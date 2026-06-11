# A-To-C (Aspirations to Capabilities)

A personal instrument for measuring dedication to self-investment — structured roadmaps, honest weigh-ins, and an Investment Score trend line.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run migrations** in the Supabase SQL Editor, in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_aspiration_draft_fields.sql`
   - `supabase/migrations/002_checkin_delete_policies.sql`
   - `supabase/migrations/003_url_requirements_cache.sql`
   - `supabase/migrations/004_polish_features.sql`

3. **Environment variables** — copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — cron jobs + public share links
   - `ANTHROPIC_API_KEY` — roadmap generation and check-in nudges
   - `NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000`
   - `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — weigh-in reminder emails
   - `CRON_SECRET` — random string; same value in Vercel for cron auth

4. **Google OAuth** (optional): Supabase → Authentication → Providers → Google

5. **Run locally**
   ```bash
   npm install
   npm run dev
   ```

## Features

- Onboarding: capabilities, aspiration, timeline
- AI roadmap generation with baseline Gap Score reading
- Weigh-in flow (done / partial / skipped) with Investment Score calculation
- Dashboard with trend sparkline, drift alerts, and aspiration cards
- Roadmap reference view, recalibration, and progress repair
- PDF performance reports and CSV score export
- Accountability share links (`/share/[token]`)
- Weekly email reminders via Resend (daily cron on Vercel Hobby)
- PWA manifest for add-to-home-screen

## Deploy (Vercel)

Set all env vars in the Vercel project settings. `vercel.json` configures a daily cron at 14:00 UTC for reminder emails.
