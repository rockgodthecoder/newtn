# Architecture — Newtn

## Tech Stack

- **Runtime:** Node.js 23
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (`@supabase/ssr`)
- **Frontend:** React 19 + Tailwind CSS v4
- **Testing:** None yet

## Directory Structure

```
newtn/
├── app/                          ← Next.js App Router pages
│   ├── layout.tsx                ← Root layout (Sidebar + main content)
│   ├── page.tsx                  ← Dashboard homepage
│   ├── globals.css               ← CSS variables (design tokens)
│   ├── tools/                    ← Public tools (no auth required)
│   │   └── price-converter/
│   │       └── page.tsx
│   └── intelligence/             ← Auth-gated Intelligence feature
│       ├── login/
│       │   └── page.tsx          ← Supabase login page
│       ├── page.tsx              ← Intelligence dashboard (protected)
│       └── SignOutButton.tsx     ← Client sign-out component
├── components/
│   ├── Sidebar.tsx               ← Left nav + mobile bottom nav (client)
│   └── ToolCard.tsx              ← Tool card (client)
├── utils/
│   └── supabase/
│       ├── client.ts             ← Browser Supabase client
│       └── server.ts             ← Server Supabase client (cookies)
├── proxy.ts                      ← Route protection (Next.js 16 proxy)
├── specs/                        ← NLSpec and interview files
└── .workflow/nlspec-workflow/    ← NLSpec workflow system
```

## Module Structure

New Intelligence features follow this pattern:

```
app/intelligence/[feature]/
├── page.tsx                      ← Server component (data fetching)
├── [Feature]Client.tsx           ← Client component (interactivity)
└── actions.ts                    ← Server actions (mutations)

app/api/[feature]/
└── route.ts                      ← API routes for external calls
```

## Patterns

### Authentication & Authorization
- **Public routes:** Everything under `/` and `/tools/*` — no auth required
- **Protected routes:** Everything under `/intelligence/*` except `/intelligence/login`
- Auth enforced in `proxy.ts` via `supabase.auth.getUser()`
- Server components use `utils/supabase/server.ts` (`createServerClient` with cookies)
- Client components use `utils/supabase/client.ts` (`createBrowserClient`)
- Redirect unauthenticated users to `/intelligence/login`

### Server vs Client Components
- Default to **server components** — no `"use client"` unless you need event handlers, state, or browser APIs
- Client components are named `[Feature]Client.tsx` or `[Feature]Button.tsx`
- Never put `"use client"` on page.tsx unless the entire page needs it

### Design System
All styling uses CSS variables defined in `app/globals.css`. Never hardcode colors — always use variables:

```css
--background: #0f0f11       /* page background */
--surface: #18181b          /* cards, panels */
--surface-2: #222228        /* inputs, secondary surfaces */
--border: #2a2a33           /* borders */
--accent: #7c3aed           /* purple primary */
--accent-light: #8b5cf6     /* lighter purple */
--accent-glow: rgba(124,58,237,0.15)
--text-primary: #f4f4f5
--text-secondary: #a1a1aa
--green: #22c55e
--green-glow: rgba(34,197,94,0.12)
```

### API Routes
- External API calls (e.g. Facebook, exchange rates) go in `app/api/[name]/route.ts`
- Keep secrets server-side — never expose `SUPABASE_SERVICE_ROLE_KEY` or third-party API keys to the browser
- Exchange rates: `open.er-api.com/v6/latest/{BASE}` (no key needed)

### Error Handling
- Server components: throw or redirect on error
- Client components: local `error` state, display inline error message
- API routes: return `{ error: string }` with appropriate HTTP status

### Proxy (Middleware)
- File: `proxy.ts` (Next.js 16 — previously `middleware.ts`)
- Export function named `proxy` (not `middleware`)
- Matcher scoped to `/intelligence/:path*`

## Build & Test Commands

```bash
npm run dev        # dev server on localhost:3000
npm run build      # production build (run before every deploy)
npm run lint       # ESLint
```

## Exemplar Module

Use **`app/tools/price-converter/page.tsx`** as the reference for:
- Client component structure
- CSS variable usage
- Inline style patterns (no Tailwind for colors — use CSS vars)
- State management patterns

Use **`app/intelligence/login/page.tsx`** as the reference for:
- Supabase auth patterns
- Form handling
- Error display

## Conventions

- No Tailwind color classes — use `style={{ color: "var(--text-primary)" }}` etc.
- Tailwind used only for layout, spacing, flexbox, grid
- `"use client"` only when required — keep components server-side by default
- Tools live in `app/tools/[tool-name]/page.tsx`
- Intelligence features live in `app/intelligence/[feature]/`
- New tools must be added to BOTH `app/page.tsx` (CATEGORIES array) and `components/Sidebar.tsx` (NAV array)
- Package name is `newtn-app` (lowercase, npm requirement)
- No console.log in production code
