import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export interface SubmissionData {
  application: {
    id: string
    status: string
    volume: number
    term_months: number | null
    metadata: Record<string, unknown>
  }
  company: {
    id: string
    name: string
    legal_form: string | null
    hrb: string | null
    ust_id: string | null
    crefo: string | null
    website: string | null
    address: { street?: string; zip?: string; city?: string; country?: string } | null
    annual_revenue: number | null
  }
  user: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    phone: string | null
    metadata: Record<string, unknown>
  }
  inquiry: {
    id: string
    volume: number
    term_months: number | null
    purpose: string | null
    metadata: Record<string, unknown>
  }
  provider: {
    id: string
    name: string
    type: string | null
    metadata: Record<string, unknown>
  }
  product: {
    id: string
    name: string
    type: string | null
    metadata: Record<string, unknown>
  }
  tenant_config: Record<string, unknown>
}

export async function fetchSubmissionData(
  supabase: SupabaseClient,
  applicationId: string
): Promise<SubmissionData> {
  // Fetch application with joined inquiry, product, and provider
  const { data: app, error: appError } = await supabase
    .from('applications')
    .select(`
      id, status, volume, term_months, metadata, company_id, user_id, tenant_id,
      inquiries ( id, volume, term_months, purpose, metadata ),
      products ( id, name, type, metadata, provider_id,
        providers ( id, name, type, metadata )
      )
    `)
    .eq('id', applicationId)
    .single()

  if (appError || !app) {
    throw new Error(`Application not found: ${applicationId}`)
  }

  // Fetch company and user in parallel
  const [companyResult, userResult, configResult] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name, legal_form, hrb, ust_id, crefo, website, address, annual_revenue')
      .eq('id', app.company_id)
      .single(),
    supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, metadata')
      .eq('id', app.user_id)
      .single(),
    supabase
      .from('tenant_provider_settings')
      .select('config')
      .eq('tenant_id', app.tenant_id)
      .eq('provider_id', (app as any).products.provider_id)
      .maybeSingle(),
  ])

  if (companyResult.error || !companyResult.data) {
    throw new Error(`Company not found for application: ${applicationId}`)
  }
  if (userResult.error || !userResult.data) {
    throw new Error(`User not found for application: ${applicationId}`)
  }

  const inquiry = (app as any).inquiries
  const product = (app as any).products
  const provider = product.providers

  return {
    application: {
      id: app.id,
      status: app.status,
      volume: app.volume,
      term_months: app.term_months,
      metadata: app.metadata || {},
    },
    company: companyResult.data,
    user: userResult.data,
    inquiry: {
      id: inquiry.id,
      volume: inquiry.volume,
      term_months: inquiry.term_months,
      purpose: inquiry.purpose,
      metadata: inquiry.metadata || {},
    },
    provider: {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      metadata: provider.metadata || {},
    },
    product: {
      id: product.id,
      name: product.name,
      type: product.type,
      metadata: product.metadata || {},
    },
    tenant_config: configResult.data?.config || {},
  }
}
