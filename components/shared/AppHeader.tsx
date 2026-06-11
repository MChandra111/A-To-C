import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/auth/SignOutButton";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="border-b border-border bg-surface/50 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/dashboard" className="font-display text-lg font-bold text-text-primary">
          A-To-C
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-text-muted transition-colors hover:text-text-primary"
          >
            Dashboard
          </Link>
          <Link
            href="/resources"
            className="text-sm text-text-muted transition-colors hover:text-text-primary"
          >
            Resources
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt={displayName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">{displayName}</span>
          </Link>
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
