import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export async function storeProviderSubmission(
  supabase: SupabaseClient,
  applicationId: string,
  externalRef: string,
  externalUrl?: string,
  providerSlug?: string
): Promise<void> {
  // Store external reference in metadata
  const { error: metaError } = await supabase
    .from('applications')
    .update({
      metadata: {
        external_ref: externalRef,
        external_url: externalUrl || null,
        provider_slug: providerSlug || null,
        submitted_at: new Date().toISOString(),
      },
      status: 'inquired',
    })
    .eq('id', applicationId)
    .in('status', ['new', 'product_selected'])

  if (metaError) {
    throw new Error(`Failed to store submission: ${metaError.message}`)
  }
}
