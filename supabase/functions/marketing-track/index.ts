import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createServiceClient } from "../_shared/supabase-client.ts"
import { corsHeaders, handleCors } from "../_shared/cors.ts"
import { jsonResponse, errorResponse } from "../_shared/response.ts"

// Valid funnel event types
const VALID_EVENT_TYPES = new Set([
  "page_view",
  "cta_click",
  "signup_start",
  "signup_completed",
  "funnel_step",
  "funnel_submit",
])

// Valid funnel step names
const VALID_STEPS = new Set([
  "anfrage",
  "umsatz",
  "unternehmen",
  "persoenliche_daten",
])

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  const origin = req.headers.get("origin")

  try {
    const body = await req.json()
    const { action } = body

    const sb = createServiceClient()

    // --- Create session ---
    if (action === "session") {
      const { visitor_id, utm_source, utm_medium, utm_campaign, referrer, landing_page, device_type } = body

      if (!visitor_id) {
        return errorResponse("visitor_id required", origin)
      }

      // Resolve default tenant
      const { data: tenantId, error: tenantErr } = await sb.rpc("get_default_tenant_id")
      if (tenantErr || !tenantId) {
        return errorResponse("Could not resolve tenant", origin, 500)
      }

      const sessionId = crypto.randomUUID()

      const { error } = await sb.from("marketing_sessions").insert({
        id: sessionId,
        tenant_id: tenantId,
        visitor_id,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        referrer: referrer || null,
        landing_page: landing_page || null,
        device_type: device_type || null,
      })

      if (error) {
        return errorResponse(`Session insert failed: ${error.message}`, origin, 500)
      }

      // Fire initial page_view event
      await sb.from("marketing_events").insert({
        tenant_id: tenantId,
        session_id: sessionId,
        event_type: "page_view",
        properties: { path: landing_page || "/" },
      })

      return jsonResponse({ session_id: sessionId, tenant_id: tenantId }, origin)
    }

    // --- Track event ---
    if (action === "event") {
      const { session_id, tenant_id, event_type, properties } = body

      if (!session_id || !tenant_id) {
        return errorResponse("session_id and tenant_id required", origin)
      }

      if (!VALID_EVENT_TYPES.has(event_type)) {
        return errorResponse(`Invalid event_type: ${event_type}`, origin)
      }

      // Validate funnel_step has a valid step name
      if (event_type === "funnel_step") {
        const step = properties?.step
        if (!step || !VALID_STEPS.has(step)) {
          return errorResponse(`Invalid funnel step: ${step}`, origin)
        }
      }

      const { error } = await sb.from("marketing_events").insert({
        tenant_id,
        session_id,
        event_type,
        properties: properties ?? {},
      })

      if (error) {
        // Stale session — let client know to create a new one
        if (error.code === "23503") {
          return errorResponse("session_expired", origin, 410)
        }
        return errorResponse(`Event insert failed: ${error.message}`, origin, 500)
      }

      return jsonResponse({ ok: true }, origin)
    }

    return errorResponse(`Unknown action: ${action}`, origin)
  } catch (e) {
    return errorResponse(`Invalid request: ${(e as Error).message}`, origin)
  }
})
