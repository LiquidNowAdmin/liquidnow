// workflow-rules-admin: CRUD für workflow_rules + read für executions + sent_emails.
// Auth: operations role.
// Body: { resource, action, data? }
//   resource: 'rule' | 'execution' | 'sent_email'
//   rule:        list | get | upsert | delete | toggle | run_now
//   execution:   list (recent), list_by_rule
//   sent_email:  list_by_entity

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';

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
        return Response.json({ executions: rows || [] }, { headers });
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
      if (action === 'list_recent') {
        const { data: rows, error } = await sb.from('sent_emails')
          .select('id, recipient_email, subject, status, trigger_kind, template_slug, entity_type, entity_id, sent_at')
          .eq('tenant_id', TENANT_ID)
          .order('sent_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        return Response.json({ sent_emails: rows || [] }, { headers });
      }
      return Response.json({ error: `Unknown sent_email action: ${action}` }, { status: 400, headers });
    }

    return Response.json({ error: `Unknown resource: ${resource}` }, { status: 400, headers });
  } catch (err: any) {
    return Response.json({ error: 'DB error', details: err?.message || String(err) }, { status: 500, headers });
  }
});
