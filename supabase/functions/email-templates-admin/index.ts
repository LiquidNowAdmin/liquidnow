// email-templates-admin: CRUD für email_templates + email_attachments_library.
// Auth: Supabase JWT, role='operations'.
// Body: { resource, action, data? }
//   resource: 'template' | 'attachment'
//   action (template):   'list' | 'get' | 'upsert' | 'publish' | 'unpublish' | 'delete'
//   action (attachment): 'list' | 'upload' | 'delete'

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';

function templateToClient(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name ?? '',
    type: row.type,
    category: row.category,
    subject: row.subject ?? '',
    preheader: row.preheader ?? '',
    blocks: row.blocks ?? [],
    cta_label: row.cta_label,
    cta_url: row.cta_url,
    variables_used: row.variables_used ?? [],
    attachments: row.attachments ?? [],
    intent: row.intent,
    published: row.published ?? false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function templateFromClient(d: any) {
  const row: Record<string, unknown> = {};
  if (d.slug !== undefined)            row.slug = d.slug;
  if (d.name !== undefined)            row.name = d.name;
  if (d.type !== undefined)            row.type = d.type;
  if (d.category !== undefined)        row.category = d.category;
  if (d.subject !== undefined)         row.subject = d.subject;
  if (d.preheader !== undefined)       row.preheader = d.preheader;
  if (d.blocks !== undefined)          row.blocks = Array.isArray(d.blocks) ? d.blocks : [];
  if (d.cta_label !== undefined)       row.cta_label = d.cta_label;
  if (d.cta_url !== undefined)         row.cta_url = d.cta_url;
  if (d.variables_used !== undefined)  row.variables_used = Array.isArray(d.variables_used) ? d.variables_used : [];
  if (d.attachments !== undefined)     row.attachments = Array.isArray(d.attachments) ? d.attachments : [];
  if (d.intent !== undefined)          row.intent = d.intent;
  return row;
}

async function authorize(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false as const, status: 401, msg: 'Missing token' };
  const sb = createServiceClient();
  const { data: userData, error } = await sb.auth.getUser(token);
  if (error || !userData.user) return { ok: false as const, status: 401, msg: 'Invalid token' };
  const { data: row } = await sb.from('users').select('role, tenant_id').eq('id', userData.user.id).maybeSingle();
  if (row?.role !== 'operations') return { ok: false as const, status: 403, msg: 'operations role required' };
  return { ok: true as const, tenantId: row.tenant_id as string, userId: userData.user.id };
}

