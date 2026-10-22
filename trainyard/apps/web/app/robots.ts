import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Search engines may index the landing page and the public text files; the app itself,
// which needs a key, is kept out. The same list is repeated in the app layout's robots meta.
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt", "/og.png", "/icon.svg"],
        disallow: ["/dashboards", "/value-streams", "/canvases", "/outcome-planning", "/embed/", "/board", "/boards/", "/portfolio", "/templates", "/imports", "/ai", "/agents", "/model", "/sync", "/users", "/login", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
export const dynamic = "force-dynamic";
