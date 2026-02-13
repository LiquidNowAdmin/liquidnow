# LiqiNow Data Architecture

## Domains

```
marketing (anonymous) → core (authenticated) → inquiry → application
                                                           ↑
                                              provider ────┘
                                              document ────┘
```

Within a domain: normalize (FK references, no duplication).
Across domains: copy core fields for independence.

## Schema Overview

### Core Domain

#### tenants
Multi-tenancy / white-label root entity. LiqiNow itself is a tenant.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text NOT NULL | Tenant display name |
| slug | text UNIQUE NOT NULL | URL-safe identifier |
| domain | text | Custom domain for white-label |
| branding | jsonb | {logo_url, primary_color, secondary_color} |
| config | jsonb | {features, limits, provider_filter} |
| is_active | boolean DEFAULT true | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### users
Extends Supabase auth.users. Created via trigger on auth.users insert.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | = auth.users.id |
| tenant_id | uuid FK → tenants | |
| email | text NOT NULL | |
| role | text NOT NULL | 'lead', 'operations' |
| first_name | text | |
| last_name | text | |
| phone | text | |
| metadata | jsonb | utm_source, signup context, etc. |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### companies

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK → tenants | |
| name | text NOT NULL | |
| legal_form | text | 'gmbh', 'ug', 'ag', 'kg', 'gbr', 'einzelunternehmen' |
| ust_id | text | DE123456789 |
| hrb | text | HRB 12345 |
| website | text | |
| address | jsonb | {street, zip, city, country} |
| industry | text | 'handel', 'dienstleistung', 'produktion', etc. |
| annual_revenue | integer | In cents or whole euros |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | Soft delete |

#### company_members
Many-to-many: users ↔ companies.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK → tenants | |
| company_id | uuid FK → companies | |
| user_id | uuid FK → users | |
| role | text | 'owner', 'member' |
| created_at | timestamptz | |
| UNIQUE | (company_id, user_id) | |

### Provider Domain

#### providers
Global catalog, filterable per tenant.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text NOT NULL | |
| type | text | 'bank', 'fintech', 'factor' |
| logo_url | text | |
| website | text | |
| is_active | boolean DEFAULT true | |
| metadata | jsonb | Contact info, integration config |
| created_at | timestamptz | |

#### products

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| provider_id | uuid FK → providers | |
| name | text NOT NULL | |
| type | text | 'credit_line', 'term_loan', 'factoring', 'leasing' |
| min_volume | integer | |
| max_volume | integer | |
| min_term_months | integer | |
| max_term_months | integer | |
| interest_rate_from | decimal | |
| interest_rate_to | decimal | |
| is_active | boolean DEFAULT true | |
| metadata | jsonb | Provider-specific parameters |
| created_at | timestamptz | |

#### tenant_provider_settings
Controls which providers/products are visible per tenant.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK → tenants | |
| provider_id | uuid FK → providers | |
| is_enabled | boolean DEFAULT true | |
| config | jsonb | Tenant-specific overrides |
| created_at | timestamptz | |
| UNIQUE | (tenant_id, provider_id) | |

### Inquiry Domain

#### inquiries
A financing request from a company.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK → tenants | |
| company_id | uuid FK → companies | |
| user_id | uuid FK → users | |
| company_name | text | Cross-domain copy |
| volume | integer NOT NULL | Requested amount |
| term_months | integer | |
| purpose | text | 'wareneinkauf', 'liquiditaet', 'wachstum', etc. |
| status | text DEFAULT 'new' | 'new', 'matched', 'completed' |
| metadata | jsonb | Extra context |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Application Domain

#### applications
One per selected product. Created when user picks a product from inquiry matches.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK → tenants | |
| inquiry_id | uuid FK → inquiries | |
| product_id | uuid FK → products | |
| company_id | uuid FK → companies | For RLS |
| user_id | uuid FK → users | |
| provider_name | text | Cross-domain copy |
| product_name | text | Cross-domain copy |
| volume | integer | Cross-domain copy from inquiry |
| term_months | integer | Cross-domain copy from inquiry |
| status | text DEFAULT 'new' | 'new', 'product_selected', 'inquired', 'signed', 'closed', 'rejected' |
| metadata | jsonb | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### application_offers
Indicative or final offers from providers (or manually by Operations).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK → tenants | |
| application_id | uuid FK → applications | |
| company_id | uuid FK → companies | For RLS |
| type | text | 'indicative', 'final' |
| interest_rate | decimal | |
| volume | integer | |
| term_months | integer | |
| monthly_payment | decimal | |
| total_cost | decimal | |
| conditions | jsonb | Flexible conditions/terms |
| valid_until | date | |
| created_by | uuid FK → users | Who created (Operations or system) |
| created_at | timestamptz | |

#### application_status_logs
Audit trail for status changes.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK → tenants | |
| application_id | uuid FK → applications | |
| from_status | text | |
| to_status | text | |
| changed_by | uuid FK → users | |
| note | text | Optional comment |
| created_at | timestamptz | |

