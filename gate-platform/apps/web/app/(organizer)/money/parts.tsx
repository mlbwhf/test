import Link from "next/link";
import { FX_ROUNDING_LABELS, RELEASE_POLICY_LABELS, type EventLine, type Order, type Organization } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { connectStripeAction } from "@/app/auth-actions";
import { refundOrderAction, releaseFundsAction } from "@/app/actions";

const PAID = new Set(["paid", "partially_refunded"]);

type Sums = Map<string, number>;
const add = (m: Sums, currency: string, v: number) => m.set(currency, (m.get(currency) ?? 0) + v);

function Amounts({ sums, currency, green }: { sums: Sums; currency: string; green?: boolean }) {
  const rows = [...sums.entries()].filter(([, v]) => v !== 0).sort(([a], [b]) => (a === currency ? -1 : b === currency ? 1 : a.localeCompare(b)));
  const [first, ...rest] = rows.length ? rows : [[currency, 0] as [string, number]];
  return (
    <>
      <p className={`tkpi-value${green ? " is-green" : ""}`}>{formatMoney(first![1], first![0])}</p>
      {rest.map(([c, v]) => (
        <p key={c} className="tkpi-more">
          + {formatMoney(v, c)}
        </p>
      ))}
    </>
  );
}

/** Held · Released this month · Platform fees · Refunded, all derived from the orders. */
export function MoneyKpis({ orders, currency }: { orders: Order[]; currency: string }) {
  const held: Sums = new Map();
  const released: Sums = new Map();
  const fees: Sums = new Map();
  const refunded: Sums = new Map();
  const heldEvents = new Set<string>();
  let paid = 0;
  let refundedCount = 0;
  const now = new Date();
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  for (const o of orders) {
    if (PAID.has(o.status)) {
      paid += 1;
      add(fees, o.currency, o.pricing.platformFeeMinor + o.pricing.attendeeFeeMinor);
      if (o.fundsStatus === "held") {
        add(held, o.currency, o.pricing.organizerNetMinor);
        heldEvents.add(o.eventId);
      }
      if (o.fundsStatus === "released" && o.releasedAt && new Date(o.releasedAt).getTime() >= monthStart) add(released, o.currency, o.pricing.organizerNetMinor);
    }
    if (o.refundedMinor > 0) {
      refundedCount += 1;
      add(refunded, o.currency, o.refundedMinor);
    }
  }
  const month = now.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  return (
    <div className="tkpis">
      <div className="tkpi">
        <p className="tkpi-label">Held</p>
        <Amounts sums={held} currency={currency} />
        <p className="tkpi-sub">
          {heldEvents.size} cohort{heldEvents.size === 1 ? "" : "s"} · released after delivery
        </p>
      </div>
      <div className="tkpi">
        <p className="tkpi-label">Released ({month})</p>
        <Amounts sums={released} currency={currency} green />
        <p className="tkpi-sub">to your payout account</p>
      </div>
      <div className="tkpi">
        <p className="tkpi-label">Platform fees</p>
        <Amounts sums={fees} currency={currency} />
        <p className="tkpi-sub">
          on {paid} paid order{paid === 1 ? "" : "s"}
        </p>
      </div>
      <div className="tkpi">
        <p className="tkpi-label">Refunded</p>
        <Amounts sums={refunded} currency={currency} />
        <p className="tkpi-sub">
          {refundedCount} order{refundedCount === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}

const STATUS: Record<string, [label: string, cls: string]> = {
  paid: ["Paid", "chip-ok"],
  partially_refunded: ["Part refunded", "chip-warn"],
  refunded: ["Refunded", ""],
  pending: ["Pending", "chip-warn"],
  failed: ["Failed", "chip-err"],
  cancelled: ["Cancelled", ""],
};

export function OrdersTab({ orders, lines, canWrite, now }: { orders: Order[]; lines: EventLine[]; canWrite: boolean; now: number }) {
  const byId = new Map(lines.map((l) => [l.eventId, l]));
  // Delivered cohorts whose money is still held: one row each with a Release button.
  const ready = new Map<string, { line: EventLine; minor: number; currency: string }>();
  for (const o of orders) {
    const l = byId.get(o.eventId);
    if (!l || o.fundsStatus !== "held" || !PAID.has(o.status)) continue;
    if (new Date(l.endsAt ?? l.startsAt).getTime() > now) continue;
    const r = ready.get(o.eventId) ?? { line: l, minor: 0, currency: o.currency };
    r.minor += o.pricing.organizerNetMinor;
    ready.set(o.eventId, r);
  }
  const shown = orders.filter((o) => o.status !== "failed").slice(0, 200);

  return (
    <>
      {ready.size > 0 && (
        <section className="card money-list" aria-label="Ready to release">
          <ul>
            {[...ready.values()].map(({ line, minor, currency }) => (
              <li key={line.eventId}>
                <strong>Release funds · {line.name}</strong>
                <span className="muted">Delivered {new Date(line.endsAt ?? line.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: line.timezone })}</span>
                <span className="mono">{formatMoney(minor, currency)}</span>
                {canWrite ? (
                  <ActionForm action={releaseFundsAction} submitLabel="Release" pendingLabel="Releasing…" inline>
                    <input type="hidden" name="eventId" value={line.eventId} />
                    <input type="hidden" name="currency" value={currency} />
                  </ActionForm>
                ) : (
                  <span className="chip chip-ok">Held</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="card money-list" aria-label="Orders">
        {shown.length === 0 ? (
          <p className="today-clear">No orders yet. They appear here as soon as someone registers.</p>
        ) : (
          <ul>
            {shown.map((o) => {
              const who = o.attendees[0]?.name ?? o.buyerEmail;
              const event = byId.get(o.eventId)?.name ?? o.eventId;
              const [label, cls] = o.paymentMethod === "invoice" && o.status === "pending" ? ["Invoice", "chip-warn"] : (STATUS[o.status] ?? [o.status, ""]);
              return (
                <li key={o.id}>
                  <strong title={o.buyerEmail}>{who}</strong>
                  <span className="muted">
                    <Link href={`/events?sel=${encodeURIComponent(o.eventId)}`}>{event}</Link>
                    {o.quantity > 1 ? ` · ${o.quantity} seats` : ""}
                  </span>
                  <span className="mono">{formatMoney(o.pricing.totalMinor, o.currency)}</span>
                  <span className="money-status">
                    <span className={`chip ${cls}`}>{label}</span>
                    {canWrite && o.status === "paid" && (
                      <details className="person-menu">
                        <summary aria-label={`Actions for order ${o.id}`}>⋯</summary>
                        <div className="person-menu-body">
                          <span className="mono muted">{o.id}</span>
                          <ActionForm action={refundOrderAction} submitLabel="Refund in full" pendingLabel="Refunding…" variant="danger" inline>
                            <input type="hidden" name="orderId" value={o.id} />
                            <input type="hidden" name="currency" value={o.currency} />
                            <input type="hidden" name="reason" value="requested_by_customer" />
                          </ActionForm>
                        </div>
                      </details>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

/** Settings as rows: the value, and Edit to open the form below. */
export function SettingsRows({ org, canEdit, paymentsSetup, showPayments = true }: { org: Organization; canEdit: boolean; paymentsSetup: "none" | "incomplete" | "ready" | null; showPayments?: boolean }) {
  const direct = org.paymentMode === "direct";
  const rows: Array<{ label: string; value: string; edit?: string }> = [
    {
      label: "Release policy",
      value: direct
        ? "Not used: Direct payments go straight to your Stripe account"
        : org.releasePolicy === "on_delivery" ? `${RELEASE_POLICY_LABELS[org.releasePolicy]} · ${org.releaseGraceHours}h after the last session` : RELEASE_POLICY_LABELS[org.releasePolicy],
      edit: "rules",
    },
    { label: "Minimum-enrolment decision", value: `${org.minEnrollmentDecisionDays} days before the first session`, edit: "rules" },
    { label: "Currencies", value: [org.currency, ...org.pricing.currencies].join(" · "), edit: "pricing" },
    { label: "Converted prices", value: org.pricing.fxFallback ? `On · ${FX_ROUNDING_LABELS[org.pricing.rounding]}` : "Off", edit: "pricing" },
  ];
  return (
    <section className="card settings-rows" aria-label="Settings">
      <ul>
        {showPayments && <li>
          <span>Payments · {direct ? "Direct" : "Protected"}</span>
          <strong>{paymentsSetup === "ready" ? "Stripe connected" : paymentsSetup === "incomplete" ? "Stripe setup not finished" : "Stripe not connected"}</strong>
          {canEdit && paymentsSetup !== "ready" ? (
            <ActionForm action={connectStripeAction} submitLabel={paymentsSetup === "incomplete" ? "Continue" : "Connect"} pendingLabel="Opening Stripe…" inline>
              <span />
            </ActionForm>
          ) : (
            <span className={`chip ${paymentsSetup === "ready" ? "chip-ok" : "chip-warn"}`}>{paymentsSetup === "ready" ? "Set" : "Not set"}</span>
          )}
        </li>}
        {rows.map((r) => (
          <li key={r.label}>
            <span>{r.label}</span>
            <strong>{r.value}</strong>
            {canEdit && r.edit ? (
              <a className="pill-btn" href={`/money?tab=settings&edit=${r.edit}#${r.edit}`}>
                Edit
              </a>
            ) : (
              <span />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
