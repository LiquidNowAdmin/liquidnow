# LiqiNow - Development Guidelines

## Architecture Rules (READ FIRST)

### Before any database or API work, read `docs/data-architecture.md`

### BE-First
- ALL business logic in PostgreSQL functions or Edge Functions
- Frontend is ONLY for display — no business logic, no validation beyond UX
- PostgreSQL functions for anything data-only (validation, status changes, events)
- Edge Functions ONLY for external APIs (OpenAI, bank APIs, email, webhooks)
- ONE function per task — never duplicate functionality within a domain

### Data Conventions
- ALL table names, column names, function names: **English, snake_case**
- Table names: **plural** (companies, inquiries, applications)
- Column names: **singular** (name, status, volume)
- **NEVER use PostgreSQL enums** — always `text` for type/status fields. Validate in functions
- `tenant_id` on EVERY business table (multi-tenancy from day 1)
- Use columns for queryable data, JSONB for flexible/variable metadata
- Cross-domain: copy core fields (denormalize). Within domain: normalize (FK references)

### Event-Driven
- Every data change logs to `events` table via PostgreSQL triggers
- Events can trigger other events (event chains)
- Edge Functions triggered via database webhooks when external action needed

### Security
- RLS on EVERY table — no exceptions
- Never expose service_role key to frontend
- Input validation in BE (PostgreSQL functions + Edge Functions), not just FE
- Use `auth.uid()` in RLS policies
- Frontend uses anon key + RLS only
- Sensitive data (API keys, secrets, PII like bank details) stored in **Supabase Vault** — never in plain-text columns

### Domains
- **marketing**: anonymous tracking, funnel events, sessions
- **core**: tenants, users, companies, company_members
- **inquiry**: inquiries (financing requests)
- **application**: applications, offers, status logs, document assignments
- **provider**: providers, products (global with tenant filter)
- **document**: documents (attached to company, selectable per application)
- **email**: email_templates (block-based, KI-generiert), email_attachments_library

### Email-Versand (zwingend)
- **NIEMALS Resend (oder anderen Mail-Provider) direkt aus einer Edge Function aufrufen** — immer über `supabase/functions/_shared/email-sender.ts`
- Die zentrale Sender-Utility hängt **immer** ein BCC auf `platformmails@liqinow.de` an (Compliance/Archiv) — diese Garantie wäre bei Direkt-Aufrufen weg
- From-Adresse, BCC und Default-Reply-To sind im Sender hardcoded und NICHT überschreibbar von außen
- E-Mail-Inhalte werden block-basiert in der Datenbank gehalten (`email_templates.blocks` jsonb), gerendert von `_shared/template-variables.ts:renderEmail()`
- Geschäftsbrief-Footer (Impressum, GF, HRB, USt-IdNr., „Marke der Deutschen Einkaufsfinanzierer GmbH") wird vom Renderer **automatisch** angehängt — KI/Editor schreibt ihn nicht selbst

### Template-Variablen (E-Mail, später PDF, …)
- Single Source of Truth: `supabase/functions/_shared/template-variables.ts` (Edge) + `src/lib/email-renderer.ts` (Frontend-Mirror)
- Keys mit Punkt-Notation: `{{recipient.first_name}}`, `{{company.name}}`, `{{tenant.name}}`, `{{unsubscribe.url}}`
- Auflösung via `template-variables` Edge Function (`action: 'resolve'`)
- Niemals neue Variablen ohne Eintrag in `VARIABLES` einführen

### Provider Integration Conventions
- Edge Function pro Provider: `provider-{slug}/index.ts` (z.B. `provider-qred`, `provider-youlend`)
- Provider-Slug: lowercase, keine Bindestriche im Firmennamen (z.B. `qred`, `youlend`, `iwoca`, `deutschebank`)
- Shared Utilities: `supabase/functions/_shared/` — gemeinsamer Code für alle Provider
- Env-Variablen pro Provider: `{SLUG}_API_KEY`, `{SLUG}_API_BASE_URL` (z.B. `QRED_API_KEY`)
- Funnel-Seiten pro Provider: `/antrag/{slug}/` (z.B. `/antrag/qred`)
- Status-Mapping: Plain Object `{SLUG}_STATUS_MAP` in der jeweiligen Edge Function
- Externe Referenz in `applications.metadata`: `{ external_ref, external_url, provider_slug, submitted_at }`
- Action-Parameter: `"submit"` | `"status"` | `"upload"` — einheitlich über alle Provider
- Keine PostgreSQL-Funktionen für Provider-Logik — alles in Edge Functions + `_shared/`

## UI/UX Rules

### Component System
- ONE global set of UI components defined as CSS classes in `globals.css`
- **ALWAYS reuse existing CSS classes / Tailwind tokens from `globals.css`** — never invent new patterns when one exists
- **NEVER hardcode hex color values** in JSX/TSX. Use the CSS variables / Tailwind tokens defined under `@theme inline` in `globals.css` (`bg-turquoise`, `text-dark`, `text-subtle`, `bg-sand-beige`, etc.)
- **NEVER use inline CSS** (except for dynamic computed values like slider progress that can't be expressed via classes)
- Before adding new colors or styles: check `globals.css` first — if a token doesn't exist for what you need, **extend the token system**, don't bypass it
- ONE radio button component, ONE input field, ONE select — no variants
- **NEVER nest boxes inside boxes** (no card inside card, no bordered container inside bordered container) — use dividers/spacing instead
- Every funnel step explains itself: headline = what to do, subtext = why, CTA = what happens next

### Funnel Design
- **NEVER use popovers, modals, or overlays for funnel steps**
- **ALWAYS use separate fullscreen pages** for each funnel step
- Each step is a dedicated route (e.g., `/antrag`, `/antrag/zweck`, etc.)

### Design Tokens
- Source of truth: `--color-*` variables defined in `globals.css` (`@theme inline` block at the top)
- Never duplicate or hardcode hex values from those tokens — use the Tailwind class names that Tailwind v4 auto-generates from them (`bg-turquoise`, `text-turquoise-dark`, `bg-sand-beige`, `text-dark`, `text-subtle`, …)
- Solid colors for buttons/badges (gradients only for decorative elements)

## Tech Stack
- Next.js 16 (App Router) — TypeScript
- Tailwind CSS v4 (CSS-based config with `@theme inline`)
- Framer Motion (animations)
- Lucide React (icons)
- Supabase (PostgreSQL + Auth + Edge Functions + Realtime + Storage)

## API Integration
- ChatGPT (GPT-4o-mini) for company data extraction from websites
- Browserless.io for headless Chrome rendering (SPA fallback)
- API keys in `.env.local` / Supabase secrets
