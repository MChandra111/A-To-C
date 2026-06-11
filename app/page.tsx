import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "A-To-C | Turn Ambitions into Trackable Roadmaps",
  description:
    "A-To-C helps students, career changers, and lifelong learners bridge the gap between where they are and where they want to be. AI-powered roadmaps, honest progress tracking, and a personal Investment Score.",
  keywords: [
    "career change roadmap",
    "self-investment tracker",
    "learning path planner",
    "goal tracking app",
    "career pivot tool",
    "AI career coach",
    "student goal planning",
    "reskilling after AI",
    "personal development tracker",
  ],
  openGraph: {
    title: "A-To-C | Aspirations to Capabilities",
    description:
      "Measure your dedication to self-investment. Structured roadmaps and honest progress tracking for anyone ready to make a change.",
    type: "website",
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
