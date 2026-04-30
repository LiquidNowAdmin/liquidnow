// workflow-rules-admin: CRUD für workflow_rules + read für executions + sent_emails.
// Auth: operations role.
// Body: { resource, action, data? }
//   resource: 'rule' | 'execution' | 'sent_email'
//   rule:        list | get | upsert | delete | toggle | run_now
//   execution:   list (recent), list_by_rule
//   sent_email:  list_by_entity

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';

// Enrich rows with `link_id`: for inquiries/users it's the entity_id itself,
// for applications we look up the inquiry_id (Detail-View an /admin/anfragen?id=
// erwartet entweder inquiry_id oder user_id).
async function enrichWithLinkIds<T extends { entity_type: string | null; entity_id: string | null }>(
  rows: T[],
  sb: ReturnType<typeof createServiceClient>,
): Promise<Array<T & { link_id: string | null }>> {
  if (!rows.length) return rows.map((r) => ({ ...r, link_id: r.entity_id ?? null }));
  const appIds = rows
    .filter((r) => r.entity_type === 'applications' && r.entity_id)
    .map((r) => r.entity_id as string);
  let appMap = new Map<string, string>();
  if (appIds.length) {
    const { data: apps } = await sb.from('applications')
      .select('id, inquiry_id').in('id', appIds);
    for (const a of (apps as Array<{ id: string; inquiry_id: string | null }>) || []) {
      if (a.inquiry_id) appMap.set(a.id, a.inquiry_id);
    }
  }
  return rows.map((r) => ({
    ...r,
    link_id: r.entity_type === 'applications'
      ? (r.entity_id ? appMap.get(r.entity_id) ?? null : null)
      : r.entity_id ?? null,
  }));
}

