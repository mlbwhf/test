/** Find a class data shapes, safe to import from client components. */
export type CatalogItem = {
  organizationId: string; organizationName: string; slug: string; name: string; nextStartsAt: string; classes: number; url?: string | null; listed?: boolean;
  category?: string; promoted?: "top" | "category" | null; imageUrl?: string | null;
  courseId?: string; description?: string | null; certificationBody?: string | null; format?: string; hours?: number | null;
  priceMinor?: number | null; currency?: string; capacity?: number; seatsLeft?: number;
  badge?: "selling_fast" | "early_bird" | "accredited" | "new" | null; verifiedBadge?: boolean;
  logoUrl?: string | null; dates?: CatalogDate[];
  language?: string | null; tagline?: string | null; included?: string[]; heldUntilDelivery?: boolean; groupKey?: string; digitalBadge?: { name: string; platform: string; imageUrl: string | null } | null;
};
/** One upcoming date of a course. Older API responses carry only slug and startsAt. */
export type CatalogDate = {
  slug: string; startsAt: string; endsAt?: string; timezone?: string; format?: string;
  capacity?: number; seatsLeft?: number; priceMinor?: number | null;
  dayStartsAt?: string; dayEndsAt?: string; days?: number;
};
export type CatalogCategory = { id: string; label: string };

/** Stable id of a course in the finder (also the `class` query parameter). */
export const keyOf = (c: CatalogItem) => `${c.organizationId}~${c.slug}`;
