import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";

async function signOut(request: NextRequest) {
  await api.logout().catch(() => undefined);
  const expired = request.nextUrl.searchParams.get("expired") === "1";
  const res = new NextResponse(null, { status: 303, headers: { location: expired ? "/login?expired=1" : "/login?signedOut=1" } });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export const POST = signOut;
// Also reachable by GET for expired sessions; signing someone out is the worst it can do.
export const GET = signOut;
