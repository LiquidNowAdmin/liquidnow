-- ============================================
-- Migration: Document Domain Tables
-- documents + FK for application_documents
-- ============================================

-- ----- DOCUMENTS -----
create table documents (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id),
  company_id  uuid not null references companies(id),
  uploaded_by uuid not null references users(id),
  name        text not null,
  category    text,
  file_path   text not null,
  file_size   integer,
  mime_type   text,
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

create index idx_documents_tenant on documents(tenant_id);
create index idx_documents_company on documents(company_id);
create index idx_documents_category on documents(category);

-- Add FK constraint to application_documents now that documents table exists
alter table application_documents
  add constraint fk_app_docs_document
  foreign key (document_id) references documents(id) on delete cascade;
