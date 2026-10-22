import path from "node:path";
import type { NextConfig } from "next";

// Headers that do not change per request. The Content Security Policy needs a nonce per
// request, so it is set in proxy.ts instead.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // Older browsers ignore frame-ancestors; keep DENY everywhere but the embedded pages
      // (see proxy.ts), where CSP frame-ancestors names the hosts allowed to frame them.
      {
        source: "/((?!embed(?:/|$)).*)",
        missing: [{ type: "header", key: "sec-fetch-dest", value: "iframe" }],
        headers: [{ key: "X-Frame-Options", value: "DENY" }],
      },
    ];
  },
};

export default nextConfig;
