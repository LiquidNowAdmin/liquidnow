-- Aggregate views + CTA clicks per published article from marketing_events.
-- Operations only.

create or replace function admin_article_stats()
returns table (
  slug text,
  views bigint,
  cta_clicks bigint
)
language sql
security definer
set search_path = public, pg_temp
as $$
  with views as (
    select
      regexp_replace(
        coalesce(properties->>'path', properties->>'pathname', ''),
        '^/ratgeber/([^/]+)/?.*$',
        '\1'
      ) as slug,
      count(*) as n
    from public.marketing_events
    where event_type = 'page_view'
      and tenant_id = get_user_tenant_id()
      and (
        properties->>'path' like '/ratgeber/%'
        or properties->>'pathname' like '/ratgeber/%'
      )
    group by 1
  ),
  ctas as (
    select
      properties->>'article_slug' as slug,
      count(*) as n
    from public.marketing_events
    where event_type = 'cta_click'
      and tenant_id = get_user_tenant_id()
      and properties->>'article_slug' is not null
    group by 1
  ),
  ids as (
    select a.slug from public.articles a where a.tenant_id = get_user_tenant_id()
  )
  select
    ids.slug,
    coalesce(v.n, 0) as views,
    coalesce(c.n, 0) as cta_clicks
  from ids
  left join views v on v.slug = ids.slug
  left join ctas c on c.slug = ids.slug;
$$;

revoke all on function admin_article_stats() from public;
grant execute on function admin_article_stats() to authenticated;
