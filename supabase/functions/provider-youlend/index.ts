import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createServiceClient } from "../_shared/supabase-client.ts"
import { fetchSubmissionData, SubmissionData } from "../_shared/submission-data.ts"
import { corsHeaders, handleCors } from "../_shared/cors.ts"
import { jsonResponse, errorResponse } from "../_shared/response.ts"
import { getAccessToken, getBaseUrl, getAudience } from "../_shared/youlend-auth.ts"

// YouLend status → internal application status
const YOULEND_STATUS_MAP: Record<string, string> = {
  'New':              'inquired',
  'Stage1Incomplete': 'inquired',
  'Stage1Submitted':  'inquired',
  'InReview':         'inquired',
  'OffersProvided':   'inquired',
  'OfferAccepted':    'inquired',
  'ContractSigned':   'signed',
  'OnboardingComplete': 'signed',
  'Funded':           'signed',
  'Declined':         'rejected',
  'Withdrawn':        'rejected',
  'Expired':          'rejected',
}

// Internal legal_form → YouLend companyType
const COMPANY_TYPE_MAP: Record<string, string> = {
  'GmbH':            'GmbhUg',
  'UG':              'GmbhUg',
  'AG':              'GmbhUg',
  'GmbH & Co. KG':   'GmbhUg',
  'UG & Co. KG':     'GmbhUg',
  'e.K.':            'EK',
  'KG':              'Kg',
  'OHG':             'Ohg',
  'GbR':             'Gbr',
  'Einzelunternehmen': 'Gewerbebetrieb',
  'Freiberufler':    'Gewerbebetrieb',
  'Ltd':             'GmbhUg',
  'SE':              'GmbhUg',
  'PartG':           'GbrOhg',
  'eG':              'eGbR',
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const origin = req.headers.get('origin')

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', origin, 405)
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    const supabase = createServiceClient()

    // Handle multipart upload (bank statements)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const applicationId = formData.get('application_id') as string
      if (!applicationId) return errorResponse('application_id is required', origin)
      return await handleUploadBankStatements(supabase, applicationId, formData, origin)
    }

    const body = await req.text()
    if (!body) return errorResponse('Empty request body', origin)
    const { action, application_id, extra } = JSON.parse(body)

    if (!application_id) {
      return errorResponse('application_id is required', origin)
    }

    switch (action) {
      case 'submit':
        return await handleSubmit(supabase, application_id, origin, extra)
      case 'submit_stage1':
        return await handleSubmitStage1(supabase, application_id, origin)
      case 'status':
        return await handleStatus(supabase, application_id, origin)
      case 'offers':
        return await handleGetOffers(supabase, application_id, origin)
      case 'calculate_offers':
        return await handleCalculateOffers(supabase, application_id, origin, extra)
      case 'accept_offer':
        return await handleAcceptOffer(supabase, application_id, origin, extra)
      case 'get_documents':
        return await handleGetDocuments(supabase, application_id, origin, extra)
      case 'sign_documents':
        return await handleSignDocuments(supabase, application_id, origin, extra)
      default:
        return errorResponse(`Unknown action: ${action}`, origin)
    }
  } catch (error) {
    console.error('[provider-youlend] Error:', error)
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
  origin: string | null,
  extra?: { confirmedCreditSearch?: boolean; typeOfPerson?: string; ylCompanyType?: string }
) {
  const data = await fetchSubmissionData(supabase, applicationId)

  // Idempotency: skip if already submitted
  const existingRef = (data.application.metadata as any)?.external_ref
  if (existingRef) {
    const existingUrl = (data.application.metadata as any)?.open_banking_url
    return jsonResponse({
      external_ref: existingRef,
      openBankingURL: existingUrl,
      already_submitted: true,
    }, origin)
  }

  const baseUrl = getBaseUrl()
  const token = await getAccessToken(getAudience('onboarding'))

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  // 1. Create Lead
  const leadPayload = mapToLeadPayload(data, extra)
  console.log('[provider-youlend] Creating lead:', JSON.stringify(leadPayload))

  const leadResponse = await fetch(`${baseUrl}/onboarding/Leads`, {
    method: 'POST',
    headers,
    body: JSON.stringify(leadPayload),
  })

  if (!leadResponse.ok) {
    const errorBody = await leadResponse.text()
    console.error(`[provider-youlend] Create Lead error ${leadResponse.status}:`, errorBody)
    throw new Error(`YouLend Create Lead failed: ${leadResponse.status} — ${errorBody}`)
  }

  const leadResult = await leadResponse.json()
  console.log('[provider-youlend] Lead created:', leadResult)

  const leadId = leadResult.leadId

  // 2. Add Significant Persons
  const personsPayload = mapToSignificantPersons(data, extra)
  console.log('[provider-youlend] Adding significant persons:', JSON.stringify(personsPayload))

  const personsResponse = await fetch(
    `${baseUrl}/onboarding/Leads/${leadId}/significantpersons`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ significantPersons: personsPayload }),
    }
  )

  if (!personsResponse.ok) {
    const errorBody = await personsResponse.text()
    console.error(`[provider-youlend] Significant persons error ${personsResponse.status}:`, errorBody)
    // Non-fatal — lead exists, continue
  }

  // Stage 1 Submit happens AFTER the merchant completes Open Banking / uploads bank statements
  // It will be triggered via action: "submit_stage1" once bank data is available

  // 3. Store metadata + set status to 'inquired'
  const { error: metaError } = await supabase
    .from('applications')
    .update({
      metadata: {
        external_ref: leadId,
        external_url: leadResult.leadURL || null,
        signup_url: leadResult.signUpURL || null,
        open_banking_url: leadResult.openBankingURL || null,
        provider_slug: 'youlend',
        submitted_at: new Date().toISOString(),
      },
      status: 'inquired',
    })
    .eq('id', applicationId)
    .in('status', ['new', 'product_selected'])

  if (metaError) {
    console.error('[provider-youlend] Metadata store error:', metaError)
  }

  return jsonResponse({
    external_ref: leadId,
    openBankingURL: leadResult.openBankingURL,
    signUpURL: leadResult.signUpURL,
    leadURL: leadResult.leadURL,
  }, origin)
}

