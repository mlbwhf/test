// Schedule widget for an organizer's own website: every upcoming date of a course as a list or
// month calendar, with quick filters, times in the visitor's time zone, a seat stepper and
// registration that opens right under the chosen date. Modelled on the schedule built for
// agile-agilist.com, fed by live EnrollClass data.

import { createApi, type Cohort, type CoursePayload, type TicketType } from "./api.js";
import { currencyForLocale, currencyUnion, formatLabel, formatMoney, pickCurrency, rememberedCurrency } from "./format.js";
import { injectScheduleStyles } from "./schedule-styles.js";
import { mount, type Widget } from "./widget.js";

export interface ScheduleOptions {
  api: string;
  org: string;
  course: string;
  currency?: string;
  stripePk?: string;
  /** Cloudflare Turnstile site key for the inline checkout (see WidgetOptions). */
  turnstileSiteKey?: string;
  /** Heading above the list (default "Schedules"). */
  title?: string;
  /** Brand colours: buttons and dark accents, and the highlight colour. */
  ink?: string;
  accent?: string;
  /** Show the "Fast filling" side card (default on). */
  sidebar?: boolean;
  /** Where the per-date pages live (default: the app host next to the API host). */
  pageBase?: string;
}

type Quick = "all" | "this-month" | "next-month" | "weekend" | "weekday";
type Attrs = Record<string, string | number | boolean | EventListener | undefined>;
type Child = Node | string | null | undefined | false;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (k === "class") node.className = String(v);
    else if (v === true) node.setAttribute(k, "");
    else node.setAttribute(k, String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) node.append(typeof c === "string" ? document.createTextNode(c) : c);
  return node;
}

const MAX_SEATS = 10;
const FILLING_FAST = 5;
const DATE_PARAM = "gate_date";

