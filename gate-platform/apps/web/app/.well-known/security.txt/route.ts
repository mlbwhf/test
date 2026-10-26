import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

// RFC 9116: how to report a vulnerability. Expires rolls forward so the file never goes stale.
export function GET() {
  const expires = new Date(Date.now() + 180 * 86_400_000);
  expires.setUTCHours(0, 0, 0, 0);
  const lines = [
    "Contact: mailto:security@enrollclass.com",
    `Expires: ${expires.toISOString()}`,
    "Preferred-Languages: en",
    `Canonical: ${siteUrl()}/.well-known/security.txt`,
    `Policy: ${siteUrl()}/privacy`,
  ];
  return new Response(lines.join("\n") + "\n", { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" } });
}
