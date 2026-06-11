/** Canonical app origin for OAuth redirects and emails. */
export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  }

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export const OAUTH_REDIRECT_COOKIE = "oauth_redirect";

/** Safe in-app path only — blocks open redirects after OAuth. */
export function sanitizeRedirectPath(path: string | null, fallback = "/dashboard"): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }

  return path;
}

/** Store post-login path in a cookie so redirectTo stays an exact Supabase allowlist match. */
export function setOAuthRedirectCookie(path: string): void {
  document.cookie = `${OAUTH_REDIRECT_COOKIE}=${encodeURIComponent(path)}; path=/; max-age=600; SameSite=Lax`;
}