/** "YYYY-MM-DD" of an instant in a time zone. */
export function localYmd(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function fmt(iso: string, timeZone: string | undefined, o: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat("en-US", { ...(timeZone ? { timeZone } : {}), ...o }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("en-US", o).format(new Date(iso));
  }
}

/** "Nov 20, 2026" or "Nov 20 – 21, 2026" in the class's own time zone. */
export function dateRange(c: Cohort): string {
  const e = c.event;
  const end = e.endsAt ?? e.startsAt;
  const a = fmt(e.startsAt, e.timezone, { month: "short", day: "numeric", year: "numeric" });
  if (localYmd(e.startsAt, e.timezone) === localYmd(end, e.timezone)) return a;
  const [m1, y1] = [fmt(e.startsAt, e.timezone, { month: "short" }), fmt(e.startsAt, e.timezone, { year: "numeric" })];
  const [m2, d2, y2] = [fmt(end, e.timezone, { month: "short" }), fmt(end, e.timezone, { day: "numeric" }), fmt(end, e.timezone, { year: "numeric" })];
  const d1 = fmt(e.startsAt, e.timezone, { day: "numeric" });
  if (y1 !== y2) return `${a} – ${fmt(end, e.timezone, { month: "short", day: "numeric", year: "numeric" })}`;
  return m1 === m2 ? `${m1} ${d1} – ${d2}, ${y2}` : `${m1} ${d1} – ${m2} ${d2}, ${y2}`;
}

/** "ET 09:00 AM - 05:00 PM" for the first day, in `timeZone` (undefined = the visitor's). */
export function timeLine(c: Cohort, timeZone?: string): string {
  const first = c.event.sessions[0] ?? { startsAt: c.event.startsAt, endsAt: c.event.endsAt ?? c.event.startsAt };
  const o: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  const zone = fmt(first.startsAt, timeZone, { timeZoneName: "short" }).split(" ").pop() ?? "";
  return `${zone} ${fmt(first.startsAt, timeZone, o)} - ${fmt(first.endsAt, timeZone, o)}`;
}

function partOfDay(c: Cohort): string {
  const hour = Number(fmt(c.event.startsAt, c.event.timezone, { hour: "numeric", hour12: false }));
  return hour < 12 ? "☀ Morning" : hour < 17 ? "◐ Afternoon" : "☾ Evening";
}

const dayCount = (c: Cohort) => Math.max(1, new Set(c.event.sessions.map((s) => localYmd(s.startsAt, c.event.timezone))).size);
const isWeekend = (c: Cohort) => {
  const d = new Date(`${localYmd(c.event.startsAt, c.event.timezone)}T00:00:00Z`).getUTCDay();
  return d === 0 || d === 6;
};
const seatsLeft = (c: Cohort) => c.ticketTypes.reduce((a, t) => a + Math.max(0, t.remaining), 0);

function cheapest(c: Cohort, currency: string): { tt: TicketType; minor: number } | null {
  const priced = c.ticketTypes.filter((t) => t.prices[currency] !== undefined);
  const pool = priced.filter((t) => t.remaining > 0).length ? priced.filter((t) => t.remaining > 0) : priced;
  const tt = pool.sort((a, b) => a.prices[currency]! - b.prices[currency]!)[0];
  return tt ? { tt, minor: tt.prices[currency]! } : null;
}

let seq = 0;

export class ScheduleWidget {
  readonly ready: Promise<void>;
  private readonly root: HTMLElement;
  private readonly id = `gs${++seq}`;
  private data: CoursePayload | null = null;
  private cohorts: Cohort[] = [];
  private currency = "";
  private quick: Quick = "all";
  private month = "all";
  private view: "list" | "cal" = "list";
  private calYear = 0;
  private calMonth = 0;
  private selected: string | null = null;
  private readonly qty = new Map<string, number>();
  private checkout: Widget | null = null;

  constructor(private readonly host: HTMLElement, private readonly opts: ScheduleOptions) {
    injectScheduleStyles(host.ownerDocument);
    this.root = el("div", { class: "gs-root" });
    if (opts.ink) this.root.style.setProperty("--gs-ink", opts.ink);
    if (opts.accent) this.root.style.setProperty("--gs-accent", opts.accent);
    this.root.append(el("p", { class: "gs-muted" }, "Loading schedule…"));
    host.replaceChildren(this.root);
    this.ready = this.load();
  }

  private get pageBase(): string {
    return (this.opts.pageBase ?? this.opts.api.replace("://api.", "://app.")).replace(/\/$/, "");
  }

  private async load(): Promise<void> {
    try {
      const data = await createApi(this.opts.api, this.opts.org).getCourse(this.opts.course);
      this.data = data;
      this.cohorts = [...data.cohorts].sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
      const locale = typeof navigator === "undefined" ? undefined : navigator.language;
      this.currency = pickCurrency(currencyUnion(this.cohorts), this.opts.currency, rememberedCurrency(), currencyForLocale(locale), data.organization.currency) ?? data.organization.currency;
      const first = this.cohorts[0];
      const start = first ? localYmd(first.event.startsAt, first.event.timezone) : new Date().toISOString().slice(0, 10);
      this.calYear = Number(start.slice(0, 4));
      this.calMonth = Number(start.slice(5, 7)) - 1;
      this.render();
      const want = new URLSearchParams(window.location.search).get(DATE_PARAM);
      const hit = want ? this.cohorts.find((c) => c.dateSlug === want || c.event.id === want) : undefined;
      if (hit) this.enroll(hit.event.id);
    } catch (err) {
      this.root.replaceChildren(
        el("p", { class: "gs-error", role: "alert" }, err instanceof Error && err.message ? err.message : "The schedule could not be loaded."),
        el("button", { type: "button", class: "gs-pill", onclick: () => { void this.load(); } }, "Try again"),
      );
    }
  }

  private visible(): Cohort[] {
    const now = new Date();
    const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const thisM = ym(now);
    const nextM = ym(new Date(now.getFullYear(), now.getMonth() + 1, 1));
    return this.cohorts.filter((c) => {
      const m = localYmd(c.event.startsAt, c.event.timezone).slice(0, 7);
      if (this.quick === "this-month" && m !== thisM) return false;
      if (this.quick === "next-month" && m !== nextM) return false;
      if (this.quick === "weekend" && !isWeekend(c)) return false;
      if (this.quick === "weekday" && isWeekend(c)) return false;
      return this.month === "all" || m === this.month;
    });
  }

  private render(): void {
    const data = this.data;
    if (!data) return;
    const list = this.visible();
    const main = el("div", { class: "gs-main" });
    const toggle = el("span", { class: "gs-toggle", role: "group", "aria-label": "View" },
      el("button", { type: "button", "aria-pressed": this.view === "list" ? "true" : "false", onclick: () => { this.view = "list"; this.render(); } }, "▤ List"),
      el("button", { type: "button", "aria-pressed": this.view === "cal" ? "true" : "false", onclick: () => { this.view = "cal"; this.render(); } }, "▦ Calendar"));
    main.append(el("div", { class: "gs-head" },
      el("h2", {}, this.opts.title ?? "Schedules"),
      el("span", { class: "gs-count", "aria-live": "polite" }, `${list.length} Result${list.length === 1 ? "" : "s"}`),
      toggle));

    if (this.view === "list") {
      const filters = el("div", { class: "gs-filters" });
      const quick: [Quick, string][] = [["this-month", "This Month"], ["next-month", "Next Month"], ["weekend", "Weekend"], ["weekday", "Weekday"]];
      for (const [k, label] of quick) {
        filters.append(el("button", { type: "button", class: "gs-pill", "aria-pressed": this.quick === k ? "true" : "false", onclick: () => { this.quick = this.quick === k ? "all" : k; this.render(); } }, label));
      }
      const formats = [...new Set(this.cohorts.map((c) => c.event.format))];
      if (formats.length === 1 && formats[0]) filters.append(el("span", { class: "gs-pill gs-pill-static" }, `● ${formatLabel(formats[0])}`));
      const months = [...new Set(this.cohorts.map((c) => localYmd(c.event.startsAt, c.event.timezone).slice(0, 7)))].sort();
      const select = el("select", { class: "gs-select", "aria-label": "Month" }, el("option", { value: "all" }, "▦ Month"));
      for (const m of months) {
        const o = el("option", { value: m }, new Date(`${m}-01T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }));
        o.selected = m === this.month;
        select.append(o);
      }
      select.addEventListener("change", () => { this.month = select.value; this.render(); });
      filters.append(select, el("button", { type: "button", class: "gs-pill gs-pill-reset", onclick: () => { this.quick = "all"; this.month = "all"; this.render(); } }, "Reset"));
      main.append(filters);
      const cards = el("div", { class: "gs-cards" });
      if (list.length === 0) {
        cards.append(el("p", { class: "gs-muted gs-empty" }, this.cohorts.length ? "No dates match. Try another filter." : "New dates are being scheduled. Check back soon."));
      }
      for (const c of list) cards.append(this.card(c));
      main.append(cards);
    } else {
      main.append(this.calendar());
    }

    const wrap = el("div", { class: `gs-wrap${this.opts.sidebar === false ? " gs-no-side" : ""}` }, main);
    const side = this.opts.sidebar === false ? null : this.sidebar();
    if (side) wrap.append(side);
    this.root.replaceChildren(wrap);
    if (this.selected) this.placeCheckout();
  }

  private card(c: Cohort): HTMLElement {
    const id = c.event.id;
    const left = seatsLeft(c);
    const price = cheapest(c, this.currency);
    const visitorTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const sameZone = visitorTz === c.event.timezone;
    const max = Math.max(1, Math.min(MAX_SEATS, left));
    const qtyEl = el("span", { class: "gs-qval", "aria-live": "polite" }, String(Math.min(this.qty.get(id) ?? 1, max)));
    const step = (d: number) => (e: Event) => {
      e.stopPropagation();
      const n = Math.min(max, Math.max(1, (this.qty.get(id) ?? 1) + d));
      this.qty.set(id, n);
      qtyEl.textContent = String(n);
    };
    const enrollLabel = left === 0 ? "Join Waitlist" : "Enroll Now";
    const info = el("div", { class: "gs-info" },
      el("span", { class: "gs-badge" }, partOfDay(c)),
      el("div", { class: "gs-date" }, dateRange(c)),
      el("div", { class: "gs-time" }, el("span", { class: "gs-ic", "aria-hidden": "true" }, "◷"), sameZone ? timeLine(c, c.event.timezone) : `${timeLine(c)} · your time`),
      sameZone ? null : el("div", { class: "gs-time gs-time2" }, timeLine(c, c.event.timezone)),
      el("div", { class: "gs-meta" }, el("span", { class: "gs-ic", "aria-hidden": "true" }, "◍"), `${formatLabel(c.event.format)} · ${isWeekend(c) ? "Weekend" : "Weekday"} Batch · ${dayCount(c)} day${dayCount(c) === 1 ? "" : "s"}`),
      c.dateSlug ? el("a", { class: "gs-details", href: `${this.pageBase}/c/${encodeURIComponent(this.opts.org)}/${encodeURIComponent(this.opts.course)}/${c.dateSlug}`, target: "_blank", rel: "noopener", onclick: (e: Event) => e.stopPropagation() }, "Date details ↗") : null);
    const qty = el("div", { class: "gs-qty" },
      left === 0 ? el("span", { class: "gs-soldout" }, "Sold out") : el("div", { class: "gs-stepper" },
        el("button", { type: "button", "aria-label": "Fewer seats", onclick: step(-1) }, "−"), qtyEl,
        el("button", { type: "button", "aria-label": "More seats", onclick: step(1) }, "+")));
    const earlyBird = price?.tt.earlyBirdUntil ? el("div", { class: "gs-sale" }, `Early bird until ${fmt(price.tt.earlyBirdUntil, c.event.timezone, { month: "short", day: "numeric" })}`) : null;
    const buy = el("div", { class: "gs-buy" },
      earlyBird,
      price ? el("div", { class: "gs-price" }, price.minor === 0 ? "Free" : formatMoney(price.minor, this.currency)) : null,
      el("div", { class: "gs-price-sub" }, price && price.minor > 0 ? `per seat · ${this.currency}` : left > 0 ? `${left} seats left` : "waitlist open"),
      el("div", { class: "gs-buy-row" },
        left > 0 && left <= FILLING_FAST ? el("span", { class: "gs-filling" }, "⏳ Filling Fast") : null,
        el("button", { type: "button", class: "gs-enroll", onclick: (e: Event) => { e.stopPropagation(); this.enroll(id); } }, enrollLabel)));
    return el("div", { class: `gs-card${this.selected === id ? " is-active" : ""}`, "data-event": id, onclick: () => this.enroll(id) }, info, qty, buy);
  }

  private sidebar(): HTMLElement | null {
    const soonest = this.cohorts.find((c) => seatsLeft(c) > 0);
    if (!soonest) return null;
    const price = cheapest(soonest, this.currency);
    return el("aside", { class: "gs-side" },
      el("div", { class: "gs-side-card" },
        el("div", { class: "gs-side-title" }, seatsLeft(soonest) <= FILLING_FAST ? "Fast Filling Schedule" : "Next Available Date"),
        el("div", { class: "gs-side-inner" },
          el("span", { class: "gs-badge" }, partOfDay(soonest)),
          el("div", { class: "gs-date" }, dateRange(soonest)),
          el("div", { class: "gs-time" }, el("span", { class: "gs-ic", "aria-hidden": "true" }, "◷"), timeLine(soonest, soonest.event.timezone)),
          el("div", { class: "gs-meta" }, `${formatLabel(soonest.event.format)} · ${seatsLeft(soonest)} seats left`),
          el("div", { class: "gs-side-sep" }),
          el("div", { class: "gs-price" }, price ? (price.minor === 0 ? "Free" : formatMoney(price.minor, this.currency)) : "—"),
          el("button", { type: "button", class: "gs-enroll gs-enroll-block", onclick: () => { this.view = "list"; this.quick = "all"; this.month = "all"; this.enroll(soonest.event.id); } }, "Enroll Now"),
          el("button", { type: "button", class: "gs-side-all", onclick: () => { this.view = "list"; this.quick = "all"; this.month = "all"; this.render(); this.root.scrollIntoView?.({ behavior: "smooth" }); } }, "View all Schedules ›"))));
  }

  private calendar(): HTMLElement {
    const byDay = new Map<string, Cohort[]>();
    for (const c of this.cohorts) {
      const d = localYmd(c.event.startsAt, c.event.timezone);
      byDay.set(d, [...(byDay.get(d) ?? []), c]);
    }
    const title = new Date(Date.UTC(this.calYear, this.calMonth, 1)).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    const move = (d: number) => () => {
      const m = this.calMonth + d;
      this.calYear += Math.floor(m / 12);
      this.calMonth = ((m % 12) + 12) % 12;
      this.render();
    };
    const grid = el("div", { class: "gs-cal-grid", role: "grid" });
    const first = new Date(Date.UTC(this.calYear, this.calMonth, 1)).getUTCDay();
    const days = new Date(Date.UTC(this.calYear, this.calMonth + 1, 0)).getUTCDate();
    for (let i = 0; i < first; i++) grid.append(el("div", { class: "gs-cal-pad" }));
    for (let d = 1; d <= days; d++) {
      const ymd = `${this.calYear}-${String(this.calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const hit = byDay.get(ymd);
      if (hit) {
        const c = hit[0]!;
        grid.append(el("button", { type: "button", class: `gs-cal-cell gs-has${seatsLeft(c) === 0 ? " gs-full" : ""}`, "aria-label": `${dateRange(c)}, register`, onclick: () => { this.view = "list"; this.quick = "all"; this.month = "all"; this.enroll(c.event.id); } },
          el("span", { class: "gs-cal-day" }, String(d)), el("span", { class: "gs-cal-tag" }, seatsLeft(c) === 0 ? "Full" : "Class")));
      } else {
        grid.append(el("div", { class: "gs-cal-cell" }, el("span", { class: "gs-cal-day" }, String(d))));
      }
    }
    return el("div", { class: "gs-cal" },
      el("div", { class: "gs-cal-head" },
        el("button", { type: "button", "aria-label": "Previous month", onclick: move(-1) }, "‹"),
        el("span", {}, title),
        el("button", { type: "button", "aria-label": "Next month", onclick: move(1) }, "›")),
      el("div", { class: "gs-cal-dow" }, ...["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => el("span", {}, d))),
      grid,
      el("p", { class: "gs-cal-hint" }, "Highlighted days have a class. Pick one to register."));
  }

  /** Opens registration for a date right under its card, with the chosen number of seats. */
  enroll(eventId: string): void {
    const open = this.root.querySelector<HTMLElement>(".gs-enroll-holder");
    if (this.selected === eventId && open) {
      open.scrollIntoView?.({ behavior: "smooth", block: "center" });
      return;
    }
    this.selected = eventId;
    if (this.view !== "list" || !this.visible().some((c) => c.event.id === eventId)) {
      this.view = "list";
      this.quick = "all";
      this.month = "all";
    }
    this.render();
    const holder = this.root.querySelector<HTMLElement>(".gs-enroll-holder");
    holder?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }

  private placeCheckout(): void {
    const id = this.selected;
    const card = id ? this.root.querySelector<HTMLElement>(`.gs-card[data-event="${CSS.escape(id)}"]`) : null;
    if (!id || !card) return;
    const close = el("button", { type: "button", class: "gs-close", "aria-label": "Close registration", onclick: () => { this.selected = null; this.render(); } }, "✕");
    const target = el("div", { class: "gs-checkout" });
    const holder = el("div", { class: "gs-enroll-holder", role: "region", "aria-label": "Registration" }, close, target);
    card.insertAdjacentElement("afterend", holder);
    this.checkout = mount(target, {
      api: this.opts.api, org: this.opts.org, course: this.opts.course, event: id, checkout: true, compact: true,
      quantity: this.qty.get(id) ?? 1, currency: this.currency, ...(this.opts.stripePk ? { stripePk: this.opts.stripePk } : {}),
      ...(this.opts.turnstileSiteKey ? { turnstileSiteKey: this.opts.turnstileSiteKey } : {}),
    });
  }

  /** The registration widget currently open (tests). */
  get openCheckout(): Widget | null {
    return this.selected ? this.checkout : null;
  }
}

export function mountSchedule(host: HTMLElement, options: ScheduleOptions): ScheduleWidget {
  return new ScheduleWidget(host, options);
}
