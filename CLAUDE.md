# LiquidNow - Development Guidelines

## UI/UX Preferences

### Funnel Design
- **NEVER use popovers, modals, or overlays for funnel steps**
- **ALWAYS use separate fullscreen pages** for each funnel step
- Each step should be a dedicated route (e.g., `/antrag`, `/schritt-2`, etc.)
- Use proper page navigation with Next.js routing

### Rationale
- Better mobile experience
- Clearer user flow
- Easier to track analytics per step
- No z-index/overlay issues

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4 (CSS-based config with `@theme inline`)
- Framer Motion (animations)
- Lucide React (icons)

## Design System
- All UI components defined as CSS classes in `globals.css`
- Avoid inline styles (except dynamic values like slider progress)
- Colors: Turquoise (#00CED1), Gold (#FFD700), Dark (#2C3E50)
- Solid colors for buttons/badges (gradients only for decorative elements)

## API Integration
- ChatGPT (GPT-4o-mini) for company data extraction from websites
- OpenAI API key stored in `.env.local`
- Server-side API route: `/api/company-search`
