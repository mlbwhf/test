import Link from "next/link";
import { api, type Course, type RegionalPrices, type TicketType } from "@/lib/api";
import { formatDateTimeInZone, formatMoney, formatTimeInZone, humanize } from "@/lib/format";
import { MAX_ATTENDEES, REGIONAL_PRICE_ROWS } from "@/lib/forms";
import { ActionForm } from "@/components/action-form";
import { ApiNotice, Empty, Section, StatusBadge } from "@/components/ui";
import { createTicketTypeAction, sellTestTicketAction } from "@/app/actions";

export const dynamic = "force-dynamic";

function RegionalPriceList({ prices }: { prices: RegionalPrices | null }) {
  const entries = Object.entries(prices ?? {});
  if (entries.length === 0) return <span className="muted">—</span>;
  return (
    <>
      {entries.map(([currency, minor], i) => (
        <span key={currency}>
          {i > 0 && <br />}
          {formatMoney(minor, currency)}
        </span>
      ))}
    </>
  );
}

/** Base currency first, then every regional currency across the given ticket types. */
function sellableCurrencies(base: string, ticketTypes: TicketType[]): string[] {
  const set = new Set<string>([base]);
  for (const t of ticketTypes) {
    for (const c of Object.keys(t.prices ?? {})) set.add(c);
    for (const c of Object.keys(t.earlyBird?.prices ?? {})) set.add(c);
  }
  return [...set];
}

