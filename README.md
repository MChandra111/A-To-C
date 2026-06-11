# A-To-C (Aspirations to Capabilities)

**A-To-C** is a full-stack web app that helps people close the gap between where they are today and where they want to be — students, career changers, and self-learners who have a goal but need structure and honest feedback along the way.

The product is built around one idea: **it's a scale, not a to-do list.** A bathroom scale doesn't motivate you with confetti or shame you for missing a workout. It shows you a number, consistently, so you can see whether your behavior is moving it. A-To-C does the same for self-investment.

---

## What it does

1. **Onboarding** — Users describe their current capabilities (resume upload or free text), define a specific aspiration (e.g. "Get into MIT EECS Master's"), and set a timeline and check-in interval.

2. **AI roadmap** — Claude analyzes the gap between capabilities and the goal, then generates a structured roadmap: Gap Score, milestones, action items, free/paid resources, and risk factors. Users see a **baseline reading** (Gap Score + Investment Score of 0) before viewing the full plan.

3. **Weigh-ins (check-ins)** — The core loop. On a schedule (daily, weekly, etc.), users log what they actually did using **done / partial / skipped** — not binary checkboxes. This takes under a minute and updates their **Investment Score**, a rolling 0–100 number computed from completion rate, effort quality, and streak consistency.

4. **Dashboard** — The home screen is the scale: a prominent Investment Score, a 30/60/90-day trend line, per-goal cards, drift alerts when the score drops sharply, and a **Weigh In** button as the primary CTA.

5. **Supporting features** — Roadmap reference view with recalibration, a per-roadmap resource library, PDF performance reports, CSV score export, read-only accountability share links, and weekly email reminders.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| **UI** | Radix primitives, custom instrument-style components (scores, sparklines) |
| **Backend** | Next.js API routes (serverless on Vercel) |
| **Database & auth** | Supabase (Postgres, Row Level Security, email + Google OAuth) |
| **AI** | Anthropic Claude API — roadmap generation, URL scraping, post-check-in nudges |
| **Email** | Resend, triggered by a Vercel cron job |
| **PDF export** | `@react-pdf/renderer` (server-side report generation) |
| **File parsing** | `unpdf` (PDF), `mammoth` (DOCX) for resume/capability uploads |
| **Validation** | Zod (Claude JSON output, API request bodies) |
| **Hosting** | Vercel |

---

## Architecture notes

- **Investment Score** is calculated server-side on every check-in and stored as a time-series (`investment_scores` table) so trend lines are built from real historical readings.
- **Claude calls never hit the client** — all AI routes run on the server with streaming where generation is long-running.
- **RLS on every table** — users can only read and write their own data; share links and cron jobs use a service-role client where needed.
- **Roadmap data lives in Postgres JSONB** (milestones, resources, gap scores) — no separate document store.

---

## Local setup

1. Create a [Supabase](https://supabase.com) project and run migrations in order under `supabase/migrations/`.

2. Copy env vars:
   ```bash
   cp .env.example .env.local
   ```
   Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_APP_URL`.  
   Also needed for full functionality: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET`.

3. Install and run:
   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

---

## Deploy

Hosted on **Vercel** with env vars mirrored from `.env.local`. `vercel.json` runs a daily cron at 14:00 UTC for weigh-in reminder emails.
