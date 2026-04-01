import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createServiceClient } from "../_shared/supabase-client.ts"

// Provider slug → status endpoint config
const PROVIDERS: Record<string, {
  slug: string
  getStatus: (baseUrl: string, apiKey: string, externalRef: string) => Promise<string>
  statusMap: Record<string, string>
}> = {
  qred: {
    slug: "qred",
    async getStatus(baseUrl, apiKey, externalRef) {
      const res = await fetch(`${baseUrl}/v1/loan/application/${externalRef}`, {
        method: "GET",
        headers: { Accept: "application/json", Authorization: apiKey },
      })
      if (!res.ok) throw new Error(`Status check failed: ${res.status}`)
      const data = await res.json()
      return data.status
    },
    statusMap: {
      REGISTERED: "inquired",
      PENDING: "inquired",
      WAITING: "inquired",
      BID: "inquired",
      APPROVED: "signed",
      REJECTED: "rejected",
      CANCELLED: "rejected",
      EXPIRED: "rejected",
      NOT_ELIGIBLE: "rejected",
    },
  },
}

serve(async (req) => {
  // Only allow POST (from cron or manual trigger)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const supabase = createServiceClient()

  // Fetch all open applications with an external reference
  const { data: apps, error } = await supabase
    .from("applications")
    .select("id, status, metadata, provider_name")
    .in("status", ["new", "inquired"])
    .not("metadata->external_ref", "is", null)

  if (error || !apps) {
    console.error("[poll-status] Failed to fetch applications:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch applications" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  console.log(`[poll-status] Polling ${apps.length} open application(s)`)

  const results: Array<{ id: string; provider: string; oldStatus: string; newStatus: string | null; error?: string }> = []

  for (const app of apps) {
    const meta = app.metadata as Record<string, unknown>
    const externalRef = meta.external_ref as string
    const providerSlug = meta.provider_slug as string

    const provider = PROVIDERS[providerSlug]
    if (!provider) {
      results.push({ id: app.id, provider: providerSlug, oldStatus: app.status, newStatus: null, error: "Unknown provider" })
      continue
    }

    const apiKey = Deno.env.get(`${providerSlug.toUpperCase()}_API_KEY`)
    const baseUrl = Deno.env.get(`${providerSlug.toUpperCase()}_API_BASE_URL`)
    if (!apiKey || !baseUrl) {
      results.push({ id: app.id, provider: providerSlug, oldStatus: app.status, newStatus: null, error: "Missing API credentials" })
      continue
    }

    try {
      const providerStatus = await provider.getStatus(baseUrl, apiKey, externalRef)
      const mappedStatus = provider.statusMap[providerStatus]

      if (mappedStatus && mappedStatus !== app.status) {
        const { error: updateError } = await supabase.rpc("change_application_status", {
          p_application_id: app.id,
          p_new_status: mappedStatus,
          p_note: `Provider status: ${providerStatus}`,
        })

        if (updateError) {
          results.push({ id: app.id, provider: providerSlug, oldStatus: app.status, newStatus: mappedStatus, error: updateError.message })
        } else {
          results.push({ id: app.id, provider: providerSlug, oldStatus: app.status, newStatus: mappedStatus })
          console.log(`[poll-status] ${app.id}: ${app.status} → ${mappedStatus} (provider: ${providerStatus})`)
        }
      } else {
        results.push({ id: app.id, provider: providerSlug, oldStatus: app.status, newStatus: null })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ id: app.id, provider: providerSlug, oldStatus: app.status, newStatus: null, error: msg })
      console.error(`[poll-status] ${app.id} error:`, msg)
    }
  }

  const changed = results.filter(r => r.newStatus)
  console.log(`[poll-status] Done. ${changed.length}/${apps.length} changed.`)

  return new Response(JSON.stringify({ polled: apps.length, changed: changed.length, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
})
