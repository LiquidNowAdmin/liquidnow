-- ============================================
-- Migration: Platform Offers View Function
-- Returns product-based offers with provider info
-- for the platform comparison page
-- ============================================

create or replace function get_platform_offers(
  p_min_term_months integer default null,
  p_max_term_months integer default null,
  p_min_interest_rate decimal default null,
  p_max_interest_rate decimal default null
)
returns table (
  product_id uuid,
  provider_id uuid,
  provider_name text,
  provider_logo_url text,
  provider_type text,
  product_name text,
  product_type text,
  min_volume integer,
  max_volume integer,
  min_term_months integer,
  max_term_months integer,
  interest_rate_from decimal,
  interest_rate_to decimal,
  metadata jsonb
) as $$
begin
  return query
  select
    pr.id as product_id,
    pv.id as provider_id,
    pv.name as provider_name,
    pv.logo_url as provider_logo_url,
    pv.type as provider_type,
    pr.name as product_name,
    pr.type as product_type,
    pr.min_volume,
    pr.max_volume,
    pr.min_term_months,
    pr.max_term_months,
    pr.interest_rate_from,
    pr.interest_rate_to,
    pr.metadata
  from products pr
  join providers pv on pr.provider_id = pv.id
  where pr.is_active = true
    and pv.is_active = true
    and (p_min_term_months is null or pr.max_term_months >= p_min_term_months)
    and (p_max_term_months is null or pr.min_term_months <= p_max_term_months)
    and (p_min_interest_rate is null or pr.interest_rate_to >= p_min_interest_rate)
    and (p_max_interest_rate is null or pr.interest_rate_from <= p_max_interest_rate)
  order by pr.interest_rate_from asc;
end;
$$ language plpgsql stable security definer;

-- Allow anon and authenticated users to call this function
grant execute on function get_platform_offers to anon, authenticated;
