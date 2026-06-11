# A-To-C: Cursor Agent Build Prompt

## Project Overview

Build a full-stack web application called **A-To-C** (Aspirations to Capabilities). The app bridges the gap between where a user is today and where they want to be — turning vague ambitions into structured, trackable, AI-powered roadmaps.

---

## Teaching philosophy — CRITICAL, read this first

Before writing any code for a new concept, **explain it to me like I'm smart but new to it**. Specifically:

- What is this thing, in plain English?
- Why are we using it instead of an alternative?
- What would break if we skipped it?
- Give me a 3-5 line mental model I can use to explain it in an interview.
- Let's build this one phase at a time. Do one phase at a time before moving onto the next.

After the explanation, write the code. After the code, tell me:

- What to look for when it runs to know it worked

---

## The Core Design Philosophy: A-To-C Is a Scale

**This is the single most important framing decision in the entire product. Every design, engineering, and UX choice should be evaluated against it.**

A-To-C is to self-investment what a bathroom scale is to weight loss. The scale does not motivate you by nagging you. It does not give you a to-do list. It does not celebrate you with confetti. It does one thing with complete, quiet honesty: it reflects your current reality back at you, consistently, so that over time you can see whether your behavior is moving the number.

The scale is not the diet. The scale is not the gym. The meal plan and the roadmap are just inputs. **The scale is the product.**

This means:

- The **primary artifact** is not the roadmap — it's the **Investment Score**: a single rolling number that reflects a user's consistency of engagement over time. Like a weight reading, it goes up when the user shows up and down when they don't. It is honest and it does not apologize.
- The **most important interaction** in the app is the check-in — the daily or weekly act of stepping on the scale. It must be the most refined, lowest-friction experience in the entire product. It should take under 60 seconds.
- The **dashboard's hero** is a trend line, not a progress bar. One reading means nothing. The direction of the line over 30–90 days is everything.
- The **tone** is quiet, honest, and steady — not gamified, not celebratory, not guilt-inducing. A scale never congratulates you and never shames you. It shows you the number.
- The **first screen after onboarding** is a baseline reading — an honest snapshot of where the user stands today. This is the number they are always measuring against. It should feel like stepping on a scale for the first time: clear, grounding, and motivating precisely because it's real.

Every feature, animation, and copy choice should be held against this standard: *Does this make the scale more accurate, more honest, or easier to step on? Or does it distract from it?*

---

## Product Vision & ICP

**Target users:**
- Students (high school, undergrad, grad) pursuing academic advancement
- Early-career professionals pivoting into new fields
- Self-betterment seekers (learning new skills, certifications, side projects)
- Career changers at any age

**Core value proposition:** A-To-C is not a to-do list and it is not a course platform. It is a personal instrument for measuring dedication to self-investment — the same way a scale measures dedication to physical health. The roadmap is the meal plan. The check-in is the weigh-in. The Investment Score is the number on the scale. The product's entire job is to make that number visible, honest, and impossible to ignore.

