import { HELP } from "@/lib/help";
import { isMarketingHost } from "@/lib/host";
import { publicCatalog } from "@/lib/catalog";
import { appUrl, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Marketing host: home, FAQ, help and legal pages. App host: every public course page
// with upcoming classes.
export async function GET(request: Request) {
  const today = new Date().toISOString().slice(0, 10);
  const urls: Array<{ loc: string; lastmod?: string; priority: string; freq: string }> = [];
  if (isMarketingHost(request)) {
    const s = siteUrl();
    urls.push({ loc: `${s}/`, lastmod: today, priority: "1.0", freq: "weekly" }, { loc: `${s}/faq`, lastmod: today, priority: "0.8", freq: "monthly" }, { loc: `${s}/classes`, lastmod: today, priority: "0.9", freq: "daily" }, { loc: `${s}/help`, lastmod: today, priority: "0.8", freq: "weekly" });
    for (const a of HELP) urls.push({ loc: `${s}/help/${a.slug}`, priority: "0.6", freq: "monthly" });
    for (const p of ["terms", "privacy", "refunds"]) urls.push({ loc: `${s}/${p}`, priority: "0.2", freq: "yearly" });
  } else {
    for (const c of await publicCatalog()) {
      urls.push({ loc: `${appUrl()}/c/${encodeURIComponent(c.organizationId)}/${encodeURIComponent(c.slug)}`, lastmod: today, priority: "0.9", freq: "daily" });
    }
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`;
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=900" } });
}
