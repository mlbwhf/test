import { isMarketingHost } from "@/lib/host";
import { appUrl, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Search engines and AI crawlers are welcome on public pages; the console, learner
// bookings, tickets and certificates stay out of indexes.
export function GET(request: Request) {
  const marketing = isMarketingHost(request);
  const lines = marketing
    ? ["User-agent: *", "Allow: /", "", `Sitemap: ${siteUrl()}/sitemap.xml`, `Sitemap: ${appUrl()}/sitemap.xml`]
    : [
        "User-agent: *",
        "Allow: /c/",
        "Allow: /help",
        "Allow: /llms.txt",
        "Allow: /llms-full.txt",
        "Disallow: /",
        "",
        `Sitemap: ${appUrl()}/sitemap.xml`,
      ];
  lines.push("", "# Plain-text guide for AI assistants", `# ${siteUrl()}/llms.txt`);
  return new Response(lines.join("\n") + "\n", { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
