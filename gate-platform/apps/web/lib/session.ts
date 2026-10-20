// The organizer's session lives in one httpOnly cookie on the app host. Its value is an
// opaque token the API stores only as a hash; this server forwards it as a Bearer token.
// Nothing here is readable by browser scripts.

import { cookies } from "next/headers";

export const SESSION_COOKIE = "ec_session";
export const SESSION_MAX_AGE = 30 * 24 * 3600;

export async function sessionToken(): Promise<string | undefined> {
  try {
    return (await cookies()).get(SESSION_COOKIE)?.value || undefined;
  } catch {
    // Outside a request (build time): no session.
    return undefined;
  }
}

/** Secure whenever the browser reached us over HTTPS (Traefik sets x-forwarded-proto). */
export function sessionCookieOptions(request: { headers: Headers; nextUrl: URL }) {
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? request.nextUrl.protocol.replace(":", "");
  return { httpOnly: true, secure: proto === "https", sameSite: "lax" as const, path: "/", maxAge: SESSION_MAX_AGE };
}
