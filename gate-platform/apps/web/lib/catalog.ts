import { apiBaseUrl } from "@/lib/api";

import type { CatalogCategory, CatalogItem } from "@/lib/catalog-types";

export { keyOf, type CatalogCategory, type CatalogItem } from "@/lib/catalog-types";

/** Courses with upcoming classes (public data) and the finder's topics. Empty if the API is down. */
export async function publicCatalogWithCategories(): Promise<{ items: CatalogItem[]; categories: CatalogCategory[] }> {
  try {
    // Short revalidation: a paid placement should appear within minutes of payment.
    const res = await fetch(`${apiBaseUrl}/public/v1/catalog`, { next: { revalidate: 300 } });
    if (!res.ok) return { items: [], categories: [] };
    const body = (await res.json()) as { items: CatalogItem[]; categories?: CatalogCategory[] };
    return { items: body.items, categories: body.categories ?? [] };
  } catch {
    return { items: [], categories: [] };
  }
}

/** Courses with upcoming classes, for the sitemap and llms.txt. */
export async function publicCatalog(): Promise<CatalogItem[]> {
  return (await publicCatalogWithCategories()).items;
}
