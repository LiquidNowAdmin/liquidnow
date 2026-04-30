-- Articles + Article Categories for the Ratgeber CMS
-- Free taxonomy: users (operations) can add categories; AI may suggest new ones.
-- 1:n: each article belongs to exactly one category.

create table article_categories (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  slug        text not null,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index article_categories_tenant_idx on article_categories (tenant_id);

create table articles (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  category_id      uuid not null references article_categories(id) on delete restrict,
  slug             text not null,
  title            text not null,
  excerpt          text not null default '',
  content          text not null default '',
  meta_title       text not null default '',
  meta_description text not null default '',
  image            text not null default '',
  image_alt        text not null default '',
  focus_keyword    text not null default '',
  keywords         text[] not null default '{}',
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index articles_tenant_idx     on articles (tenant_id);
create index articles_category_idx   on articles (category_id);
create index articles_published_idx  on articles (tenant_id, published_at desc) where published_at is not null;

-- Auto-update `updated_at` on row change
create or replace function set_articles_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_articles_updated_at
  before update on articles
  for each row execute procedure set_articles_updated_at();

create trigger trg_article_categories_updated_at
  before update on article_categories
  for each row execute procedure set_articles_updated_at();

-- ============================================
-- RLS
-- ============================================
alter table article_categories enable row level security;
alter table articles            enable row level security;

-- Categories: anyone in the tenant may read; only operations may write.
create policy "Categories are public-readable per tenant"
  on article_categories for select
  using (true);

create policy "Operations can insert categories"
  on article_categories for insert
  with check (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

create policy "Operations can update categories"
  on article_categories for update
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

create policy "Operations can delete categories"
  on article_categories for delete
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

-- Articles: published rows are world-readable; drafts only for operations.
create policy "Published articles are public-readable"
  on articles for select
  using (published_at is not null);

create policy "Operations can read all articles"
  on articles for select
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

create policy "Operations can insert articles"
  on articles for insert
  with check (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

create policy "Operations can update articles"
  on articles for update
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );

create policy "Operations can delete articles"
  on articles for delete
  using (
    tenant_id = get_user_tenant_id()
    and get_user_role() = 'operations'
  );
