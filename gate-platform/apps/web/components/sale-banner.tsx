import { lastDay } from "@/lib/sale-format";
import type { ActiveSale } from "@/lib/sales";

/** Homepage banner for organizer sales running now; renders nothing when there are none. */
export function SaleBanner({ sales }: { sales: ActiveSale[] }) {
  if (!sales.length) return null;
  return (
    <aside className="sale-banner" aria-label="Sale">
      {sales.slice(0, 3).map((s) => (
        <div key={s.organizationId} className="sale-banner-in">
          <span className="sale-banner-tag mono">{s.label.toUpperCase()}</span>
          <p>
            <strong>
              {s.percentOff}% off every {s.organizationName} class
            </strong>{" "}
            until {lastDay(s.until)}
            {s.next ? `, then ${s.next.percentOff}% off through ${lastDay(s.next.until)}` : ""}. Applied automatically at checkout.
          </p>
          <a className="pill pill-green" href={`/classes?provider=${encodeURIComponent(s.organizationId)}`}>
            See the classes
          </a>
        </div>
      ))}
    </aside>
  );
}
