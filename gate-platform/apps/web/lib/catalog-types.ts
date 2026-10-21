/** Find a class data shapes, safe to import from client components. */
export type CatalogItem = {
  organizationId: string; organizationName: string; slug: string; name: string; nextStartsAt: string; classes: number; url?: string | null; listed?: boolean;
  category?: string; promoted?: "top" | "category" | null; imageUrl?: string | null;
  courseId?: string; description?: string | null; certificationBody?: string | null; format?: string; hours?: number | null;
  priceMinor?: number | null; currency?: string; capacity?: number; seatsLeft?: number;
  badge?: "selling_fast" | "early_bird" | "accredited" | "new" | null; verifiedBadge?: boolean;
  logoUrl?: string | null; dates?: { slug: string; startsAt: string }[]; digitalBadge?: { name: string; platform: string; imageUrl: string | null } | null;
};
export type CatalogCategory = { id: string; label: string };

/** Stable id of a course in the finder (also the `class` query parameter). */
export const keyOf = (c: CatalogItem) => `${c.organizationId}~${c.slug}`;
