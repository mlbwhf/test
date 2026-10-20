import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CoursePayload, OrderRequest, OrderResponse, WaitlistRequest } from "./api.js";
import { config, mount, type StripeFactory } from "./widget.js";

const API = "https://api.test";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const course: CoursePayload = {
  organization: { id: "org_1", name: "Agile Agilist", country: "CA", currency: "CAD" },
  course: { id: "crs_1", slug: "leading-safe", name: "Leading SAFe", description: null, certificationBody: "Scaled Agile", durationDays: 2 },
  cohorts: [
    {
      event: {
        id: "evt_1", name: "Leading SAFe Nov 20-21", startsAt: "2026-11-20T14:00:00.000Z", endsAt: "2026-11-21T22:00:00.000Z",
        timezone: "America/Toronto", format: "live_virtual", currency: "CAD", status: "live",
        sessions: [
          { startsAt: "2026-11-20T14:00:00.000Z", endsAt: "2026-11-20T22:00:00.000Z", title: "Day 1" },
          { startsAt: "2026-11-21T14:00:00.000Z", endsAt: "2026-11-21T22:00:00.000Z", title: "Day 2" },
        ],
      },
      ticketTypes: [
        { id: "tt_1", name: "Standard", remaining: 12, prices: { CAD: 109900, USD: 84900, GBP: 69900 }, earlyBirdUntil: "2026-11-01T00:00:00.000Z" },
        { id: "tt_2", name: "Team seat", remaining: 3, prices: { CAD: 99900, USD: 74900 }, earlyBirdUntil: null },
        { id: "tt_3", name: "Alumni", remaining: 0, prices: { CAD: 49900, USD: 39900 }, earlyBirdUntil: null },
      ],
    },
    {
      event: {
        id: "evt_2", name: "Community intro (free)", startsAt: "2026-12-03T18:00:00.000Z", endsAt: "2026-12-03T20:00:00.000Z",
        timezone: "America/Toronto", format: "in_person", currency: "CAD", status: "live",
        sessions: [{ startsAt: "2026-12-03T18:00:00.000Z", endsAt: "2026-12-03T20:00:00.000Z", title: "Intro" }],
      },
      ticketTypes: [{ id: "tt_free", name: "Free seat", remaining: 50, prices: { CAD: 0, USD: 0 }, earlyBirdUntil: null }],
    },
  ],
};

/** Builds a realistic order response from the request body (fee of 4.00 per paid seat). */
function orderResponse(body: OrderRequest, id = "ord_1"): OrderResponse {
  const tt = course.cohorts.flatMap((c) => c.ticketTypes).find((t) => t.id === body.ticketTypeId);
  const unit = tt?.prices[body.currency] ?? 0;
  const quantity = body.quantity;
  const subtotal = unit * quantity;
  const fee = unit > 0 ? 400 * quantity : 0;
  const total = subtotal + fee;
  return {
    order: {
      id, status: total === 0 ? "paid" : "pending", currency: body.currency, paymentRef: total === 0 ? null : "pi_1",
      pricing: {
        subtotalMinor: subtotal, platformFeeMinor: fee, attendeeFeeMinor: fee, totalMinor: total,
        organizerNetMinor: subtotal, perTicketFeeMinor: unit > 0 ? 400 : 0, unitPriceMinor: unit, quantity,
      },
    },
    clientSecret: total === 0 ? null : "pi_1_secret_abc",
    dryRun: body.dryRun === true,
  };
}

interface Reply { status?: number; body?: unknown; network?: boolean }
type Route = (url: string, init: RequestInit | undefined, json: OrderRequest | undefined) => Reply | undefined;

