"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        void handleSignOut();
      }}
    >
      Sign out
    </Button>
  );
}
