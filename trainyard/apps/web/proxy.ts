// Runs before every page: sets a Content Security Policy with a fresh nonce per request.
// Next.js reads the nonce from the policy and puts it on its own scripts; the root layout
// puts it on the one inline script we add. 'strict-dynamic' lets those scripts load the
// chunks they need and nothing else. Static files (fonts, images, robots, sitemap) skip it.

import { NextResponse, type NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  const api = process.env.TRAINYARD_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_TRAINYARD_API_URL ?? "http://localhost:4100";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${api}${dev ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|fonts/|icon.svg|og.png|llms.txt|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
