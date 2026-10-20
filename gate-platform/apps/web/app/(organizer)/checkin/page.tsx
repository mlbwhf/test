import Link from "next/link";
import { api, type Event, type Seat } from "@/lib/api";
import { ActionForm } from "@/components/action-form";
import { ApiNotice, Empty, Section } from "@/components/ui";
import { checkInAction } from "@/app/actions";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Cohorts worth checking in: running today or starting within a week, else the next ones. */
function relevant(events: Event[], now = Date.now()): Event[] {
  const live = events.filter((e) => e.status === "live" || e.status === "ended");
  const near = live.filter((e) => {
    const start = new Date(e.startsAt).getTime();
    const end = new Date(e.endsAt ?? e.startsAt).getTime() + 12 * 3600_000;
    return end >= now && start <= now + 7 * 86_400_000;
  });
  const list = near.length ? near : live.filter((e) => new Date(e.endsAt ?? e.startsAt).getTime() >= now).slice(0, 5);
  return list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function when(e: Event): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: e.timezone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(e.startsAt));
}

export default async function CheckInPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const eventsRes = await api.listEvents();
  if (!eventsRes.ok) {
    return (
      <>
        <h1>Check-in</h1>
        <ApiNotice failure={eventsRes.error} />
      </>
    );
  }
  const choices = relevant(eventsRes.data.items);
  const selectedId = one(sp.event) || choices[0]?.id || "";
  const selected = eventsRes.data.items.find((e) => e.id === selectedId);
  const seatsRes = selected ? await api.listSeats(selected.id) : null;
  const q = one(sp.q).trim().toLowerCase();
  const seats: Seat[] = seatsRes?.ok ? seatsRes.data.items.filter((s) => s.status === "confirmed") : [];
  const shown = q
    ? seats.filter((s) => [s.attendee.name ?? "", s.attendee.email, s.attendee.company ?? "", s.ticketCode ?? ""].some((x) => x.toLowerCase().includes(q)))
    : seats;
  const inCount = seats.filter((s) => s.checkedInAt).length;

  return (
    <>
      <div className="page-header">
        <h1>Check-in</h1>
        <span className="muted">Scan a ticket with your phone camera: the QR opens that attendee here. Or type the code below.</span>
      </div>

      {choices.length === 0 ? (
        <Empty>No live cohorts in the coming week.</Empty>
      ) : (
        <nav className="tabs" aria-label="Cohort">
          {choices.map((e) => (
            <Link key={e.id} href={`/checkin?event=${encodeURIComponent(e.id)}`} className="tab" aria-current={e.id === selectedId ? "page" : undefined}>
              {e.name} <span className="mono">{when(e)}</span>
            </Link>
          ))}
        </nav>
      )}

      {selected && (
        <>
          <div className="ci-hero">
            <div>
              <p className="ci-label">CHECKED IN</p>
              <p className="ci-count">
                {inCount} <span>/ {seats.length}</span>
              </p>
            </div>
            <div className="ci-grid" aria-hidden="true">
              {seats.slice(0, 60).map((s) => (
                <span key={s.id} className={s.checkedInAt ? "on" : ""} />
              ))}
            </div>
          </div>

          <Section title="Check in by code">
            <ActionForm action={checkInAction} submitLabel="Check in" pendingLabel="Checking…" inline>
              <input type="hidden" name="eventId" value={selected.id} />
              <input name="code" placeholder="EC-7K2M-94QX" autoComplete="off" autoCapitalize="characters" spellCheck={false} aria-label="Ticket code" className="ci-code-input" />
            </ActionForm>
          </Section>

          <Section title={`Attendees · ${selected.name}`}>
            <form className="ci-search" action="/checkin">
              <input type="hidden" name="event" value={selected.id} />
              <input name="q" defaultValue={one(sp.q)} placeholder="Search name, email, company or code" aria-label="Search attendees" />
            </form>
            {seatsRes && !seatsRes.ok ? (
              <ApiNotice failure={seatsRes.error} />
            ) : shown.length === 0 ? (
              <Empty>{q ? "Nobody matches that search." : "No confirmed seats yet."}</Empty>
            ) : (
              <ul className="ci-list">
                {shown.map((s) => (
                  <li key={s.id} className={s.checkedInAt ? "is-in" : ""}>
                    <div>
                      <div className="ci-name">{s.attendee.name ?? s.attendee.email}</div>
                      <div className="ci-sub mono">
                        {s.ticketCode} · {s.attendee.company ?? s.attendee.email}
                      </div>
                    </div>
                    <ActionForm action={checkInAction} submitLabel={s.checkedInAt ? "Undo" : "Check in"} pendingLabel="…" variant={s.checkedInAt ? "danger" : "primary"} inline>
                      <input type="hidden" name="eventId" value={selected.id} />
                      <input type="hidden" name="code" value={s.ticketCode ?? ""} />
                      {s.checkedInAt && <input type="hidden" name="undo" value="1" />}
                    </ActionForm>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </>
  );
}