// ─── UPLOAD BANK STATEMENTS ─────────────────────────────────

async function handleUploadBankStatements(
  supabase: ReturnType<typeof createServiceClient>,
  applicationId: string,
  formData: FormData,
  origin: string | null
) {
  const data = await fetchSubmissionData(supabase, applicationId)
  const leadId = (data.application.metadata as any)?.external_ref

  if (!leadId) {
    return errorResponse('No external reference found — application not yet submitted', origin)
  }

  const baseUrl = getBaseUrl()
  const token = await getAccessToken(getAudience('onboarding'))

  // Collect all PDF files from the form
  const files: File[] = []
  for (const [key, value] of formData.entries()) {
    if (key === 'files' && value instanceof File) {
      files.push(value)
    }
  }

  if (files.length === 0) {
    return errorResponse('No files provided', origin)
  }

  const results: Array<{ name: string; status: string; error?: string }> = []

  for (const file of files) {
    const uploadForm = new FormData()
    uploadForm.append('file', file, file.name)

    console.log(`[provider-youlend] Uploading bank statement: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)

    const response = await fetch(
      `${baseUrl}/onboarding/Leads/${leadId}/documents/bankstatements`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: uploadForm,
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`[provider-youlend] Upload error for ${file.name}: ${response.status} — ${errorBody}`)
      results.push({ name: file.name, status: 'error', error: errorBody })
    } else {
      console.log(`[provider-youlend] Upload success: ${file.name}`)
      results.push({ name: file.name, status: 'ok' })
    }
  }

  const allOk = results.every(r => r.status === 'ok')
  return jsonResponse({ uploaded: results, allOk }, origin)
}

// ─── SUBMIT STAGE 1 ─────────────────────────────────────────

async function handleSubmitStage1(
  supabase: ReturnType<typeof createServiceClient>,
  applicationId: string,
  origin: string | null
) {
  const data = await fetchSubmissionData(supabase, applicationId)
  const leadId = (data.application.metadata as any)?.external_ref

  if (!leadId) {
    return errorResponse('No external reference found — application not yet submitted', origin)
  }

  const baseUrl = getBaseUrl()
  const token = await getAccessToken(getAudience('onboarding'))

  const response = await fetch(
    `${baseUrl}/onboarding/Leads/${leadId}/submitonboarding`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`[provider-youlend] Submit Stage 1 error ${response.status}:`, errorBody)
    throw new Error(`YouLend Submit Stage 1 failed: ${response.status} — ${errorBody}`)
  }

  console.log(`[provider-youlend] Stage 1 submitted for lead ${leadId}`)
  return jsonResponse({ leadId, stage1_submitted: true }, origin)
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

  const baseUrl = getBaseUrl()
  const token = await getAccessToken(getAudience('onboarding'))

  let result: any = null
  let ylStatus = 'unknown'

  try {
    // Use /offers endpoint — /Leads/{id} returns 404 in YouLend's API
    const response = await fetch(
      `${baseUrl}/onboarding/Leads/${externalRef}/offers`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()
      console.warn(`[provider-youlend] Status check returned ${response.status} for lead ${externalRef}`)
      return jsonResponse({
        youlend_status: 'unknown',
        internal_status: data.application.status,
        changed: false,
        error: `API returned ${response.status}`,
      }, origin)
    }

    result = await response.json()

    // Determine status from offers response
    if (result.acceptedOffer) {
      ylStatus = 'OfferAccepted'
    } else if (result.providedOffers && result.providedOffers.length > 0) {
      ylStatus = 'OffersProvided'
    } else {
      ylStatus = 'Stage1Submitted' // Still waiting for decision
    }
  } catch (fetchErr) {
    console.warn(`[provider-youlend] Status fetch failed for lead ${externalRef}:`, fetchErr)
    return jsonResponse({
      youlend_status: 'unknown',
      internal_status: data.application.status,
      changed: false,
    }, origin)
  }

  const mappedStatus = YOULEND_STATUS_MAP[ylStatus]
  console.log(`[provider-youlend] YouLend status: ${ylStatus} → ${mappedStatus}`)

  // Update internal status if changed
  if (mappedStatus && mappedStatus !== data.application.status) {
    const { error } = await supabase.rpc('change_application_status', {
      p_application_id: applicationId,
      p_new_status: mappedStatus,
      p_note: `YouLend status: ${ylStatus}`,
    })

    if (error) {
      console.error('[provider-youlend] Status update error:', error)
    }
  }

  return jsonResponse({
    youlend_status: ylStatus,
    internal_status: mappedStatus || data.application.status,
    changed: mappedStatus !== data.application.status,
  }, origin)
}

// ─── OFFERS ─────────────────────────────────────────────────

async function handleGetOffers(
  supabase: ReturnType<typeof createServiceClient>,
  applicationId: string,
  origin: string | null
) {
  const data = await fetchSubmissionData(supabase, applicationId)
  const leadId = (data.application.metadata as any)?.external_ref
  if (!leadId) return errorResponse('No external reference found', origin)

  const baseUrl = getBaseUrl()
  const token = await getAccessToken(getAudience('onboarding'))

  const response = await fetch(`${baseUrl}/onboarding/Leads/${leadId}/offers`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`[provider-youlend] Get offers error ${response.status}:`, errorBody)
    throw new Error(`YouLend get offers failed: ${response.status}`)
  }

  const result = await response.json()
  console.log(`[provider-youlend] Offers for lead ${leadId}:`, JSON.stringify(result))

  return jsonResponse(result, origin)
}

async function handleCalculateOffers(
  supabase: ReturnType<typeof createServiceClient>,
  applicationId: string,
  origin: string | null,
  extra?: { amount?: number }
) {
  const data = await fetchSubmissionData(supabase, applicationId)
  const leadId = (data.application.metadata as any)?.external_ref
  if (!leadId) return errorResponse('No external reference found', origin)
  if (!extra?.amount) return errorResponse('amount is required', origin)

  const baseUrl = getBaseUrl()
  const token = await getAccessToken(getAudience('onboarding'))

  const response = await fetch(`${baseUrl}/onboarding/Leads/${leadId}/calculateoffers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ amount: extra.amount }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`[provider-youlend] Calculate offers error ${response.status}:`, errorBody)
    throw new Error(`YouLend calculate offers failed: ${response.status}`)
  }

  const result = await response.json()
  return jsonResponse(result, origin)
}

