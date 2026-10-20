import Link from "next/link";
import { api, type EventLine, type EventOverview } from "@/lib/api";
import { getMe } from "@/lib/console-data";
import { formatMoney } from "@/lib/format";
import { ApiNotice } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import { DuplicateDialog } from "@/components/duplicate-dialog";
import { ActionForm } from "@/components/action-form";
import { issuePaneCertificatesAction, publishEventAction, setInstructorsAction } from "@/app/instructor-actions";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const DAY = 86_400_000;
const FILTERS = [
  ["all", "All"],
  ["this-week", "This week"],
  ["next-week", "Next week"],
  ["low", "Low fill"],
] as const;
type Filter = (typeof FILTERS)[number][0];

/** Monday 00:00 UTC of the week containing `t`. */
function weekStart(t: number): number {
  const d = new Date(t);
  const monday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - ((d.getUTCDay() + 6) % 7) * DAY;
  return monday;
}

const isLow = (l: EventLine) => (l.minEnrollment ? l.sold < l.minEnrollment : l.capacity > 0 && l.sold / l.capacity < 0.4);
const ended = (l: EventLine, now: number) => new Date(l.endsAt ?? l.startsAt).getTime() < now - DAY / 2;

function groupLabel(start: number, now: number): string {
  const thisWeek = weekStart(now);
  if (start === thisWeek) return "This week";
  if (start === thisWeek + 7 * DAY) return "Next week";
  return `Week of ${new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(start)}`;
}

function fmt(iso: string, tz: string, opts: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, ...opts }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts }).format(new Date(iso));
  }
}

/** Money without ".00" so it fits the small seat-card boxes. */
const whole = (minor: number, currency: string) => formatMoney(minor, currency).replace(/[.,]00(?=\D*$)/, "");

const FORMAT_LABEL: Record<string, string> = { live_virtual: "LIVE VIRTUAL", in_person: "IN PERSON", hybrid: "HYBRID", self_paced: "SELF-PACED" };