function stubFetch(route: Route) {
  const fn = vi.fn(async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    const json = typeof init?.body === "string" ? (JSON.parse(init.body) as OrderRequest) : undefined;
    const reply = route(url, init, json);
    if (!reply) throw new Error(`unexpected request ${init?.method ?? "GET"} ${url}`);
    if (reply.network) throw new TypeError("Failed to fetch");
    const status = reply.status ?? 200;
    return { ok: status < 300, status, json: async () => reply.body };
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const courseRoute: Route = (url) => (url === `${API}/public/v1/organizations/org_1/courses/leading-safe` ? { body: course } : undefined);

const text = (el: Element | null | undefined): string => (el?.textContent ?? "").replace(/[   ]/g, " ");
function setValue(el: HTMLInputElement | HTMLSelectElement, value: string, event: "input" | "change" = "input"): void {
  el.value = value;
  el.dispatchEvent(new Event(event, { bubbles: true }));
}
function buttonByText(root: ParentNode, pattern: RegExp): HTMLButtonElement {
  const btn = Array.from(root.querySelectorAll("button")).find((b) => pattern.test(b.textContent ?? ""));
  if (!btn) throw new Error(`no button matching ${pattern}`);
  return btn;
}
function submitForm(root: ParentNode): void {
  const form = root.querySelector("form.gw-form");
  if (!form) throw new Error("no checkout form");
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}
async function openCheckout(host: HTMLElement, ticketIndex: number, buyer: string): Promise<void> {
  host.querySelectorAll<HTMLButtonElement>(".gw-ticket .gw-btn")[ticketIndex]!.click();
  const buyerInput = host.querySelector<HTMLInputElement>("input[type=email]")!;
  setValue(buyerInput, buyer);
  await vi.waitFor(() => expect(text(host.querySelector(".gw-summary"))).toContain("Total"));
}

let host: HTMLElement;

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  config.debounceMs = 0;
  config.pollIntervalMs = 5;
  config.pollTimeoutMs = 2000;
});

afterEach(() => {
  vi.unstubAllGlobals();
  try { localStorage.clear(); } catch { /* no storage in this environment */ }
  document.body.innerHTML = "";
  document.getElementById("gate-widget-css")?.remove();
  delete window.Stripe;
});

describe("schedule", () => {
  it("renders cohorts, prices in the chosen currency, early-bird badge and sold-out state", async () => {
    stubFetch(courseRoute);
    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe", currency: "USD" });
    await widget.ready;

    expect(document.getElementById("gate-widget-css")?.tagName).toBe("STYLE");
    expect(text(host.querySelector(".gw-title"))).toBe("Leading SAFe");
    expect(text(host.querySelector(".gw-header"))).toContain("Scaled Agile");

    const cohorts = host.querySelectorAll(".gw-cohort");
    expect(cohorts).toHaveLength(2);
    const first = text(cohorts[0]);
    expect(first).toContain("Leading SAFe Nov 20-21");
    expect(first).toContain("Live virtual");
    expect(first).toContain("2 sessions");
    expect(first).toContain("Nov 20, 2026, 9:00 AM – Nov 21, 2026, 5:00 PM EST");
    expect(text(cohorts[1])).toContain("In person");

    const prices = Array.from(host.querySelectorAll(".gw-price")).map(text);
    expect(prices[0]).toContain("849.00");
    expect(prices[0]).not.toContain("1,099");
    expect(prices[1]).toContain("749.00");

    const tickets = host.querySelectorAll(".gw-ticket");
    expect(text(tickets[0])).toContain("Early bird until");
    expect(text(tickets[1])).not.toContain("Early bird");
    expect(text(tickets[1])).toContain("3 left");
    expect(text(tickets[0])).not.toContain("left");

    const soldOut = tickets[2]!.querySelector("button")!;
    expect(soldOut.disabled).toBe(false);
    expect(soldOut.textContent).toBe("Join waitlist");
    expect(text(tickets[2])).toContain("Sold out");
    expect(tickets[0]!.querySelector("button")!.disabled).toBe(false);
    expect(tickets[0]!.querySelector("button")!.textContent).toBe("Register");

    // currency selector = union of currencies, defaulting to data-gate-currency
    const select = host.querySelector<HTMLSelectElement>("select.gw-select")!;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(["CAD", "USD", "GBP"]);
    expect(select.value).toBe("USD");
    setValue(select, "CAD", "change");
    expect(text(host.querySelectorAll(".gw-price")[0])).toContain("1,099.00");
    setValue(select, "GBP", "change");
    expect(text(host.querySelectorAll(".gw-price")[0])).toContain("699.00");
    expect(text(host.querySelectorAll(".gw-price")[1])).toContain("Not available in GBP");
    expect(host.querySelectorAll<HTMLButtonElement>(".gw-ticket button")[1]!.disabled).toBe(true);
  });

  it("falls back to the visitor's locale currency, then the organization's, when data-gate-currency is unavailable", async () => {
    stubFetch(courseRoute);
    // jsdom reports navigator.language = "en-US" and USD is on sale.
    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe", currency: "JPY" });
    await widget.ready;
    expect(host.querySelector<HTMLSelectElement>("select.gw-select")!.value).toBe("USD");

    vi.stubGlobal("navigator", { ...navigator, language: "fr-FR" });
    const host2 = document.createElement("div");
    document.body.append(host2);
    const widget2 = mount(host2, { api: API, org: "org_1", course: "leading-safe", currency: "JPY" });
    await widget2.ready;
    expect(host2.querySelector<HTMLSelectElement>("select.gw-select")!.value).toBe("CAD");
  });

  it("shows only the chosen cohort when an event is given", async () => {
    stubFetch(courseRoute);
    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe", event: "evt_2" });
    await widget.ready;
    const names = [...host.querySelectorAll(".gw-cohort-name")].map((n) => n.textContent);
    expect(names).toEqual(["Community intro (free)"]);
  });

  it("shows the course cover image when the course has one", async () => {
    stubFetch((url, init, json) => (url.includes("/courses/") ? { body: { ...course, course: { ...course.course, imageUrl: "https://api.test/public/v1/media/abc.jpg" } } } : courseRoute(url, init, json)));
    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe" });
    await widget.ready;
    expect(host.querySelector<HTMLImageElement>("img.gw-cover")!.getAttribute("src")).toBe("https://api.test/public/v1/media/abc.jpg");
  });

  it("remembers the visitor's currency choice across mounts", async () => {
    stubFetch(courseRoute);
    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe" });
    await widget.ready;
    const select = host.querySelector<HTMLSelectElement>("select.gw-select")!;
    select.value = "GBP";
    select.dispatchEvent(new Event("change"));
    const host2 = document.createElement("div");
    document.body.append(host2);
    const widget2 = mount(host2, { api: API, org: "org_1", course: "leading-safe" });
    await widget2.ready;
    expect(host2.querySelector<HTMLSelectElement>("select.gw-select")!.value).toBe("GBP");
  });

  it("shows a network message when the service is unreachable", async () => {
    stubFetch(() => ({ network: true }));
    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe" });
    await widget.ready;
    expect(text(host)).toContain("Can't reach the registration service");
    expect(buttonByText(host, /Try again/)).toBeTruthy();
  });
});

