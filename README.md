# A-To-C (Aspirations to Capabilities)

A personal instrument for measuring dedication to self-investment.

## Phase 1: Auth & User Accounts

### Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database migration**
   - Open Supabase Dashboard → SQL Editor
   - Paste and run `supabase/migrations/001_initial_schema.sql`

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project Settings → API → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings → API → anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → `service_role` (cron + share links)
   - `RESEND_API_KEY` — [resend.com](https://resend.com) → API Keys (weigh-in reminder emails)
   - `RESEND_FROM_EMAIL` — optional; defaults to `A-To-C <onboarding@resend.dev>` for Resend sandbox
   - `CRON_SECRET` — random string you generate; set the same value in Vercel for cron auth

4. **Enable Google OAuth** (optional)
   - Supabase Dashboard → Authentication → Providers → Google
   - Add your Google OAuth credentials
   - Set redirect URL: `https://<your-project>.supabase.co/auth/v1/callback`
   - In Google Cloud Console, add authorized redirect URI from Supabase

5. **Install and run**
   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### What's included

- Email/password signup and login
- Google OAuth
- Protected routes (`/dashboard`, `/profile`, and future app routes)
- User profiles with display name and avatar URL
- Full database schema with RLS policies (ready for later phases)
