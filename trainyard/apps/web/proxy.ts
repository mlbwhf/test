// Runs before every page: sets a Content Security Policy with a fresh nonce per request.
// Next.js reads the nonce from the policy and puts it on its own scripts; the root layout
// puts it on the one inline script we add. 'strict-dynamic' lets those scripts load the
// chunks they need and nothing else. Static files (fonts, images, robots, sitemap) skip it.
//
// Embedding: the Jira app and the Azure DevOps extension show pages in an iframe through
// /embed/<page>. Those requests, and any document the browser loads into a frame
// (Sec-Fetch-Dest: iframe, so navigating inside the frame keeps working), are served the same
// page without the navigation and with frame-ancestors limited to TRAINYARD_FRAME_ANCESTORS.
// Everything else still refuses to be framed.

import { NextResponse, type NextRequest } from "next/server";

// Forge Custom UI runs on Atlassian's CDN inside the Jira site; Azure DevOps extensions run on
// the gallery CDN inside dev.azure.com. Narrow this to your own site in production, e.g.
// "https://acme.atlassian.net https://*.atlassian-dev.net".
const DEFAULT_FRAME_ANCESTORS = "https://*.atlassian.net https://*.atlassian-dev.net https://dev.azure.com https://*.visualstudio.com https://*.gallerycdn.vsassets.io";

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const embedPath = path === "/embed" || path.startsWith("/embed/");
  const embed = embedPath || req.headers.get("sec-fetch-dest") === "iframe";
  // Unset or empty: the default hosts. "'none'" turns embedding off.
  const configured = process.env.TRAINYARD_FRAME_ANCESTORS?.trim().replace(/^'?none'?$/i, "'none'");
  const ancestors = configured || DEFAULT_FRAME_ANCESTORS;
  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  const api = process.env.TRAINYARD_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_TRAINYARD_API_URL ?? "http://localhost:4100";
  const csp = [
    "default-src 'self'",
    // Stripe.js (in-page payment) loads from js.stripe.com and talks to api.stripe.com; its card
    // fields are iframes from js.stripe.com, 3-D Secure challenges from hooks.stripe.com.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${api} https://api.stripe.com https://r.stripe.com${dev ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`,
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    `frame-ancestors ${embed ? ancestors : "'none'"}`,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);
  if (embed) requestHeaders.set("x-embed", "1");
  else requestHeaders.delete("x-embed");
  let res: NextResponse;
  if (embedPath) {
    const url = req.nextUrl.clone();
    url.pathname = path.slice("/embed".length) || "/dashboards";
    res = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  } else {
    res = NextResponse.next({ request: { headers: requestHeaders } });
  }
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
