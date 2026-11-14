"use client";

// Class page v2 (handover "ClassPage"): the date picker, register card and the facts that follow
// the chosen date and time zone. Relative labels ("Starts next Monday") come from the real
// current date in the visitor's zone; the server renders with its own clock and the class's
// zone, then the browser switches to the visitor's.

import { createContext, useContext, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { COMMON_ZONES, detectedZone, zoneName } from "@/lib/class-time";

export type ClassDate = {
  slug: string;
  eventId: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  format: string;
  days: number;
  /** First session (a day's hours). */
  dayStartsAt: string;
  dayEndsAt: string;
  /** Any session falls on a Saturday or Sunday, in the class's zone. */
  weekend: boolean;
  cap: number;
  left: number;
  priceMinor: number | null;
  currency: string;
  invoice: boolean;
  instructors: string[];
  where: string;
};

type Ctx = {
  dates: ClassDate[];
  sel: ClassDate;
  select: (slug: string) => void;
  zone: string;
  setZone: (z: string) => void;
  detected: string | null;
  now: number;
  basePath: string;
  showSeats: boolean;
  paymentMode: "protected" | "direct";
  orgName: string;
};

const BookingContext = createContext<Ctx | null>(null);
const useBooking = () => {
  const c = useContext(BookingContext);
  if (!c) throw new Error("BookingProvider missing");
  return c;
};

const DAY = 86_400_000;
const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(iso: string | number, tz: string): { y: number; m: number; d: number; dow: number } {
  const f = (o: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat("en-US", { timeZone: tz, ...o }).format(new Date(iso));
    } catch {
      return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...o }).format(new Date(iso));
    }
  };
  return { y: Number(f({ year: "numeric" })), m: Number(f({ month: "numeric" })) - 1, d: Number(f({ day: "numeric" })), dow: DOW_SHORT.indexOf(f({ weekday: "short" })) };
}
/** Calendar day as a UTC timestamp, so day differences ignore clock changes. */
const dayNum = (p: { y: number; m: number; d: number }) => Date.UTC(p.y, p.m, p.d) / DAY;

function time(iso: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso)).replace(":00", "");
  } catch {
    return "";
  }
}
function abbr(iso: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).format(new Date(iso)).split(" ").pop() ?? "";
  } catch {
    return "";
  }
}

const money = (minor: number, currency: string) => {
  if (minor === 0) return "Free";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).format(minor / 100).replace(/[.,]00(?=\D*$)/, "");
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
};

/** Everything the picker shows about one date, in the display zone. */
function describe(c: ClassDate, zone: string, now: number) {
  const a = parts(c.startsAt, zone);
  const b = parts(c.endsAt, zone);
  const t = parts(now, zone);
  const diff = dayNum(a) - dayNum(t);
  const range = a.m === b.m && a.y === b.y ? (a.d === b.d ? `${MON[a.m]} ${a.d}` : `${MON[a.m]} ${a.d}–${b.d}`) : `${MON[a.m]} ${a.d} – ${MON[b.m]} ${b.d}`;
  const yearNote = a.y !== t.y ? `, ${a.y}` : "";
  // Weeks start on Monday; "in N weeks" counts calendar weeks, as the week headings do.
  const monday = (p: { y: number; m: number; d: number; dow: number }) => dayNum(p) - ((p.dow + 6) % 7);
  const wk = Math.round((monday(a) - monday(t)) / 7);
  let rel: string;
  let relShort: string;
  if (diff <= 0) [rel, relShort] = diff === 0 ? ["Starts today", "Today"] : ["In progress", "Running now"];
  else if (diff === 1) [rel, relShort] = ["Starts tomorrow", "Tomorrow"];
  else if (diff < 14) [rel, relShort] = [`Starts ${diff >= 7 && wk === 1 ? "next " : ""}${DOW[a.dow]}, in ${diff} days`, `In ${diff} days`];
  else [rel, relShort] = [`Starts in ${wk} weeks`, `In ${wk} wks`];
  const weekStart = new Date((monday(a)) * DAY);
  const holiday = (a.m === 11 && a.d >= 20) || (a.m === 0 && a.d <= 3);
  return {
    diff, rel, relShort, wk, holiday,
    range: `${range}${yearNote}`,
    monthKey: `${a.y}-${String(a.m + 1).padStart(2, "0")}`,
    monthLabel: a.y !== t.y ? `${MON[a.m]} ${a.y}` : MON[a.m]!,
    dowShort: `${DOW_SHORT[a.dow]} → ${DOW_SHORT[b.dow]}`,
    dowLong: c.days > 1 ? `${DOW[a.dow]} to ${DOW[b.dow]}` : DOW[a.dow]!,
    mono: `${MON[a.m]} ${a.d} – ${MON[b.m]} ${b.d}, ${b.y}`.toUpperCase(),
    weekLabel: wk === 0 ? "This week" : wk === 1 ? "Next week" : `In ${wk} weeks`,
    weekSub: `Week of ${MON[weekStart.getUTCMonth()]} ${weekStart.getUTCDate()}`,
    hours: `${time(c.dayStartsAt, zone)}–${time(c.dayEndsAt, zone)}`,
    zoneAbbr: abbr(c.dayStartsAt, zone),
  };
}

