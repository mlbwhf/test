// The widget itself: schedule -> checkout -> payment -> success. Vanilla DOM, no framework.

import {
  ApiError, createApi, uuid,
  type Api, type Attendee, type Cohort, type CoursePayload, type Order, type OrderRequest,
  type OrderResponse, type Pricing, type TicketType, type WaitlistEntry, type WaitlistRequest,
} from "./api.js";
import {
  currencyUnion, formatDate, formatDateRange, formatLabel, formatMoney, pickCurrency,
  remainingLabel, sessionsLabel,
} from "./format.js";
import { injectStyles } from "./styles.js";

export interface WidgetOptions {
  api: string;
  org: string;
  course: string;
  currency?: string;
  stripePk?: string;
  /** Waitlist entry id to claim (overrides `data-gate-waitlist` and the `gate_waitlist` query param). */
  waitlist?: string;
}

/** Timing knobs (mutable so tests can shorten them). */
export const config = {
  pollIntervalMs: 1500,
  pollTimeoutMs: 20_000,
  debounceMs: 300,
  stripeSrc: "https://js.stripe.com/v3/",
};

/* ---------- Minimal Stripe.js typing (no @stripe/stripe-js dependency) ---------- */
interface StripePaymentElement { mount(target: HTMLElement): void }
interface StripeElements { create(type: "payment", options?: Record<string, unknown>): StripePaymentElement }
interface StripeConfirmResult { error?: { message?: string }; paymentIntent?: { status: string } }
export interface StripeInstance {
  elements(options: { clientSecret: string; appearance?: { theme: string } }): StripeElements;
  confirmPayment(options: { elements: StripeElements; redirect: "if_required" }): Promise<StripeConfirmResult>;
}
export type StripeFactory = (publishableKey: string) => StripeInstance;
declare global {
  interface Window { Stripe?: StripeFactory }
}

let stripeLoader: Promise<StripeFactory> | undefined;
function loadStripe(): Promise<StripeFactory> {
  if (window.Stripe) return Promise.resolve(window.Stripe);
  if (!stripeLoader) {
    stripeLoader = new Promise<StripeFactory>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = config.stripeSrc;
      script.async = true;
      script.onload = () => (window.Stripe ? resolve(window.Stripe) : reject(new Error("Stripe.js did not initialise")));
      script.onerror = () => {
        stripeLoader = undefined;
        reject(new Error("Stripe.js failed to load"));
      };
      document.head.append(script);
    });
  }
  return stripeLoader;
}

/* ---------- Tiny DOM helpers ---------- */
type Attrs = Record<string, string | number | boolean | EventListener | undefined>;
type Child = Node | string | null | undefined | false;

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2), value);
    else if (key === "class") el.className = String(value);
    else if (value === true) el.setAttribute(key, "");
    else el.setAttribute(key, String(value));
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return el;
}

function errorBlock(err: unknown): HTMLElement {
  const el = h("div", { class: "gw-error", role: "alert" });
  if (err instanceof ApiError) {
    el.append(h("span", {}, err.message));
    if (err.hint) el.append(h("span", { class: "gw-error-hint" }, err.hint));
  } else {
    el.append(h("span", {}, err instanceof Error && err.message ? err.message : "Something went wrong."));
  }
  return el;
}

function row(label: string, value: string, total = false): HTMLElement {
  return h("div", { class: total ? "gw-row gw-total" : "gw-row" }, h("span", {}, label), h("span", {}, value));
}