describe("checkout", () => {
  it("shows dry-run pricing (with service fee) and completes a free order", async () => {
    const posts: { body: OrderRequest; key: string }[] = [];
    stubFetch((url, init, json) => {
      if (courseRoute(url, init, json)) return { body: course };
      if (url === `${API}/public/v1/organizations/org_1/orders` && init?.method === "POST" && json) {
        posts.push({ body: json, key: (init.headers as Record<string, string>)["idempotency-key"] ?? "" });
        return { status: 201, body: orderResponse(json, "ord_free") };
      }
      return undefined;
    });
    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe", currency: "CAD" });
    await widget.ready;

    await openCheckout(host, 0, "buyer@example.com");
    expect(host.querySelector("form.gw-form")).toBeTruthy();
    expect(posts[0]!.body).toMatchObject({ dryRun: true, ticketTypeId: "tt_1", quantity: 1, currency: "CAD" });
    expect((fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[1]![1]).toMatchObject({ headers: { "content-type": "application/json" } });
    let summary = text(host.querySelector(".gw-summary"));
    expect(summary).toContain("1,099.00 × 1");
    expect(summary).toContain("Service fee");
    expect(summary).toContain("4.00");
    expect(summary).toContain("1,103.00");

    // first attendee mirrors the buyer email while "same as buyer" is checked
    const firstAttendee = host.querySelector<HTMLInputElement>(".gw-attendee input[type=email]")!;
    expect(firstAttendee.value).toBe("buyer@example.com");
    expect(firstAttendee.readOnly).toBe(true);

    // quantity change -> attendee blocks + debounced dry run
    setValue(host.querySelector<HTMLSelectElement>("select.gw-select")!, "2", "change");
    expect(host.querySelectorAll(".gw-attendee")).toHaveLength(2);
    await vi.waitFor(() => expect(text(host.querySelector(".gw-summary"))).toContain("× 2"));
    summary = text(host.querySelector(".gw-summary"));
    expect(summary).toContain("2,198.00");
    expect(summary).toContain("2,206.00");
    expect(posts.at(-1)!.body.quantity).toBe(2);
    expect(host.querySelector<HTMLSelectElement>("select.gw-select")!.options).toHaveLength(10);

    // back link restores the schedule
    buttonByText(host, /Back to schedule/).click();
    expect(host.querySelectorAll(".gw-cohort")).toHaveLength(2);

    // free course: no service fee row, order comes back paid, success panel
    const before = posts.length;
    await openCheckout(host, 3, "lead@example.com");
    summary = text(host.querySelector(".gw-summary"));
    expect(summary).not.toContain("Service fee");
    expect(summary).toContain("0.00");
    expect(text(host.querySelector("button[type=submit]"))).toBe("Register");
    submitForm(host);
    await vi.waitFor(() => expect(text(host)).toContain("You're registered"));
    const real = posts.slice(before).filter((p) => !p.body.dryRun);
    expect(real).toHaveLength(1);
    expect(real[0]!.body).toEqual({
      ticketTypeId: "tt_free", quantity: 1, currency: "CAD", buyerEmail: "lead@example.com",
      attendees: [{ email: "lead@example.com" }], dryRun: false,
    });
    expect(real[0]!.key).toMatch(UUID_RE);
    const panel = text(host.querySelector(".gw-success"));
    expect(panel).toContain("ord_free");
    expect(panel).toContain("Community intro (free)");
    expect(panel).toContain("Seat 1: lead@example.com");
    expect(panel).toContain("calendar invites");
  });

  it("validates emails before posting", async () => {
    const posts: OrderRequest[] = [];
    stubFetch((url, init, json) => {
      if (courseRoute(url, init, json)) return { body: course };
      if (json) { posts.push(json); return { status: 201, body: orderResponse(json) }; }
      return undefined;
    });
    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe" });
    await widget.ready;
    await openCheckout(host, 0, "not-an-email");
    submitForm(host);
    expect(text(host.querySelector(".gw-errors"))).toContain("valid email address for the buyer");
    expect(posts.filter((p) => !p.dryRun)).toHaveLength(0);
  });
});

describe("payment", () => {
  it("runs the test-mode paid flow: order -> simulate -> poll -> success", async () => {
    const calls: string[] = [];
    let polls = 0;
    let created: OrderResponse | undefined;
    stubFetch((url, init, json) => {
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (courseRoute(url, init, json)) return { body: course };
      if (url === `${API}/public/v1/organizations/org_1/orders` && json) {
        const res = orderResponse(json);
        if (!json.dryRun) created = res;
        return { status: 201, body: res };
      }
      if (url === `${API}/public/v1/dev/payments/pi_1/succeed` && init?.method === "POST") return { body: { handled: true } };
      if (url === `${API}/public/v1/orders/ord_1?buyerEmail=buyer%40example.com` && created) {
        polls++;
        return { body: { order: { ...created.order, status: polls >= 2 ? "paid" : "pending" } } };
      }
      return undefined;
    });
    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe", currency: "USD" });
    await widget.ready;

    await openCheckout(host, 0, "buyer@example.com");
    setValue(host.querySelector<HTMLSelectElement>("select.gw-select")!, "2", "change");
    await vi.waitFor(() => expect(host.querySelectorAll(".gw-attendee")).toHaveLength(2));
    const second = host.querySelectorAll<HTMLInputElement>(".gw-attendee input[type=email]")[1]!;
    setValue(second, "colleague@example.com");
    setValue(host.querySelectorAll<HTMLInputElement>(".gw-attendee input[type=text]")[2]!, "Sam Lee");
    await vi.waitFor(() => expect(text(host.querySelector(".gw-summary"))).toContain("× 2"));
    submitForm(host);

    const simulate = await vi.waitFor(() => buttonByText(host, /Simulate payment \(test mode\)/));
    expect(host.querySelector("script[src*='stripe']")).toBeNull();
    expect(text(host)).toContain("Test mode");
    simulate.click();
    await vi.waitFor(() => expect(text(host)).toContain("You're registered"));

    expect(calls).toContain(`POST ${API}/public/v1/dev/payments/pi_1/succeed`);
    expect(polls).toBeGreaterThanOrEqual(2);
    expect(created?.order.pricing.quantity).toBe(2);
    const panel = text(host.querySelector(".gw-success"));
    expect(panel).toContain("ord_1");
    expect(panel).toContain("Leading SAFe Nov 20-21");
    expect(panel).toContain("Nov 20, 2026");
    expect(panel).toContain("Seat 1: buyer@example.com");
    expect(panel).toContain("Seat 2: colleague@example.com (Sam Lee)");
    expect(text(host.querySelector(".gw-status"))).toBe("Registration complete");
  });

  it("uses Stripe Payment Element when a publishable key is configured", async () => {
    let polls = 0;
    let created: OrderResponse | undefined;
    stubFetch((url, init, json) => {
      if (courseRoute(url, init, json)) return { body: course };
      if (url.endsWith("/orders") && json) {
        const res = orderResponse(json, "ord_s");
        if (!json.dryRun) created = res;
        return { status: 201, body: res };
      }
      if (url.startsWith(`${API}/public/v1/orders/ord_s?`) && created) {
        polls++;
        return { body: { order: { ...created.order, status: polls >= 2 ? "paid" : "pending" } } };
      }
      return undefined;
    });
    const mountEl = vi.fn();
    const confirmPayment = vi.fn(async () => ({ paymentIntent: { status: "succeeded" } }));
    const elementsOpts: unknown[] = [];
    const stripeFactory = vi.fn<StripeFactory>(() => ({
      elements(opts) { elementsOpts.push(opts); return { create: () => ({ mount: mountEl }) }; },
      confirmPayment,
    }));
    window.Stripe = stripeFactory;

    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe", currency: "GBP", stripePk: "pk_test_123" });
    await widget.ready;
    await openCheckout(host, 0, "buyer@example.com");
    submitForm(host);

    const pay = await vi.waitFor(() => {
      const b = buttonByText(host, /^Pay /);
      expect(b.disabled).toBe(false);
      return b;
    });
    expect(stripeFactory).toHaveBeenCalledWith("pk_test_123");
    expect(elementsOpts[0]).toEqual({ clientSecret: "pi_1_secret_abc", appearance: { theme: "stripe" } });
    expect(mountEl).toHaveBeenCalledWith(host.querySelector(".gw-payment-element"));
    expect(text(pay)).toContain("703.00");
    expect(host.querySelector("button[type=button].gw-btn-primary")?.textContent).not.toContain("Simulate");

    pay.click();
    await vi.waitFor(() => expect(text(host)).toContain("You're registered"));
    expect(confirmPayment).toHaveBeenCalledWith(expect.objectContaining({ redirect: "if_required" }));
    expect(polls).toBeGreaterThanOrEqual(2);
  });
});

describe("errors", () => {
  it("renders API errors inline with message and hint (SOLD_OUT)", async () => {
    stubFetch((url, init, json) => {
      if (courseRoute(url, init, json)) return { body: course };
      if (json?.dryRun) return { status: 201, body: orderResponse(json) };
      if (json) {
        return { status: 409, body: { error: { code: "SOLD_OUT", message: "This ticket type just sold out.", hint: "Pick another cohort or ticket type." } } };
      }
      return undefined;
    });
    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe" });
    await widget.ready;
    await openCheckout(host, 0, "buyer@example.com");
    submitForm(host);
    await vi.waitFor(() => expect(text(host.querySelector(".gw-errors"))).toContain("This ticket type just sold out."));
    expect(text(host.querySelector(".gw-error-hint"))).toBe("Pick another cohort or ticket type.");
    expect(host.querySelector(".gw-error")?.getAttribute("role")).toBe("alert");
    expect(host.querySelector<HTMLButtonElement>("button[type=submit]")!.disabled).toBe(false);
    expect(host.querySelector("form.gw-form")).toBeTruthy();
  });

  it("renders a generic message for non-JSON error bodies", async () => {
    stubFetch(() => ({ status: 503, body: undefined }));
    vi.mocked(fetch).mockImplementationOnce(async () => ({ ok: false, status: 503, json: async () => { throw new Error("not json"); } }) as unknown as Response);
    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe" });
    await widget.ready;
    expect(text(host)).toContain("returned an error (503)");
  });
});

describe("waitlist", () => {
  const WAITLIST_URL = `${API}/public/v1/organizations/org_1/waitlist`;

  it("replaces the sold-out Register button with Join waitlist and posts the entry", async () => {
    const posts: { body: WaitlistRequest; init: RequestInit | undefined }[] = [];
    stubFetch((url, init, json) => {
      if (courseRoute(url, init, json)) return { body: course };
      if (url === WAITLIST_URL && init?.method === "POST") {
        posts.push({ body: json as unknown as WaitlistRequest, init });
        return { status: 201, body: { entry: { id: "wl_1", status: "waiting", position: 3 } } };
      }
      return undefined;
    });
    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe", currency: "CAD" });
    await widget.ready;
    expect(host.querySelector(".gw-banner")).toBeNull();

    const row = host.querySelectorAll(".gw-ticket")[2]!;
    const join = row.querySelector("button")!;
    expect(join.textContent).toBe("Join waitlist");
    expect(join.disabled).toBe(false);
    expect(row.querySelector("button[aria-label^='Register']")).toBeNull();
    join.click();

    const form = host.querySelector<HTMLFormElement>("form.gw-waitlist")!;
    expect(form).toBeTruthy();
    expect(text(host)).toContain("Alumni is sold out");
    const qty = form.querySelector<HTMLSelectElement>("select")!;
    expect(Array.from(qty.options).map((o) => o.value)).toEqual(["1", "2", "3", "4", "5"]);
    expect(qty.value).toBe("1");

    // Back returns to the schedule without posting
    buttonByText(form, /^Back$/).click();
    expect(host.querySelectorAll(".gw-cohort")).toHaveLength(2);
    expect(posts).toHaveLength(0);

    host.querySelectorAll<HTMLButtonElement>(".gw-ticket button")[2]!.click();
    submitForm(host);
    expect(text(host.querySelector(".gw-errors"))).toContain("valid email address");
    expect(posts).toHaveLength(0);

    setValue(host.querySelector<HTMLInputElement>("form.gw-waitlist input[type=email]")!, "wait@example.com");
    setValue(host.querySelector<HTMLInputElement>("form.gw-waitlist input[type=text]")!, "Pat Doe");
    setValue(host.querySelector<HTMLSelectElement>("form.gw-waitlist select")!, "2", "change");
    submitForm(host);
    await vi.waitFor(() => expect(text(host)).toContain("You're #3 on the waitlist."));
    expect(text(host)).toContain("We'll email you when a seat opens; you'll have 24 hours to claim it.");
    expect(posts).toHaveLength(1);
    expect(posts[0]!.body).toEqual({ eventId: "evt_1", ticketTypeId: "tt_3", email: "wait@example.com", name: "Pat Doe", quantity: 2 });
    expect(posts[0]!.init).toMatchObject({ method: "POST", headers: { "content-type": "application/json" } });
    expect(text(host.querySelector(".gw-status"))).toBe("You're on the waitlist");
    buttonByText(host, /Back to schedule/).click();
    expect(host.querySelectorAll(".gw-cohort")).toHaveLength(2);
  });

  it("renders the API error inline (ALREADY_WAITLISTED) and keeps the form", async () => {
    stubFetch((url, init, json) => {
      if (courseRoute(url, init, json)) return { body: course };
      if (url === WAITLIST_URL && init?.method === "POST") {
        return { status: 409, body: { error: { code: "ALREADY_WAITLISTED", message: "You're already on this waitlist.", hint: "Check your inbox for the confirmation." } } };
      }
      return undefined;
    });
    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe" });
    await widget.ready;
    host.querySelectorAll<HTMLButtonElement>(".gw-ticket button")[2]!.click();
    setValue(host.querySelector<HTMLInputElement>("form.gw-waitlist input[type=email]")!, "wait@example.com");
    submitForm(host);
    await vi.waitFor(() => expect(text(host.querySelector(".gw-errors"))).toContain("You're already on this waitlist."));
    expect(text(host.querySelector(".gw-error-hint"))).toBe("Check your inbox for the confirmation.");
    expect(host.querySelector(".gw-error")?.getAttribute("role")).toBe("alert");
    expect(host.querySelector("form.gw-waitlist")).toBeTruthy();
    expect(host.querySelector<HTMLButtonElement>("button[type=submit]")!.disabled).toBe(false);
    expect(text(host)).not.toContain("on the waitlist.");
  });

  it("claim mode (data-gate-waitlist): banner, Register on the sold-out row, waitlistEntryId in the order body", async () => {
    const posts: OrderRequest[] = [];
    stubFetch((url, init, json) => {
      if (courseRoute(url, init, json)) return { body: course };
      if (url === `${API}/public/v1/organizations/org_1/orders` && init?.method === "POST" && json) {
        posts.push(json);
        return { status: 201, body: orderResponse(json, "ord_wl") };
      }
      return undefined;
    });
    host.dataset.gateWaitlist = "wl_1";
    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe", currency: "CAD" });
    await widget.ready;

    expect(text(host.querySelector(".gw-banner"))).toContain("Claiming your waitlist seat");
    expect(host.querySelector(".gw-banner")!.compareDocumentPosition(host.querySelector(".gw-cohorts")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const row = host.querySelectorAll(".gw-ticket")[2]!;
    const register = row.querySelector("button")!;
    expect(register.textContent).toBe("Register");
    expect(register.disabled).toBe(false);
    expect(row.classList.contains("gw-ticket-soldout")).toBe(false);
    expect(text(row)).toContain("Seat held for you");
    expect(text(row)).not.toContain("Join waitlist");
    // other rows are unaffected
    expect(host.querySelectorAll(".gw-ticket button")[0]!.textContent).toBe("Register");

    await openCheckout(host, 2, "claim@example.com");
    expect(posts[0]).toMatchObject({ dryRun: true, ticketTypeId: "tt_3", waitlistEntryId: "wl_1" });
    submitForm(host);
    await vi.waitFor(() => buttonByText(host, /Simulate payment/));
    const real = posts.filter((p) => !p.dryRun);
    expect(real).toHaveLength(1);
    expect(real[0]).toEqual({
      ticketTypeId: "tt_3", quantity: 1, currency: "CAD", buyerEmail: "claim@example.com",
      attendees: [{ email: "claim@example.com" }], dryRun: false, waitlistEntryId: "wl_1",
    });
  });

  it("claim mode is also enabled by the gate_waitlist query parameter", async () => {
    const posts: OrderRequest[] = [];
    stubFetch((url, init, json) => {
      if (courseRoute(url, init, json)) return { body: course };
      if (json) { posts.push(json); return { status: 201, body: orderResponse(json) }; }
      return undefined;
    });
    window.history.replaceState({}, "", "/course?gate_waitlist=wl_9&x=1");
    try {
      const widget = mount(host, { api: API, org: "org_1", course: "leading-safe" });
      await widget.ready;
      expect(text(host.querySelector(".gw-banner"))).toContain("Claiming your waitlist seat");
      expect(host.querySelectorAll(".gw-ticket button")[2]!.textContent).toBe("Register");
      await openCheckout(host, 2, "claim@example.com");
      expect(posts[0]!.waitlistEntryId).toBe("wl_9");
    } finally {
      window.history.replaceState({}, "", "/");
    }
  });

  it("does not include waitlistEntryId outside claim mode", async () => {
    const posts: OrderRequest[] = [];
    stubFetch((url, init, json) => {
      if (courseRoute(url, init, json)) return { body: course };
      if (json) { posts.push(json); return { status: 201, body: orderResponse(json) }; }
      return undefined;
    });
    const widget = mount(host, { api: API, org: "org_1", course: "leading-safe" });
    await widget.ready;
    await openCheckout(host, 0, "buyer@example.com");
    expect("waitlistEntryId" in posts[0]!).toBe(false);
  });
});

describe("auto-init", () => {
  it("mounts every [data-gate-widget] element exactly once and reports missing attributes", async () => {
    const fetchMock = stubFetch(courseRoute);
    const el = document.createElement("div");
    el.setAttribute("data-gate-widget", "");
    el.dataset.gateApi = API;
    el.dataset.gateOrg = "org_1";
    el.dataset.gateCourse = "leading-safe";
    el.dataset.gateCurrency = "usd";
    const broken = document.createElement("div");
    broken.setAttribute("data-gate-widget", "");
    broken.dataset.gateApi = API;
    document.body.append(el, broken);

    const mod = await import("./index.js");
    mod.init();
    mod.init();

    expect(el.dataset.gateMounted).toBe("1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(window.GateWidget?.mount).toBe(mount);
    await vi.waitFor(() => expect(text(el.querySelector(".gw-title"))).toBe("Leading SAFe"));
    expect(el.querySelector<HTMLSelectElement>("select.gw-select")!.value).toBe("USD");
    expect(broken.textContent).toContain("data-gate-org");
    expect(broken.textContent).toContain("data-gate-course");
  });
});
