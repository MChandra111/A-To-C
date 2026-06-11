"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

interface ReminderSettingsProps {
  userId: string;
  initialEnabled: boolean;
  initialDay: number | null;
  initialTime?: string | null;
}

export function ReminderSettings({
  userId,
  initialEnabled,
  initialDay,
}: ReminderSettingsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [enabled, setEnabled] = useState(initialEnabled);
  const [day, setDay] = useState(initialDay ?? 1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          reminder_enabled: enabled,
          reminder_day_of_week: enabled ? day : null,
          reminder_time: enabled ? "14:00:00" : null,
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      setMessage("Reminder preferences saved.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save reminder settings"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-text-muted">
        One email per week on your chosen day (~14:00 UTC). Reminders reference
        your Investment Score, not your task list. Email delivery is scaffolded —
        configure Resend or SendGrid to activate.
      </p>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <span className="text-sm text-text-primary">Enable weigh-in reminders</span>
      </label>

      {enabled && (
        <div className="space-y-2">
          <Label htmlFor="reminderDay">Reminder day (UTC)</Label>
          <select
            id="reminderDay"
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary"
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="text-sm text-decline" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-success" role="status">
          {message}
        </p>
      )}

      <Button type="submit" disabled={saving} variant="outline">
        {saving ? "Saving..." : "Save reminders"}
      </Button>
    </form>
  );
}
