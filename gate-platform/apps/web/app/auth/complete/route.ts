import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/lib/api";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { safePath } from "@/lib/urls";

// The API redirects here after a successful sign-in with a one-time code; trading it for
// the session token happens server to server, so the token never appears in a URL.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const result = code ? await api.exchange(code) : null;
  if (!result || !result.ok) {
    const msg = result && !result.ok ? (result.error.kind === "api" ? result.error.message : "the sign-in service is unreachable") : "missing sign-in code";
    return new NextResponse(null, { status: 303, headers: { location: `/login?error=${encodeURIComponent(msg)}` } });
  }
  const { token, returnTo, me } = result.data;
  const wantsInvite = returnTo?.startsWith("/invite/");
  const next = !me.organization && !wantsInvite ? "/onboarding" : safePath(returnTo);
  const res = new NextResponse(null, { status: 303, headers: { location: next } });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(request));
  return res;
}