export function BookingProvider(p: { dates: ClassDate[]; initial: string; basePath: string; nowIso: string; showSeats: boolean; paymentMode: "protected" | "direct"; orgName: string; children: ReactNode }) {
  const [selSlug, setSelSlug] = useState(p.initial);
  const [zone, setZone] = useState(p.dates.find((d) => d.slug === p.initial)?.timezone ?? p.dates[0]?.timezone ?? "UTC");
  const [detected, setDetected] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.parse(p.nowIso));
  useEffect(() => {
    const d = detectedZone();
    if (d) {
      setDetected(d);
      setZone(d);
    }
    setNow(Date.now());
  }, []);
  const sel = p.dates.find((d) => d.slug === selSlug) ?? p.dates[0]!;
  const value = useMemo<Ctx>(
    () => ({
      dates: p.dates,
      sel,
      select: (slug: string) => {
        setSelSlug(slug);
        // The address follows the chosen date, so it can be shared and reloads land on it.
        window.history.replaceState(null, "", `${p.basePath}/${encodeURIComponent(slug)}${window.location.search}`);
      },
      zone, setZone, detected, now,
      basePath: p.basePath, showSeats: p.showSeats, paymentMode: p.paymentMode, orgName: p.orgName,
    }),
    [p.dates, sel, zone, detected, now, p.basePath, p.showSeats, p.paymentMode, p.orgName],
  );
  return <BookingContext.Provider value={value}>{p.children}</BookingContext.Provider>;
}

const checkoutHref = (b: Ctx, c: ClassDate, tier = "me", qty = 1) => `${b.basePath}/register?date=${encodeURIComponent(c.slug)}&tier=${tier}&qty=${qty}`;
const waitlistHref = (b: Ctx, c: ClassDate) => `${b.basePath}/${encodeURIComponent(c.slug)}?waitlist=1`;

/** Header: the chosen date and how soon it starts. */
export function SelectedLabel() {
  const b = useBooking();
  const d = describe(b.sel, b.zone, b.now);
  return (
    <span className="cp-head-sel">
      {d.range} · {d.rel}
    </span>
  );
}

export function RegisterLink({ className, children }: { className: string; children?: ReactNode }) {
  const b = useBooking();
  const full = b.sel.cap > 0 && b.sel.left === 0;
  return (
    <a className={className} href={full ? waitlistHref(b, b.sel) : checkoutHref(b, b.sel)}>
      {children ?? (full ? "Join the waitlist" : `Register for ${describe(b.sel, b.zone, b.now).range}`)}
    </a>
  );
}