function initials(name: string | null, email: string): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function href(params: { q?: string; w?: string; sel?: string }): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.w && params.w !== "all") sp.set("w", params.w);
  if (params.sel) sp.set("sel", params.sel);
  const s = sp.toString();
  return s ? `/events?${s}` : "/events";
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const w = (FILTERS.some(([k]) => k === one(sp.w)) ? one(sp.w) : "all") as Filter;
  const [linesRes, meRes] = await Promise.all([api.eventLines(), getMe()]);
  const perms = meRes.ok ? meRes.data.permissions : [];
  if (!linesRes.ok) {
    return (
      <>
        <h1>Events</h1>
        <ApiNotice failure={linesRes.error} />
      </>
    );
  }

  const now = Date.now();
  const thisWeek = weekStart(now);
  const needle = q.toLowerCase();
  const all = linesRes.data.items.filter((l) => l.status !== "cancelled" || w === "all");
  const filtered = all.filter((l) => {
    if (needle && !`${l.name} ${l.courseName ?? ""}`.toLowerCase().includes(needle)) return false;
    const start = new Date(l.startsAt).getTime();
    if (w === "this-week") return weekStart(start) === thisWeek && !ended(l, now);
    if (w === "next-week") return weekStart(start) === thisWeek + 7 * DAY;
    if (w === "low") return !ended(l, now) && l.status === "live" && isLow(l);
    return true;
  });
  const upcoming = filtered.filter((l) => !ended(l, now)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = filtered.filter((l) => ended(l, now)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  const groups = new Map<string, EventLine[]>();
  for (const l of upcoming) {
    const label = groupLabel(weekStart(new Date(l.startsAt).getTime()), now);
    groups.set(label, [...(groups.get(label) ?? []), l]);
  }
  if (past.length) groups.set("Past", past);

  const explicit = one(sp.sel);
  const selId = explicit && all.some((l) => l.eventId === explicit) ? explicit : (upcoming[0] ?? past[0])?.eventId;
  const canManage = perms.includes("settings");
  const [detailRes, partiesRes] = await Promise.all([selId ? api.eventOverview(selId) : Promise.resolve(null), canManage ? api.listParties() : Promise.resolve(null)]);
  const instructorOptions = partiesRes?.ok ? partiesRes.data.items.filter((p) => p.kind === "instructor").map((p) => ({ id: p.id, name: p.name })) : [];

  return (
    <div className={`ev-split${explicit ? " has-sel" : ""}`}>
      <section className="ev-list" aria-label="Events">
        <div className="ev-list-head">
          <h1>Events</h1>
          {perms.includes("classes:write") && (
            <Link className="pill-btn" href="/import">
              Import
            </Link>
          )}
        </div>
        <form className="ev-search" action="/events" role="search">
          {w !== "all" && <input type="hidden" name="w" value={w} />}
          <input type="search" name="q" defaultValue={q} placeholder="Search events or courses" aria-label="Search events or courses" />
        </form>
        <nav className="ev-chips" aria-label="Filter">
          {FILTERS.map(([key, label]) => (
            <Link key={key} href={href({ q, w: key })} aria-current={w === key ? "true" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="ev-rows">
          {groups.size === 0 ? (
            <p className="today-clear">
              {all.length === 0 ? (
                <>
                  No events yet.{" "}
                  {perms.includes("classes:write") && (
                    <>
                      <Link href="/events/new">Create your first</Link> or <Link href="/import">import from Eventbrite</Link>.
                    </>
                  )}
                </>
              ) : (
                "Nothing matches."
              )}
            </p>
          ) : (
            [...groups.entries()].map(([label, lines]) => (
              <div key={label} className="ev-group">
                <p className="ev-group-label">{label}</p>
                <ul>
                  {lines.map((l) => (
                    <li key={l.eventId}>
                      <Link href={href({ q, w, sel: l.eventId })} className="ev-row" aria-current={l.eventId === selId ? "true" : undefined}>
                        <span className="ev-date">
                          <span>{fmt(l.startsAt, l.timezone, { month: "short" }).toUpperCase()}</span>
                          <strong>{fmt(l.startsAt, l.timezone, { day: "numeric" })}</strong>
                        </span>
                        <span className="ev-main">
                          <span className="ev-name">{l.name}</span>
                          <span className="ev-time">
                            {fmt(l.startsAt, l.timezone, { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}
                            {l.status === "draft" ? " · DRAFT" : l.status === "cancelled" ? " · CANCELLED" : ""}
                          </span>
                        </span>
                        <span className={`ev-seats${l.status === "live" && !ended(l, now) && isLow(l) ? " is-low" : ""}`}>
                          {l.sold}/{l.capacity}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="ev-detail" aria-label="Event detail">
        {explicit && (
          <Link href={href({ q, w })} className="ev-back">
            ← All events
          </Link>
        )}
        {!detailRes ? (
          <div className="ev-empty">
            <p className="today-clear">Select an event to see seats, attendees and emails.</p>
          </div>
        ) : !detailRes.ok ? (
          <ApiNotice failure={detailRes.error} />
        ) : (
          <Detail o={detailRes.data} canWrite={perms.includes("classes:write")} canManage={canManage} instructorOptions={instructorOptions} />
        )}
      </section>
    </div>
  );
}

function Detail({ o, canWrite, canManage, instructorOptions }: { o: EventOverview; canWrite: boolean; canManage: boolean; instructorOptions: { id: string; name: string }[] }) {
  const l = o.line;
  const left = Math.max(0, l.capacity - l.sold);
  const cells = Math.min(l.capacity, 60);
  const days = o.sessions.length;
  return (
    <>
      <header className="ev-head">
        <p className="ev-meta">
          <span className="chip chip-ok">{FORMAT_LABEL[l.format] ?? l.format.toUpperCase()}</span>
          {l.status !== "live" && <span className="chip">{l.status.toUpperCase()}</span>}
          <span className="mono">
            {fmt(l.startsAt, l.timezone, { month: "short", day: "numeric", year: "numeric" })} · {fmt(l.startsAt, l.timezone, { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}
          </span>
        </p>
        <h2>{l.name}</h2>
        {l.status === "draft" && (
          <div className="ev-draft" role="status">
            <span>
              <strong>Draft.</strong> {canManage ? "An instructor created this class; it isn't on sale until you publish it." : "Waiting for an owner or admin to publish it."}
            </span>
            {canManage && (
              <ActionForm action={publishEventAction} submitLabel="Publish" pendingLabel="Publishing…" inline>
                <input type="hidden" name="eventId" value={l.eventId} />
              </ActionForm>
            )}
          </div>
        )}
        <div className="ev-teachers">
          <span className="muted">Taught by</span>
          {o.instructors.length ? o.instructors.map((i) => <span key={i.id} className="chip role-instructor">{i.name}</span>) : <span className="muted">no one yet</span>}
          {canManage && instructorOptions.length > 0 && (
            <details className="person-menu">
              <summary aria-label="Choose instructors">✎</summary>
              <div className="person-menu-body">
                <ActionForm action={setInstructorsAction} submitLabel="Save" pendingLabel="Saving…" inline>
                  <input type="hidden" name="eventId" value={l.eventId} />
                  <div className="teacher-picks">
                    {instructorOptions.map((p) => (
                      <label key={p.id}>
                        <input type="checkbox" name="instructorIds" value={p.id} defaultChecked={o.instructors.some((i) => i.id === p.id)} /> {p.name}
                      </label>
                    ))}
                  </div>
                </ActionForm>
              </div>
            </details>
          )}
        </div>
        <div className="ev-actions">
          <Link className="pill-btn" href={`/events/${encodeURIComponent(l.eventId)}`}>
            {canWrite ? "Edit" : "Open"}
          </Link>
          {o.publicUrl && <CopyButton text={o.publicUrl} />}
          {canWrite && <DuplicateDialog key={l.eventId} eventId={l.eventId} firstDay={fmt(l.startsAt, l.timezone, { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/(\d+)\/(\d+)\/(\d+)/, "$3-$1-$2")} />}
          {canWrite && (
            <Link className="live-cta" href={`/checkin?event=${encodeURIComponent(l.eventId)}`}>
              Check-in
            </Link>
          )}
        </div>
      </header>

      <div className="ev-panes">
        <section className="seat-card" aria-label="Seats">
          <div className="seat-card-top">
            <span>SEATS</span>
            {l.capacity > 0 && <span className="seat-left">{left} left</span>}
          </div>
          {cells > 0 ? (
            <div className="seat-grid" role="img" aria-label={`${l.sold} of ${l.capacity} seats taken`}>
              {Array.from({ length: cells }, (_, i) => (
                <span key={i} className={i < l.sold ? "is-taken" : i === l.sold ? "is-next" : ""} />
              ))}
            </div>
          ) : (
            <p className="seat-none">
              No tickets yet.{" "}
              {canWrite && <Link href={`/events/${encodeURIComponent(l.eventId)}#tickets`}>Add tickets</Link>}
            </p>
          )}
          <p className="seat-count">
            <strong>{l.sold}</strong> of {l.capacity}
          </p>
          {o.money && (
            <div className="seat-money">
              <div>
                <span>HELD</span>
                <strong>{whole(o.money.heldMinor, o.money.currency)}</strong>
              </div>
              <div>
                <span>NET</span>
                <strong className="is-green">{whole(o.money.netMinor, o.money.currency)}</strong>
              </div>
            </div>
          )}
        </section>

        <section className="card ev-attendees" aria-labelledby="att-title">
          <div className="today-card-head">
            <h3 id="att-title">Attendees</h3>
            <span className="mono muted">{o.attendees.length}</span>
          </div>
          {o.attendees.length === 0 ? (
            <p className="today-clear">No confirmed seats yet.</p>
          ) : (
            <ul>
              {o.attendees.map((a) => (
                <li key={a.seatId}>
                  <span className="att-avatar" aria-hidden="true">
                    {initials(a.name, a.email)}
                  </span>
                  <span className="att-name" title={a.email}>
                    {a.name ?? a.email}
                    {a.checkedIn && <span className="att-in"> ✓ in</span>}
                    {a.certificate && (
                      <a className="att-cert" href={`/cert/${encodeURIComponent(a.certificate.code)}`} target="_blank" rel="noreferrer" title={`Certificate of ${a.certificate.kind}`}>
                        {" "}
                        · certificate
                      </a>
                    )}
                  </span>
                  {a.payment && <span className={`chip ${a.payment === "paid" ? "chip-ok" : "chip-warn"}`}>{a.payment === "paid" ? "Paid" : a.payment === "invoice" ? "Invoice" : "Pending"}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="ev-side">
          <section className="card" aria-labelledby="flow-title">
            <h3 id="flow-title">Course flow</h3>
            <ol className="flow">
              <li className={o.course?.prework ? "is-set" : ""}>
                <span>T-14 DAYS</span>
                <strong>Pre-work email</strong>
              </li>
              <li className="is-square">
                <span>{days > 1 ? `DAY 1–${days}` : "DAY 1"}</span>
                <strong>Live session{days > 1 ? "s" : ""}</strong>
              </li>
              <li className={o.course?.survey ? "is-set" : ""}>
                <span>LAST DAY</span>
                <strong>Survey email</strong>
              </li>
              <li className="is-set">
                <span>AFTER DELIVERY</span>
                <strong>Funds released to Stripe</strong>
              </li>
            </ol>
          </section>
          {canWrite && (
            <section className="card" aria-labelledby="certs-title">
              <h3 id="certs-title">Certificates</h3>
              <p className="muted cert-count">
                {o.attendees.filter((a) => a.certificate).length} of {o.attendees.length} issued
              </p>
              {o.attendees.length > 0 && (
                <ActionForm action={issuePaneCertificatesAction} submitLabel="Issue certificates" pendingLabel="Issuing…">
                  <input type="hidden" name="eventId" value={l.eventId} />
                  <div className="cert-opts">
                    <label>
                      <input type="radio" name="kind" value="attendance" defaultChecked /> Attendance
                    </label>
                    <label>
                      <input type="radio" name="kind" value="completion" /> Completion
                    </label>
                    <label>
                      <input type="checkbox" name="onlyCheckedIn" defaultChecked={o.attendees.some((a) => a.checkedIn)} /> Only people checked in
                    </label>
                  </div>
                </ActionForm>
              )}
            </section>
          )}
          <section className="card" aria-labelledby="emails-title">
            <h3 id="emails-title">Emails</h3>
            {o.course ? (
              <dl className="emails">
                <div>
                  <dt>Pre-work</dt>
                  <dd>
                    <Link href={`/courses/${encodeURIComponent(o.course.id)}`} className={`chip ${o.course.prework ? "chip-ok" : "chip-warn"}`}>
                      {o.course.prework ? "Set" : "Not set"}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt>Survey</dt>
                  <dd>
                    <Link href={`/courses/${encodeURIComponent(o.course.id)}`} className={`chip ${o.course.survey ? "chip-ok" : "chip-warn"}`}>
                      {o.course.survey ? "Set" : "Not set"}
                    </Link>
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="today-clear">Link this event to a course to send pre-work and survey emails.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
