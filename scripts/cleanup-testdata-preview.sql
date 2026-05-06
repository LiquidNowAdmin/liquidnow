-- DRY RUN: alle Counts in einer Query — Supabase-SQL-Editor zeigt nur das
-- letzte SELECT-Result, deshalb hier zusammengeführt.

with ops as (
  select string_agg(email, ', ' order by created_at)::text as emails,
         count(*) as anzahl
  from public.users where role = 'operations'
)
select 'OPERATIONS_USERS (BLEIBEN)' as section, ops.emails as detail, ops.anzahl from ops
union all select 'TO_DELETE', 'leads (users.role=lead)',         count(*) from public.users where role = 'lead'
union all select 'TO_DELETE', 'companies (gesamt)',              count(*) from public.companies
union all select 'TO_DELETE', 'company_members',                 count(*) from public.company_members
union all select 'TO_DELETE', 'inquiries',                       count(*) from public.inquiries
union all select 'TO_DELETE', 'applications',                    count(*) from public.applications
union all select 'TO_DELETE', 'application_offers',              count(*) from public.application_offers
union all select 'TO_DELETE', 'application_status_logs',         count(*) from public.application_status_logs
union all select 'TO_DELETE', 'application_documents',           count(*) from public.application_documents
union all select 'TO_DELETE', 'documents',                       count(*) from public.documents
union all select 'TO_DELETE', 'sent_emails',                     count(*) from public.sent_emails
union all select 'TO_DELETE', 'workflow_executions',             count(*) from public.workflow_executions
union all select 'TO_DELETE', 'workflow_execution_tracking',     count(*) from public.workflow_execution_tracking
union all select 'TO_DELETE', 'events',                          count(*) from public.events
union all select 'TO_DELETE', 'marketing_sessions',              count(*) from public.marketing_sessions
union all select 'TO_DELETE', 'marketing_events',                count(*) from public.marketing_events
union all select 'TO_KEEP',   'tenants',                         count(*) from public.tenants
union all select 'TO_KEEP',   'users (gesamt)',                  count(*) from public.users
union all select 'TO_KEEP',   'products',                        count(*) from public.products
union all select 'TO_KEEP',   'providers',                       count(*) from public.providers
union all select 'TO_KEEP',   'tenant_provider_settings',        count(*) from public.tenant_provider_settings
union all select 'TO_KEEP',   'email_templates',                 count(*) from public.email_templates
union all select 'TO_KEEP',   'email_attachments_library',       count(*) from public.email_attachments_library
union all select 'TO_KEEP',   'template_routes',                 count(*) from public.template_routes
union all select 'TO_KEEP',   'workflow_rules',                  count(*) from public.workflow_rules
union all select 'TO_KEEP',   'articles',                        count(*) from public.articles
union all select 'TO_KEEP',   'article_categories',              count(*) from public.article_categories
union all select 'TO_KEEP',   'article_topics',                  count(*) from public.article_topics
order by section, detail;
