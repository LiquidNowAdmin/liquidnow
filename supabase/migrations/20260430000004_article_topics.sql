-- Article Topics — SEO-priorisierte Themenliste für Topic Clustering.
-- Operations pflegen Topics manuell + per AI-Vorschlag.
-- Artikel können (optional) genau einem Topic zugeordnet werden, damit die
-- "Wie viele Artikel haben wir schon zu Topic X?"-Frage trivial wird.

create table article_topics (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  slug          text not null,
  label         text not null,
  notes         text,                                       -- was der Pillar-Artikel abdecken soll
  search_volume integer,                                    -- monatl. Suchvolumen, manuell aus Keyword Planner
  priority      text not null default 'medium'              -- high | medium | low
                check (priority in ('high','medium','low')),
  intent        text not null default 'informational'       -- informational | commercial | transactional
                check (intent in ('informational','commercial','transactional')),
  target_count  integer not null default 5,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index article_topics_tenant_idx on article_topics (tenant_id);

create trigger trg_article_topics_updated_at
  before update on article_topics
  for each row execute procedure set_articles_updated_at();

-- FK von articles → article_topics (nullable: alte Artikel ohne Topic erlaubt)
alter table articles
  add column topic_id uuid references article_topics(id) on delete set null;

create index articles_topic_idx on articles (topic_id) where topic_id is not null;

-- RLS
alter table article_topics enable row level security;

create policy "Operations can read topics"
  on article_topics for select
  using (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');

create policy "Operations can insert topics"
  on article_topics for insert
  with check (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');

create policy "Operations can update topics"
  on article_topics for update
  using (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');

create policy "Operations can delete topics"
  on article_topics for delete
  using (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');