/** Four tiles under the title: next class, your time, format, how often. */
export function HeroFacts({ language }: { language: string | null }) {
  const b = useBooking();
  const open = b.dates.filter((c) => describe(c, b.zone, b.now).diff >= 0);
  const next = open[0] ?? b.sel;
  const dn = describe(next, b.zone, b.now);
  const ds = describe(b.sel, b.zone, b.now);
  const online = b.sel.format !== "in_person";
  const gaps = open.slice(1).map((c, i) => (Date.parse(c.startsAt) - Date.parse(open[i]!.startsAt)) / DAY);
  const avg = gaps.length ? gaps.reduce((s, x) => s + x, 0) / gaps.length : 0;
  return (
    <div className="cp-facts">
      <div>
        <span className="cp-mono">NEXT CLASS</span>
        <strong>{dn.relShort}</strong>
        <small>{dn.range}</small>
      </div>
      <div>
        <span className="cp-mono">YOUR TIME</span>
        <strong>{b.sel.format === "self_paced" ? "Any time" : `${ds.hours} ${ds.zoneAbbr}`}</strong>
        <small>
          {b.sel.days} {b.sel.days === 1 ? "day" : "days"} · {zoneName(b.zone)}
        </small>
      </div>
      <div>
        <span className="cp-mono">FORMAT</span>
        <strong>{b.sel.format === "self_paced" ? "Self-paced" : b.sel.format === "in_person" ? `In person · ${b.sel.where}` : b.sel.format === "hybrid" ? "Hybrid" : "Live online"}</strong>
        <small>
          {b.sel.format === "self_paced" ? "On demand" : "Instructor-led"}
          {language ? ` · ${language}` : online ? "" : ""}
        </small>
      </div>
      <div>
        <span className="cp-mono">HOW OFTEN</span>
        <strong>
          {open.length} {open.length === 1 ? "class" : "classes"}
        </strong>
        <small>{open.length >= 3 && avg > 0 ? `New one about every ${avg < 4 ? "3–4" : Math.round(avg)} days` : open.length > 1 ? `Next after that: ${describe(open[1]!, b.zone, b.now).range}` : "More dates as they're added"}</small>
      </div>
    </div>
  );
}