---

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes (or a Node/Express layer if preferred)
- **Database:** Supabase (Postgres + Auth + Storage for file uploads)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514) for roadmap generation and research
- **File Parsing:** pdf-parse or similar for resume/document extraction
- **Payments (future):** Stripe (scaffold the integration but don't implement billing yet)
- **Hosting:** Vercel

---

## Core Features to Build

### Phase 1. Auth & User Accounts
- Email/password auth via Supabase Auth
- Google OAuth login
- Protected dashboard routes
- User profile with optional display name and avatar

---

### Phase 2. Onboarding: Capabilities Input

**Page:** `/onboard/capabilities`

Allow users to define where they are *right now*. Offer two input modes that can be combined:

**Mode A — File Upload:**
- Accept: `.pdf`, `.docx`, `.txt`
- Parse and extract text from resume, transcript, portfolio, or any relevant document
- Show a preview of what was extracted with the ability to manually edit
- Store extracted text in the database linked to the user

**Mode B — Free Text:**
- A large, unstructured text area: "Describe your background, skills, and experience."
- Include a helpful placeholder/example to reduce blank-page anxiety:
  > *"I'm a 3rd year business student. I know Excel, some Python, and have done one marketing internship. I have a 3.4 GPA and no research experience."*

**UX Considerations:**
- Users can upload multiple files (e.g., resume + transcript)
- Extracted content is editable — they own their data
- Progress bar or stepper showing they're on step 1 of 3
- "Save and continue" persists their capabilities to their profile for reuse in future aspirations

---

### Phase 3. Onboarding: Aspirations Input

**Page:** `/onboard/aspiration`

Allow users to define what they want to achieve. Be opinionated about structure to improve AI output quality.

**Fields:**
- **Aspiration Title** (short label for the dashboard): e.g., "Get into MIT EECS Master's"
- **Aspiration Description** (freeform): What exactly do you want to achieve? Be as specific as possible.
  - Example prompts to help users be specific:
    - "Link to the program, job posting, or role you're targeting (optional)"
    - "What does success look like? What will you have/be when this is done?"
- **URL input (optional):** If the goal is a specific program, job posting, or certification, let them paste a URL. Use a server-side fetch + Claude to extract the requirements from that page.
- **Category tag (optional):** Academic / Career / Skill / Personal / Creative / Health & Fitness

---

### Phase 4. Onboarding: Timeframe & Interval Selection

**Page:** `/onboard/timeline`

- **End date selector:** Month + Year (no day precision needed). Minimum 1 month from today, maximum 5 years.
- **Goal interval selector:** Daily / Weekly / Biweekly / Monthly
  - Show a smart recommendation based on timeframe (e.g., "For a 6-month goal, weekly milestones are usually most effective")
  - Frame this choice explicitly around the scale analogy: the interval is how often the user steps on the scale. Reinforce this in the UI copy: *"How often will you weigh in on your progress?"*
- **Intensity preference (optional):** A slider — "How much time per week can you dedicate?" (1 hr / 3 hrs / 5 hrs / 10+ hrs). This feeds into the roadmap density.
- Calculate and display: *"That's approximately 24 weekly check-ins between now and your goal. Your Investment Score will be calculated from these."*

---

### Phase 5. AI Roadmap Generation + Baseline Reading

**Page:** `/roadmap/generating` → `/roadmap/[id]`

The roadmap is the meal plan, not the scale. It is essential infrastructure — but it is not what the user returns to every day. Design it accordingly: thorough, honest, and then out of the way in favor of the check-in loop.

#### Baseline Reading (shown before the roadmap)

Before revealing the roadmap, show the user their **Baseline Reading** — a dedicated screen that functions exactly like stepping on a scale for the first time. This is the number they are always measuring against.

**Baseline Reading screen includes:**
- **Investment Score: 0** — explicitly labeled as their starting point. Copy: *"This is where you start. Every check-in moves this number."*
- **Gap Score** (e.g., 61/100) — Claude-generated, broken into 3–4 sub-dimensions (e.g., Academic Credentials: 40/100, Technical Skills: 75/100, Work Experience: 55/100). Short honest narrative: "You're strong in X. You need significant work in Y and Z."
- **Distance summary:** *"You have 9 months and approximately 36 weekly weigh-ins to close this gap."*
- A single CTA: "See my roadmap →"

This screen should feel grounding and honest — not alarming, not celebratory. The tone is: *here is your reality, clearly stated.*

#### Generation Flow:
1. On form submission, POST to `/api/roadmap/generate`
2. Server composes a structured prompt to Claude (see prompt template below)
3. Stream the response back to the frontend for a live "thinking" experience
4. Parse structured JSON from Claude's output and store in the database
5. Show the Baseline Reading screen first, then redirect to the roadmap

#### Claude Prompt Template (construct this server-side):

```
You are an expert career coach, academic advisor, and learning path architect. A user wants to bridge the gap between their current capabilities and a specific aspiration.

USER CAPABILITIES:
{capabilities_text}

USER ASPIRATION:
{aspiration_description}
{if url_provided: "The aspiration links to this page, whose requirements are: {scraped_requirements}"}

TIMEFRAME: {months} months (from {start_month_year} to {end_month_year})
GOAL INTERVAL: {interval} (user will check in {interval}ly)
WEEKLY TIME AVAILABLE: {hours_per_week} hours

Your task:
1. Perform a thorough gap analysis between their capabilities and the aspiration's requirements.
2. Produce a Gap Score from 0–100 representing how close the user currently is to meeting the aspiration's requirements. Break this into 3–4 named sub-dimensions with individual scores and a 1-sentence honest explanation for each.
3. Identify every skill, qualification, credential, experience, or knowledge area they need to develop.
4. Build a structured roadmap broken into {interval} milestones. Each milestone should have:
   - A title
   - A difficulty tag: Foundation | Building | Advanced | Final Push
   - A description of what to focus on
   - 2-5 concrete action items with effort estimates
   - Resources to use (both FREE and PAID options)
5. For paid resources, include realistic cost estimates in USD.
6. Calculate a total estimated cost range (free path vs recommended paid path).
7. Include a "Quick Wins" section: 3 things they can do in the next 48 hours to start momentum.
8. Include a "Risk Factors" section: 2-3 honest warnings about common pitfalls or things that could derail this goal. Be direct, not diplomatic.

Return your response as a JSON object matching this exact schema:
{
  "gap_analysis": "string (2-3 paragraph honest narrative)",
  "gap_score": {
    "overall": number (0-100),
    "dimensions": [
      { "name": "string", "score": number (0-100), "note": "string (1 sentence)" }
    ]
  },
  "skills_needed": ["string"],
  "quick_wins": [{ "action": "string", "time_estimate": "string" }],
  "risk_factors": [{ "risk": "string", "mitigation": "string" }],
  "milestones": [
    {
      "index": number,
      "label": "string (e.g. 'Week 1-2' or 'Month 1')",
      "title": "string",
      "difficulty_tag": "Foundation | Building | Advanced | Final Push",
      "description": "string",
      "focus_areas": ["string"],
      "action_items": [
        {
          "task": "string",
          "effort": "string",
          "resources": [
            { "name": "string", "url": "string or null", "cost": "string (e.g. 'Free' or '$49')", "type": "free|paid" }
          ]
        }
      ]
    }
  ],
  "cost_summary": {
    "free_path_estimate": "string",
    "paid_path_estimate": "string",
    "recommended_path_cost": "string",
    "notes": "string"
  }
}
```

#### Roadmap Display Page `/roadmap/[id]`:

The roadmap page is a reference document the user consults — not the screen they live on. Design it to be thorough and scannable, but don't make it the emotional center of the product. The dashboard and check-in are the emotional center.

- **Header:** Aspiration title, timeframe, Gap Score chip, current Investment Score
- **Gap Analysis card:** Narrative paragraph from Claude — honest, specific, not softened
- **Gap Score breakdown:** Small horizontal bar chart showing sub-dimension scores
- **Skills Needed:** Visual chip list
- **Quick Wins:** A 48-hour starter box — visually distinct, the first thing to act on
- **Risk Factors:** Collapsible warning cards — amber-toned, direct language
- **Milestone Timeline:** Vertical scrolling timeline. Each milestone card shows:
  - Milestone label + title + difficulty tag (color-coded: Foundation=teal, Building=violet, Advanced=amber, Final Push=red)
  - Toggle to expand action items
  - Each action item has sub-resources (free/paid clearly labeled, with cost filter toggle)
  - A "Mark complete" checkbox per action item
- **Cost Summary:** Sticky sidebar or bottom panel — free path vs paid path, with toggle
- **Resource cost filter:** Toggle between "All resources" and "Free only" — persistent per user session

---

### Phase 6. Dashboard

**Page:** `/dashboard`

The dashboard is the scale. It is the screen users return to every day to see their number. Design it around the Investment Score trend line, not a list of tasks.

**Dashboard hero (above the fold):**
- **Overall Investment Score** — large, prominent, styled like an instrument reading. This is the weighted average across all active aspirations. It goes up when check-ins are completed on time and down when they're missed.
- **Investment Score trend line** — a 30/60/90-day sparkline showing the score's trajectory. One reading is noise. The line is the signal. This is the most important visual in the entire app.
- **Streak** — displayed quietly below the score, not as a hero element. Format: *"12-week streak"* or *"Last check-in: 3 days ago"* — honest, not celebratory.
- **Next weigh-in** — a subtle indicator of when the user's next check-in is due across any active goal.

**Aspiration Cards (per goal, below the hero):**
- Aspiration title + category tag
- Individual Investment Score for this goal + its own mini trend line (14-day)
- Gap Score chip (from baseline — a static reminder of where they started)
- Days remaining until end date
- Current milestone label + difficulty tag
- Large, prominent "Weigh In" button — primary CTA. This is the most important button in the product. Label it "Weigh In" not "Check In" to reinforce the scale metaphor.
- If overdue: quiet amber indicator — *"Weigh-in overdue by 2 days"* — no guilt, just data

**Dashboard sections:**
- **Active Goals** (in-progress aspirations)
- **Completed Goals** (past the end date or manually marked complete — show final Investment Score as a historical record)
- **Archived Goals** (soft-deleted/hidden)

**Drift Alert (key accountability feature):**
If a user's Investment Score drops more than 15 points in a rolling 14-day window, surface a quiet alert card — not a notification, not an email, just a card on the dashboard: *"Your Investment Score has dropped from 84 to 61 over the last two weeks. Your goal date is in 4 months."* No judgment. No suggestions. Just the number, the way a scale shows the number.

---

### Phase 7. The Check-In (The Weigh-In)

**This is the product. Everything else exists to support this interaction.**

The check-in is the act of stepping on the scale. It must be the lowest-friction, most honest, most consistent interaction in the app. It should take under 60 seconds. It should feel like a brief moment of self-reckoning — not a task manager, not a form, not a game.

**Page:** `/checkin/[roadmap_id]`

#### Check-In Flow (mobile-first, full-screen step cards):

**Step 1 — Show the scale:**
Display the user's current Investment Score prominently. Below it, show today's milestone and its action items as a simple list with checkboxes. Copy: *"What did you actually do this period?"*

**Step 2 — Mark your effort (honest, not binary):**
For each action item, a three-option selector — not a checkbox:
- ✓ Done
- ◑ Partial
- ✗ Skipped

This matters because the Investment Score should reflect honest effort, not just whether a box was ticked. Partial credit is real data. Skips are real data.

**Step 3 — One-line journal (optional but encouraged):**
A single text field, placeholder: *"What happened? One sentence is enough."*
This is not a reflection exercise. It's a data point — like noting what you ate before weighing in.

**Step 4 — New reading:**
Show the updated Investment Score immediately after submission, with a delta indicator: *"+3 points"* or *"−8 points"*. No confetti. No badges. Just the number, same as a scale. If the score went down, show it clearly — a scale that only shows good news is useless.
Below the score, show the 14-day trend line updated with today's reading.

#### Investment Score Calculation Logic:

The Investment Score (0–100) for a given aspiration is calculated as a rolling weighted average:

- **Check-in completion rate (50%):** What % of scheduled check-ins has the user completed in the last 30 days?
- **Effort quality (30%):** Average effort across action items in recent check-ins. Done = 1.0, Partial = 0.5, Skipped = 0.0.
- **Consistency streak (20%):** A logarithmic bonus for consecutive on-time check-ins, capped at +20 points. Missing a check-in decays this component quickly.

The formula should be computed server-side on every check-in submission and stored in a `investment_scores` time-series table so historical readings are preserved and plottable.

**Overall Investment Score** (shown on the dashboard hero) is the simple average of all active aspiration scores.

#### AI Nudge (after check-in, not before):
After the score is shown, display a short 2–3 sentence Claude-generated response. This is not motivational fluff — it is a tactical observation based on what the user just submitted. If they skipped 3 items, Claude should note that honestly and suggest one specific adjustment. Keep the system prompt for this tight:

```
You are a direct, honest coach. The user just completed a check-in for their goal: {aspiration_title}.
They marked: {completed_items} as done, {partial_items} as partial, {skipped_items} as skipped.
Their Investment Score moved from {old_score} to {new_score}.
Write 2-3 sentences: one observation about their pattern, one specific tactical suggestion. Be direct. Do not use filler phrases like "Great job" or "Keep it up." Do not moralize.
```

#### Drift Detection & Honest Surfacing:
- If Investment Score drops 15+ points in 14 days: surface Drift Alert on dashboard (described above)
- If a user misses 2+ consecutive check-ins: show a quiet re-entry prompt on next login — not a guilt message, just: *"You missed 2 weigh-ins for [goal]. Your Investment Score is now 54. Want to pick back up?"*
- If a user falls more than 4 weeks behind their milestone progression, offer recalibration: *"Your timeline may need adjusting — want Claude to recalculate from where you are now?"* This triggers a partial re-generation that preserves completed milestones.

#### Email Reminders (scaffold, don't fully implement):
- User sets reminder preference: day of week + time
- Scaffold the email template and cron trigger (Supabase edge function or Vercel cron)
- Email subject line should reference the score, not the task: *"Your Investment Score is 61 — weigh-in due today"*
- Leave `TODO: integrate with Resend or SendGrid` comment

---

### Phase 8. Resource Library (V2 — scaffold now)

Scaffold a `/resources` page with placeholder UI. The idea: as users complete roadmaps, frequently recommended resources are aggregated into a searchable library. Tag by skill area, cost, and format. Leave a `TODO: populate from roadmap completions` comment.

---

## Database Schema (Supabase / Postgres)

```sql
-- Users table (Supabase Auth handles auth.users; this is the profile extension)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User capabilities (reusable across aspirations)
CREATE TABLE capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source_type TEXT, -- 'upload' | 'text'
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Aspirations
CREATE TABLE aspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  target_url TEXT,
  end_date DATE NOT NULL,
  interval TEXT NOT NULL, -- 'daily' | 'weekly' | 'biweekly' | 'monthly'
  hours_per_week INT,
  status TEXT DEFAULT 'active', -- 'active' | 'completed' | 'archived'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Roadmaps (AI-generated, linked to an aspiration)
CREATE TABLE roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aspiration_id UUID REFERENCES aspirations(id) ON DELETE CASCADE,
  gap_analysis TEXT,
  gap_score JSONB,         -- { overall: number, dimensions: [...] }
  skills_needed JSONB,
  quick_wins JSONB,
  risk_factors JSONB,
  milestones JSONB,        -- full milestone array from Claude
  cost_summary JSONB,
  baseline_date DATE,      -- the date this roadmap was first generated (the "first weigh-in")
  generated_at TIMESTAMPTZ DEFAULT now(),
  version INT DEFAULT 1    -- supports recalibration
);

-- Action item completions
CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  milestone_index INT NOT NULL,
  action_item_index INT NOT NULL,
  effort TEXT NOT NULL DEFAULT 'done', -- 'done' | 'partial' | 'skipped'
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- Check-ins (weigh-ins)
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  milestone_index INT NOT NULL,
  journal_entry TEXT,
  ai_response TEXT,
  score_before INT,        -- Investment Score before this check-in
  score_after INT,         -- Investment Score after this check-in
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- Investment Score time series (one row per check-in per aspiration)
-- This is the core data the dashboard trend line is built from
CREATE TABLE investment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  score INT NOT NULL,           -- 0-100
  checkin_id UUID REFERENCES checkins(id),
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Streaks (denormalized for performance)
CREATE TABLE streaks (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_checkin_date DATE
);
```

---

## UI/UX Design Direction

**Aesthetic:** Instrument-grade. A-To-C should feel like a precision tool — not a productivity app, not a gamified learning platform. Think the calm authority of a fitness tracker's data view, or the focused clarity of a Bloomberg terminal stripped of noise. Every element earns its place by either displaying data or enabling action. No decoration that doesn't carry information.

- **Color palette:**
  - Background: `#0F0F12` (near-black with a hint of blue)
  - Surface: `#1A1A22`
  - Primary accent: `#6C63FF` (electric violet — ambition, transformation)
  - Success / rising score: `#2DD4BF` (teal)
  - Warning / drift / overdue: `#F59E0B` (amber — neutral data, not shame)
  - Declining score: `#F87171` (muted red — honest, not alarming)
  - Text primary: `#F1F0FF`
  - Text muted: `#8B8BA7`

- **Typography:**
  - Display / score numbers: `Syne` (Google Fonts) — geometric, confident. The Investment Score should always render in Syne at large size. It should look like an instrument reading.
  - Body: `Inter` — clean, readable at small sizes
  - Mono (for scores, dates, data): `JetBrains Mono`

- **Motion:** Minimal and purposeful. The score number should animate (count up/down) when it changes after a check-in — this is the one moment of drama, because it mirrors watching the scale number settle. No confetti, no unlock animations, no particle effects. If a milestone is completed, a quiet line fills in on the timeline. That's it.

- **Signature element:** The Investment Score on the dashboard renders as a large instrument-style number with a subtle animated ring that fills proportionally (0–100). Below it, the trend sparkline. This pairing — the current reading and the historical trend — is the visual identity of the entire product. It should be unmistakable.

- **Check-in UX:** Full-screen mobile-first step cards with large tap targets. No sidebars, no navigation chrome, no distraction. The user is stepping on the scale. Give them a clean surface and honest feedback. PWA manifest enabled so users can add to home screen and access the weigh-in with one tap.

---

## Suggested Enhancements (Build These In)

### 1. Baseline History — "Your First Reading"
Always preserve and surface the original baseline Gap Score and the date it was taken. On the roadmap page, show a small historical marker: *"Started: Gap Score 61 · Sept 2025."* Users should be able to see how far the gap has closed over time — this is the most motivating data in the product, and it requires nothing more than storing the initial reading.

### 2. Peer Benchmarking (anonymous)
After roadmap generation, anonymously compare the user's Gap Score against others who set the same or similar aspirations. Not a leaderboard — a quiet reference point: *"Among users targeting this goal type, your starting Gap Score of 61 is above the median of 54."* This contextualizes the score without shaming or gamifying.

### 3. Mentor / Accountability Partner Sharing
Generate a shareable read-only link to a roadmap that shows the Investment Score trend line and check-in history. The partner can see the data but not the private journal entries. This turns the score into a social contract — the user knows someone else can see the number.

### 4. Milestone Difficulty Tags (already in roadmap schema)
Each milestone is tagged: `Foundation` / `Building` / `Advanced` / `Final Push`. Color-code these consistently throughout the app. This helps users understand the arc — they will hit hard periods, and knowing the difficulty tag in advance reduces dropout.

### 5. Progress Export
Allow users to export their Investment Score history and roadmap as a clean PDF. Format it like a performance report, not a to-do list. Useful for sharing with academic advisors, career coaches, or employers. Use a clean print stylesheet or server-side PDF render.

### 6. AI Coach Chat (V2)
Floating context-aware chat on the roadmap and check-in pages. Claude knows the user's goal, Gap Score, Investment Score trend, and current milestone. Scaffold the system prompt structure now; leave as `// TODO (V2): connect chat UI`. The system prompt should establish the coach as honest and direct — consistent with the scale metaphor, not a cheerleader.

### 7. Score History Export & API (V2)
Allow users to export their raw Investment Score time-series as CSV. Scaffold a `/api/user/scores` endpoint. Leave as `// TODO (V2)`. Power users and students tracking their own data will want this.

### 8. Recalibration Mode
When a user updates their end date or interval after falling behind, trigger a partial roadmap regeneration from their current milestone position forward. Preserve completed milestones and their Investment Score history. The new roadmap should acknowledge the recalibration: *"Roadmap recalculated from Month 3. Completed milestones preserved."*

---

## File & Folder Structure

```
/app
  /api
    /roadmap
      /generate/route.ts
      /regenerate/route.ts      ← partial recalibration from current milestone
    /checkin/route.ts           ← submits check-in, calculates + stores new Investment Score
    /capabilities/upload/route.ts
    /scrape/route.ts            ← scrapes aspiration URLs
    /user
      /scores/route.ts          ← returns Investment Score time series (V2 export scaffold)
  /(auth)
    /login/page.tsx
    /signup/page.tsx
  /(app)
    /dashboard/page.tsx
    /onboard
      /capabilities/page.tsx
      /aspiration/page.tsx
      /timeline/page.tsx
    /roadmap
      /[id]/page.tsx
      /generating/page.tsx
      /baseline/page.tsx        ← the "first reading" screen shown after generation
    /checkin
      /[roadmap_id]/page.tsx
    /resources/page.tsx         ← V2 scaffold
/components
  /ui/                          ← shadcn components
  /score
    InvestmentScore.tsx         ← the instrument-style score display with animated ring
    ScoreTrend.tsx              ← sparkline trend chart (recharts or d3)
    GapScore.tsx                ← breakdown bar chart by dimension
    DriftAlert.tsx              ← quiet amber alert when score drops 15+ pts
  /roadmap
    RoadmapTimeline.tsx
    MilestoneCard.tsx           ← includes difficulty tag color coding
    ActionItem.tsx              ← done/partial/skipped selector, not checkbox
    CostSummary.tsx
    BaselineReading.tsx         ← first reading screen component
  /dashboard
    AspirationCard.tsx          ← Investment Score + mini sparkline + Weigh In CTA
    WeighInButton.tsx           ← primary CTA, styled prominently
  /checkin
    CheckInSteps.tsx            ← full-screen mobile step card flow
    EffortSelector.tsx          ← done/partial/skipped three-option selector
    ScoreReveal.tsx             ← animated score update after submission
    AiNudge.tsx                 ← direct tactical response from Claude
  /shared
    FileUploader.tsx
    StepperNav.tsx
    TrendLine.tsx
/lib
  /supabase/
    client.ts
    server.ts
    middleware.ts
  /claude/
    generateRoadmap.ts
    generateCheckinResponse.ts
    scrapeAspiration.ts
  /utils/
    parseDocument.ts
    dateHelpers.ts
    investmentScore.ts          ← score calculation logic (completion rate, effort quality, streak)
/types
  index.ts                      ← shared TypeScript types
```

---

## API Routes Detail

### `POST /api/roadmap/generate`
- Auth required
- Body: `{ aspiration_id, capabilities_ids[] }`
- Fetches capabilities text, aspiration details, scrapes URL if present
- Calls Claude with constructed prompt (includes gap_score in schema)
- Streams response, parses JSON on completion, validates with Zod
- Stores roadmap to DB with `baseline_date = today`
- Inserts initial `investment_scores` row with `score = 0` (baseline reading)
- Returns `{ roadmap_id }`

### `POST /api/capabilities/upload`
- Auth required
- Accepts multipart form data (max 5MB, 3 files, validated MIME types)
- Extracts text from PDF/DOCX/TXT using pdf-parse
- Saves to `capabilities` table
- Returns `{ capability_id, extracted_text }`

### `POST /api/checkin`
- Auth required
- Body: `{ roadmap_id, milestone_index, effort_items: [{ action_item_index, effort: 'done'|'partial'|'skipped' }], journal_entry }`
- Inserts completion rows with effort values
- **Calculates new Investment Score** using `investmentScore.ts` utility:
  - Fetches last 30 days of checkins and completions for this roadmap
  - Computes: completion rate (50%), effort quality (30%), streak bonus (20%)
  - Clamps result to 0–100
- Inserts new row into `investment_scores` time series
- Updates `streaks` table
- Calls Claude for a direct, honest 2-3 sentence tactical nudge
- Returns `{ ai_response, score_before, score_after, delta, new_streak }`

### `POST /api/roadmap/regenerate`
- Auth required
- Body: `{ roadmap_id, new_end_date?, new_interval? }`
- Fetches existing roadmap, identifies last completed milestone index
- Re-calls Claude for milestones from `completed_index + 1` onward
- Stores as new roadmap version, preserving completed milestone data and score history
- Returns `{ new_roadmap_id }`

### `GET /api/scrape`
- Auth required
- Query: `?url=...`
- Server-side fetch of the URL + Claude extraction of key requirements
- Returns `{ requirements_text }`

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Build Order (Recommended Sequence)

Build in this order. The check-in and Investment Score come before polish on the roadmap display — because the check-in is the product.

1. **Auth + DB setup** — Supabase auth, all tables (including `investment_scores`), RLS policies, login/signup pages
2. **Capabilities input** — file upload + text input, extraction, storage
3. **Aspiration + timeline form** — multi-step onboard flow, DB writes
4. **Roadmap generation** — Claude integration, streaming, JSON+Zod validation, DB storage, baseline reading screen
5. **Check-in (Weigh-In) flow** — full-screen mobile step cards, done/partial/skipped effort selector, Investment Score calculation logic, score reveal animation, AI nudge
6. **Dashboard** — Investment Score instrument display, trend sparkline, aspiration cards with mini trends, Drift Alert logic
7. **Roadmap display page** — timeline UI, milestone cards with difficulty tags, cost summary, resource cost filter
8. **Polish + accountability** — email scaffold, sharing link, recalibration flow, PWA manifest, export

---

## Key Engineering Constraints & Notes

- **Never expose the Anthropic API key on the client.** All Claude calls go through server-side API routes.
- **Stream Claude responses** where possible to avoid timeout issues on long generations. Use the Anthropic SDK's streaming mode.
- **Validate Claude's JSON output** before storing. Use a Zod schema matching the roadmap structure. If parsing fails, retry once with an explicit correction prompt before returning an error.
- **Supabase Row Level Security (RLS):** Enable RLS on all tables. Users can only read/write their own rows. Write policies for every table before shipping.
- **File uploads:** Cap at 5MB per file, 3 files max per submission. Validate MIME types server-side.
- **Rate limiting:** Add basic rate limiting on `/api/roadmap/generate` (max 3 generations per user per day on free tier).
- **Error states:** Every AI-powered action must have a graceful error state with a user-facing message and a retry option.

---

## Out of Scope for V1 (Note But Don't Build)

- Native mobile app
- Social feed / community features
- Real-time collaboration
- Marketplace for coaches or mentors
- Payment processing / subscription tiers
- SMS reminders

Leave `// TODO (V2):` comments near any scaffolded hooks for these.

---

## Definition of Done for V1

The app is considered V1-complete when:

- [ ] A new user can sign up, input capabilities, set an aspiration with a timeframe, and receive an AI-generated roadmap in under 3 minutes
- [ ] The roadmap includes a Gap Score with dimension breakdown, at least 3 milestones with difficulty tags, action items with free/paid resources, and a cost summary
- [ ] The user sees a Baseline Reading screen after generation showing their starting Gap Score and Investment Score of 0
- [ ] The user can complete a Weigh-In (check-in) using done/partial/skipped effort selectors in under 60 seconds
- [ ] The Investment Score is calculated correctly and stored to the time-series table after every check-in
- [ ] The dashboard displays the Investment Score as a prominent instrument reading with a trend sparkline
- [ ] The Drift Alert surfaces correctly when score drops 15+ points in 14 days
- [ ] All data is user-scoped and RLS is enforced on all tables
- [ ] The check-in flow is usable on mobile without zooming or horizontal scrolling
- [ ] The app is deployed to Vercel and connected to a production Supabase project

---

*End of A-To-C Build Prompt*
