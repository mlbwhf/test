import type { MetadataRoute } from "next";
import { publicPaths } from "@/lib/public";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return publicPaths().map((p) => ({ url: `${base}${p.path}`, lastModified: new Date(`${p.updated}T00:00:00Z`), changeFrequency: p.path === "/" ? "weekly" : "monthly", priority: p.priority }));
}
export const dynamic = "force-dynamic";