// ─── ACCEPT OFFER ───────────────────────────────────────────

async function handleAcceptOffer(
  supabase: ReturnType<typeof createServiceClient>,
  applicationId: string,
  origin: string | null,
  extra?: { offerId?: string }
) {
  const data = await fetchSubmissionData(supabase, applicationId)
  const leadId = (data.application.metadata as any)?.external_ref
  if (!leadId) return errorResponse('No external reference found', origin)
  if (!extra?.offerId) return errorResponse('offerId is required', origin)

  const baseUrl = getBaseUrl()
  const token = await getAccessToken(getAudience('onboarding'))

  const response = await fetch(
    `${baseUrl}/onboarding/Leads/${leadId}/offers/${extra.offerId}/acceptance`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`[provider-youlend] Accept offer error ${response.status}:`, errorBody)
    throw new Error(`YouLend accept offer failed: ${response.status}`)
  }

  const result = await response.json()
  console.log(`[provider-youlend] Offer accepted:`, JSON.stringify(result))

  // Update status to offer_accepted
  await supabase.rpc('change_application_status', {
    p_application_id: applicationId,
    p_new_status: 'offer_accepted',
    p_note: `Offer ${extra.offerId} accepted`,
  })

  return jsonResponse({
    accepted: true,
    eligibleForInstantSigning: result.eligibleForInstantSigning ?? false,
    ...result,
  }, origin)
}

// ─── DOCUMENTS + SIGNING ────────────────────────────────────

