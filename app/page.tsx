import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-primary">
          Aspirations to Capabilities
        </p>
        <h1 className="font-display text-5xl font-bold tracking-tight text-text-primary">
          A-To-C
        </h1>
        <p className="mt-4 text-lg text-text-muted">
          A personal instrument for measuring dedication to self-investment.
          Like a scale for your ambitions.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/signup">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
