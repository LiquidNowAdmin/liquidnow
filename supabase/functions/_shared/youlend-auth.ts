// Shared YouLend OAuth 2.0 + URL helpers
// Used by: provider-youlend, poll-application-status, webhook-youlend

export async function getAccessToken(audience: string): Promise<string> {
  const isProduction = Deno.env.get('YOULEND_ENV') === 'production'
  const authUrl = isProduction
    ? 'https://youlend.eu.auth0.com/oauth/token'
    : 'https://youlend-stag.eu.auth0.com/oauth/token'

  const clientId = Deno.env.get('YOULEND_CLIENT_ID')
  const clientSecret = Deno.env.get('YOULEND_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new Error('YOULEND_CLIENT_ID / YOULEND_CLIENT_SECRET not configured')
  }

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`YouLend auth failed: ${response.status} — ${errorBody}`)
  }

  const { access_token } = await response.json()
  return access_token
}

export function getBaseUrl(): string {
  const isProduction = Deno.env.get('YOULEND_ENV') === 'production'
  return isProduction
    ? 'https://youlendapi.com'
    : 'https://partners.staging-youlendapi.com'
}

export function getAudience(api: string): string {
  const isProduction = Deno.env.get('YOULEND_ENV') === 'production'
  return isProduction
    ? `https://youlendapi.com/${api}`
    : `https://staging.youlendapi.com/${api}`
}
