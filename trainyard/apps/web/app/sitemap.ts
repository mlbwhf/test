import type { MetadataRoute } from "next";
import { publicPaths } from "@/lib/public";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return publicPaths().map((p) => ({ url: `${base}${p.path}`, lastModified: new Date(), changeFrequency: p.path === "/" ? "weekly" : "monthly", priority: p.priority }));
}
export const dynamic = "force-dynamic";
