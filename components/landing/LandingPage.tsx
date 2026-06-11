import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const audiences = [
  {
    title: "Students",
    description:
      "Whether you're in high school, undergrad, or grad school — map a path from where you are today to the program, internship, or career you're aiming for.",
  },
  {
    title: "Career changers",
    description:
      "Switching industries is daunting when you don't know what you're missing. A-To-C shows you the gap between your current skills and your target role, then builds a roadmap to close it.",
  },
  {
    title: "Navigating AI disruption",
    description:
      "If your role has changed or disappeared because of automation, you need a clear plan — not panic. Define a new direction, measure your consistency, and rebuild with intention.",
  },
  {
    title: "Lifelong learners",
    description:
      "Learning a new language, earning a certification, or starting a side project — any ambition that takes sustained effort deserves a way to track whether you're actually showing up.",
  },
] as const;

const steps = [
  {
    title: "Define where you are",
    description:
      "Upload a resume, transcript, or describe your background in plain language. A-To-C captures your current capabilities as a starting point.",
  },
  {
    title: "Set your aspiration",
    description:
      "Name the goal — a degree, a job, a skill, a certification. The more specific you are, the more useful your roadmap becomes.",
  },
  {
    title: "Get an honest baseline",
    description:
      "See your Gap Score and Investment Score before you begin. Like stepping on a scale for the first time, you know exactly where you stand.",
  },
  {
    title: "Weigh in consistently",
    description:
      "Regular check-ins update your Investment Score over time. The trend line — not a single reading — tells you whether your behavior is moving you forward.",
  },
] as const;

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-display text-xl font-bold text-text-primary">
            A-To-C
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:py-28">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-primary">
            Aspirations to Capabilities
          </p>
          <h1 className="font-display text-5xl font-bold tracking-tight text-text-primary sm:text-6xl">
            Measure dedication to the life you want
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-text-muted">
            A-To-C is a personal instrument for self-investment — like a scale for
            your ambitions. Turn vague goals into structured roadmaps, then track
            whether you&apos;re actually showing up.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/signup">Get started free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        {/* Who it's for */}
        <section
          id="who-its-for"
          aria-labelledby="who-its-for-heading"
          className="border-t border-border bg-surface/40"
        >
          <div className="mx-auto max-w-5xl px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                id="who-its-for-heading"
                className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
              >
                Who it&apos;s for
              </h2>
              <p className="mt-4 text-lg text-text-muted">
                A-To-C is for anyone who wants to make a real change in their life
                and needs help getting there — not with motivation, but with
                clarity, structure, and an honest measure of progress.
              </p>
            </div>

            <ul className="mt-12 grid gap-6 sm:grid-cols-2">
              {audiences.map((audience) => (
                <li key={audience.title}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>{audience.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed">
                        {audience.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          aria-labelledby="how-it-works-heading"
          className="border-t border-border"
        >
          <div className="mx-auto max-w-5xl px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                id="how-it-works-heading"
                className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
              >
                How it works
              </h2>
              <p className="mt-4 text-lg text-text-muted">
                A-To-C is not a to-do list and it is not a course platform. It is
                the instrument that tells you whether your daily choices are moving
                you toward the person you want to become.
              </p>
            </div>

            <ol className="mt-12 grid gap-8 sm:grid-cols-2">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-mono text-sm text-primary"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-text-primary">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-text-muted">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Value proposition / SEO body */}
        <section
          id="about"
          aria-labelledby="about-heading"
          className="border-t border-border bg-surface/40"
        >
          <div className="mx-auto max-w-3xl px-4 py-20">
            <h2
              id="about-heading"
              className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
            >
              A scale for self-investment
            </h2>
            <div className="mt-6 space-y-4 text-text-muted leading-relaxed">
              <p>
                Most goal-setting tools give you a list and leave you alone. A-To-C
                gives you something different: a single, honest number that reflects
                how consistently you invest in yourself. Your{" "}
                <strong className="font-medium text-text-primary">
                  Investment Score
                </strong>{" "}
                rises when you check in and put in effort. It drifts down when you
                don&apos;t. Over weeks and months, the trend line tells the truth.
              </p>
              <p>
                Behind the score is an AI-generated roadmap tailored to your
                background and aspiration — whether that&apos;s getting into a
                competitive graduate program, landing a role in a new industry,
                reskilling after a career disruption, or mastering a skill you&apos;ve
                always wanted to learn. The roadmap is your plan. The score is your
                accountability.
              </p>
              <p>
                If you&apos;ve ever felt stuck between where you are and where you
                want to be — unsure what steps to take, or unsure whether you&apos;re
                taking them — A-To-C gives you both the path and the proof.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-20 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary">
              Start with your baseline reading
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-text-muted">
              Your first step is an honest snapshot of where you stand today. Every
              check-in moves the number from there.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/signup">Create your free account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6 text-sm text-text-muted">
          <span className="font-display font-semibold text-text-primary">A-To-C</span>
          <span>Aspirations to Capabilities</span>
        </div>
      </footer>
    </div>
  );
}
