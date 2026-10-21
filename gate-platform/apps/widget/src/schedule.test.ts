import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CoursePayload } from "./api.js";
import { dateRange, localYmd, mountSchedule, timeLine } from "./schedule.js";
import { init } from "./schedule-entry.js";

const API = "https://api.test";
const session = (start: string, end: string) => ({ startsAt: start, endsAt: end });
const cohort = (id: string, slug: string, start: string, days: number, remaining: number, price: number) => ({
  dateSlug: slug,
  event: {
    id, name: slug, startsAt: start, endsAt: new Date(Date.parse(start) + (days - 1) * 86_400_000 + 8 * 3_600_000).toISOString(), timezone: "America/Toronto", format: "live_virtual", currency: "USD", status: "live",
    sessions: Array.from({ length: days }, (_, i) => session(new Date(Date.parse(start) + i * 86_400_000).toISOString(), new Date(Date.parse(start) + i * 86_400_000 + 8 * 3_600_000).toISOString())),
  },
  ticketTypes: [{ id: `tt_${id}`, name: "Seat", remaining, quantity: 20, prices: { USD: price }, earlyBirdUntil: null }],
});

const course: CoursePayload = {
  organization: { id: "org_1", name: "Agile Agilist", country: "CA", currency: "USD" },
  course: { id: "crs_1", slug: "leading-safe", name: "Leading SAFe", description: null, certificationBody: "Scaled Agile", durationDays: 2 },
  cohorts: [
    cohort("evt_sat", "2026-11-21", "2026-11-21T14:00:00.000Z", 2, 3, 85_000),
    cohort("evt_mon", "2026-11-09", "2026-11-09T14:00:00.000Z", 2, 12, 85_000),
    cohort("evt_full", "2026-12-07", "2026-12-07T14:00:00.000Z", 1, 0, 85_000),
  ],
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-02T12:00:00Z"));
  vi.stubGlobal("fetch", vi.fn(async (url: unknown) => {
    if (String(url) === `${API}/public/v1/organizations/org_1/courses/leading-safe`) return { ok: true, status: 200, json: async () => course };
    throw new Error(`unexpected ${String(url)}`);
  }));
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  window.history.replaceState(null, "", "/training/leading-safe");
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const host = () => {
  const el = document.createElement("div");
  document.body.append(el);
  return el;
};
const txt = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();

describe("schedule widget helpers", () => {
  it("formats date ranges and times in the class's own time zone", () => {
    const c = course.cohorts[0]!;
    expect(localYmd(c.event.startsAt, "America/Toronto")).toBe("2026-11-21");
    expect(dateRange(c)).toBe("Nov 21 – 22, 2026");
    expect(timeLine(c, "America/Toronto")).toBe("EST 09:00 AM - 05:00 PM");
  });
});

describe("schedule widget", () => {
  it("lists dates soonest first with price, seats, weekend/weekday and a fast-filling flag", async () => {
    const el = host();
    const w = mountSchedule(el, { api: API, org: "org_1", course: "leading-safe" });
    await w.ready;
    const cards = [...el.querySelectorAll(".gs-card")];
    expect(cards.map((c) => c.getAttribute("data-event"))).toEqual(["evt_mon", "evt_sat", "evt_full"]);
    expect(txt(el.querySelector(".gs-count"))).toBe("3 Results");
    expect(txt(cards[0])).toContain("Nov 9 – 10, 2026");
    expect(txt(cards[0])).toContain("Weekday Batch · 2 days");
    expect(txt(cards[0])).toContain("$850.00");
    expect(txt(cards[1])).toContain("Weekend Batch");
    expect(txt(cards[1])).toContain("Filling Fast");
    expect(txt(cards[2])).toContain("Sold out");
    expect(txt(cards[2])).toContain("Join Waitlist");
    expect(cards[0]!.querySelector<HTMLAnchorElement>(".gs-details")!.href).toBe("https://app.test/c/org_1/leading-safe/2026-11-09");
    // The side card shows the soonest date that still has seats.
    expect(txt(el.querySelector(".gs-side"))).toContain("Nov 9 – 10, 2026");
  });

  it("filters by weekend, weekday and month, and resets", async () => {
    const el = host();
    const w = mountSchedule(el, { api: API, org: "org_1", course: "leading-safe" });
    await w.ready;
    const pill = (label: string) => [...el.querySelectorAll<HTMLButtonElement>(".gs-pill")].find((b) => b.textContent === label)!;
    pill("Weekend").click();
    expect([...el.querySelectorAll(".gs-card")].map((c) => c.getAttribute("data-event"))).toEqual(["evt_sat"]);
    pill("Weekday").click();
    expect(el.querySelectorAll(".gs-card")).toHaveLength(2);
    pill("Reset").click();
    const month = el.querySelector<HTMLSelectElement>(".gs-select")!;
    month.value = "2026-12";
    month.dispatchEvent(new Event("change"));
    expect([...el.querySelectorAll(".gs-card")].map((c) => c.getAttribute("data-event"))).toEqual(["evt_full"]);
    pill("This Month").click();
    expect(txt(el.querySelector(".gs-count"))).toBe("0 Results");
  });

  it("enroll opens the checkout under the chosen date with the stepper's seat count", async () => {
    const el = host();
    const w = mountSchedule(el, { api: API, org: "org_1", course: "leading-safe" });
    await w.ready;
    const card = el.querySelector<HTMLElement>('.gs-card[data-event="evt_mon"]')!;
    const plus = card.querySelector<HTMLButtonElement>('[aria-label="More seats"]')!;
    plus.click();
    plus.click();
    expect(txt(card.querySelector(".gs-qval"))).toBe("3");
    card.querySelector<HTMLButtonElement>(".gs-enroll")!.click();
    const holder = el.querySelector(".gs-enroll-holder")!;
    expect(holder.previousElementSibling?.getAttribute("data-event")).toBe("evt_mon");
    expect(el.querySelector('.gs-card[data-event="evt_mon"]')!.classList.contains("is-active")).toBe(true);
    await w.openCheckout!.ready;
    const qty = holder.querySelector<HTMLSelectElement>(".gw-select");
    expect(qty?.value).toBe("3");
    expect(holder.querySelector(".gw-cover")).toBeNull();
    holder.querySelector<HTMLButtonElement>(".gs-close")!.click();
    expect(el.querySelector(".gs-enroll-holder")).toBeNull();
  });

  it("calendar view highlights class days and a day opens registration", async () => {
    const el = host();
    const w = mountSchedule(el, { api: API, org: "org_1", course: "leading-safe", ink: "#123456", accent: "#ff6600" });
    await w.ready;
    expect(el.querySelector<HTMLElement>(".gs-root")!.style.getPropertyValue("--gs-accent")).toBe("#ff6600");
    [...el.querySelectorAll<HTMLButtonElement>(".gs-toggle button")][1]!.click();
    expect(txt(el.querySelector(".gs-cal-head"))).toContain("November 2026");
    const days = [...el.querySelectorAll(".gs-has")].map((d) => txt(d.querySelector(".gs-cal-day")));
    expect(days).toEqual(["9", "21"]);
    el.querySelector<HTMLButtonElement>('.gs-cal-head [aria-label="Next month"]')!.click();
    expect([...el.querySelectorAll(".gs-full")].map((d) => txt(d))).toEqual(["7Full"]);
    el.querySelector<HTMLButtonElement>(".gs-has")!.click();
    expect(el.querySelector(".gs-enroll-holder")!.previousElementSibling?.getAttribute("data-event")).toBe("evt_full");
  });

  it("a ?gate_date= link opens that date, and data attributes mount it", async () => {
    window.history.replaceState(null, "", "/training/leading-safe?gate_date=2026-11-21");
    document.body.innerHTML = `<div data-gate-schedule data-gate-api="${API}" data-gate-org="org_1" data-gate-course="leading-safe" data-gate-title="Upcoming dates" data-gate-sidebar="off"></div>`;
    const [w] = init();
    await w!.ready;
    expect(txt(document.querySelector(".gs-head h2"))).toBe("Upcoming dates");
    expect(document.querySelector(".gs-side")).toBeNull();
    expect(document.querySelector(".gs-enroll-holder")!.previousElementSibling?.getAttribute("data-event")).toBe("evt_sat");
  });
});
