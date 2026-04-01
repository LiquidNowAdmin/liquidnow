import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createServiceClient } from "../_shared/supabase-client.ts"
import { fetchSubmissionData, SubmissionData } from "../_shared/submission-data.ts"
import { storeProviderSubmission } from "../_shared/store-submission.ts"
import { corsHeaders, handleCors } from "../_shared/cors.ts"
import { jsonResponse, errorResponse } from "../_shared/response.ts"

// Qred status → internal application status
const QRED_STATUS_MAP: Record<string, string> = {
  'REGISTERED':   'inquired',
  'PENDING':      'inquired',
  'WAITING':      'inquired',
  'BID':          'inquired',
  'APPROVED':     'signed',
  'REJECTED':     'rejected',
  'CANCELLED':    'rejected',
  'EXPIRED':      'rejected',
  'NOT_ELIGIBLE': 'rejected',
}

// Qred purpose values
const PURPOSE_MAP: Record<string, string> = {
  'wareneinkauf':    'INVENTORY',
  'liquiditaet':     'WORKING_CAPITAL',
  'wachstum':        'EXPANSION',
  'marketing':       'MARKETING',
  'personal':        'EMPLOY_PERSONNEL',
  'equipment':       'BUY_EQUIPMENT',
  'umschuldung':     'REPAY_OTHER_LOAN',
  'other':           'OTHER',
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const origin = req.headers.get('origin')

  try {
    const { action, application_id } = await req.json()

    if (!application_id) {
      return errorResponse('application_id is required', origin)
    }

    const supabase = createServiceClient()

    switch (action) {
      case 'submit':
        return await handleSubmit(supabase, application_id, origin)
      case 'status':
        return await handleStatus(supabase, application_id, origin)
      default:
        return errorResponse(`Unknown action: ${action}`, origin)
    }
  } catch (error) {
    console.error('[provider-qred] Error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten.',
      origin,
      500
    )
  }
})

// ─── SUBMIT ─────────────────────────────────────────────────

async function handleSubmit(
  supabase: ReturnType<typeof createServiceClient>,
  applicationId: string,
  origin: string | null
) {
  const data = await fetchSubmissionData(supabase, applicationId)
  const payload = mapToQredPayload(data)

  console.log('[provider-qred] Submitting to Qred:', JSON.stringify(payload))

  const baseUrl = Deno.env.get('QRED_API_BASE_URL') || 'https://sandbox.test.qred.com/embedded'
  const apiKey = Deno.env.get('QRED_API_KEY')

  if (!apiKey) {
    throw new Error('QRED_API_KEY not configured')
  }

  const response = await fetch(`${baseUrl}/v1/loan/application`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': apiKey,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`[provider-qred] Qred API error ${response.status}:`, errorBody)
    throw new Error(`Qred API error: ${response.status} — ${errorBody}`)
  }

  const result = await response.json()
  console.log('[provider-qred] Qred response:', result)

  // Store external reference and update status to 'inquired'
  await storeProviderSubmission(
    supabase,
    applicationId,
    result.id,    // e.g. "ap_123e4567-..."
    result.url,   // e.g. "https://api.qred.com/..."
    'qred'
  )

  return jsonResponse({ external_ref: result.id, url: result.url }, origin)
}

// ─── STATUS ─────────────────────────────────────────────────

async function handleStatus(
  supabase: ReturnType<typeof createServiceClient>,
  applicationId: string,
  origin: string | null
) {
  const data = await fetchSubmissionData(supabase, applicationId)
  const externalRef = (data.application.metadata as any)?.external_ref

  if (!externalRef) {
    return errorResponse('No external reference found — application not yet submitted', origin)
  }

  const baseUrl = Deno.env.get('QRED_API_BASE_URL') || 'https://sandbox.test.qred.com/embedded'
  const apiKey = Deno.env.get('QRED_API_KEY')

  if (!apiKey) {
    throw new Error('QRED_API_KEY not configured')
  }

  const response = await fetch(`${baseUrl}/v1/loan/application/${externalRef}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': apiKey,
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`[provider-qred] Status check error ${response.status}:`, errorBody)
    throw new Error(`Qred status check failed: ${response.status}`)
  }

  const result = await response.json()
  const qredStatus = result.status
  const mappedStatus = QRED_STATUS_MAP[qredStatus]

  console.log(`[provider-qred] Qred status: ${qredStatus} → ${mappedStatus}`)

  // Update internal status if it changed
  if (mappedStatus && mappedStatus !== data.application.status) {
    const { error } = await supabase.rpc('change_application_status', {
      p_application_id: applicationId,
      p_new_status: mappedStatus,
      p_note: `Qred status: ${qredStatus}`,
    })

    if (error) {
      console.error('[provider-qred] Status update error:', error)
    }
  }

  return jsonResponse({
    qred_status: qredStatus,
    internal_status: mappedStatus || data.application.status,
    changed: mappedStatus !== data.application.status,
  }, origin)
}

// ─── PAYLOAD MAPPING ────────────────────────────────────────

function mapToQredPayload(data: SubmissionData) {
  const { company, user, inquiry } = data
  const userMeta = user.metadata || {}
  const address = company.address || {}

  const qredPurpose = PURPOSE_MAP[inquiry.purpose || ''] || 'OTHER'
  const purposeManual = qredPurpose === 'OTHER' && inquiry.metadata?.purpose_manual
    ? String(inquiry.metadata.purpose_manual)
    : undefined

  return {
    applicant: {
      firstName: user.first_name || undefined,
      lastName: user.last_name || undefined,
      dateOfBirth: (userMeta as any).dob || undefined,
      email: user.email,
      phone: user.phone || undefined,
      address: {
        street: (userMeta as any).street || undefined,
        zipCode: (userMeta as any).zip || undefined,
        city: (userMeta as any).city || undefined,
      },
    },
    organization: {
      nationalOrganizationNumber: company.hrb || undefined,
      uniqueCompanyIdentifier: company.crefo || undefined,
      name: company.name,
      address: {
        street: address.street || undefined,
        zipCode: address.zip || undefined,
        city: address.city || undefined,
      },
      turnover: company.annual_revenue
        ? Math.round(company.annual_revenue / 12)
        : undefined,
      webpage: company.website || undefined,
    },
    amount: inquiry.volume,
    term: inquiry.term_months || undefined,
    purpose: qredPurpose,
    purposeManual,
  }
}
