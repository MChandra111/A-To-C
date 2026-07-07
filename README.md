# A-To-C
### *Aspirations to Capabilities*

> It's a scale, not a to-do list.

A-To-C is a full-stack web app that helps students, career changers, and self-learners close the gap between where they are and where they want to be — with structure, and with honest feedback along the way.

---

## The idea

A bathroom scale doesn't motivate you with confetti, and it doesn't shame you for missing a workout. It just shows you a number, consistently, so you can see whether your behavior is actually moving it.

A-To-C applies that same principle to self-investment. No streak-gamified checklists, no guilt-driven UI — just a clear, honest signal on whether you're closing the gap between your current capabilities and your stated goal.

## How it works

**1. Onboarding**
Describe your current capabilities (resume upload or free text), define a specific aspiration — *"Get into MIT EECS Master's"* — and set a timeline and check-in interval.

**2. AI-generated roadmap**
Claude analyzes the gap between capabilities and goal, then produces a structured plan: Gap Score, milestones, action items, free/paid resources, and risk factors. You see your **baseline reading** — Gap Score + an Investment Score of 0 — before the full plan unlocks.

**3. Weigh-ins**
The core loop. On your schedule (daily, weekly, whatever you set), you log what you actually did using **done / partial / skipped** — not a binary checkbox. Takes under a minute. Each weigh-in updates your **Investment Score**, a rolling 0–100 number computed from completion rate, effort quality, and streak consistency.

**4. Dashboard**
The home screen *is* the scale: a prominent Investment Score, a 30/60/90-day trend line, per-goal cards, drift alerts when your score drops sharply, and one primary action — **Weigh In**.

**5. Supporting features**
Roadmap reference view with recalibration, a per-roadmap resource library, PDF performance reports, CSV score export, read-only accountability share links, and weekly email reminders.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| UI | Radix primitives, custom instrument-style components (scores, sparklines) |
| Backend | Next.js API routes (serverless on Vercel) |
| Database & auth | Supabase (Postgres, Row Level Security, email + Google OAuth) |
| AI | Anthropic Claude API — roadmap generation, URL scraping, post-check-in nudges |
| Email | Resend, triggered by a Vercel cron job |
| PDF export | `@react-pdf/renderer` (server-side report generation) |
| File parsing | `unpdf` (PDF), `mammoth` (DOCX) |
| Validation | Zod (Claude JSON output, API request bodies) |
| Hosting | Vercel |

## Link

https://a-to-c.vercel.app/

## Roadmap / known limitations

- [Redo Styles]
- [Remove plans and make everything FOSS]
---

<p align="center">Built by <a href="#">your name</a></p>
