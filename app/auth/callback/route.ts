import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  OAUTH_REDIRECT_COOKIE,
  sanitizeRedirectPath,
} from "@/lib/supabase/siteUrl";

function buildRedirectUrl(request: NextRequest, path: string): string {
  const { origin } = request.nextUrl;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (!isLocalEnv && forwardedHost) {
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${forwardedProto}://${forwardedHost}${path}`;
  }

  return `${origin}${path}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const redirectCookie = request.cookies.get(OAUTH_REDIRECT_COOKIE)?.value;
  const redirect = sanitizeRedirectPath(
    redirectCookie ? decodeURIComponent(redirectCookie) : null
  );

  if (!code) {
    return NextResponse.redirect(
      buildRedirectUrl(request, "/login?error=auth_callback_failed")
    );
  }

  const response = NextResponse.redirect(buildRedirectUrl(request, redirect));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth callback failed:", error.message);
    return NextResponse.redirect(
      buildRedirectUrl(request, "/login?error=auth_callback_failed")
    );
  }

  response.cookies.set(OAUTH_REDIRECT_COOKIE, "", { maxAge: 0, path: "/" });

  return response;
}
