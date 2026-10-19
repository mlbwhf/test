import { NextResponse, type NextRequest } from "next/server";

// Routes the public marketing site. The same Next.js server answers three hosts:
//   app.<domain>   organizer dashboard (behind Traefik basic auth) and learner portal (/my)
//   <domain>       marketing site, served from app/site
//   www.<domain>   redirected to <domain>
// Legal pages (/terms, /privacy, /refunds) resolve on every host so links from emails
// and the learner portal work wherever they are opened.
const LEGAL = new Set(["/terms", "/privacy", "/refunds"]);

function marketingHosts(): Set<string> {
  const domain = (process.env.GATE_DOMAIN ?? "enrollclass.com").toLowerCase();
  return new Set([domain, `www.${domain}`]);
}

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(":")[0]!.toLowerCase();
  const hosts = marketingHosts();
  const bare = [...hosts][0]!;

  if (host.startsWith("www.") && hosts.has(host)) {
    const target = url.clone();
    target.host = bare;
    target.protocol = "https:";
    target.port = "";
    return NextResponse.redirect(target, 308);
  }

  if (LEGAL.has(url.pathname)) {
    return NextResponse.rewrite(new URL(`/site${url.pathname}`, request.url));
  }

  if (hosts.has(host)) {
    if (url.pathname === "/") return NextResponse.rewrite(new URL("/site", request.url));
    if (url.pathname.startsWith("/site") || url.pathname.startsWith("/_next") || url.pathname === "/favicon.ico" || url.pathname === "/icon.svg" || url.pathname === "/robots.txt") {
      return NextResponse.next();
    }
    // Anything else on the marketing host belongs to the app host.
    const target = url.clone();
    target.host = `app.${bare}`;
    target.protocol = "https:";
    target.port = "";
    return NextResponse.redirect(target, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