function RegionalPriceRows({ prefix }: { prefix: string }) {
  return (
    <div className="fields-row">
      {Array.from({ length: REGIONAL_PRICE_ROWS }, (_, i) => (
        <div key={i} className="fields-row">
          <label>
            Currency {i + 1}
            <input
              name={`${prefix}_${i}_currency`}
              maxLength={3}
              pattern="[A-Za-z]{3}"
              placeholder="USD"
              style={{ textTransform: "uppercase" }}
            />
          </label>
          <label>
            Price {i + 1}
            <input name={`${prefix}_${i}_price`} inputMode="decimal" placeholder="19.00" />
          </label>
        </div>
      ))}
    </div>
  );
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [eventRes, ticketTypesRes, seatsRes] = await Promise.all([
    api.getEvent(id),
    api.listTicketTypes(id),
    api.listSeats(id),
  ]);

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
  const seats = seatsRes.ok ? seatsRes.data.items : [];
  const timezone = event.timezone || "UTC";
  const currencies = sellableCurrencies(event.currency, ticketTypes);
  const rosterHref = `/events/${encodeURIComponent(event.id)}/roster.csv`;

  let course: Course | null = null;
  if (event.courseId) {
    const courseRes = await api.getCourse(event.courseId);
    if (courseRes.ok) course = courseRes.data;
  }

  return (
    <>
      <div className="page-header">
        <h1>{event.name}</h1>
        <StatusBadge status={event.status} />
        <span className="muted">
          {formatDateTimeInZone(event.startsAt, timezone)}
          {event.endsAt ? ` – ${formatDateTimeInZone(event.endsAt, timezone)}` : ""} · {timezone} ·{" "}
          {humanize(event.format)} · {event.currency} · <code>{event.id}</code>
        </span>
        {event.courseId && (
          <Link href={`/courses/${encodeURIComponent(event.courseId)}`}>
            ← Course{course ? `: ${course.name}` : ""}
          </Link>
        )}
        <Link href="/events">← All events</Link>
      </div>

      <Section title="Sessions">
        {event.sessions.length === 0 ? (
          <Empty>No sessions scheduled. Times shown in {timezone}.</Empty>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Starts ({timezone})</th>
                    <th>Ends</th>
                  </tr>
                </thead>
                <tbody>
                  {event.sessions.map((s, i) => (
                    <tr key={`${s.startsAt}-${i}`}>
                      <td className="num">{i + 1}</td>
                      <td>{s.title ?? <span className="muted">—</span>}</td>
                      <td>{formatDateTimeInZone(s.startsAt, timezone)}</td>
                      <td>{formatTimeInZone(s.endsAt, timezone)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hint">
              {event.minEnrollment !== null ? `Minimum enrollment ${event.minEnrollment}. ` : ""}
              {event.instructorIds.length} instructor{event.instructorIds.length === 1 ? "" : "s"} assigned.
            </p>
          </>
        )}
      </Section>

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
                  <th className="num">Base price</th>
                  <th className="num">Regional</th>
                  <th>Early bird</th>
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
                    <td className="num">
                      <RegionalPriceList prices={t.prices} />
                    </td>
                    <td>
                      {t.earlyBird ? (
                        <>
                          {formatMoney(t.earlyBird.priceMinor, event.currency)}
                          {t.earlyBird.prices && Object.keys(t.earlyBird.prices).length > 0 && (
                            <>
                              {" "}
                              (
                              {Object.entries(t.earlyBird.prices)
                                .map(([c, m]) => formatMoney(m, c))
                                .join(", ")}
                              )
                            </>
                          )}
                          <br />
                          <span className="muted">until {formatDateTimeInZone(t.earlyBird.until, timezone)}</span>
                        </>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
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
        <ActionForm action={createTicketTypeAction} submitLabel="Create ticket type" pendingLabel="Creating…" wide>
          <input type="hidden" name="eventId" value={event.id} />
          <input type="hidden" name="currency" value={event.currency} />
          <input type="hidden" name="timezone" value={timezone} />
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

          <fieldset>
            <legend>Regional prices (optional)</legend>
            <p className="hint">Fixed prices in other currencies, in major units. Leave blank to sell only in {event.currency}.</p>
            <RegionalPriceRows prefix="regional" />
          </fieldset>

          <fieldset>
            <legend>Early bird (optional)</legend>
            <div className="fields">
              <label>
                Until (end of day, {timezone})
                <input name="earlyBirdUntil" type="date" />
              </label>
              <label>
                Early-bird price ({event.currency})
                <input name="earlyBirdPrice" inputMode="decimal" placeholder="19.00" />
              </label>
            </div>
            <p className="hint">Optional early-bird regional prices:</p>
            <RegionalPriceRows prefix="eb_regional" />
          </fieldset>
        </ActionForm>
      </Section>

      <Section title="Roster">
        <div className="section-actions">
          <span className="muted">
            {seatsRes.ok
              ? `${seats.length} seat${seats.length === 1 ? "" : "s"}`
              : "Seats unavailable"}
          </span>
          <a href={rosterHref} download>
            Download CSV
          </a>
          <span className="hint">(name,email,company,status,orderId — import into SAFe Studio)</span>
        </div>
        {!seatsRes.ok ? (
          <ApiNotice failure={seatsRes.error} />
        ) : seats.length === 0 ? (
          <Empty>No seats yet. Sell a ticket below to add attendees to the roster.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Order</th>
                </tr>
              </thead>
              <tbody>
                {seats.map((s) => (
                  <tr key={s.id}>
                    <td>{s.attendee.name ?? <span className="muted">—</span>}</td>
                    <td>{s.attendee.email}</td>
                    <td>{s.attendee.company ?? <span className="muted">—</span>}</td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="mono">{s.orderId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Sell test ticket">
        {ticketTypes.length === 0 ? (
          <Empty>Create a ticket type first.</Empty>
        ) : (
          <ActionForm action={sellTestTicketAction} submitLabel="Create order" pendingLabel="Creating order…" wide>
            <input type="hidden" name="eventId" value={event.id} />
            <div className="fields">
              <label>
                Ticket type
                <select name="ticketTypeId" required defaultValue={ticketTypes[0]?.id}>
                  {ticketTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {formatMoney(t.priceMinor, event.currency)}
                      {t.prices && Object.keys(t.prices).length > 0 ? ` (+${Object.keys(t.prices).join(", ")})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Currency
                <select name="currency" required defaultValue={event.currency}>
                  {currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                      {c === event.currency ? " (base)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity (1–{MAX_ATTENDEES})
                <input name="quantity" type="number" min={1} max={MAX_ATTENDEES} step={1} required defaultValue={1} />
              </label>
              <label>
                Buyer email
                <input name="buyerEmail" type="email" required placeholder="buyer@example.com" />
              </label>
            </div>

            <fieldset>
              <legend>Attendees</legend>
              <p className="hint">
                One row per seat; only the first <em>quantity</em> rows with an email are sent. A regional currency
                is only accepted when the chosen ticket type has a price in it.
              </p>
              {Array.from({ length: MAX_ATTENDEES }, (_, i) => (
                <div key={i} className="fields-row">
                  <label>
                    Attendee {i + 1} email
                    <input name={`attendee_${i}_email`} type="email" placeholder="attendee@example.com" />
                  </label>
                  <label>
                    Attendee {i + 1} name
                    <input name={`attendee_${i}_name`} placeholder="Full name" />
                  </label>
                </div>
              ))}
            </fieldset>
          </ActionForm>
        )}
      </Section>
    </>
  );
}
