// template-variables: zentrale API für Variablen-Registry und -Auflösung.
//
// Body: { action, context? }
//   action='list':    → { variables: VariableDef[] }
//   action='resolve': → { values: Record<string,string> }   benötigt context
//
// Auth: operations role.

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';
import { VARIABLES, resolveVariables, type ResolveContext } from '../_shared/template-variables.ts';

async function authorize(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false as const, status: 401, msg: 'Missing token' };
  const sb = createServiceClient();
  const { data: userData, error } = await sb.auth.getUser(token);
  if (error || !userData.user) return { ok: false as const, status: 401, msg: 'Invalid token' };
  const { data: row } = await sb.from('users').select('role').eq('id', userData.user.id).maybeSingle();
  if (row?.role !== 'operations') return { ok: false as const, status: 403, msg: 'operations role required' };
  return { ok: true as const };
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

  let body: any = {};
  try { body = await req.json(); } catch {}
  const action = body?.action;

  if (action === 'list') {
    return Response.json({ variables: VARIABLES }, { headers });
  }

  if (action === 'resolve') {
    const ctx: ResolveContext = body?.context ?? {};
    return Response.json({ values: resolveVariables(ctx) }, { headers });
  }

  return Response.json({ error: `Unknown action: ${action}` }, { status: 400, headers });
});