async function authorize(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false as const, status: 401, msg: 'Missing token' };
  const sb = createServiceClient();
  const { data: u, error } = await sb.auth.getUser(token);
  if (error || !u.user) return { ok: false as const, status: 401, msg: 'Invalid token' };
  const { data: row } = await sb.from('users').select('role, tenant_id, id').eq('id', u.user.id).maybeSingle();
  if (row?.role !== 'operations') return { ok: false as const, status: 403, msg: 'operations role required' };
  return { ok: true as const, tenantId: row.tenant_id as string, userId: row.id as string };
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const headers = corsHeaders(req.headers.get('origin'));
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers });

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
    // -------------------- RULES --------------------
    if (resource === 'rule') {
      if (action === 'list') {
        const { data: rows, error } = await sb.from('workflow_rules')
          .select('*')
          .eq('tenant_id', TENANT_ID)
          .order('updated_at', { ascending: false });
        if (error) throw error;
        return Response.json({ rules: rows || [] }, { headers });
      }
      if (action === 'get') {
        const { data: row, error } = await sb.from('workflow_rules')
          .select('*').eq('id', data.id).eq('tenant_id', TENANT_ID).maybeSingle();
        if (error) throw error;
        return Response.json({ rule: row }, { headers });
      }
      if (action === 'upsert') {
        if (!data.name || !data.entity_type || !data.trigger_type) {
          return Response.json({ error: 'name, entity_type, trigger_type required' }, { status: 400, headers });
        }
        const row: Record<string, unknown> = {
          tenant_id: TENANT_ID,
          name: data.name,
          description: data.description ?? null,
          is_active: data.is_active ?? true,
          entity_type: data.entity_type,
          trigger_type: data.trigger_type,
          time_config: data.time_config ?? null,
          conditions: data.conditions ?? { match_type: 'all', conditions: [] },
          actions: data.actions ?? [],
          created_by: USER_ID,
        };
        if (data.id) row.id = data.id;
        const { data: out, error } = await sb.from('workflow_rules')
          .upsert(row).select('*').maybeSingle();
        if (error) throw error;
        return Response.json({ rule: out }, { headers });
      }
      if (action === 'toggle') {
        if (!data.id) return Response.json({ error: 'id required' }, { status: 400, headers });
        const { data: existing } = await sb.from('workflow_rules')
          .select('is_active').eq('id', data.id).eq('tenant_id', TENANT_ID).maybeSingle();
        if (!existing) return Response.json({ error: 'not found' }, { status: 404, headers });
        const { data: out, error } = await sb.from('workflow_rules')
          .update({ is_active: !existing.is_active })
          .eq('id', data.id).eq('tenant_id', TENANT_ID)
          .select('*').maybeSingle();
        if (error) throw error;
        return Response.json({ rule: out }, { headers });
      }
      if (action === 'delete') {
        if (!data.id) return Response.json({ error: 'id required' }, { status: 400, headers });
        const { error } = await sb.from('workflow_rules').delete()
          .eq('id', data.id).eq('tenant_id', TENANT_ID);
        if (error) throw error;
        return Response.json({ ok: true }, { headers });
      }
      if (action === 'run_now') {
        // Manuelle Time-Based-Auswertung — nützlich zum Debuggen
        const { data: result, error } = await sb.rpc('process_time_based_workflows');
        if (error) throw error;
        return Response.json({ result }, { headers });
      }
      return Response.json({ error: `Unknown rule action: ${action}` }, { status: 400, headers });
    }

    // -------------------- EXECUTIONS --------------------
    if (resource === 'execution') {
      if (action === 'list') {
        const { data: rows, error } = await sb.from('workflow_executions')
          .select('*, rule:workflow_rules(name, entity_type)')
          .eq('tenant_id', TENANT_ID)
          .order('executed_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        const enriched = await enrichWithLinkIds((rows ?? []) as never[], sb);
        return Response.json({ executions: enriched }, { headers });
      }
      if (action === 'list_by_rule') {
        const { data: rows, error } = await sb.from('workflow_executions')
          .select('*')
          .eq('tenant_id', TENANT_ID)
          .eq('rule_id', data.rule_id)
          .order('executed_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return Response.json({ executions: rows || [] }, { headers });
      }
      return Response.json({ error: `Unknown execution action: ${action}` }, { status: 400, headers });
    }

    // -------------------- SENT EMAILS --------------------
    if (resource === 'sent_email') {
      if (action === 'list_by_entity') {
        if (!data.entity_type || !data.entity_id) {
          return Response.json({ error: 'entity_type + entity_id required' }, { status: 400, headers });
        }
        const { data: rows, error } = await sb.from('sent_emails')
          .select('id, recipient_email, recipient_name, subject, status, error_message, trigger_kind, template_slug, sent_at')
          .eq('tenant_id', TENANT_ID)
          .eq('entity_type', data.entity_type)
          .eq('entity_id', data.entity_id)
          .order('sent_at', { ascending: false });
        if (error) throw error;
        return Response.json({ sent_emails: rows || [] }, { headers });
      }
      if (action === 'list_by_lead') {
        // Liefert ALLE sent_emails die zum Lead gehören:
        //   - entity_type='inquiries' AND entity_id=<inquiry_id>
        //   - entity_type='users'     AND entity_id=<inquiry.user_id>
        //   - entity_type='applications' AND entity_id IN (apps für diesen Lead)
        if (!data.inquiry_id && !data.user_id) {
          return Response.json({ error: 'inquiry_id or user_id required' }, { status: 400, headers });
        }

        let userId = data.user_id as string | undefined;
        let appIds: string[] = [];
        if (data.inquiry_id) {
          const { data: inq } = await sb.from('inquiries')
            .select('user_id').eq('id', data.inquiry_id).maybeSingle();
          if (inq) userId = (inq as { user_id: string }).user_id;
          const { data: apps } = await sb.from('applications')
            .select('id').eq('inquiry_id', data.inquiry_id);
          appIds = (apps as Array<{ id: string }> || []).map((a) => a.id);
        }

        // Build OR-filter: 1-3 sub-clauses
        const orParts: string[] = [];
        if (data.inquiry_id) orParts.push(`and(entity_type.eq.inquiries,entity_id.eq.${data.inquiry_id})`);
        if (userId)          orParts.push(`and(entity_type.eq.users,entity_id.eq.${userId})`);
        if (appIds.length)   orParts.push(`and(entity_type.eq.applications,entity_id.in.(${appIds.join(',')}))`);

        if (orParts.length === 0) return Response.json({ sent_emails: [] }, { headers });

        const { data: rows, error } = await sb.from('sent_emails')
          .select('id, recipient_email, recipient_name, subject, status, error_message, trigger_kind, template_slug, sent_at, entity_type, entity_id')
          .eq('tenant_id', TENANT_ID)
          .or(orParts.join(','))
          .order('sent_at', { ascending: false });
        if (error) throw error;
        return Response.json({ sent_emails: rows || [] }, { headers });
      }
      if (action === 'list_recent') {
        const { data: rows, error } = await sb.from('sent_emails')
          .select('id, recipient_email, subject, status, trigger_kind, template_slug, entity_type, entity_id, sent_at')
          .eq('tenant_id', TENANT_ID)
          .order('sent_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        const enriched = await enrichWithLinkIds((rows ?? []) as never[], sb);
        return Response.json({ sent_emails: enriched }, { headers });
      }
      return Response.json({ error: `Unknown sent_email action: ${action}` }, { status: 400, headers });
    }

    return Response.json({ error: `Unknown resource: ${resource}` }, { status: 400, headers });
  } catch (err: any) {
    return Response.json({ error: 'DB error', details: err?.message || String(err) }, { status: 500, headers });
  }
});
