-- template_routes: hardcoded + custom Routes für E-Mail-Templates und PDFs.
-- Werden als {{link.<key>}} Variable im Template verfügbar.
-- url_template kann {{entity.id}}-Platzhalter enthalten (resolved zur Send-Zeit).

create table template_routes (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  key           text not null,                                          -- z.B. 'plattform', 'admin_inquiry'
  label         text not null,                                          -- Anzeige im Picker
  url_template  text not null,                                          -- z.B. 'https://liqinow.de/admin/anfragen?id={{entity.id}}'
  description   text,
  entity_type   text,                                                   -- 'inquiries' | 'applications' | 'users' | NULL (statisch)
  is_protected  boolean not null default false,                         -- gesäte Routen können nicht gelöscht werden
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, key)
);

create index idx_template_routes_tenant on template_routes (tenant_id);

create trigger trg_template_routes_updated_at
  before update on template_routes
  for each row execute procedure set_articles_updated_at();

alter table template_routes enable row level security;

create policy "Operations can manage template_routes"
  on template_routes for all
  using (tenant_id = get_user_tenant_id() and get_user_role() = 'operations');

-- Seed Standard-Routes für jeden existierenden Tenant
insert into template_routes (tenant_id, key, label, url_template, description, entity_type, is_protected)
select t.id, r.key, r.label, r.url_template, r.description, r.entity_type, true
  from tenants t
  cross join (values
    ('home',           'Startseite',                       'https://liqinow.de',                                       'Public-Landing',                                NULL),
    ('plattform',      'Plattform (Login)',                'https://liqinow.de/plattform',                              'Eingeloggter Kundenbereich',                    NULL),
    ('plattform_dokumente','Plattform — Dokumente',       'https://liqinow.de/plattform/dokumente',                    'Upload-Bereich für Dokumente',                  NULL),
    ('plattform_profil',   'Plattform — Profil',          'https://liqinow.de/plattform/profil',                       'User-Profil',                                   NULL),
    ('wissen',         'Wissen-Übersicht',                 'https://liqinow.de/ratgeber',                               'Ratgeber-Index',                                NULL),
    ('admin',          'Admin-Dashboard',                  'https://liqinow.de/admin',                                  'Operations-Übersicht',                          NULL),
    ('admin_anfragen', 'Admin — Anfragen-Liste',           'https://liqinow.de/admin/anfragen',                         'Kanban / Lead-Übersicht',                       NULL),
    ('admin_inquiry',  'Admin — Anfrage-Detail',           'https://liqinow.de/admin/anfragen?id={{entity.id}}',        'Detailansicht im Admin (Inquiry)',              'inquiries'),
    ('admin_application','Admin — Application-Detail',     'https://liqinow.de/admin/anfragen?id={{entity.inquiry_id}}','Detailansicht im Admin (Application)',          'applications'),
    ('admin_user',     'Admin — User-Detail',              'https://liqinow.de/admin/anfragen?id={{entity.id}}',        'User-Detail (öffnet die Anfragen-Detailansicht)','users'),
    ('admin_emails',   'Admin — E-Mail-Templates',         'https://liqinow.de/admin/emails',                           'Template-Verwaltung',                           NULL),
    ('admin_autopilot','Admin — Autopilot',                'https://liqinow.de/admin/autopilot',                        'Workflow-Rules',                                NULL),
    ('impressum',      'Impressum',                        'https://liqinow.de/impressum',                              'Impressum',                                     NULL),
    ('datenschutz',    'Datenschutz',                      'https://liqinow.de/datenschutz',                            'Datenschutzerklärung',                          NULL),
    ('agb',            'AGB',                              'https://liqinow.de/agb',                                    'Allgemeine Geschäftsbedingungen',               NULL)
  ) as r(key, label, url_template, description, entity_type)
on conflict (tenant_id, key) do nothing;
