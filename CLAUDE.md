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

## UI/UX Rules

### Component System
- ONE global set of UI components defined as CSS classes in `globals.css`
- NEVER use inline CSS (except dynamic values like slider progress)
- ONE radio button component, ONE input field, ONE select — no variants
- **NEVER nest boxes inside boxes** (no card inside card, no bordered container inside bordered container) — use dividers/spacing instead
- Every funnel step explains itself: headline = what to do, subtext = why, CTA = what happens next

### Funnel Design
- **NEVER use popovers, modals, or overlays for funnel steps**
- **ALWAYS use separate fullscreen pages** for each funnel step
- Each step is a dedicated route (e.g., `/antrag`, `/antrag/zweck`, etc.)

### Design Tokens
- Colors: Turquoise (#00CED1), Gold (#FFD700), Dark (#2C3E50)
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
