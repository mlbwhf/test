import { apiBaseUrl } from "@/lib/api";

export type CatalogItem = { organizationId: string; organizationName: string; slug: string; name: string; nextStartsAt: string; classes: number };

/** Courses with upcoming classes (public data), for the sitemap and llms.txt. Empty if the API is down. */
export async function publicCatalog(): Promise<CatalogItem[]> {
  try {
    const res = await fetch(`${apiBaseUrl}/public/v1/catalog`, { next: { revalidate: 900 } });
    if (!res.ok) return [];
    return ((await res.json()) as { items: CatalogItem[] }).items;
  } catch {
    return [];
  }
}
