import Link from "next/link";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { ApiNotice, Empty, Section, StatusBadge } from "@/components/ui";
import { refundOrderAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [ordersRes, eventsRes] = await Promise.all([api.listOrders(), api.listEvents()]);
  const eventNames = new Map<string, string>();
  if (eventsRes.ok) for (const e of eventsRes.data.items) eventNames.set(e.id, e.name);

  return (
    <>
      <div className="page-header">
        <h1>Orders</h1>
      </div>

      {!ordersRes.ok && <ApiNotice failure={ordersRes.error} />}

      <Section title="All orders">
        {!ordersRes.ok ? (
          <Empty>Orders unavailable.</Empty>
        ) : ordersRes.data.items.length === 0 ? (
          <Empty>No orders yet. Sell a test ticket from an event page.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Event</th>
                  <th>Buyer</th>
                  <th className="num">Qty</th>
                  <th className="num">Total</th>
                  <th className="num">Organizer net</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordersRes.data.items.map((o) => (
                  <tr key={o.id}>
                    <td className="mono">{o.id}</td>
                    <td>
                      <Link href={`/events/${encodeURIComponent(o.eventId)}`}>
                        {eventNames.get(o.eventId) ?? o.eventId}
                      </Link>
                    </td>
                    <td>{o.buyerEmail}</td>
                    <td className="num">{o.quantity}</td>
                    <td className="num">{formatMoney(o.pricing.totalMinor, o.currency)}</td>
                    <td className="num">{formatMoney(o.pricing.organizerNetMinor, o.currency)}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td>
                      {o.status === "paid" ? (
                        <ActionForm
                          action={refundOrderAction}
                          submitLabel="Refund"
                          pendingLabel="Refunding…"
                          variant="danger"
                          inline
                        >
                          <input type="hidden" name="orderId" value={o.id} />
                          <input type="hidden" name="currency" value={o.currency} />
                          <input type="hidden" name="reason" value="requested_by_customer" />
                        </ActionForm>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  );
}