function prefersDark(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLACEHOLDER_EMAIL = "pending@example.com";
const WAITLIST_MAX_SEATS = 5;
const WAITLIST_PARAM = "gate_waitlist";

/** Waitlist entry id from the page URL (`?gate_waitlist=wl_...`, the link in the offer email). */
function waitlistFromLocation(): string | undefined {
  try {
    return new URLSearchParams(window.location.search).get(WAITLIST_PARAM) ?? undefined;
  } catch {
    return undefined;
  }
}

interface Draft { email: string; name: string; company: string }
interface CheckoutContext { cohort: Cohort; ticket: TicketType; quantity: number; buyerEmail: string; attendees: Attendee[] }

function toAttendees(drafts: readonly Draft[]): Attendee[] {
  return drafts.map((d) => {
    const a: Attendee = { email: d.email.trim() };
    const name = d.name.trim();
    const company = d.company.trim();
    if (name) a.name = name;
    if (company) a.company = company;
    return a;
  });
}

let seq = 0;

export class Widget {
  /** Resolves once the schedule (or its error state) has rendered. */
  readonly ready: Promise<void>;
  private readonly api: Api;
  private readonly id: string;
  private readonly titleEl: HTMLElement;
  private readonly metaEl: HTMLElement;
  private readonly statusEl: HTMLElement;
  private readonly body: HTMLElement;
  private data: CoursePayload | null = null;
  private currency = "";
  /** Set when the visitor arrived to claim a seat offered from the waitlist. */
  private readonly waitlistEntryId: string | undefined;

  constructor(host: HTMLElement, private readonly opts: WidgetOptions) {
    injectStyles(host.ownerDocument);
    this.api = createApi(opts.api, opts.org);
    this.id = `gw${++seq}`;
    this.waitlistEntryId = (opts.waitlist ?? host.dataset.gateWaitlist ?? waitlistFromLocation())?.trim() || undefined;
    this.titleEl = h("h2", { class: "gw-title" }, "Loading…");
    this.metaEl = h("p", { class: "gw-muted" });
    this.statusEl = h("div", { class: "gw-status", role: "status", "aria-live": "polite" });
    this.body = h("div", { class: "gw-body" });
    host.replaceChildren(
      h("div", { class: "gw-root" }, h("div", { class: "gw-header" }, this.titleEl, this.metaEl), this.statusEl, this.body),
    );
    this.ready = this.load();
  }

  private setStatus(text: string): void {
    this.statusEl.textContent = text;
  }

  /* ---------- Load ---------- */
  private async load(): Promise<void> {
    this.setStatus("Loading schedule…");
    try {
      const data = await this.api.getCourse(this.opts.course);
      this.data = data;
      const available = currencyUnion(data.cohorts);
      this.currency = pickCurrency(available, this.opts.currency, data.organization.currency) ?? data.organization.currency;
      this.titleEl.textContent = data.course.name;
      this.metaEl.textContent = [
        data.course.certificationBody,
        data.course.durationDays ? `${data.course.durationDays}-day course` : null,
        data.organization.name,
      ].filter(Boolean).join(" · ");
      this.setStatus("");
      this.renderSchedule();
    } catch (err) {
      this.titleEl.textContent = "Course schedule";
      this.setStatus("");
      this.body.replaceChildren(
        errorBlock(err),
        h("button", { type: "button", class: "gw-btn", onclick: () => { void this.load(); } }, "Try again"),
      );
    }
  }

  /* ---------- Schedule ---------- */
  private renderSchedule(): void {
    const data = this.data;
    if (!data) return;
    const frag = document.createDocumentFragment();
    if (this.waitlistEntryId) {
      frag.append(h("div", { class: "gw-banner", role: "status" },
        h("strong", {}, "Claiming your waitlist seat"),
        h("span", { class: "gw-banner-hint" }, "Your seat is held for you. Pick the cohort you were offered and register below.")));
    }
    const available = currencyUnion(data.cohorts);
    if (available.length > 1) {
      const select = h("select", { id: `${this.id}-currency`, class: "gw-select" });
      for (const code of available) {
        const option = h("option", { value: code }, code);
        option.selected = code === this.currency;
        select.append(option);
      }
      select.addEventListener("change", () => {
        this.currency = select.value;
        this.renderSchedule();
      });
      frag.append(h("div", { class: "gw-toolbar" }, h("label", { class: "gw-label", for: select.id }, "Currency"), select));
    }
    if (data.cohorts.length === 0) {
      frag.append(h("p", { class: "gw-muted" }, "No upcoming dates are scheduled yet."));
    } else {
      const list = h("ul", { class: "gw-cohorts" });
      for (const cohort of data.cohorts) list.append(this.cohortItem(cohort));
      frag.append(list);
    }
    this.body.replaceChildren(frag);
  }

  private cohortItem(cohort: Cohort): HTMLElement {
    const ev = cohort.event;
    const tickets = h("ul", { class: "gw-tickets" });
    for (const tt of cohort.ticketTypes) tickets.append(this.ticketItem(cohort, tt));
    return h("li", { class: "gw-cohort" },
      h("div", { class: "gw-cohort-head" },
        h("h3", { class: "gw-cohort-name" }, ev.name),
        h("span", { class: "gw-badge gw-badge-format" }, formatLabel(ev.format))),
      h("p", { class: "gw-cohort-dates" }, formatDateRange(ev.startsAt, ev.endsAt, ev.timezone)),
      h("p", { class: "gw-cohort-sessions" }, sessionsLabel(ev.sessions.length)),
      tickets,
    );
  }

  private ticketItem(cohort: Cohort, tt: TicketType): HTMLElement {
    const price = tt.prices[this.currency];
    const soldOut = tt.remaining <= 0;
    const info = h("div", { class: "gw-ticket-info" }, h("span", { class: "gw-ticket-name" }, tt.name));
    if (tt.earlyBirdUntil) {
      info.append(h("span", { class: "gw-badge gw-badge-early" }, `Early bird until ${formatDate(tt.earlyBirdUntil, cohort.event.timezone)}`));
    }
    // In claim mode the seat is held for the visitor, so a sold-out row still registers.
    const claiming = soldOut && this.waitlistEntryId !== undefined;
    const left = remainingLabel(tt.remaining);
    if (claiming) info.append(h("span", { class: "gw-badge gw-badge-held" }, "Seat held for you"));
    else if (left) info.append(h("span", { class: "gw-badge gw-badge-left" }, left));
    const priceEl = h("span", { class: "gw-price" },
      price === undefined ? `Not available in ${this.currency}` : formatMoney(price, this.currency));
    const button = soldOut && !claiming
      ? h("button", {
        type: "button",
        class: "gw-btn",
        "aria-label": `Join waitlist for ${tt.name}, ${cohort.event.name}`,
        onclick: () => this.renderWaitlist(cohort, tt),
      }, "Join waitlist")
      : h("button", {
        type: "button",
        class: "gw-btn gw-btn-primary",
        disabled: price === undefined,
        "aria-label": `Register for ${tt.name}, ${cohort.event.name}`,
        onclick: () => this.renderCheckout(cohort, tt),
      }, "Register");
    return h("li", { class: soldOut && !claiming ? "gw-ticket gw-ticket-soldout" : "gw-ticket" }, info, priceEl, button);
  }

  /* ---------- Waitlist ---------- */
  private renderWaitlist(cohort: Cohort, tt: TicketType): void {
    const ev = cohort.event;
    const uid = (s: string): string => `${this.id}-wl-${s}`;
    const emailInput = h("input", {
      id: uid("email"), type: "email", class: "gw-input", required: true, autocomplete: "email", placeholder: "you@example.com",
    });
    const nameInput = h("input", { id: uid("name"), type: "text", class: "gw-input", autocomplete: "name" });
    const qtySelect = h("select", { id: uid("qty"), class: "gw-select", "aria-describedby": uid("qty-hint") });
    for (let i = 1; i <= WAITLIST_MAX_SEATS; i++) qtySelect.append(h("option", { value: String(i) }, String(i)));
    const errors = h("div", { class: "gw-errors" });
    const submitButton = h("button", { type: "submit", class: "gw-btn gw-btn-primary" }, "Join waitlist");

    const submit = async (): Promise<void> => {
      errors.replaceChildren();
      const email = emailInput.value.trim();
      if (!EMAIL_RE.test(email)) {
        errors.append(h("div", { class: "gw-error", role: "alert" }, "Enter a valid email address."));
        emailInput.focus();
        return;
      }
      const quantity = Math.min(WAITLIST_MAX_SEATS, Math.max(1, Number(qtySelect.value) || 1));
      const body: WaitlistRequest = { eventId: ev.id, ticketTypeId: tt.id, email, quantity };
      const name = nameInput.value.trim();
      if (name) body.name = name;
      submitButton.disabled = true;
      this.setStatus("Joining the waitlist…");
      try {
        const res = await this.api.joinWaitlist(body);
        this.renderWaitlisted(res.entry, cohort, tt);
      } catch (err) {
        this.setStatus("");
        submitButton.disabled = false;
        errors.replaceChildren(errorBlock(err));
      }
    };

    const form = h("form", { class: "gw-form gw-waitlist", novalidate: true, onsubmit: (e: Event) => { e.preventDefault(); void submit(); } },
      h("div", { class: "gw-field" }, h("label", { class: "gw-label", for: emailInput.id }, "Email"), emailInput),
      h("div", { class: "gw-field" }, h("label", { class: "gw-label", for: nameInput.id }, "Name (optional)"), nameInput),
      h("div", { class: "gw-field" },
        h("label", { class: "gw-label", for: qtySelect.id }, "Seats"),
        qtySelect,
        h("span", { id: uid("qty-hint"), class: "gw-muted" }, `Up to ${WAITLIST_MAX_SEATS}`)),
      errors,
      h("div", { class: "gw-actions" },
        submitButton,
        h("button", { type: "button", class: "gw-btn", onclick: () => this.renderSchedule() }, "Back")),
    );

    this.setStatus("");
    this.body.replaceChildren(
      h("button", { type: "button", class: "gw-link gw-back", onclick: () => this.renderSchedule() }, "← Back to schedule"),
      h("h3", { class: "gw-subtitle" }, `Join the waitlist · ${ev.name}`),
      h("p", { class: "gw-muted" }, `${formatDateRange(ev.startsAt, ev.endsAt, ev.timezone)} · ${tt.name} is sold out. We'll email you if a seat opens up.`),
      form,
    );
    emailInput.focus();
  }

  private renderWaitlisted(entry: WaitlistEntry, cohort: Cohort, tt: TicketType): void {
    const ev = cohort.event;
    this.setStatus("You're on the waitlist");
    this.body.replaceChildren(
      h("div", { class: "gw-success" },
        h("h3", { class: "gw-subtitle" }, "You're on the waitlist"),
        h("p", {}, `You're #${entry.position} on the waitlist. We'll email you when a seat opens; you'll have 24 hours to claim it.`),
        h("p", { class: "gw-muted" }, `${ev.name} · ${formatDateRange(ev.startsAt, ev.endsAt, ev.timezone)} · ${tt.name}`),
        h("div", { class: "gw-actions" },
          h("button", { type: "button", class: "gw-btn", onclick: () => this.renderSchedule() }, "Back to schedule"))),
    );
  }

  /* ---------- Checkout form ---------- */
  private renderCheckout(cohort: Cohort, tt: TicketType): void {
    const ev = cohort.event;
    const currency = this.currency;
    const unit = tt.prices[currency] ?? 0;
    const max = Math.max(1, Math.min(10, tt.remaining));
    const idempotencyKey = uuid(); // one per checkout attempt
    const uid = (s: string): string => `${this.id}-${s}`;
    const drafts: Draft[] = [{ email: "", name: "", company: "" }];
    let quantity = 1;
    let buyerEmail = "";
    let sameAsBuyer = true;
    let firstEmailInput: HTMLInputElement | null = null;

    const qtySelect = h("select", { id: uid("qty"), class: "gw-select", "aria-describedby": uid("qty-hint") });
    for (let i = 1; i <= max; i++) qtySelect.append(h("option", { value: String(i) }, String(i)));
    const buyerInput = h("input", {
      id: uid("buyer"), type: "email", class: "gw-input", required: true, autocomplete: "email", placeholder: "you@example.com",
    });
    const attendeesBox = h("div", { class: "gw-attendees" });
    const summary = h("div", { class: "gw-summary", "aria-live": "polite" });
    const errors = h("div", { class: "gw-errors" });
    const submitButton = h("button", { type: "submit", class: "gw-btn gw-btn-primary" }, unit === 0 ? "Register" : "Continue to payment");

    const syncFirst = (): void => {
      const first = drafts[0];
      if (!first || !firstEmailInput) return;
      firstEmailInput.readOnly = sameAsBuyer;
      if (sameAsBuyer) {
        first.email = buyerEmail;
        firstEmailInput.value = buyerEmail;
      }
    };

    const renderAttendees = (): void => {
      while (drafts.length < quantity) drafts.push({ email: "", name: "", company: "" });
      drafts.length = quantity;
      attendeesBox.replaceChildren();
      drafts.forEach((draft, i) => {
        const emailId = uid(`a${i}-email`);
        const nameId = uid(`a${i}-name`);
        const companyId = uid(`a${i}-company`);
        const email = h("input", { id: emailId, type: "email", class: "gw-input", required: true, autocomplete: "off" });
        email.value = draft.email;
        email.addEventListener("input", () => { draft.email = email.value; });
        const name = h("input", { id: nameId, type: "text", class: "gw-input", autocomplete: "off" });
        name.value = draft.name;
        name.addEventListener("input", () => { draft.name = name.value; });
        const company = h("input", { id: companyId, type: "text", class: "gw-input", autocomplete: "off" });
        company.value = draft.company;
        company.addEventListener("input", () => { draft.company = company.value; });

        const block = h("fieldset", { class: "gw-attendee" },
          h("legend", { class: "gw-legend" }, quantity === 1 ? "Attendee" : `Attendee ${i + 1}`));
        if (i === 0) {
          firstEmailInput = email;
          const checkbox = h("input", { type: "checkbox", id: uid("same") });
          checkbox.checked = sameAsBuyer;
          checkbox.addEventListener("change", () => {
            sameAsBuyer = checkbox.checked;
            syncFirst();
            if (!sameAsBuyer) email.focus();
          });
          block.append(h("label", { class: "gw-check", for: checkbox.id }, checkbox, "Same as buyer"));
        }
        block.append(
          h("div", { class: "gw-field" }, h("label", { class: "gw-label", for: emailId }, "Email"), email),
          h("div", { class: "gw-grid" },
            h("div", { class: "gw-field" }, h("label", { class: "gw-label", for: nameId }, "Name (optional)"), name),
            h("div", { class: "gw-field" }, h("label", { class: "gw-label", for: companyId }, "Company (optional)"), company)),
        );
        attendeesBox.append(block);
      });
      syncFirst();
    };

    const renderSummary = (p: Pricing, cur: string): void => {
      const rows = [row(`${formatMoney(p.unitPriceMinor, cur)} × ${p.quantity}`, formatMoney(p.subtotalMinor, cur))];
      if (p.attendeeFeeMinor > 0) rows.push(row("Service fee", formatMoney(p.attendeeFeeMinor, cur)));
      rows.push(row("Total", formatMoney(p.totalMinor, cur), true));
      summary.replaceChildren(...rows);
    };

    let pricingSeq = 0;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    const refreshPricing = async (): Promise<void> => {
      const mine = ++pricingSeq;
      summary.replaceChildren(h("p", { class: "gw-muted" }, "Calculating price…"));
      try {
        const res = await this.api.createOrder(this.orderBody(tt, currency, quantity, buyerEmail, drafts, true), uuid());
        if (mine !== pricingSeq) return;
        renderSummary(res.order.pricing, res.order.currency);
      } catch (err) {
        if (mine !== pricingSeq) return;
        summary.replaceChildren(errorBlock(err));
      }
    };
    const schedulePricing = (): void => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => { void refreshPricing(); }, config.debounceMs);
    };

    qtySelect.addEventListener("change", () => {
      quantity = Math.min(max, Math.max(1, Number(qtySelect.value) || 1));
      renderAttendees();
      schedulePricing();
    });
    buyerInput.addEventListener("input", () => {
      buyerEmail = buyerInput.value.trim();
      syncFirst();
    });

    const submit = async (): Promise<void> => {
      errors.replaceChildren();
      buyerEmail = buyerInput.value.trim();
      syncFirst();
      if (!EMAIL_RE.test(buyerEmail)) {
        errors.append(h("div", { class: "gw-error", role: "alert" }, "Enter a valid email address for the buyer."));
        buyerInput.focus();
        return;
      }
      const bad = drafts.findIndex((d) => !EMAIL_RE.test(d.email.trim()));
      if (bad >= 0) {
        errors.append(h("div", { class: "gw-error", role: "alert" }, `Enter a valid email address for attendee ${bad + 1}.`));
        return;
      }
      submitButton.disabled = true;
      this.setStatus("Creating your order…");
      try {
        const res = await this.api.createOrder(this.orderBody(tt, currency, quantity, buyerEmail, drafts, false), idempotencyKey);
        await this.afterOrder(res, { cohort, ticket: tt, quantity, buyerEmail, attendees: toAttendees(drafts) });
      } catch (err) {
        this.setStatus("");
        submitButton.disabled = false;
        errors.replaceChildren(errorBlock(err));
      }
    };

    const form = h("form", { class: "gw-form", novalidate: true, onsubmit: (e: Event) => { e.preventDefault(); void submit(); } },
      h("div", { class: "gw-field" },
        h("label", { class: "gw-label", for: qtySelect.id }, "Seats"),
        qtySelect,
        h("span", { id: uid("qty-hint"), class: "gw-muted" }, `Up to ${max} per order`)),
      h("div", { class: "gw-field" },
        h("label", { class: "gw-label", for: buyerInput.id }, "Your email (receipt and confirmation)"),
        buyerInput),
      attendeesBox,
      summary,
      errors,
      submitButton,
    );

    this.setStatus("");
    this.body.replaceChildren(
      h("button", { type: "button", class: "gw-link gw-back", onclick: () => this.renderSchedule() }, "← Back to schedule"),
      h("h3", { class: "gw-subtitle" }, ev.name),
      h("p", { class: "gw-muted" }, `${formatDateRange(ev.startsAt, ev.endsAt, ev.timezone)} · ${tt.name} · ${formatMoney(unit, currency)} per seat`),
      form,
    );
    renderAttendees();
    void refreshPricing();
    buyerInput.focus();
  }

  private orderBody(tt: TicketType, currency: string, quantity: number, buyerEmail: string, drafts: readonly Draft[], dryRun: boolean): OrderRequest {
    const attendees = toAttendees(drafts).map((a) => (dryRun && !a.email ? { ...a, email: PLACEHOLDER_EMAIL } : a));
    const body: OrderRequest = { ticketTypeId: tt.id, quantity, currency, buyerEmail: buyerEmail || (dryRun ? PLACEHOLDER_EMAIL : ""), attendees, dryRun };
    if (this.waitlistEntryId) body.waitlistEntryId = this.waitlistEntryId;
    return body;
  }

  /* ---------- After the order is created ---------- */
  private async afterOrder(res: OrderResponse, ctx: CheckoutContext): Promise<void> {
    const { order, clientSecret } = res;
    if (order.status === "paid" || (clientSecret === null && order.pricing.totalMinor === 0)) {
      this.renderSuccess(order, ctx);
      return;
    }
    if (clientSecret && this.opts.stripePk) {
      await this.renderStripePayment(res, clientSecret, this.opts.stripePk, ctx);
      return;
    }
    if (clientSecret) {
      this.renderTestMode(order, ctx);
      return;
    }
    await this.confirm(order, ctx);
  }

  private async renderStripePayment(res: OrderResponse, clientSecret: string, publishableKey: string, ctx: CheckoutContext): Promise<void> {
    const total = formatMoney(res.order.pricing.totalMinor, res.order.currency);
    const container = h("div", { class: "gw-payment-element" });
    const errors = h("div", { class: "gw-errors" });
    const payButton = h("button", { type: "button", class: "gw-btn gw-btn-primary", disabled: true }, `Pay ${total}`);
    this.body.replaceChildren(
      h("h3", { class: "gw-subtitle" }, "Payment"),
      h("p", { class: "gw-muted" }, `${ctx.cohort.event.name} · ${ctx.ticket.name} × ${ctx.quantity} · Total ${total}`),
      container, errors, payButton,
    );
    this.setStatus("Loading secure payment form…");
    try {
      const stripe = (await loadStripe())(publishableKey);
      const elements = stripe.elements({ clientSecret, appearance: { theme: prefersDark() ? "night" : "stripe" } });
      elements.create("payment").mount(container);
      this.setStatus("");
      payButton.disabled = false;
      payButton.addEventListener("click", async () => {
        errors.replaceChildren();
        payButton.disabled = true;
        this.setStatus("Processing payment…");
        try {
          const result = await stripe.confirmPayment({ elements, redirect: "if_required" });
          if (result.error) {
            errors.append(h("div", { class: "gw-error", role: "alert" }, result.error.message ?? "Payment was not completed."));
            payButton.disabled = false;
            this.setStatus("");
            return;
          }
          await this.confirm(res.order, ctx);
        } catch (err) {
          errors.replaceChildren(errorBlock(err));
          payButton.disabled = false;
          this.setStatus("");
        }
      });
    } catch {
      this.setStatus("");
      errors.append(h("div", { class: "gw-error", role: "alert" }, "Couldn't load the payment form. Please reload the page and try again."));
    }
  }

  private renderTestMode(order: Order, ctx: CheckoutContext): void {
    const total = formatMoney(order.pricing.totalMinor, order.currency);
    const errors = h("div", { class: "gw-errors" });
    const button = h("button", { type: "button", class: "gw-btn gw-btn-primary" }, "Simulate payment (test mode)");
    button.addEventListener("click", async () => {
      errors.replaceChildren();
      button.disabled = true;
      try {
        if (!order.paymentRef) throw new Error("This order has no payment reference to simulate.");
        this.setStatus("Simulating payment…");
        await this.api.simulatePayment(order.paymentRef);
        await this.confirm(order, ctx);
      } catch (err) {
        this.setStatus("");
        button.disabled = false;
        errors.replaceChildren(errorBlock(err));
      }
    });
    this.setStatus("");
    this.body.replaceChildren(
      h("h3", { class: "gw-subtitle" }, "Payment"),
      h("p", { class: "gw-muted" }, `${ctx.cohort.event.name} · ${ctx.ticket.name} × ${ctx.quantity} · Total ${total}`),
      h("p", { class: "gw-note" }, "Test mode: no payment key is configured, so no real card is charged."),
      errors,
      button,
    );
  }

  /* ---------- Poll until paid ---------- */
  private async confirm(order: Order, ctx: CheckoutContext): Promise<void> {
    this.setStatus("Confirming…");
    this.body.replaceChildren(
      h("p", { class: "gw-confirming" }, h("span", { class: "gw-spinner", "aria-hidden": "true" }), "Confirming your payment…"),
    );
    const deadline = Date.now() + config.pollTimeoutMs;
    let latest = order;
    for (;;) {
      try {
        latest = (await this.api.getOrder(order.id, ctx.buyerEmail)).order;
      } catch {
        /* transient; keep polling until the deadline */
      }
      if (latest.status === "paid") {
        this.renderSuccess(latest, ctx);
        return;
      }
      if (latest.status === "failed") {
        this.renderOutcome("Payment failed", "The payment was declined or could not be completed. No seats were reserved.", ctx);
        return;
      }
      if (Date.now() >= deadline) break;
      await sleep(config.pollIntervalMs);
    }
    this.setStatus("");
    this.body.replaceChildren(
      h("h3", { class: "gw-subtitle" }, "Still confirming"),
      h("p", { class: "gw-muted" }, `We haven't received payment confirmation yet. Your order id is ${order.id}; you'll get an email as soon as it's confirmed.`),
      h("div", { class: "gw-actions" },
        h("button", { type: "button", class: "gw-btn gw-btn-primary", onclick: () => { void this.confirm(latest, ctx); } }, "Check again"),
        h("button", { type: "button", class: "gw-btn", onclick: () => { void this.load(); } }, "Back to schedule")),
    );
  }

  private renderOutcome(title: string, message: string, ctx: CheckoutContext): void {
    this.setStatus(title);
    this.body.replaceChildren(
      h("h3", { class: "gw-subtitle" }, title),
      h("div", { class: "gw-error", role: "alert" }, message),
      h("div", { class: "gw-actions" },
        h("button", { type: "button", class: "gw-btn gw-btn-primary", onclick: () => this.renderCheckout(ctx.cohort, ctx.ticket) }, "Try again"),
        h("button", { type: "button", class: "gw-btn", onclick: () => { void this.load(); } }, "Back to schedule")),
    );
  }

  /* ---------- Success ---------- */
  private renderSuccess(order: Order, ctx: CheckoutContext): void {
    const ev = ctx.cohort.event;
    const seats = h("ul", { class: "gw-seatlist" });
    ctx.attendees.forEach((a, i) => {
      const extra = [a.name, a.company].filter(Boolean).join(", ");
      seats.append(h("li", {}, h("strong", {}, `Seat ${i + 1}: `), a.email, extra ? ` (${extra})` : ""));
    });
    this.setStatus("Registration complete");
    this.body.replaceChildren(
      h("div", { class: "gw-success" },
        h("h3", { class: "gw-subtitle" }, "You're registered"),
        h("p", { class: "gw-muted" }, "Order ", h("code", {}, order.id)),
        h("p", {}, h("strong", {}, ev.name)),
        h("p", { class: "gw-muted" }, `${formatDateRange(ev.startsAt, ev.endsAt, ev.timezone)} · ${ctx.ticket.name} × ${ctx.quantity}`),
        seats,
        h("p", { class: "gw-note" }, "Confirmation emails with calendar invites are on their way to each attendee."),
        h("div", { class: "gw-actions" },
          h("button", { type: "button", class: "gw-btn", onclick: () => { void this.load(); } }, "Back to schedule"))),
    );
  }
}

export function mount(host: HTMLElement, options: WidgetOptions): Widget {
  return new Widget(host, options);
}
