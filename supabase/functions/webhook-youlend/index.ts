import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createServiceClient } from "../_shared/supabase-client.ts"

// HMAC-SHA256 signature verification
async function verifySignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const secretBase64 = Deno.env.get('YOULEND_WEBHOOK_SECRET')
  if (!secretBase64 || !signatureHeader) return false

  // Format: "sha256=<base64-signature>"
  const match = signatureHeader.match(/^sha256=(.+)$/)
  if (!match) return false
  const expectedSignature = match[1]

  // Decode base64 secret to raw bytes
  const secretBytes = Uint8Array.from(atob(secretBase64), c => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))

  return computedSignature === expectedSignature
}

// YouLend webhook event codes
const EVENT_HANDLERS: Record<string, (supabase: any, props: any) => Promise<void>> = {
  // Offers provided — store offers + update status
  ONB10011: async (supabase, props) => {
    const leadId = props.LeadId
    if (!leadId) return

    // Find application by external_ref (leadId)
    const { data: app } = await supabase
      .from('applications')
      .select('id, status')
      .eq('metadata->>external_ref', leadId)
      .single()

    if (!app) {
      console.error(`[webhook-youlend] No application found for leadId: ${leadId}`)
      return
    }

    // Store offers in metadata
    const offers = props.Offers || []
    await supabase
      .from('applications')
      .update({
        metadata: {
          external_ref: leadId,
          provider_slug: 'youlend',
          offers,
          max_funding_amount: props.MaxFundingAmount,
          min_funding_amount: props.MinFundingAmount,
        },
      })
      .eq('id', app.id)

    // Update status to offer_received
    if (app.status !== 'offer_received') {
      await supabase.rpc('change_application_status', {
        p_application_id: app.id,
        p_new_status: 'offer_received',
        p_note: `YouLend: ${offers.length} offer(s) provided`,
      })
    }

    console.log(`[webhook-youlend] ONB10011: ${offers.length} offers for app ${app.id}`)
  },

  // Contract signed
  ONB10022: async (supabase, props) => {
    const leadId = props.LeadId
    if (!leadId) return

    const { data: app } = await supabase
      .from('applications')
      .select('id, status')
      .eq('metadata->>external_ref', leadId)
      .single()

    if (!app) return

    if (!['signed', 'closed'].includes(app.status)) {
      await supabase.rpc('change_application_status', {
        p_application_id: app.id,
        p_new_status: 'signed',
        p_note: 'YouLend: Contract signed',
      })
    }

    console.log(`[webhook-youlend] ONB10022: Contract signed for app ${app.id}`)
  },

  // Contract sent (informational)
  ONB10038: async (_supabase, props) => {
    console.log(`[webhook-youlend] ONB10038: Contract sent for lead ${props.LeadId}`)
  },
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Read raw body for signature verification (must verify against raw bytes)
    const rawBody = await req.text()
    const signatureHeader = req.headers.get('X-YL-Webhook-Signature')

    // Verify signature (skip in dev if secret not set)
    const secretConfigured = !!Deno.env.get('YOULEND_WEBHOOK_SECRET')
    if (secretConfigured) {
      const valid = await verifySignature(rawBody, signatureHeader)
      if (!valid) {
        console.warn('[webhook-youlend] Invalid signature — rejecting request')
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } else {
      console.warn('[webhook-youlend] YOULEND_WEBHOOK_SECRET not set — skipping signature verification')
    }

    const body = JSON.parse(rawBody)
    const { EventCode, Message, EventProperties } = body

    console.log(`[webhook-youlend] Received event: ${EventCode} — ${Message}`)

    const supabase = createServiceClient()
    const handler = EVENT_HANDLERS[EventCode]

    if (handler) {
      await handler(supabase, EventProperties || {})
    } else {
      console.log(`[webhook-youlend] Unhandled event code: ${EventCode}`, JSON.stringify(EventProperties))
    }

    // Always return 200 to acknowledge receipt (YouLend retries on non-2xx)
    return new Response(JSON.stringify({ received: true, eventCode: EventCode }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[webhook-youlend] Error:', error)
    // Still return 200 to prevent YouLend retries on parse errors
    return new Response(JSON.stringify({ received: true, error: 'Processing error' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