async function handleGetDocuments(
  supabase: ReturnType<typeof createServiceClient>,
  applicationId: string,
  origin: string | null,
  extra?: { documentSigningId?: string }
) {
  const data = await fetchSubmissionData(supabase, applicationId)
  const leadId = (data.application.metadata as any)?.external_ref
  if (!leadId) return errorResponse('No external reference found', origin)

  const baseUrl = getBaseUrl()
  const token = await getAccessToken(getAudience('onboarding'))

  // If documentSigningId provided, fetch specific signing documents
  if (extra?.documentSigningId) {
    const response = await fetch(
      `${baseUrl}/onboarding/DocumentSigning/${extra.documentSigningId}`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
      }
    )
    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`YouLend get documents failed: ${response.status} — ${errorBody}`)
    }
    return jsonResponse(await response.json(), origin)
  }

  // Otherwise, fetch the unsigned loan document for the lead
  const response = await fetch(
    `${baseUrl}/onboarding/Leads/${leadId}/loandocument`,
    {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`[provider-youlend] Get loan document error ${response.status}:`, errorBody)
    throw new Error(`YouLend get loan document failed: ${response.status}`)
  }

  return jsonResponse(await response.json(), origin)
}

async function handleSignDocuments(
  supabase: ReturnType<typeof createServiceClient>,
  applicationId: string,
  origin: string | null,
  extra?: { verificationId?: string }
) {
  const data = await fetchSubmissionData(supabase, applicationId)
  const leadId = (data.application.metadata as any)?.external_ref
  if (!leadId) return errorResponse('No external reference found', origin)
  if (!extra?.verificationId) return errorResponse('verificationId is required', origin)

  const baseUrl = getBaseUrl()
  const token = await getAccessToken(getAudience('onboarding'))

  const response = await fetch(
    `${baseUrl}/onboarding/Leads/${leadId}/clicksigndocuments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ verificationId: extra.verificationId }),
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`[provider-youlend] Sign documents error ${response.status}:`, errorBody)
    throw new Error(`YouLend sign documents failed: ${response.status}`)
  }

  // Update status to signed
  await supabase.rpc('change_application_status', {
    p_application_id: applicationId,
    p_new_status: 'signed',
    p_note: 'Contract signed via instant signing',
  })

  return jsonResponse({ signed: true }, origin)
}

// ─── PAYLOAD MAPPING ────────────────────────────────────────

function mapToLeadPayload(data: SubmissionData, extra?: Record<string, unknown>) {
  const { company, user, inquiry } = data
  const userMeta = user.metadata || {}
  const address = company.address || {}

  const companyType = COMPANY_TYPE_MAP[
    (extra?.ylCompanyType as string) || company.legal_form || ''
  ] || 'GmbhUg'

  return {
    thirdPartyCustomerId: data.application.id,
    companyName: company.name,
    countryISOCode: 'DEU',
    loanCurrencyISOCode: 'EUR',
    keyContactName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
    companyType,
    registeredAddress: {
      line1: address.street || '',
      city: address.city || '',
      areaCode: address.zip || '',
      countryISOCode: 'DEU',
    },
    contactPhoneNumber: user.phone || '',
    contactEmailAddress: (userMeta as any).applicant_email || user.email,
    confirmedCreditSearch: (extra?.confirmedCreditSearch as boolean) ?? true,
    // Optional fields
    ...(company.website ? { companyWebsite: company.website } : {}),
    ...(company.hrb ? { companyNumber: company.hrb } : {}),
    ...(company.name ? { tradingName: company.name } : {}),
    ...(inquiry.volume ? { loanAmount: inquiry.volume } : {}),
    ...(company.annual_revenue ? { monthlyCardRevenue: Math.round(company.annual_revenue / 12) } : {}),
    additionalInfo: { language: 'de' },
    preferredLanguageCode: 'DE',
  }
}

function parseDateToModel(dateStr: string): { day: number; month: number; year: number } | undefined {
  if (!dateStr) return undefined
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return { year: Number(parts[0]), month: Number(parts[1]), day: Number(parts[2]) }
  }
  return undefined
}

function mapToSignificantPersons(data: SubmissionData, extra?: Record<string, unknown>) {
  const { user } = data
  const userMeta = user.metadata || {}
  const dobStr = (userMeta as any).date_of_birth || (userMeta as any).dob || ''

  return [{
    firstName: user.first_name || '',
    surname: user.last_name || '',
    typeOfPerson: (extra?.typeOfPerson as string) || 'DirectorAndBeneficialOwner',
    dateOfBirth: parseDateToModel(dobStr),
    emailAddress: (userMeta as any).applicant_email || user.email || '',
    mobilePhoneNumber: user.phone || '',
    address: {
      line1: (userMeta as any).street || '',
      city: (userMeta as any).city || '',
      areaCode: (userMeta as any).zip || '',
      country: 'DEU',
    },
  }]
}
