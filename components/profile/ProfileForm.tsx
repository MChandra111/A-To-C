"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileFormProps {
  userId: string;
  email: string;
  initialDisplayName: string;
  initialAvatarUrl: string | null;
}

export function ProfileForm({
  userId,
  email,
  initialDisplayName,
  initialAvatarUrl,
}: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initials = (displayName || email).slice(0, 2).toUpperCase();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      setMessage("Profile updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-text-primary">{displayName || "Your profile"}</p>
          <p className="text-sm text-text-muted">{email}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          type="text"
          placeholder="How should we call you?"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatarUrl">Avatar URL</Label>
        <Input
          id="avatarUrl"
          type="url"
          placeholder="https://example.com/avatar.jpg"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
        <p className="text-xs text-text-muted">
          Paste an image URL. File upload will come in a later phase.
        </p>
      </div>

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

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
