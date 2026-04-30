-- Email-Templates-System für Newsletter + Transaktionsmails
-- Block-basiert (jsonb), KI-generiert via email-generate Edge Function,
-- editierbar im Admin /admin/emails. Operations-only RLS.

create table email_templates (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  slug            text not null,
  name            text not null,                                       -- interner Name
  type            text not null check (type in ('newsletter', 'transactional')),
  category        text,
  subject         text not null default '',
  preheader       text not null default '',                            -- Inbox-Vorschautext
  blocks          jsonb not null default '[]'::jsonb,                  -- Array<Block>
  cta_label       text,
  cta_url         text,
  variables_used  text[] not null default '{}',
  attachments     jsonb not null default '[]'::jsonb,                  -- [{kind, file_id|storage_path, filename, mime_type, size_bytes}]
  intent          text,                                                -- ursprünglicher User-Brief für Audit/Re-Generation
  published       boolean not null default false,
  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index email_templates_tenant_idx       on email_templates (tenant_id);
create index email_templates_type_idx         on email_templates (tenant_id, type);
create index email_templates_published_idx    on email_templates (tenant_id, published)
  where published = true;

create trigger trg_email_templates_updated_at
  before update on email_templates
  for each row execute procedure set_articles_updated_at();

-- Wiederverwendbare Anhänge-Library
create table email_attachments_library (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  filename      text not null,
  storage_path  text not null,                                          -- Pfad im Scaleway-Bucket
  mime_type     text not null,
  size_bytes    bigint not null,
  description   text,
  created_by    uuid references users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index email_attachments_library_tenant_idx on email_attachments_library (tenant_id);

-- ============================================
-- RLS — operations only
-- ============================================
alter table email_templates             enable row level security;
alter table email_attachments_library   enable row level security;

create policy "Operations can read email templates"
  on email_templates for select
  using (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');

create policy "Operations can insert email templates"
  on email_templates for insert
  with check (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');

create policy "Operations can update email templates"
  on email_templates for update
  using (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');

create policy "Operations can delete email templates"
  on email_templates for delete
  using (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');

create policy "Operations can read attachment library"
  on email_attachments_library for select
  using (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');

create policy "Operations can insert attachment library"
  on email_attachments_library for insert
  with check (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');

create policy "Operations can delete attachment library"
  on email_attachments_library for delete
  using (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');

-- ============================================
-- Storage bucket for email attachments
-- ============================================
insert into storage.buckets (id, name, public)
values ('email-attachments', 'email-attachments', false)
on conflict (id) do nothing;

-- Operations can read/write/delete in this bucket
create policy "Operations can manage email attachments"
  on storage.objects for all
  using (
    bucket_id = 'email-attachments'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.users
       where id = auth.uid() and role = 'operations'
    )
  );
