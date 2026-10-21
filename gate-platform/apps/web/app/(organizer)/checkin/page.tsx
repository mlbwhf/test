import { api, type Event } from "@/lib/api";
import { ApiNotice, Empty } from "@/components/ui";
import { CheckInBoard } from "@/components/checkin-board";

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

/** Which session day it is today in the cohort's own time zone (null when none is today). */
function dayOf(e: Event, now = new Date()): number | null {
  const key = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: e.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const today = key(now);
  const sessions = e.sessions.length ? e.sessions : [{ startsAt: e.startsAt }];
  const i = sessions.findIndex((s) => key(new Date(s.startsAt)) === today);
  return i < 0 ? null : i + 1;
}

export default async function CheckInPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const [eventsRes, linesRes] = await Promise.all([api.listEvents(), api.eventLines()]);
  const sold = new Map((linesRes.ok ? linesRes.data.items : []).map((l) => [l.eventId, l.sold]));
  if (!eventsRes.ok) {
    return (
      <>
        <h1>Check-in</h1>
        <ApiNotice failure={eventsRes.error} />
      </>
    );
  }
  const choices = relevant(eventsRes.data.items);
  const selected = eventsRes.data.items.find((e) => e.id === one(sp.event)) ?? choices[0];
  if (!selected) {
    return (
      <>
        <h1>Check-in</h1>
        <Empty>No cohorts are running or starting in the coming week.</Empty>
      </>
    );
  }
  const seatsRes = await api.listSeats(selected.id);
  if (!seatsRes.ok) return <ApiNotice failure={seatsRes.error} />;
  const seats = seatsRes.data.items
    .filter((s) => s.status === "confirmed")
    .map((s) => ({ id: s.id, name: s.attendee.name ?? null, email: s.attendee.email, company: s.attendee.company ?? null, code: s.ticketCode ?? "", checkedInAt: s.checkedInAt }))
    .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));

  return (
    <CheckInBoard
      event={{ id: selected.id, name: selected.name, day: dayOf(selected), days: Math.max(1, selected.sessions.length), when: when(selected) }}
      seats={seats}
      choices={(choices.some((c) => c.id === selected.id) ? choices : [selected, ...choices]).map((e) => ({ id: e.id, name: e.name, when: when(e), seats: sold.get(e.id) ?? null }))}
    />
  );
}
