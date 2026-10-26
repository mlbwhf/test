import { NextResponse, type NextRequest } from "next/server";

// Routes the public marketing site. The same Next.js server answers three hosts:
//   app.<domain>   organizer dashboard (signed-in people only) and learner portal (/my)
//   <domain>       marketing site, served from app/site
//   www.<domain>   redirected to <domain>
// Legal pages, the FAQ, the class finder and the product pages (/terms, /privacy, /refunds, /faq,
// /classes, /how-it-works, /pricing, /instructors) resolve on
// every host so links from emails and the learner portal work wherever they are opened.
const LEGAL = new Set(["/terms", "/privacy", "/refunds", "/faq", "/classes", "/how-it-works", "/pricing", "/instructors"]);

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
    // The app host has its own /badges (the organizer page), so this one lives on the marketing host only.
    if (url.pathname === "/badges") return NextResponse.rewrite(new URL("/site/badges", request.url));
    if (url.pathname === "/help" || url.pathname.startsWith("/help/") || url.pathname.startsWith("/fonts/") || url.pathname.startsWith("/site") || url.pathname.startsWith("/_next") || PUBLIC_FILES.has(url.pathname)) {
      return NextResponse.next();
    }
    // Anything else on the marketing host belongs to the app host.
    const target = url.clone();
    target.host = `app.${bare}`;
    target.protocol = "https:";
    target.port = "";
    return NextResponse.redirect(target, 307);
  }

  // Organizer pages need a session cookie; the API checks it and the role on every call.
  if (!isPublicAppPath(url.pathname) && !request.cookies.get("ec_session")?.value) {
    const login = url.clone();
    login.pathname = "/login";
    login.search = url.pathname === "/" || url.pathname === "/dashboard" ? "" : `?returnTo=${encodeURIComponent(url.pathname + url.search)}`;
    return NextResponse.redirect(login, 307);
  }

  return NextResponse.next();
}

// Files for browsers, search engines and AI crawlers, answered on every host.
const PUBLIC_FILES = new Set(["/.well-known/security.txt", "/favicon.ico", "/icon.svg", "/robots.txt", "/sitemap.xml", "/llms.txt", "/llms-full.txt", "/opengraph-image"]);

const PUBLIC_APP = [/^\/\.well-known\/security\.txt$/, /^\/(robots\.txt|sitemap\.xml|llms\.txt|llms-full\.txt|opengraph-image)$/, /^\/help(\/|$)/, /^\/c\//, /^\/cert\//, /^\/verify$/, /^\/pay\//, /^\/my(\/|$)/, /^\/login$/, /^\/auth\//, /^\/invite\//, /^\/_next\//, /^\/favicon\.ico$/, /^\/icon\.svg$/, /^\/robots\.txt$/, /^\/site(\/|$)/];
function isPublicAppPath(path: string): boolean {
  return PUBLIC_APP.some((re) => re.test(path));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|fonts/).*)"],
};
