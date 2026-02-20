-- ============================================
-- Migration: Admin Dashboard Stats Function
-- Returns KPI counts for the admin dashboard
-- ============================================

create or replace function admin_get_dashboard_stats()
returns table (
  total_providers integer,
  active_providers integer,
  total_products integer,
  active_products integer,
  total_inquiries integer,
  total_companies integer
) as $$
begin
  -- Only operations role can call this
  if get_user_role() != 'operations' then
    raise exception 'Access denied: operations role required';
  end if;

  return query
  select
    (select count(*)::integer from providers) as total_providers,
    (select count(*)::integer from providers where is_active = true) as active_providers,
    (select count(*)::integer from products) as total_products,
    (select count(*)::integer from products where is_active = true) as active_products,
    (select count(*)::integer from inquiries where tenant_id = get_user_tenant_id()) as total_inquiries,
    (select count(*)::integer from companies where tenant_id = get_user_tenant_id() and deleted_at is null) as total_companies;
end;
$$ language plpgsql stable security definer;

grant execute on function admin_get_dashboard_stats to authenticated;
