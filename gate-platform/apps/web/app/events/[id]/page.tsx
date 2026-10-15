import Link from "next/link";
import { api } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { ApiNotice, Empty, Section, StatusBadge } from "@/components/ui";
import { createTicketTypeAction, sellTestTicketAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [eventRes, ticketTypesRes] = await Promise.all([api.getEvent(id), api.listTicketTypes(id)]);

  if (!eventRes.ok) {
    return (
      <>
        <div className="page-header">
          <h1>Event</h1>
          <Link href="/events">← All events</Link>
        </div>
        <ApiNotice failure={eventRes.error} />
      </>
    );
  }

  const event = eventRes.data;
  const ticketTypes = ticketTypesRes.ok ? ticketTypesRes.data.items : [];

  return (
    <>
      <div className="page-header">
        <h1>{event.name}</h1>
        <StatusBadge status={event.status} />
        <span className="muted">
          {formatDateTime(event.startsAt)} · {event.currency} · <code>{event.id}</code>
        </span>
        <Link href="/events">← All events</Link>
      </div>

      <Section title="Ticket types">
        {!ticketTypesRes.ok ? (
          <ApiNotice failure={ticketTypesRes.error} />
        ) : ticketTypes.length === 0 ? (
          <Empty>No ticket types yet. Add one below.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="num">Price</th>
                  <th className="num">Quantity</th>
                  <th className="num">Sold</th>
                  <th className="num">Remaining</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {ticketTypes.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td className="num">{formatMoney(t.priceMinor, event.currency)}</td>
                    <td className="num">{t.quantity}</td>
                    <td className="num">{t.sold}</td>
                    <td className="num">{t.quantity - t.sold}</td>
                    <td className="mono">{t.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Create ticket type">
        <ActionForm action={createTicketTypeAction} submitLabel="Create ticket type" pendingLabel="Creating…">
          <input type="hidden" name="eventId" value={event.id} />
          <input type="hidden" name="currency" value={event.currency} />
          <div className="fields">
            <label>
              Name
              <input name="name" required placeholder="General admission" />
            </label>
            <label>
              Price ({event.currency})
              <input name="price" required inputMode="decimal" placeholder="25.00" />
            </label>
            <label>
              Quantity
              <input name="quantity" type="number" min={1} step={1} required defaultValue={100} />
            </label>
          </div>
        </ActionForm>
      </Section>

      <Section title="Sell test ticket">
        {ticketTypes.length === 0 ? (
          <Empty>Create a ticket type first.</Empty>
        ) : (
          <ActionForm action={sellTestTicketAction} submitLabel="Create order" pendingLabel="Creating order…">
            <input type="hidden" name="eventId" value={event.id} />
            <div className="fields">
              <label>
                Ticket type
                <select name="ticketTypeId" required defaultValue={ticketTypes[0]?.id}>
                  {ticketTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {formatMoney(t.priceMinor, event.currency)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity
                <input name="quantity" type="number" min={1} step={1} required defaultValue={1} />
              </label>
              <label>
                Buyer email
                <input name="buyerEmail" type="email" required placeholder="buyer@example.com" />
              </label>
            </div>
          </ActionForm>
        )}
      </Section>
    </>
  );
}
