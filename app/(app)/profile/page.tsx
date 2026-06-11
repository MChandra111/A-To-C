import { createClient } from "@/lib/supabase/server";
import { ExportDataPanel } from "@/components/export/ExportDataPanel";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ReminderSettings } from "@/components/profile/ReminderSettings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, avatar_url, reminder_enabled, reminder_day_of_week, reminder_time"
    )
    .eq("id", user!.id)
    .single();

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "";

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Account
        </p>
        <h1 className="font-display text-3xl font-bold text-text-primary">Profile</h1>
        <p className="mt-2 text-text-muted">
          Optional display name and avatar. Your data, your identity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
          <CardDescription>Changes are saved to your profile immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            userId={user!.id}
            email={user!.email ?? ""}
            initialDisplayName={displayName}
            initialAvatarUrl={profile?.avatar_url ?? null}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Weigh-in reminders</CardTitle>
          <CardDescription>
            Email subject references your score, not your tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReminderSettings
            userId={user!.id}
            initialEnabled={profile?.reminder_enabled ?? false}
            initialDay={profile?.reminder_day_of_week ?? null}
            initialTime={profile?.reminder_time ?? null}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Export data</CardTitle>
          <CardDescription>
            Score history and downloadable performance reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExportDataPanel />
        </CardContent>
      </Card>
    </div>
  );
}
