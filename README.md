# TaktFlow MVP

Production-ready MVP for takt planning (zone-by-time grid) using Next.js App Router + TypeScript + Tailwind + Supabase.

## Features
- Supabase Auth (email/password), auto-org bootstrap.
- Multi-tenant schema with RLS.
- Project, zones, trains, assignments.
- Drag/drop takt board with sticky headers.
- Diagonal generation.
- Baseline snapshots + diff highlighting (Pro-gated).
- Analytics (Pro-gated).
- Public share links via secure RPC token lookup (Pro-gated).
- Print-optimized export view with free-plan watermark.
- Billing gate scaffolding + upgrade page.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Postgres/Auth/RLS/Storage-ready)
- `@dnd-kit` for drag/drop
- `zod`, `date-fns`

## Local setup
1. Create Supabase project.
2. Run SQL migrations in order:
   - `supabase/migrations/001_init.sql`
   - `supabase/migrations/002_rls.sql`
3. Configure env in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # optional for future server admin tasks
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Install and run:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.


## Auth setup (Email + Google)
1. In Supabase, go to **Authentication -> Providers**.
2. Enable **Email** provider (for email/password sign up).
3. Enable **Google** provider and set Google OAuth client id/secret.
4. In Supabase **Authentication -> URL Configuration**, add redirect URLs:
   - `http://localhost:3000/app`
   - `https://<your-vercel-domain>/app`
5. In Google Cloud OAuth credentials, add authorized redirect URI from Supabase provider setup and authorized JavaScript origins for local/prod app URLs.

The login and signup pages include both email/password and “Continue with Google” options.

## Deploy to Vercel
1. Push repo to GitHub.
2. Import project in Vercel.
3. Set same env vars in Vercel project settings.
4. Ensure Supabase Auth redirect URLs include your Vercel domain.
5. Deploy.

## Notes
- Export is implemented as print-to-PDF (`window.print`) on `/app/projects/[projectId]/export`.
- Optional Playwright server PDF endpoint is not included to keep free-tier deployment simple.
- Stripe checkout/webhooks are TODO; gating is already enforced in app logic.

## Free vs Pro gating
Centralized in `lib/billing/gating.ts`.
- Free: 1 active project, 25 zones/project, watermark export, no baseline/analytics/share.
- Pro: unlimited projects/zones, baseline/analytics/share, no watermark.

## Scripts
- `pnpm dev`
- `pnpm build`
- `pnpm test`
