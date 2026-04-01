import { corsHeaders } from "./cors.ts"

export function jsonResponse(data: unknown, origin: string | null, status = 200): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      status,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    }
  )
}

export function errorResponse(error: string, origin: string | null, status = 400): Response {
  return new Response(
    JSON.stringify({ success: false, error }),
    {
      status,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    }
  )
}
