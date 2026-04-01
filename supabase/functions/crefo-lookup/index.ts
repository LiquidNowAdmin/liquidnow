import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCors } from "../_shared/cors.ts"
import { jsonResponse, errorResponse } from "../_shared/response.ts"

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  const origin = req.headers.get('origin')

  try {
    const { query } = await req.json()
    if (!query || query.length < 2) {
      return errorResponse('query must be at least 2 characters', origin)
    }

    const res = await fetch(
      `https://app.fincompare.de/api/v1/company?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Accept': '*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'de-DE,de;q=0.9',
        },
      }
    )

    if (!res.ok) {
      return errorResponse('Lookup failed', origin, 502)
    }

    const results = await res.json()
    return jsonResponse(results, origin)
  } catch (error) {
    console.error('[crefo-lookup] Error:', error)
    return errorResponse('Lookup failed', origin, 500)
  }
})
