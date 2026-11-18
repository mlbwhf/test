import { apiBaseUrl } from "@/lib/api";

export type ActiveSale = { organizationId: string; organizationName: string; handle: string; label: string; percentOff: number; until: string; endsAt: string; next: { percentOff: number; until: string } | null };

/** Organizer sales running now (Black Friday…). Empty if the API is down; refreshed every few minutes. */
export async function activeSales(): Promise<ActiveSale[]> {
  try {
    const res = await fetch(`${apiBaseUrl}/public/v1/sales`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const now = Date.now();
    return ((await res.json()) as { items: ActiveSale[] }).items.filter((s) => Date.parse(s.endsAt) > now);
  } catch {
    return [];
  }
}

export { lastDay } from "@/lib/sale-format";