// Decode base64 to Uint8Array for Scaleway upload.
function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Upload file to Scaleway via S3-compatible API using SigV4.
async function uploadToScaleway(opts: {
  filename: string;
  content: Uint8Array;
  contentType: string;
}): Promise<{ ok: true; storage_path: string } | { ok: false; error: string }> {
  // For simplicity store in Supabase Storage (`email-attachments` bucket).
  // Scaleway-direct via SigV4 wäre möglich, ist aber für unsere Zwecke (kleine PDFs)
  // Overkill — Supabase Storage hat schon Auth/RLS und passt zum Rest des Stacks.
  const sb = createServiceClient();
  const path = `email-attachments/${Date.now()}-${opts.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error } = await sb.storage.from('email-attachments').upload(path, opts.content, {
    contentType: opts.contentType,
    upsert: false,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, storage_path: path };
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const headers = corsHeaders(req.headers.get('origin'));

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
  }

  const auth = await authorize(req);
  if (!auth.ok) return Response.json({ error: auth.msg }, { status: auth.status, headers });
  const TENANT_ID = auth.tenantId;
  const USER_ID = auth.userId;

  let body: any = {};
  try { body = await req.json(); } catch {}
  const resource = body?.resource;
  const action = body?.action;
  const data = body?.data || {};
  const sb = createServiceClient();

  try {
    // -------------------- TEMPLATES --------------------
    if (resource === 'template') {
      if (action === 'list') {
        const { data: rows, error } = await sb.from('email_templates')
          .select('id, slug, name, type, category, subject, published, updated_at, created_at')
          .eq('tenant_id', TENANT_ID)
          .order('updated_at', { ascending: false });
        if (error) throw error;
        return Response.json({ templates: rows || [] }, { headers });
      }
      if (action === 'get') {
        if (!data.slug) return Response.json({ error: 'slug required' }, { status: 400, headers });
        const { data: row, error } = await sb.from('email_templates')
          .select('*').eq('tenant_id', TENANT_ID).eq('slug', data.slug).maybeSingle();
        if (error) throw error;
        return Response.json({ template: templateToClient(row) }, { headers });
      }
      if (action === 'upsert') {
        if (!data.slug || !data.name || !data.type) {
          return Response.json({ error: 'slug, name, type required' }, { status: 400, headers });
        }
        const row = { ...templateFromClient(data), tenant_id: TENANT_ID, created_by: USER_ID };
        const { data: out, error } = await sb.from('email_templates')
          .upsert(row, { onConflict: 'tenant_id,slug' })
          .select('*').maybeSingle();
        if (error) throw error;
        return Response.json({ template: templateToClient(out) }, { headers });
      }
      if (action === 'publish' || action === 'unpublish') {
        if (!data.slug) return Response.json({ error: 'slug required' }, { status: 400, headers });
        const { data: out, error } = await sb.from('email_templates')
          .update({ published: action === 'publish' })
          .eq('tenant_id', TENANT_ID).eq('slug', data.slug)
          .select('*').maybeSingle();
        if (error) throw error;
        return Response.json({ template: templateToClient(out) }, { headers });
      }
      if (action === 'delete') {
        if (!data.slug) return Response.json({ error: 'slug required' }, { status: 400, headers });
        const { error } = await sb.from('email_templates').delete()
          .eq('tenant_id', TENANT_ID).eq('slug', data.slug);
        if (error) throw error;
        return Response.json({ ok: true }, { headers });
      }
      return Response.json({ error: `Unknown template action: ${action}` }, { status: 400, headers });
    }

    // -------------------- ATTACHMENTS LIBRARY --------------------
    if (resource === 'attachment') {
      if (action === 'list') {
        const { data: rows, error } = await sb.from('email_attachments_library')
          .select('id, filename, storage_path, mime_type, size_bytes, description, created_at')
          .eq('tenant_id', TENANT_ID)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return Response.json({ attachments: rows || [] }, { headers });
      }
      if (action === 'upload') {
        // data: { filename, mime_type, content_b64, description? }
        if (!data.filename || !data.mime_type || !data.content_b64) {
          return Response.json({ error: 'filename, mime_type, content_b64 required' }, { status: 400, headers });
        }
        const bytes = decodeBase64(data.content_b64);
        const up = await uploadToScaleway({
          filename: data.filename,
          content: bytes,
          contentType: data.mime_type,
        });
        if (!up.ok) {
          return Response.json({ error: 'Upload failed', details: up.error }, { status: 500, headers });
        }
        const { data: out, error } = await sb.from('email_attachments_library').insert({
          tenant_id: TENANT_ID,
          filename: data.filename,
          storage_path: up.storage_path,
          mime_type: data.mime_type,
          size_bytes: bytes.length,
          description: data.description ?? null,
          created_by: USER_ID,
        }).select('*').maybeSingle();
        if (error) throw error;
        return Response.json({ attachment: out }, { headers });
      }
      if (action === 'delete') {
        if (!data.id) return Response.json({ error: 'id required' }, { status: 400, headers });
        const { data: existing } = await sb.from('email_attachments_library')
          .select('storage_path').eq('id', data.id).eq('tenant_id', TENANT_ID).maybeSingle();
        if (existing?.storage_path) {
          await sb.storage.from('email-attachments').remove([existing.storage_path]).catch(() => {});
        }
        const { error } = await sb.from('email_attachments_library').delete()
          .eq('id', data.id).eq('tenant_id', TENANT_ID);
        if (error) throw error;
        return Response.json({ ok: true }, { headers });
      }
      return Response.json({ error: `Unknown attachment action: ${action}` }, { status: 400, headers });
    }

    // -------------------- ROUTES --------------------
    if (resource === 'route') {
      if (action === 'list') {
        const { data: rows, error } = await sb.from('template_routes')
          .select('*')
          .eq('tenant_id', TENANT_ID)
          .order('is_protected', { ascending: false })
          .order('key', { ascending: true });
        if (error) throw error;
        return Response.json({ routes: rows || [] }, { headers });
      }
      if (action === 'upsert') {
        if (!data.key || !data.label || !data.url_template) {
          return Response.json({ error: 'key, label, url_template required' }, { status: 400, headers });
        }
        const row: Record<string, unknown> = {
          tenant_id: TENANT_ID,
          key: data.key,
          label: data.label,
          url_template: data.url_template,
          description: data.description ?? null,
          entity_type: data.entity_type ?? null,
          is_protected: false,
        };
        if (data.id) row.id = data.id;
        const { data: out, error } = await sb.from('template_routes')
          .upsert(row, { onConflict: 'tenant_id,key' })
          .select('*').maybeSingle();
        if (error) throw error;
        return Response.json({ route: out }, { headers });
      }
      if (action === 'delete') {
        if (!data.id) return Response.json({ error: 'id required' }, { status: 400, headers });
        // Geschützte Routen können nicht gelöscht werden
        const { data: existing } = await sb.from('template_routes')
          .select('is_protected').eq('id', data.id).eq('tenant_id', TENANT_ID).maybeSingle();
        if (existing?.is_protected) {
          return Response.json({ error: 'Geschützte Route — nicht löschbar' }, { status: 400, headers });
        }
        const { error } = await sb.from('template_routes')
          .delete().eq('id', data.id).eq('tenant_id', TENANT_ID);
        if (error) throw error;
        return Response.json({ ok: true }, { headers });
      }
      return Response.json({ error: `Unknown route action: ${action}` }, { status: 400, headers });
    }

    return Response.json({ error: `Unknown resource: ${resource}` }, { status: 400, headers });
  } catch (err: any) {
    console.error('email-templates-admin error:', err);
    return Response.json({ error: 'DB error', details: err?.message || String(err) }, { status: 500, headers });
  }
});
