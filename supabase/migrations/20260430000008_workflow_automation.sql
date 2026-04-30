-- Autopilot-Workflow-System (port of moonbase autopilot, angepasst an LiqiNow).
-- Drei Tabellen + Conditions/Actions-Engine + Cron-Job + AFTER-INSERT-Triggers.
-- Email-Sender wird vom Application-Code aktualisiert um Logs in sent_emails zu schreiben.

-- ============================================
-- 1. TABELLEN
-- ============================================

-- workflow_rules: deklarative Regeln, von Operations gepflegt
create table workflow_rules (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  name            text not null,
  description     text,
  is_active       boolean not null default true,

  entity_type     text not null,      -- 'inquiries' | 'applications' | 'users'
  trigger_type    text not null check (trigger_type in ('record_created', 'time_based')),

  time_config     jsonb,              -- Beispiele:
                                      --   {"type":"days_in_status","status_field":"status","status_value":"new","days":3}
                                      --   {"type":"days_after_field","field":"created_at","days":7}

  conditions      jsonb not null default '{"match_type":"all","conditions":[]}'::jsonb,
                                      -- {match_type:'all'|'any', conditions:[{field,operator,value}, ...]}

  actions         jsonb not null default '[]'::jsonb,
                                      -- [{action_type:'send_email', config:{template_slug, recipient_type, custom_email?}}]

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references users(id) on delete set null
);

create index idx_workflow_rules_tenant on workflow_rules (tenant_id);
create index idx_workflow_rules_entity_trigger on workflow_rules (entity_type, trigger_type, is_active);

create trigger trg_workflow_rules_updated_at
  before update on workflow_rules
  for each row execute procedure set_articles_updated_at();

-- workflow_executions: Audit-Log jedes Rule-Runs
create table workflow_executions (
  id                   uuid primary key default uuid_generate_v4(),
  tenant_id            uuid not null references tenants(id) on delete cascade,
  rule_id              uuid not null references workflow_rules(id) on delete cascade,
  entity_type          text not null,
  entity_id            uuid not null,
  status               text not null default 'success' check (status in ('success','failure','skipped')),
  error_message        text,
  matched_conditions   jsonb,
  executed_actions     jsonb,
  executed_at          timestamptz not null default now()
);

create index idx_workflow_executions_rule on workflow_executions (rule_id);
create index idx_workflow_executions_entity on workflow_executions (entity_type, entity_id);
create index idx_workflow_executions_executed_at on workflow_executions (executed_at desc);

-- workflow_execution_tracking: Dedup für time-based (jeder Rule feuert pro Entity nur einmal)
create table workflow_execution_tracking (
  id                uuid primary key default uuid_generate_v4(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  rule_id           uuid not null references workflow_rules(id) on delete cascade,
  entity_type       text not null,
  entity_id         uuid not null,
  last_executed_at  timestamptz not null default now(),
  unique (rule_id, entity_type, entity_id)
);

create index idx_workflow_tracking_rule_entity on workflow_execution_tracking (rule_id, entity_type, entity_id);

-- sent_emails: jede ausgehende E-Mail wird hier geloggt (workflow, manual, test)
create table sent_emails (
  id                  uuid primary key default uuid_generate_v4(),
  tenant_id           uuid not null references tenants(id) on delete cascade,

  -- Send-Metadaten
  recipient_email     text not null,
  recipient_name      text,
  subject             text not null,
  body_html           text,
  body_text           text,
  resend_id           text,                 -- Resend-Message-ID
  status              text not null default 'sent' check (status in ('sent','failed','bounced')),
  error_message       text,

  -- Source / Trigger
  trigger_kind        text not null check (trigger_kind in ('workflow','manual','test','transactional')),
  trigger_rule_id     uuid references workflow_rules(id) on delete set null,
  template_slug       text,
  template_id         uuid references email_templates(id) on delete set null,

  -- Optional Entity-Bezug (zur Anzeige im Detail-View)
  entity_type         text,                 -- 'inquiries' | 'applications' | 'users' | 'companies' | NULL
  entity_id           uuid,

  sent_at             timestamptz not null default now(),
  sent_by             uuid references users(id) on delete set null
);

create index idx_sent_emails_tenant on sent_emails (tenant_id);
create index idx_sent_emails_entity on sent_emails (entity_type, entity_id) where entity_id is not null;
create index idx_sent_emails_recipient on sent_emails (recipient_email);
create index idx_sent_emails_sent_at on sent_emails (sent_at desc);

-- ============================================
-- 2. RLS
-- ============================================
alter table workflow_rules                enable row level security;
alter table workflow_executions           enable row level security;
alter table workflow_execution_tracking   enable row level security;
alter table sent_emails                   enable row level security;

create policy "Operations can manage workflow_rules"
  on workflow_rules for all
  using (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');

create policy "Operations can read workflow_executions"
  on workflow_executions for select
  using (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');

create policy "Operations can read workflow_execution_tracking"
  on workflow_execution_tracking for select
  using (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');

create policy "Operations can read sent_emails"
  on sent_emails for select
  using (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');