#### application_documents
Junction: which documents are attached to which application.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK → tenants | |
| application_id | uuid FK → applications | |
| document_id | uuid FK → documents | |
| created_at | timestamptz | |
| UNIQUE | (application_id, document_id) | |

### Document Domain

#### documents
Files belong to a company, selectable per application.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK → tenants | |
| company_id | uuid FK → companies | |
| uploaded_by | uuid FK → users | |
| name | text NOT NULL | Display name |
| category | text | Free text: 'bwa', 'jahresabschluss', 'kontoauszug', etc. |
| file_path | text NOT NULL | Supabase Storage path |
| file_size | integer | Bytes |
| mime_type | text | |
| metadata | jsonb | Extracted data, analysis results |
| created_at | timestamptz | |

### Marketing Domain

#### marketing_sessions
Anonymous visitor sessions.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK → tenants | |
| visitor_id | text | Anonymous cookie/fingerprint |
| user_id | uuid FK → users | Linked after signup |
| utm_source | text | |
| utm_medium | text | |
| utm_campaign | text | |
| referrer | text | |
| landing_page | text | |
| device_type | text | |
| created_at | timestamptz | |

#### marketing_events
Funnel tracking, page views, widget interactions.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK → tenants | |
| session_id | uuid FK → marketing_sessions | |
| event_type | text NOT NULL | 'page_view', 'widget_interaction', 'funnel_start', 'funnel_step', 'funnel_complete' |
| properties | jsonb | {step, volume, term, page, ...} |
| created_at | timestamptz | |

### Event System

#### events
Central event log. Auto-populated by triggers on all business tables.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid | From the entity |
| entity_type | text NOT NULL | 'application', 'inquiry', 'document', 'company', etc. |
| entity_id | uuid NOT NULL | Which record |
| event_type | text NOT NULL | 'created', 'updated', 'deleted', 'status_changed', etc. |
| actor_id | uuid | Who triggered (null for system) |
| actor_type | text | 'user', 'system', 'webhook' |
| payload | jsonb | Event-specific data (old/new values, changes) |
| metadata | jsonb | Request context (ip, user-agent, etc.) |
| created_at | timestamptz DEFAULT now() | |

**Triggers**: Every INSERT, UPDATE, DELETE on business tables fires a trigger that writes to `events`.

**Event Chains**: A PostgreSQL function can check events and trigger follow-up actions. Example: all documents uploaded → auto-advance application status.

**Realtime**: Supabase Realtime subscription on `events` table for live Operations dashboard.

## RLS Strategy

| Role | Access |
|------|--------|
| **lead** | Own tenant + own companies only (via company_members) |
| **operations** | Own tenant, all companies within tenant |
| **service_role** | Everything (backend only, never exposed to FE) |

Every table with `tenant_id` gets:
1. Policy: `tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())`
2. Lead role adds: `company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())`

Providers/products are global (no tenant_id) but filtered via `tenant_provider_settings`.

## PostgreSQL Functions

| Function | Domain | Purpose |
|----------|--------|---------|
| `handle_new_auth_user()` | core | Trigger: creates users row when auth.users signup |
| `change_application_status(app_id, new_status)` | application | Validates transition, logs event, returns result |
| `create_inquiry(company_id, volume, term, purpose)` | inquiry | Creates inquiry with cross-domain copies |
| `submit_application(inquiry_id, product_id)` | application | Creates application with cross-domain copies |
| `log_event()` | events | Generic trigger function for event logging |
| `check_event_chains()` | events | Runs after event insert, triggers follow-up actions |

## Edge Functions

| Function | Purpose |
|----------|---------|
| `company-search` | Fetches website → extracts company data via OpenAI |
| `analyze-document` | PDF/document analysis (one function, multiple triggers) |
| `send-notification` | Email/notification dispatch |
| `provider-webhook` | Receives callbacks from bank/provider APIs |

## Data Flow: Funnel to Application

```
1. Landing Page
   → marketing_sessions (anonymous)
   → marketing_events (page_view, widget_interaction)

2. Funnel Widget (volume, term)
   → marketing_events (funnel_start)

3. Funnel Steps (legal form, company, purpose, revenue, industry, contact)
   → marketing_events (funnel_step per step)

4. Final Submit (contact form)
   → auth.users (signup/login)
   → users (trigger: handle_new_auth_user, copies utm data)
   → companies (from company search data)
   → company_members (link user to company)
   → inquiries (volume, term, purpose from funnel)
   → marketing_events (funnel_complete)
   → marketing_sessions.user_id updated (link anonymous to user)

5. Product Matching
   → products matched against inquiry parameters
   → displayed to user

6. Application
   → applications (user selects products)
   → application_documents (user assigns documents)
   → application_offers (from providers or Operations)
   → application_status_logs (every change tracked)

Every step → events table (via triggers)
```
