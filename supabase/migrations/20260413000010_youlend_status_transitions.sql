-- Add offer_received and offer_accepted status transitions for YouLend lifecycle
-- inquired → offer_received → offer_accepted → signed

create or replace function change_application_status(
  p_application_id uuid,
  p_new_status text,
  p_note text default null
)
returns void as $$
declare
  v_application record;
  v_allowed boolean := false;
begin
  select * into v_application from applications where id = p_application_id;
  if v_application is null then
    raise exception 'Application not found';
  end if;

  if not exists (
    select 1 from company_members
    where company_id = v_application.company_id and user_id = auth.uid()
  ) and get_user_role() != 'operations' then
    raise exception 'No access to this application';
  end if;

  case v_application.status
    when 'new' then
      v_allowed := p_new_status in ('product_selected', 'inquired', 'rejected');
    when 'product_selected' then
      v_allowed := p_new_status in ('inquired', 'rejected');
    when 'inquired' then
      v_allowed := p_new_status in ('offer_received', 'signed', 'rejected');
    when 'offer_received' then
      v_allowed := p_new_status in ('offer_accepted', 'signed', 'rejected');
    when 'offer_accepted' then
      v_allowed := p_new_status in ('signed', 'rejected');
    when 'signed' then
      v_allowed := p_new_status in ('closed', 'rejected');
    when 'rejected' then
      v_allowed := false;
    when 'closed' then
      v_allowed := false;
    else
      v_allowed := true;
  end case;

  if get_user_role() = 'operations' then
    v_allowed := true;
  end if;

  if not v_allowed then
    raise exception 'Status transition from % to % is not allowed', v_application.status, p_new_status;
  end if;

  update applications set status = p_new_status where id = p_application_id;
end;
$$ language plpgsql security definer;