/** The sticky navy card: chosen date, seats, who is attending, total and Register. */
export function RegisterPanel() {
  const b = useBooking();
  const c = b.sel;
  const d = describe(c, b.zone, b.now);
  const [tier, setTier] = useState<"me" | "team" | "invoice">("me");
  const [qty, setQty] = useState(2);
  const full = c.cap > 0 && c.left === 0;
  const canInvoice = c.invoice && (c.priceMinor ?? 0) > 0;
  const t = tier === "invoice" && !canInvoice ? "me" : tier;
  const maxQty = Math.max(1, Math.min(c.cap > 0 ? c.left : 20, t === "invoice" ? 20 : 10));
  const n = t === "me" ? 1 : Math.min(Math.max(qty, t === "team" ? 2 : 1), maxQty);
  const cells = Math.min(Math.max(c.cap, 1), 52);
  const taken = c.cap > 0 ? Math.round(((c.cap - c.left) / c.cap) * cells) : 0;
  const tiers = [
    { id: "me" as const, name: "Just me", note: "Pay by card in about 2 minutes" },
    { id: "team" as const, name: "My team", note: "One checkout, one receipt" },
    ...(canInvoice ? [{ id: "invoice" as const, name: "Invoice my company", note: "Seat held now, pay by PO" }] : []),
  ];
  const cta = full ? "Join the waitlist" : t === "invoice" ? `Hold ${n} seat${n > 1 ? "s" : ""} on invoice` : n > 1 ? `Register ${n} seats` : `Register — ${d.range}`;
  return (
    <div className="cp-card">
      <span className="cp-mono cp-card-eyebrow">YOUR CLASS · {d.mono}</span>
      <div>
        <div className="cp-card-dow">{d.dowLong}</div>
        <div className="cp-card-sub">
          {d.rel}
          {c.format !== "self_paced" ? ` · ${d.hours} ${d.zoneAbbr}` : ""}
        </div>
      </div>
      {b.showSeats && c.cap > 0 && (
        <div className="cp-seats" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${Math.min(13, cells)}, minmax(0, 1fr))` }}>
          {Array.from({ length: cells }, (_, i) => (
            <span key={i} className={i < taken ? "is-taken" : undefined} />
          ))}
        </div>
      )}
      <div className="cp-card-row">
        <span>{full ? "Sold out" : b.showSeats && c.cap > 0 ? `${c.left} of ${c.cap} seats open` : "Seats available"}</span>
        {b.dates.length > 1 && <a href="#dates">Change date</a>}
      </div>
      {!full && (
        <div role="radiogroup" aria-label="Who is attending" className="cp-tiers">
          {tiers.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={t === x.id} onClick={() => setTier(x.id)}>
              <span className="cp-dot" aria-hidden="true" />
              <span>
                <strong>{x.name}</strong>
                <small>{x.note}</small>
              </span>
            </button>
          ))}
        </div>
      )}
      {!full && t !== "me" && (
        <div className="cp-qty">
          <strong>Seats</strong>
          <span>
            <button type="button" aria-label="Remove a seat" onClick={() => setQty(Math.max(n - 1, t === "team" ? 2 : 1))} disabled={n <= (t === "team" ? 2 : 1)}>
              −
            </button>
            <output aria-live="polite">{n}</output>
            <button type="button" aria-label="Add a seat" onClick={() => setQty(Math.min(n + 1, maxQty))} disabled={n >= maxQty}>
              +
            </button>
          </span>
        </div>
      )}
      {c.priceMinor !== null && !full && (
        <div className="cp-total">
          <span>Total</span>
          <strong>
            {money(c.priceMinor * n, c.currency)} {c.priceMinor > 0 && <small>{c.currency}</small>}
          </strong>
        </div>
      )}
      <a className="cp-btn cp-btn-green cp-btn-block" href={full ? waitlistHref(b, c) : checkoutHref(b, c, t, n)}>
        {cta}
      </a>
      <div className="cp-card-foot cp-mono">
        {b.paymentMode === "protected" ? (
          <>
            <span>Held until delivery</span>
            <span className="cp-green">protected</span>
          </>
        ) : (
          <span>Secure card payment to {b.orgName}</span>
        )}
      </div>
      {c.priceMinor !== null && c.priceMinor > 0 && !full && <p className="cp-card-note">Taxes and any booking fee are shown before you pay.</p>}
    </div>
  );
}

const PICK_ZONES = ["America/Los_Angeles", "America/New_York", "Europe/London", "Europe/Paris"];

/** "Pick the week that works": soonest three, month tabs, weekday/weekend filter, list by week. */
export function DatePicker({ heading }: { heading: string }) {
  const b = useBooking();
  const rows = useMemo(() => b.dates.map((c) => ({ c, d: describe(c, b.zone, b.now) })).filter((r) => r.d.diff >= 0 || r.c.slug === b.sel.slug), [b.dates, b.zone, b.now, b.sel.slug]);
  const [pattern, setPattern] = useState<"any" | "wk" | "we">("any");
  const selRow = rows.find((r) => r.c.slug === b.sel.slug);
  const [month, setMonth] = useState<string | null>(null);
  const patOk = (c: ClassDate) => pattern === "any" || (pattern === "wk" ? !c.weekend : c.weekend);
  const months = [...new Map(rows.map((r) => [r.d.monthKey, r.d.monthLabel])).entries()];
  const activeMonth = month ?? selRow?.d.monthKey ?? months[0]?.[0] ?? "";
  const list = rows.filter((r) => r.d.monthKey === activeMonth && patOk(r.c));
  const groups: { wk: number; label: string; sub: string; items: typeof list }[] = [];
  for (const r of list) {
    let g = groups.find((x) => x.wk === r.d.wk);
    if (!g) groups.push((g = { wk: r.d.wk, label: r.d.weekLabel, sub: r.d.weekSub, items: [] }));
    g.items.push(r);
  }
  const zones = [...new Set([...(b.detected && !PICK_ZONES.includes(b.detected) ? [b.detected] : []), ...PICK_ZONES, ...(!PICK_ZONES.includes(b.zone) && b.zone !== b.detected ? [b.zone] : [])])];
  const days = b.dates[0]?.days ?? 1;
  const anyWeekend = rows.some((r) => r.c.weekend);
  const anyWeekday = rows.some((r) => !r.c.weekend);
  const pick = (c: ClassDate) => (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    b.select(c.slug);
  };
  const seatsText = (c: ClassDate) => (c.cap > 0 && c.left === 0 ? "Full · waitlist" : b.showSeats && c.cap > 0 ? `${c.left} seats open` : "Seats open");
  const href = (c: ClassDate) => `${b.basePath}/${encodeURIComponent(c.slug)}`;
  const zoneLabel = (z: string) => (z === b.detected && !PICK_ZONES.includes(z) ? `${zoneName(z)} (you)` : COMMON_ZONES.find((x) => x.id === z)?.label.replace("Central Europe", "CET") ?? zoneName(z));

  if (!rows.length) return null;
  return (
    <section id="dates" className="cp-dates" aria-labelledby="dates-title">
      <div className="cp-dates-head">
        <div>
          <span className="cp-mono cp-eyebrow">
            {rows.length} UPCOMING {rows.length === 1 ? "CLASS" : "CLASSES"}
            {days > 1 ? ` · ${days} DAYS EACH` : ""}
          </span>
          <h2 id="dates-title">{heading}</h2>
          <p>All times shown in {zoneName(b.zone)} time.</p>
        </div>
        <div className="cp-seg" role="group" aria-label="Time zone">
          {zones.map((z) => (
            <button key={z} type="button" aria-pressed={b.zone === z} onClick={() => b.setZone(z)}>
              {zoneLabel(z)}
            </button>
          ))}
        </div>
      </div>

      <div className="cp-soonest">
        {rows
          .filter((r) => r.d.diff >= 0)
          .slice(0, 3)
          .map(({ c, d }) => (
            <a key={c.slug} href={href(c)} onClick={pick(c)} aria-current={c.slug === b.sel.slug ? "true" : undefined} className="cp-soon">
              <span className="cp-mono">{d.rel.toUpperCase()}</span>
              <strong>{d.range}</strong>
              <small>
                {d.dowShort} · {seatsText(c)}
              </small>
            </a>
          ))}
      </div>

      {rows.length > 3 && (
        <>
          <div className="cp-dates-bar">
            <div role="tablist" aria-label="Month" className="cp-months">
              {months.map(([key, label]) => (
                <button key={key} type="button" role="tab" aria-selected={activeMonth === key} onClick={() => setMonth(key)}>
                  {label} <span className="cp-mono">{rows.filter((r) => r.d.monthKey === key && patOk(r.c)).length}</span>
                </button>
              ))}
            </div>
            {anyWeekend && anyWeekday && days > 1 && (
              <div role="group" aria-label="Schedule pattern" className="cp-patterns">
                {(
                  [
                    ["any", "Any start day"],
                    ["wk", "Weekdays only"],
                    ["we", "Includes a weekend"],
                  ] as const
                ).map(([id, label]) => (
                  <button key={id} type="button" aria-pressed={pattern === id} onClick={() => setPattern(id)}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="cp-weeks">
            {groups.map((g) => (
              <div key={g.wk} className="cp-week">
                <div className="cp-week-label">
                  <strong>{g.label}</strong>
                  <span className="cp-mono">{g.sub}</span>
                </div>
                <div className="cp-week-items">
                  {g.items.map(({ c, d }) => (
                    <a key={c.slug} href={href(c)} onClick={pick(c)} aria-current={c.slug === b.sel.slug ? "true" : undefined} className={`cp-row${c.cap > 0 && c.left === 0 ? " is-full" : ""}`}>
                      <span className="cp-radio" aria-hidden="true" />
                      <span className="cp-row-main">
                        <strong>{d.range}</strong>
                        <small>
                          {d.dowShort}
                          {c.format !== "self_paced" ? ` · ${d.hours} ${d.zoneAbbr}` : ""} · {c.format === "in_person" ? c.where : c.format === "hybrid" ? `${c.where} + online` : "Online"}
                        </small>
                      </span>
                      <span className="cp-tags">
                        {d.diff < 7 && <span className="cp-tag cp-tag-soon">Soonest</span>}
                        {d.holiday && <span className="cp-tag cp-tag-hol">Holiday week</span>}
                        {c.weekend && <span className="cp-tag">Weekend</span>}
                        {c.cap > 0 && c.left === 0 ? <span className="cp-tag cp-tag-hol">Full</span> : b.showSeats && c.cap > 0 && c.left <= 5 ? <span className="cp-tag cp-tag-hol">{c.left} left</span> : null}
                      </span>
                      <span className="cp-mono cp-row-rel">{d.relShort}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
            {groups.length === 0 && <div className="cp-empty">No classes match in this month. Try another month or start day.</div>}
          </div>
        </>
      )}
    </section>
  );
}

/** Phone: price and Register pinned to the bottom. */
export function MobileBar() {
  const b = useBooking();
  const c = b.sel;
  const full = c.cap > 0 && c.left === 0;
  return (
    <div className="cp-mbar">
      <div>
        <strong>{c.priceMinor === null ? "—" : money(c.priceMinor, c.currency)}</strong>
        <span>{describe(c, b.zone, b.now).range}</span>
      </div>
      <a className="cp-btn cp-btn-green" href={full ? waitlistHref(b, c) : checkoutHref(b, c)}>
        {full ? "Join waitlist" : "Register"}
      </a>
    </div>
  );
}
