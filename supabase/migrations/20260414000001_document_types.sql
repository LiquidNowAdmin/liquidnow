-- Add doc_type and valid_until to documents table
-- doc_type: standardized document category (bank_statement, bwa_susa, annual_report, etc.)
-- valid_until: auto-calculated expiry based on doc_type

alter table documents add column if not exists doc_type text;
alter table documents add column if not exists valid_until timestamptz;

create index if not exists idx_documents_doc_type on documents(doc_type);

-- Helper function to calculate document validity
create or replace function calculate_document_validity(p_doc_type text, p_uploaded_at timestamptz default now())
returns timestamptz as $$
begin
  case p_doc_type
    when 'bank_statement' then return p_uploaded_at + interval '14 days';
    when 'bwa_susa' then return p_uploaded_at + interval '2 months';
    when 'annual_report' then return p_uploaded_at + interval '12 months';
    when 'tax_assessment' then return p_uploaded_at + interval '12 months';
    when 'asset_statement' then return p_uploaded_at + interval '12 months';
    when 'profit_determination' then return p_uploaded_at + interval '12 months';
    else return p_uploaded_at + interval '12 months';
  end case;
end;
$$ language plpgsql immutable;

-- Auto-set valid_until on insert
create or replace function set_document_validity()
returns trigger as $$
begin
  if NEW.doc_type is not null and NEW.valid_until is null then
    NEW.valid_until := calculate_document_validity(NEW.doc_type, coalesce(NEW.created_at, now()));
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_set_document_validity on documents;
create trigger trg_set_document_validity
  before insert or update on documents
  for each row execute function set_document_validity();
