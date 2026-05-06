-- link_marketing_session: erweitert auf alle Sessions des Visitors.
-- Bisher: linkt nur die übergebene Session-ID.
-- Problem: bei Multi-Page-Funnels (z.B. Landing → /auth/login → /auth/callback)
--          wird pro Seite eine neue Session erzeugt; nur die letzte (callback)
--          bekam user_id, die ursprüngliche Acquisition-Session blieb anonym.
-- Jetzt:   findet die visitor_id der übergebenen Session und linkt alle
--          Sessions mit derselben visitor_id im selben Tenant an den User.

create or replace function link_marketing_session(
  p_session_id uuid
)
returns void as $$
declare
  v_visitor_id text;
  v_tenant_id  uuid;
begin
  select visitor_id, tenant_id
    into v_visitor_id, v_tenant_id
    from marketing_sessions
    where id = p_session_id;

  if v_visitor_id is null then
    -- Session nicht gefunden — silent return (kein Error, ist optional)
    return;
  end if;

  update marketing_sessions
    set user_id = auth.uid()
    where visitor_id = v_visitor_id
      and tenant_id = v_tenant_id
      and user_id is null;
end;
$$ language plpgsql security definer;
