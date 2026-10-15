import { createHash, randomBytes } from "node:crypto";
import { allocate, assertCurrency, type Ledger, type MinorUnits, type Posting } from "@gate/ledger";
import { computeSplits, priceOrder, type PayoutDestination, type SplitRule } from "@gate/pricing";
import { ChartOfAccounts } from "./accounts.js";
import { DomainError, notFound } from "./errors.js";
import type { CoreHooks, HookFailure } from "./hooks.js";
import type { Clock, IdGenerator, PaymentEvent, PaymentsPort, Repos, TaxPort } from "./ports.js";
import { NO_TAX } from "./tax.js";
import type { Attendee, BillingAddress, CorporateAccount, Course, DeliveryFormat, Event, Invoice, InvoicePaymentMethod, Order, Organization, Party, PartyKind, PriceTier, Refund, Seat, Session, TicketType } from "./types.js";

export interface CoreDeps {
  repos: Repos;
  ledger: Ledger;
  payments: PaymentsPort;
  clock?: Clock;
  ids?: IdGenerator;
  hooks?: CoreHooks[];
  onHookFailure?: (failure: HookFailure) => void;
  tax?: TaxPort;
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

const defaultClock: Clock = { now: () => new Date() };
const defaultIds: IdGenerator = {
  next: (prefix) => `${prefix}_${randomBytes(9).toString("base64url")}`,
};

export class Core {
  readonly repos: Repos;
  readonly ledger: Ledger;
  readonly payments: PaymentsPort;
  readonly tax: TaxPort;
  readonly accounts: ChartOfAccounts;
  private readonly clock: Clock;
  private readonly ids: IdGenerator;
  private readonly hooks: CoreHooks[];
  private readonly onHookFailure: (failure: HookFailure) => void;
  readonly hookFailures: HookFailure[] = [];

  constructor(deps: CoreDeps) {
    this.repos = deps.repos;
    this.ledger = deps.ledger;
    this.payments = deps.payments;
    this.tax = deps.tax ?? NO_TAX;
    this.accounts = new ChartOfAccounts(deps.ledger);
    this.clock = deps.clock ?? defaultClock;
    this.ids = deps.ids ?? defaultIds;
    this.hooks = deps.hooks ?? [];
    this.onHookFailure = deps.onHookFailure ?? ((f) => { this.hookFailures.push(f); });
  }

  private async runHooks<K extends keyof CoreHooks>(name: K, orderId: string, run: (hook: NonNullable<CoreHooks[K]>) => Promise<void>): Promise<void> {
    for (const h of this.hooks) {
      const fn = h[name];
      if (!fn) continue;
      try {
        await run(fn as NonNullable<CoreHooks[K]>);
      } catch (err) {
        this.onHookFailure({ hook: name, orderId, error: (err as Error).message, at: this.clock.now() });
      }
    }
  }

  // ---------- Organizations ----------

  async createOrganization(input: {
    name: string;
    country: string;
    currency: string;
    payoutDestination?: PayoutDestination | undefined;
    passFeeToAttendee?: boolean | undefined;
    splitRules?: SplitRule[] | undefined;
    /** Dev/bootstrap only: fix the API key instead of generating one. */
    apiKey?: string | undefined;
  }): Promise<{ organization: Organization; apiKey: string }> {
    assertCurrency(input.currency);
    if (!/^[A-Z]{2}$/.test(input.country)) throw new DomainError("VALIDATION", "country must be ISO 3166-1 alpha-2");
    if (!input.name.trim()) throw new DomainError("VALIDATION", "name is required");
    const apiKey = input.apiKey ?? `gk_${input.country === "US" ? "us" : "x"}_${randomBytes(24).toString("base64url")}`;
    const organization: Organization = {
      id: this.ids.next("org"),
      name: input.name.trim(),
      country: input.country,
      currency: input.currency,
      payoutDestination: input.payoutDestination ?? "gate_account",
      passFeeToAttendee: input.passFeeToAttendee ?? false,
      splitRules: input.splitRules ?? [],
      apiKeyHash: hashApiKey(apiKey),
      createdAt: this.clock.now(),
    };
    await this.repos.organizations.create(organization);
    await this.accounts.orgPayable(organization.id, organization.currency);
    return { organization, apiKey };
  }

  async authenticate(apiKey: string | undefined): Promise<Organization> {
    if (!apiKey) throw new DomainError("UNAUTHORIZED", "missing x-api-key");
    const org = await this.repos.organizations.getByApiKeyHash(hashApiKey(apiKey));
    if (!org) throw new DomainError("UNAUTHORIZED", "invalid api key");
    return org;
  }

  async getOrganization(id: string): Promise<Organization> {
    const org = await this.repos.organizations.get(id);
    if (!org) throw notFound("organization", id);
    return org;
  }

  async connectPayments(organizationId: string, email?: string | undefined): Promise<Organization & { onboardingUrl?: string }> {
    const org = await this.getOrganization(organizationId);
    if (org.paymentsAccountRef) return org;
    const res = await this.payments.createConnectedAccount({
      organizationId: org.id,
      country: org.country,
      businessName: org.name,
      ...(email ? { email } : {}),
    });
    const updated: Organization = { ...org, paymentsAccountRef: res.accountRef };
    await this.repos.organizations.update(updated);
    return { ...updated, ...(res.onboardingUrl ? { onboardingUrl: res.onboardingUrl } : {}) };
  }

  async createParty(organizationId: string, input: { name: string; kind: PartyKind; paymentsAccountRef?: string | undefined }): Promise<Party> {
    await this.getOrganization(organizationId);
    const party: Party = {
      id: this.ids.next("party"),
      organizationId,
      name: input.name,
      kind: input.kind,
      ...(input.paymentsAccountRef ? { paymentsAccountRef: input.paymentsAccountRef } : {}),
      createdAt: this.clock.now(),
    };
    await this.repos.parties.create(party);
    return party;
  }

  listParties(organizationId: string): Promise<Party[]> {
    return this.repos.parties.listByOrganization(organizationId);
  }

  // ---------- Courses ----------

  async createCourse(organizationId: string, input: { slug: string; name: string; description?: string | undefined; certificationBody?: string | undefined; durationDays?: number | undefined }): Promise<Course> {
    await this.getOrganization(organizationId);
    const slug = input.slug.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new DomainError("VALIDATION", "slug must be lowercase letters, digits and hyphens");
    if (!input.name.trim()) throw new DomainError("VALIDATION", "name is required");
    if (await this.repos.courses.getBySlug(organizationId, slug)) throw new DomainError("CONFLICT", `course slug ${slug} already exists`);
    if (input.durationDays !== undefined && (!Number.isSafeInteger(input.durationDays) || input.durationDays <= 0)) throw new DomainError("VALIDATION", "durationDays must be a positive integer");
    const course: Course = {
      id: this.ids.next("crs"),
      organizationId,
      slug,
      name: input.name.trim(),
      ...(input.description ? { description: input.description } : {}),
      ...(input.certificationBody ? { certificationBody: input.certificationBody } : {}),
      ...(input.durationDays !== undefined ? { durationDays: input.durationDays } : {}),
      createdAt: this.clock.now(),
    };
    await this.repos.courses.create(course);
    return course;
  }

  async getCourse(organizationId: string, courseId: string): Promise<Course> {
    const c = await this.repos.courses.get(courseId);
    if (!c || c.organizationId !== organizationId) throw notFound("course", courseId);
    return c;
  }

  async getCourseBySlug(organizationId: string, slug: string): Promise<Course> {
    const c = await this.repos.courses.getBySlug(organizationId, slug);
    if (!c) throw notFound("course", slug);
    return c;
  }

  listCourses(organizationId: string): Promise<Course[]> {
    return this.repos.courses.listByOrganization(organizationId);
  }

  async listCohorts(organizationId: string, courseId: string): Promise<Event[]> {
    await this.getCourse(organizationId, courseId);
    return this.repos.events.listByCourse(courseId);
  }

  // ---------- Events (cohorts) & tickets ----------

  async createEvent(
    organizationId: string,
    input: {
      name: string;
      startsAt?: Date | undefined;
      currency?: string | undefined;
      splitRules?: SplitRule[] | undefined;
      courseId?: string | undefined;
      timezone?: string | undefined;
      format?: DeliveryFormat | undefined;
      sessions?: Session[] | undefined;
      instructorIds?: string[] | undefined;
      minEnrollment?: number | undefined;
    },
  ): Promise<Event> {
    const org = await this.getOrganization(organizationId);
    const currency = input.currency ?? org.currency;
    assertCurrency(currency);
    if (!input.name.trim()) throw new DomainError("VALIDATION", "name is required");
    const sessions = [...(input.sessions ?? [])].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    for (const s of sessions) {
      if (Number.isNaN(s.startsAt.getTime()) || Number.isNaN(s.endsAt.getTime())) throw new DomainError("VALIDATION", "session dates must be valid");
      if (s.endsAt <= s.startsAt) throw new DomainError("VALIDATION", "session endsAt must be after startsAt");
    }
    const startsAt = input.startsAt ?? sessions[0]?.startsAt;
    if (!startsAt || Number.isNaN(startsAt.getTime())) throw new DomainError("VALIDATION", "startsAt or at least one session is required");
    const endsAt = sessions.length ? sessions[sessions.length - 1]!.endsAt : undefined;
    const timezone = input.timezone ?? "UTC";
    if (!isValidTimeZone(timezone)) throw new DomainError("VALIDATION", `unknown time zone ${timezone}`);
    if (input.courseId) await this.getCourse(organizationId, input.courseId);
    if (input.minEnrollment !== undefined && (!Number.isSafeInteger(input.minEnrollment) || input.minEnrollment < 0)) throw new DomainError("VALIDATION", "minEnrollment must be a non-negative integer");
    for (const id of input.instructorIds ?? []) {
      const party = await this.repos.parties.get(id);
      if (!party || party.organizationId !== organizationId || party.kind !== "instructor") throw new DomainError("VALIDATION", `unknown instructor ${id}`);
    }
    if (input.splitRules) {
      for (const r of input.splitRules) {
        const party = await this.repos.parties.get(r.partyId);
        if (!party || party.organizationId !== organizationId) throw new DomainError("VALIDATION", `unknown split party ${r.partyId}`);
      }
    }
    const event: Event = {
      id: this.ids.next("evt"),
      organizationId,
      ...(input.courseId ? { courseId: input.courseId } : {}),
      name: input.name.trim(),
      startsAt,
      ...(endsAt ? { endsAt } : {}),
      timezone,
      format: input.format ?? "live_virtual",
      sessions,
      instructorIds: input.instructorIds ?? [],
      ...(input.minEnrollment !== undefined ? { minEnrollment: input.minEnrollment } : {}),
      currency,
      status: "live",
      ...(input.splitRules ? { splitRules: input.splitRules } : {}),
      createdAt: this.clock.now(),
    };
    await this.repos.events.create(event);
    return event;
  }

  async getEvent(organizationId: string, eventId: string): Promise<Event> {
    const e = await this.repos.events.get(eventId);
    if (!e || e.organizationId !== organizationId) throw notFound("event", eventId);
    return e;
  }

  listEvents(organizationId: string): Promise<Event[]> {
    return this.repos.events.listByOrganization(organizationId);
  }

  async createTicketType(
    organizationId: string,
    eventId: string,
    input: { name: string; priceMinor: MinorUnits; quantity: number; prices?: Record<string, MinorUnits> | undefined; earlyBird?: PriceTier | undefined },
  ): Promise<TicketType> {
    await this.getEvent(organizationId, eventId);
    if (!Number.isSafeInteger(input.priceMinor) || input.priceMinor < 0) throw new DomainError("VALIDATION", "priceMinor must be a non-negative integer");
    if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) throw new DomainError("VALIDATION", "quantity must be a positive integer");
    const prices = validatePriceList(input.prices);
    const earlyBird = input.earlyBird
      ? { until: input.earlyBird.until, priceMinor: input.earlyBird.priceMinor, ...(validatePriceList(input.earlyBird.prices) ? { prices: validatePriceList(input.earlyBird.prices)! } : {}) }
      : undefined;
    if (earlyBird) {
      if (Number.isNaN(earlyBird.until.getTime())) throw new DomainError("VALIDATION", "earlyBird.until must be a valid date");
      if (!Number.isSafeInteger(earlyBird.priceMinor) || earlyBird.priceMinor < 0) throw new DomainError("VALIDATION", "earlyBird.priceMinor must be a non-negative integer");
    }
    const t: TicketType = {
      id: this.ids.next("tt"), eventId, organizationId, name: input.name, priceMinor: input.priceMinor,
      ...(prices ? { prices } : {}), ...(earlyBird ? { earlyBird } : {}), quantity: input.quantity, sold: 0,
    };
    await this.repos.ticketTypes.create(t);
    return t;
  }

  /**
   * The unit price a buyer pays right now in a currency: early-bird tier while
   * its window is open, else the list price. Base currency always resolves;
   * other currencies only when the ticket lists them (no silent FX).
   */
  resolveUnitPrice(ticketType: TicketType, event: Event, currency: string, now = this.clock.now()): MinorUnits {
    assertCurrency(currency);
    const pick = (base: MinorUnits, prices?: Record<string, MinorUnits>): MinorUnits | undefined => {
      if (currency === event.currency) return prices?.[currency] ?? base;
      return prices?.[currency];
    };
    let price: MinorUnits | undefined;
    if (ticketType.earlyBird && now < ticketType.earlyBird.until) price = pick(ticketType.earlyBird.priceMinor, ticketType.earlyBird.prices);
    if (price === undefined) price = pick(ticketType.priceMinor, ticketType.prices);
    if (price === undefined) {
      throw new DomainError("VALIDATION", `ticket ${ticketType.id} is not sold in ${currency}`, `available: ${[event.currency, ...Object.keys(ticketType.prices ?? {})].join(", ")}`);
    }
    return price;
  }

  /** Public catalogue view of a course: cohorts with resolved prices per currency. */
  async publicCourse(organizationId: string, slug: string) {
    const org = await this.getOrganization(organizationId);
    const course = await this.getCourseBySlug(organizationId, slug);
    const now = this.clock.now();
    const cohorts = (await this.repos.events.listByCourse(course.id)).filter((e) => e.status === "live" && (e.endsAt ?? e.startsAt) >= now);
    const out = [];
    for (const event of cohorts) {
      const ticketTypes = await this.repos.ticketTypes.listByEvent(event.id);
      out.push({
        event,
        ticketTypes: ticketTypes.map((t) => {
          const currencies = [event.currency, ...Object.keys(t.prices ?? {}), ...Object.keys(t.earlyBird?.prices ?? {})];
          const prices: Record<string, MinorUnits> = {};
          for (const c of new Set(currencies)) {
            try { prices[c] = this.resolveUnitPrice(t, event, c, now); } catch { /* not sold in c */ }
          }
          return { id: t.id, name: t.name, remaining: t.quantity - t.sold, prices, earlyBirdUntil: t.earlyBird && now < t.earlyBird.until ? t.earlyBird.until : null };
        }),
      });
    }
    return { organization: { id: org.id, name: org.name, country: org.country, currency: org.currency }, course, cohorts: out };
  }

  async listTicketTypes(organizationId: string, eventId: string): Promise<TicketType[]> {
    await this.getEvent(organizationId, eventId);
    return this.repos.ticketTypes.listByEvent(eventId);
  }

  // ---------- Checkout ----------

  async createOrder(
    organizationId: string,
    input: {
      ticketTypeId: string;
      quantity: number;
      buyerEmail: string;
      /** Currency the buyer pays in; defaults to the cohort's base currency. */
      currency?: string | undefined;
      /** One per seat, in order. Missing entries default to the buyer. */
      attendees?: Attendee[] | undefined;
      /** Enables tax calculation; without it tax is not calculated. */
      billingAddress?: BillingAddress | undefined;
      idempotencyKey?: string | undefined;
      dryRun?: boolean | undefined;
    },
  ): Promise<{ order: Order; clientSecret: string | null; created: boolean }> {
    const org = await this.getOrganization(organizationId);
    if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0 || input.quantity > 100) {
      throw new DomainError("VALIDATION", "quantity must be an integer between 1 and 100");
    }
    if (!isEmail(input.buyerEmail)) throw new DomainError("VALIDATION", "buyerEmail is invalid");
    if (input.attendees && input.attendees.length > input.quantity) throw new DomainError("VALIDATION", "more attendees than seats");
    for (const a of input.attendees ?? []) if (!isEmail(a.email)) throw new DomainError("VALIDATION", `attendee email ${a.email} is invalid`);

    if (input.idempotencyKey) {
      const prior = await this.repos.orders.getByIdempotencyKey(organizationId, input.idempotencyKey);
      if (prior) return { order: prior, clientSecret: null, created: false };
    }

    const ticketType = await this.repos.ticketTypes.get(input.ticketTypeId);
    if (!ticketType || ticketType.organizationId !== organizationId) throw notFound("ticketType", input.ticketTypeId);
    const event = await this.getEvent(organizationId, ticketType.eventId);
    if (event.status !== "live") throw new DomainError("INVALID_STATE", `event is ${event.status}`);

    const currency = input.currency ?? event.currency;
    const unitPriceMinor = this.resolveUnitPrice(ticketType, event, currency);
    const pricing = await this.priceWithTax({ org, currency, unitPriceMinor, quantity: input.quantity, billingAddress: input.billingAddress, businessCustomer: false });
    const splits = computeSplits(pricing.organizerNetMinor, org.id, event.splitRules ?? org.splitRules);
    const attendees: Attendee[] = Array.from({ length: input.quantity }, (_, i) => input.attendees?.[i] ?? { email: input.buyerEmail });

    const order: Order = {
      id: this.ids.next("ord"),
      organizationId,
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity: input.quantity,
      buyerEmail: input.buyerEmail,
      attendees,
      currency,
      status: "pending",
      paymentMethod: "card",
      ...(input.billingAddress ? { billingAddress: input.billingAddress } : {}),
      pricing,
      splits,
      transferRefs: {},
      refundedMinor: 0,
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
      createdAt: this.clock.now(),
    };

    if (input.dryRun) return { order, clientSecret: null, created: false };

    const reserved = await this.repos.ticketTypes.reserve(ticketType.id, input.quantity);
    if (!reserved) throw new DomainError("SOLD_OUT", `only ${ticketType.quantity - ticketType.sold} left`, "lower the quantity");

    let paymentRef: string;
    let clientSecret: string | null;
    try {
      if (pricing.totalMinor === 0) {
        // Free order: no payment needed, settle immediately.
        paymentRef = `free_${order.id}`;
        clientSecret = null;
      } else {
        const p = await this.payments.createPayment({
          orderId: order.id,
          amountMinor: pricing.totalMinor,
          currency: order.currency,
          transferGroup: order.id,
          buyerEmail: input.buyerEmail,
          metadata: { orderId: order.id, organizationId, eventId: event.id },
        });
        paymentRef = p.paymentRef;
        clientSecret = p.clientSecret;
      }
    } catch (err) {
      await this.repos.ticketTypes.release(ticketType.id, input.quantity);
      throw new DomainError("PAYMENTS_UPSTREAM", `payments provider error: ${(err as Error).message}`);
    }

    order.paymentRef = paymentRef;
    try {
      await this.repos.orders.create(order);
    } catch (err) {
      // Never leak reserved inventory: a failed persist gives the seats back.
      await this.repos.ticketTypes.release(ticketType.id, input.quantity);
      throw err;
    }
    if (pricing.totalMinor === 0) await this.markPaid(order);
    return { order: (await this.repos.orders.get(order.id)) ?? order, clientSecret, created: true };
  }

  async getOrder(organizationId: string, orderId: string): Promise<Order> {
    const o = await this.repos.orders.get(orderId);
    if (!o || o.organizationId !== organizationId) throw notFound("order", orderId);
    return o;
  }

  listOrders(organizationId: string, limit?: number): Promise<Order[]> {
    return this.repos.orders.listByOrganization(organizationId, limit);
  }

  // ---------- Provider events (webhooks) ----------

  async handlePaymentEvent(event: PaymentEvent): Promise<{ handled: boolean; reason?: string }> {
    const fresh = await this.repos.processedEvents.record(event.providerEventId);
    if (!fresh) return { handled: false, reason: "duplicate" };
    switch (event.type) {
      case "payment.succeeded": {
        const invoice = await this.repos.invoices.getByCardPaymentRef(event.paymentRef);
        if (invoice) {
          if (invoice.status === "paid" || invoice.status === "void") return { handled: false, reason: `invoice is ${invoice.status}` };
          await this.recordInvoicePayment(invoice.organizationId, { invoiceId: invoice.id, amountMinor: event.amountMinor, method: "card", reference: event.paymentRef, viaCardRef: event.paymentRef });
          return { handled: true };
        }
        const order = await this.repos.orders.getByPaymentRef(event.paymentRef);
        if (!order) return { handled: false, reason: "unknown payment" };
        if (order.status !== "pending") return { handled: false, reason: `order is ${order.status}` };
        if (event.amountMinor !== order.pricing.totalMinor || event.currency !== order.currency) {
          throw new DomainError("CONFLICT", `payment ${event.paymentRef} amount ${event.amountMinor} ${event.currency} does not match order ${order.pricing.totalMinor} ${order.currency}`);
        }
        await this.markPaid(order);
        return { handled: true };
      }
      case "payment.failed": {
        const invoice = await this.repos.invoices.getByCardPaymentRef(event.paymentRef);
        if (invoice) {
          const { cardPaymentRef: _drop, ...rest } = invoice;
          await this.repos.invoices.update(rest as Invoice);
          return { handled: true };
        }
        const order = await this.repos.orders.getByPaymentRef(event.paymentRef);
        if (!order || order.status !== "pending") return { handled: false, reason: "no pending order" };
        await this.repos.ticketTypes.release(order.ticketTypeId, order.quantity);
        await this.repos.orders.update({ ...order, status: "failed" });
        return { handled: true };
      }
      case "refund.succeeded": {
        const refund = await this.repos.refunds.getByProviderRef(event.refundRef);
        if (!refund) return { handled: false, reason: "unknown refund" };
        if (refund.status === "succeeded") return { handled: false, reason: "already settled" };
        await this.settleRefund(refund);
        return { handled: true };
      }
      case "refund.failed": {
        const refund = await this.repos.refunds.getByProviderRef(event.refundRef);
        if (!refund) return { handled: false, reason: "unknown refund" };
        await this.repos.refunds.update({ ...refund, status: "failed" });
        return { handled: true };
      }
      case "ignored":
        return { handled: false, reason: `ignored ${event.providerType}` };
    }
  }

  /**
   * Settle a paid order into the ledger. `cash` describes where the money
   * sits: the card processor's clearing account by default, or a mix of bank
   * clearing and previously held customer deposits for invoice payments.
   */
  private async markPaid(order: Order, cash?: Posting[]): Promise<void> {
    const ccy = order.currency;
    const org = await this.getOrganization(order.organizationId);
    const clearing = await this.accounts.clearing(ccy);
    const fees = await this.accounts.feeRevenue(ccy);
    const orgPayable = await this.accounts.orgPayable(org.id, ccy);

    const postings: Posting[] = cash ?? [{ accountId: clearing.id, amount: order.pricing.totalMinor }];
    if (order.splits.organizerMinor > 0) postings.push({ accountId: orgPayable.id, amount: -order.splits.organizerMinor });
    for (const line of order.splits.lines) {
      if (line.amountMinor === 0) continue;
      const acct = await this.accounts.partyPayable(org.id, line.partyId, ccy);
      postings.push({ accountId: acct.id, amount: -line.amountMinor });
    }
    if (order.pricing.platformFeeMinor > 0) postings.push({ accountId: fees.id, amount: -order.pricing.platformFeeMinor });
    if (order.pricing.taxMinor > 0) postings.push({ accountId: (await this.accounts.taxPayable(org.id, ccy)).id, amount: -order.pricing.taxMinor });

    if (order.pricing.totalMinor > 0) {
      await this.ledger.post({
        idempotencyKey: `order:${order.id}:paid`,
        currency: ccy,
        description: `Order ${order.id} paid (${order.quantity} x ${order.ticketTypeId})`,
        postings,
        metadata: { orderId: order.id, organizationId: org.id, eventId: order.eventId, paymentRef: order.paymentRef ?? "" },
      });
    }

    // Separate charges and transfers: move each party's share to its connected account.
    // Invoice cash lives in the platform bank account, so it pays out through payouts (sprint 6), not transfers.
    const transferRefs: Record<string, string> = { ...order.transferRefs };
    if (order.paymentRef && order.pricing.totalMinor > 0 && order.paymentMethod === "card") {
      const targets: Array<{ key: string; accountRef: string | undefined; amount: number }> = [
        { key: org.id, accountRef: org.paymentsAccountRef, amount: order.splits.organizerMinor },
      ];
      for (const line of order.splits.lines) {
        const party = await this.repos.parties.get(line.partyId);
        targets.push({ key: line.partyId, accountRef: party?.paymentsAccountRef, amount: line.amountMinor });
      }
      for (const t of targets) {
        if (!t.accountRef || t.amount <= 0 || transferRefs[t.key]) continue;
        const res = await this.payments.createTransfer({
          idempotencyKey: `transfer:${order.id}:${t.key}`,
          paymentRef: order.paymentRef,
          destinationAccountRef: t.accountRef,
          amountMinor: t.amount,
          currency: ccy,
          transferGroup: order.id,
        });
        transferRefs[t.key] = res.transferRef;
      }
    }

    await this.repos.orders.update({ ...order, status: "paid", paidAt: this.clock.now(), transferRefs });

    // One confirmed seat per learner (invoice orders reserved them at creation).
    const seats: Seat[] = await this.repos.seats.listByOrder(order.id);
    for (const [i, seat] of seats.entries()) {
      if (seat.status === "reserved") {
        const confirmed: Seat = { ...seat, status: "confirmed", confirmedAt: this.clock.now() };
        await this.repos.seats.update(confirmed);
        seats[i] = confirmed;
      }
    }
    if (seats.length === 0) {
      for (const attendee of order.attendees) {
        const seat: Seat = {
          id: this.ids.next("seat"),
          organizationId: order.organizationId,
          orderId: order.id,
          eventId: order.eventId,
          ticketTypeId: order.ticketTypeId,
          attendee,
          status: "confirmed",
          createdAt: this.clock.now(),
          confirmedAt: this.clock.now(),
        };
        await this.repos.seats.create(seat);
        seats.push(seat);
      }
    }

    const paidOrder = (await this.repos.orders.get(order.id)) ?? order;
    const event = await this.repos.events.get(order.eventId);
    const ticketType = await this.repos.ticketTypes.get(order.ticketTypeId);
    if (event && ticketType) {
      const course = event.courseId ? await this.repos.courses.get(event.courseId) : undefined;
      await this.runHooks("orderPaid", order.id, (hook) => hook({ organization: org, order: paidOrder, event, course, ticketType, seats }));
    }
  }

  async listSeats(organizationId: string, filter: { eventId?: string | undefined; orderId?: string | undefined }): Promise<Seat[]> {
    if (filter.orderId) {
      await this.getOrder(organizationId, filter.orderId);
      return this.repos.seats.listByOrder(filter.orderId);
    }
    if (filter.eventId) {
      await this.getEvent(organizationId, filter.eventId);
      return this.repos.seats.listByEvent(filter.eventId);
    }
    throw new DomainError("VALIDATION", "eventId or orderId is required");
  }

  // ---------- Refunds ----------

  async refundOrder(organizationId: string, input: { orderId: string; amountMinor?: MinorUnits | undefined; reason: string; idempotencyKey?: string | undefined }): Promise<Refund> {
    const order = await this.getOrder(organizationId, input.orderId);
    if (order.status !== "paid" && order.status !== "partially_refunded") {
      throw new DomainError("INVALID_STATE", `order is ${order.status}, only paid orders can be refunded`);
    }
    const refundable = order.pricing.totalMinor - order.refundedMinor;
    const amount = input.amountMinor ?? refundable;
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new DomainError("VALIDATION", "amountMinor must be a positive integer");
    if (amount > refundable) throw new DomainError("VALIDATION", `amount exceeds refundable ${refundable}`);
    if (!input.reason.trim()) throw new DomainError("VALIDATION", "reason is required");

    const refund: Refund = {
      id: this.ids.next("rf"),
      orderId: order.id,
      organizationId,
      amountMinor: amount,
      reason: input.reason.trim(),
      status: "pending",
      createdAt: this.clock.now(),
    };
    await this.repos.refunds.create(refund);

    if (!order.paymentRef || order.paymentRef.startsWith("free_") || order.paymentMethod === "invoice") {
      // Free or invoice-paid: the organizer returns the money by bank transfer; the ledger records it now.
      await this.settleRefund(refund);
      return (await this.repos.refunds.get(refund.id)) ?? refund;
    }
    const res = await this.payments.refund({
      idempotencyKey: input.idempotencyKey ?? `refund:${refund.id}`,
      paymentRef: order.paymentRef,
      amountMinor: amount,
      reason: refund.reason,
    });
    const withRef: Refund = { ...refund, paymentRefundRef: res.refundRef };
    await this.repos.refunds.update(withRef);
    if (res.status === "succeeded") await this.settleRefund(withRef);
    if (res.status === "failed") await this.repos.refunds.update({ ...withRef, status: "failed" });
    return (await this.repos.refunds.get(refund.id)) ?? withRef;
  }

  /** Reverse the paid entry pro rata and mark the refund settled. */
  private async settleRefund(refund: Refund): Promise<void> {
    const order = await this.repos.orders.get(refund.orderId);
    if (!order) throw notFound("order", refund.orderId);
    const ccy = order.currency;
    const total = order.pricing.totalMinor;

    if (total > 0) {
      // Buckets in the same order as the paid entry: organizer, parties..., platform fee.
      const buckets: Array<{ accountId: string; paid: number }> = [];
      const orgPayable = await this.accounts.orgPayable(order.organizationId, ccy);
      buckets.push({ accountId: orgPayable.id, paid: order.splits.organizerMinor });
      for (const line of order.splits.lines) {
        const acct = await this.accounts.partyPayable(order.organizationId, line.partyId, ccy);
        buckets.push({ accountId: acct.id, paid: line.amountMinor });
      }
      const fees = await this.accounts.feeRevenue(ccy);
      buckets.push({ accountId: fees.id, paid: order.pricing.platformFeeMinor });
      if (order.pricing.taxMinor > 0) buckets.push({ accountId: (await this.accounts.taxPayable(order.organizationId, ccy)).id, paid: order.pricing.taxMinor });

      const shares = allocate(refund.amountMinor, buckets.map((b) => b.paid));
      const cashAccount = order.paymentMethod === "invoice" ? await this.accounts.bankClearing(ccy) : await this.accounts.clearing(ccy);
      const postings: Posting[] = [{ accountId: cashAccount.id, amount: -refund.amountMinor }];
      buckets.forEach((b, i) => {
        const amt = shares[i] ?? 0;
        if (amt !== 0) postings.push({ accountId: b.accountId, amount: amt });
      });
      await this.ledger.post({
        idempotencyKey: `refund:${refund.id}:settled`,
        currency: ccy,
        description: `Refund ${refund.id} for order ${order.id}: ${refund.reason}`,
        postings,
        metadata: { orderId: order.id, refundId: refund.id, organizationId: order.organizationId },
      });
    }

    const refunded = order.refundedMinor + refund.amountMinor;
    const fully = refunded >= total;
    await this.repos.orders.update({ ...order, refundedMinor: refunded, status: fully ? "refunded" : "partially_refunded" });
    await this.repos.refunds.update({ ...refund, status: "succeeded" });
    if (fully) {
      for (const seat of await this.repos.seats.listByOrder(order.id)) {
        if (seat.status === "confirmed" || seat.status === "reserved") await this.repos.seats.update({ ...seat, status: "cancelled" });
      }
      await this.repos.ticketTypes.release(order.ticketTypeId, order.quantity);
    }
    const settled = (await this.repos.refunds.get(refund.id)) ?? refund;
    const event = await this.repos.events.get(order.eventId);
    if (event) {
      const org = await this.getOrganization(order.organizationId);
      const course = event.courseId ? await this.repos.courses.get(event.courseId) : undefined;
      const latest = (await this.repos.orders.get(order.id)) ?? order;
      await this.runHooks("orderRefunded", order.id, (hook) => hook({ organization: org, order: latest, refund: settled, fully, event, course }));
    }
  }

  // ---------- Tax ----------

  private async priceWithTax(input: { org: Organization; currency: string; unitPriceMinor: MinorUnits; quantity: number; billingAddress?: BillingAddress | undefined; businessCustomer: boolean }) {
    const base = priceOrder({ currency: input.currency, unitPriceMinor: input.unitPriceMinor, quantity: input.quantity, destination: input.org.payoutDestination, passFeeToAttendee: input.org.passFeeToAttendee });
    if (!input.billingAddress) return base;
    const taxable = base.subtotalMinor + base.attendeeFeeMinor;
    const tax = await this.tax.calculate({ currency: input.currency, amountMinor: taxable, sellerCountry: input.org.country, buyer: input.billingAddress, businessCustomer: input.businessCustomer });
    return priceOrder({ currency: input.currency, unitPriceMinor: input.unitPriceMinor, quantity: input.quantity, destination: input.org.payoutDestination, passFeeToAttendee: input.org.passFeeToAttendee, taxMinor: tax.taxMinor });
  }

  // ---------- Corporate accounts & invoices ----------

  async createCorporateAccount(organizationId: string, input: { name: string; billingEmail: string; address: BillingAddress; poRequired?: boolean | undefined; netTermsDays?: number | undefined; currency?: string | undefined }): Promise<CorporateAccount> {
    const org = await this.getOrganization(organizationId);
    if (!input.name.trim()) throw new DomainError("VALIDATION", "name is required");
    if (!isEmail(input.billingEmail)) throw new DomainError("VALIDATION", "billingEmail is invalid");
    if (!/^[A-Z]{2}$/.test(input.address.country)) throw new DomainError("VALIDATION", "address.country must be ISO 3166-1 alpha-2");
    const netTermsDays = input.netTermsDays ?? 30;
    if (!Number.isSafeInteger(netTermsDays) || netTermsDays < 0 || netTermsDays > 180) throw new DomainError("VALIDATION", "netTermsDays must be between 0 and 180");
    const currency = input.currency ?? org.currency;
    assertCurrency(currency);
    const account: CorporateAccount = {
      id: this.ids.next("corp"), organizationId, name: input.name.trim(), billingEmail: input.billingEmail.toLowerCase(), address: input.address,
      poRequired: input.poRequired ?? false, netTermsDays, currency, createdAt: this.clock.now(),
    };
    await this.repos.corporateAccounts.create(account);
    return account;
  }

  async getCorporateAccount(organizationId: string, id: string): Promise<CorporateAccount> {
    const a = await this.repos.corporateAccounts.get(id);
    if (!a || a.organizationId !== organizationId) throw notFound("corporateAccount", id);
    return a;
  }

  listCorporateAccounts(organizationId: string): Promise<CorporateAccount[]> {
    return this.repos.corporateAccounts.listByOrganization(organizationId);
  }

  /**
   * Quote-to-invoice in one step: seats are held, an invoice is issued with
   * the account's net terms, and the order settles when the invoice is paid
   * (bank transfer recorded by the organizer, or card against the invoice).
   */
  async createInvoiceOrder(
    organizationId: string,
    input: {
      corporateAccountId: string;
      ticketTypeId: string;
      quantity: number;
      attendees?: Attendee[] | undefined;
      poNumber?: string | undefined;
      currency?: string | undefined;
      dueDays?: number | undefined;
      idempotencyKey?: string | undefined;
      dryRun?: boolean | undefined;
    },
  ): Promise<{ order: Order; invoice: Invoice; created: boolean }> {
    const org = await this.getOrganization(organizationId);
    const account = await this.getCorporateAccount(organizationId, input.corporateAccountId);
    if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0 || input.quantity > 500) throw new DomainError("VALIDATION", "quantity must be an integer between 1 and 500");
    if (account.poRequired && !input.poNumber?.trim()) throw new DomainError("VALIDATION", `${account.name} requires a PO number`, "ask the buyer for their purchase order number");
    if (input.attendees && input.attendees.length > input.quantity) throw new DomainError("VALIDATION", "more attendees than seats");
    for (const a of input.attendees ?? []) if (!isEmail(a.email)) throw new DomainError("VALIDATION", `attendee email ${a.email} is invalid`);

    if (input.idempotencyKey) {
      const prior = await this.repos.orders.getByIdempotencyKey(organizationId, input.idempotencyKey);
      if (prior) {
        const inv = await this.repos.invoices.getByOrder(prior.id);
        if (inv) return { order: prior, invoice: inv, created: false };
      }
    }

    const ticketType = await this.repos.ticketTypes.get(input.ticketTypeId);
    if (!ticketType || ticketType.organizationId !== organizationId) throw notFound("ticketType", input.ticketTypeId);
    const event = await this.getEvent(organizationId, ticketType.eventId);
    if (event.status !== "live") throw new DomainError("INVALID_STATE", `event is ${event.status}`);

    const currency = input.currency ?? account.currency;
    const unitPriceMinor = this.resolveUnitPrice(ticketType, event, currency);
    const pricing = await this.priceWithTax({ org, currency, unitPriceMinor, quantity: input.quantity, billingAddress: account.address, businessCustomer: true });
    const splits = computeSplits(pricing.organizerNetMinor, org.id, event.splitRules ?? org.splitRules);
    const attendees: Attendee[] = Array.from({ length: input.quantity }, (_, i) => input.attendees?.[i] ?? { email: account.billingEmail, company: account.name });
    const now = this.clock.now();
    const dueDays = input.dueDays ?? account.netTermsDays;
    const dueAt = new Date(now.getTime() + dueDays * 86_400_000);

    const order: Order = {
      id: this.ids.next("ord"), organizationId, eventId: event.id, ticketTypeId: ticketType.id, quantity: input.quantity,
      buyerEmail: account.billingEmail, attendees, currency, status: "pending", paymentMethod: "invoice", corporateAccountId: account.id,
      billingAddress: account.address, pricing, splits, transferRefs: {}, refundedMinor: 0,
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}), createdAt: now,
    };
    const invoiceId = this.ids.next("inv");
    const invoice: Invoice = {
      id: invoiceId, organizationId, orderId: order.id, corporateAccountId: account.id,
      number: "", ...(input.poNumber?.trim() ? { poNumber: input.poNumber.trim() } : {}), currency,
      subtotalMinor: pricing.subtotalMinor + pricing.attendeeFeeMinor, taxMinor: pricing.taxMinor, totalMinor: pricing.totalMinor, paidMinor: 0,
      status: "issued", issuedAt: now, dueAt, payments: [], createdAt: now,
    };
    if (input.dryRun) return { order, invoice, created: false };

    const reserved = await this.repos.ticketTypes.reserve(ticketType.id, input.quantity);
    if (!reserved) throw new DomainError("SOLD_OUT", `only ${ticketType.quantity - ticketType.sold} left`, "lower the quantity");
    order.paymentRef = `inv_${invoiceId}`;
    try {
      await this.repos.orders.create(order);
      const seq = await this.repos.invoices.nextNumber(organizationId, now.getUTCFullYear());
      invoice.number = `INV-${now.getUTCFullYear()}-${String(seq).padStart(4, "0")}`;
      await this.repos.invoices.create(invoice);
      for (const attendee of attendees) {
        await this.repos.seats.create({ id: this.ids.next("seat"), organizationId, orderId: order.id, eventId: event.id, ticketTypeId: ticketType.id, attendee, status: "reserved", createdAt: now });
      }
    } catch (err) {
      await this.repos.ticketTypes.release(ticketType.id, input.quantity);
      throw err;
    }
    if (pricing.totalMinor === 0) await this.recordInvoicePayment(organizationId, { invoiceId, amountMinor: 0, method: "other", reference: "free" });
    const finalInvoice = (await this.repos.invoices.get(invoiceId)) ?? invoice;
    await this.runHooks("invoiceIssued", order.id, (hook) => hook({ organization: org, order, invoice: finalInvoice, account, event }));
    return { order: (await this.repos.orders.get(order.id)) ?? order, invoice: finalInvoice, created: true };
  }

  async getInvoice(organizationId: string, invoiceId: string): Promise<Invoice> {
    const i = await this.repos.invoices.get(invoiceId);
    if (!i || i.organizationId !== organizationId) throw notFound("invoice", invoiceId);
    return i;
  }

  listInvoices(organizationId: string, filter?: { status?: Invoice["status"][] | undefined }): Promise<Invoice[]> {
    return this.repos.invoices.listByOrganization(organizationId, filter);
  }

  /** Cash against an invoice. Partial payments are held as customer deposits; the last one settles the order. */
  async recordInvoicePayment(
    organizationId: string,
    input: { invoiceId: string; amountMinor: MinorUnits; method: InvoicePaymentMethod; reference?: string | undefined; receivedAt?: Date | undefined; viaCardRef?: string | undefined },
  ): Promise<Invoice> {
    const invoice = await this.getInvoice(organizationId, input.invoiceId);
    if (invoice.status === "paid" || invoice.status === "void") throw new DomainError("INVALID_STATE", `invoice is ${invoice.status}`);
    if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor < 0) throw new DomainError("VALIDATION", "amountMinor must be a non-negative integer");
    const outstanding = invoice.totalMinor - invoice.paidMinor;
    if (input.amountMinor > outstanding) throw new DomainError("VALIDATION", `amount exceeds outstanding ${outstanding}`, "record the overpayment separately");
    const order = await this.repos.orders.get(invoice.orderId);
    if (!order) throw notFound("order", invoice.orderId);
    const ccy = invoice.currency;
    const receivedAt = input.receivedAt ?? this.clock.now();
    const payment = { id: this.ids.next("ip"), amountMinor: input.amountMinor, method: input.method, ...(input.reference ? { reference: input.reference } : {}), receivedAt };
    const paidMinor = invoice.paidMinor + input.amountMinor;
    const complete = paidMinor >= invoice.totalMinor;
    const cashAccount = input.method === "card" ? await this.accounts.clearing(ccy) : await this.accounts.bankClearing(ccy);

    if (!complete) {
      if (input.amountMinor > 0) {
        const deposits = await this.accounts.customerDeposits(ccy);
        await this.ledger.post({
          idempotencyKey: `invoice:${invoice.id}:payment:${payment.id}`, currency: ccy, description: `Partial payment on ${invoice.number}`,
          postings: [{ accountId: cashAccount.id, amount: input.amountMinor }, { accountId: deposits.id, amount: -input.amountMinor }],
          metadata: { invoiceId: invoice.id, orderId: order.id, organizationId },
        });
      }
      const { cardPaymentRef: _drop, ...rest } = invoice;
      const updated: Invoice = { ...(rest as Invoice), paidMinor, status: "partially_paid", payments: [...invoice.payments, payment] };
      await this.repos.invoices.update(updated);
      return updated;
    }

    // Final payment: release held deposits and settle the order with the full cash picture.
    const cash: Posting[] = [];
    if (input.amountMinor > 0) cash.push({ accountId: cashAccount.id, amount: input.amountMinor });
    if (invoice.paidMinor > 0) cash.push({ accountId: (await this.accounts.customerDeposits(ccy)).id, amount: invoice.paidMinor });
    const { cardPaymentRef: _drop2, ...rest2 } = invoice;
    const settled: Invoice = { ...(rest2 as Invoice), paidMinor, status: "paid", payments: [...invoice.payments, payment] };
    await this.repos.invoices.update(settled);
    if (order.status === "pending") await this.markPaid(order, cash.length ? cash : undefined);
    return settled;
  }

  /** Let the buyer pay an open invoice by card: returns a client secret for the outstanding amount. */
  async createInvoiceCardPayment(organizationId: string, invoiceId: string): Promise<{ invoice: Invoice; clientSecret: string | null; paymentRef: string }> {
    const invoice = await this.getInvoice(organizationId, invoiceId);
    if (invoice.status === "paid" || invoice.status === "void") throw new DomainError("INVALID_STATE", `invoice is ${invoice.status}`);
    const order = await this.repos.orders.get(invoice.orderId);
    if (!order) throw notFound("order", invoice.orderId);
    const outstanding = invoice.totalMinor - invoice.paidMinor;
    const p = await this.payments.createPayment({
      orderId: `${order.id}:${invoice.id}:${invoice.payments.length}`, amountMinor: outstanding, currency: invoice.currency, transferGroup: order.id, buyerEmail: order.buyerEmail,
      metadata: { orderId: order.id, invoiceId: invoice.id, organizationId },
    });
    const updated: Invoice = { ...invoice, cardPaymentRef: p.paymentRef };
    await this.repos.invoices.update(updated);
    return { invoice: updated, clientSecret: p.clientSecret, paymentRef: p.paymentRef };
  }

  async voidInvoice(organizationId: string, invoiceId: string, reason: string): Promise<Invoice> {
    const invoice = await this.getInvoice(organizationId, invoiceId);
    if (invoice.status === "paid") throw new DomainError("INVALID_STATE", "paid invoices are refunded, not voided");
    if (invoice.status === "void") return invoice;
    if (invoice.paidMinor > 0) throw new DomainError("INVALID_STATE", "invoice has partial payments; refund them first");
    const order = await this.repos.orders.get(invoice.orderId);
    if (order && order.status === "pending") {
      await this.repos.orders.update({ ...order, status: "cancelled" });
      await this.repos.ticketTypes.release(order.ticketTypeId, order.quantity);
      for (const seat of await this.repos.seats.listByOrder(order.id)) await this.repos.seats.update({ ...seat, status: "cancelled" });
    }
    const voided: Invoice = { ...invoice, status: "void" };
    await this.repos.invoices.update(voided);
    void reason;
    return voided;
  }

  /** Receivables ageing as of a date: what corporate buyers still owe, bucketed by days past due. */
  async receivablesAgeing(organizationId: string, asOf = this.clock.now()) {
    const open = await this.repos.invoices.listByOrganization(organizationId, { status: ["issued", "partially_paid"] });
    const buckets = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90_plus: 0 } as Record<"current" | "d1_30" | "d31_60" | "d61_90" | "d90_plus", number>;
    const byCurrency: Record<string, typeof buckets> = {};
    const items = open.map((i) => {
      const outstanding = i.totalMinor - i.paidMinor;
      const daysPastDue = Math.floor((asOf.getTime() - i.dueAt.getTime()) / 86_400_000);
      const bucket = daysPastDue <= 0 ? "current" : daysPastDue <= 30 ? "d1_30" : daysPastDue <= 60 ? "d31_60" : daysPastDue <= 90 ? "d61_90" : "d90_plus";
      byCurrency[i.currency] ??= { ...buckets };
      byCurrency[i.currency]![bucket] += outstanding;
      return { invoiceId: i.id, number: i.number, corporateAccountId: i.corporateAccountId, currency: i.currency, outstandingMinor: outstanding, dueAt: i.dueAt, daysPastDue: Math.max(0, daysPastDue), bucket };
    });
    return { asOf, byCurrency, items };
  }

  // ---------- Public (buyer-facing) reads ----------

  /** Order status for the buyer who placed it: id + buyer email act as the credential. */
  async publicOrder(orderId: string, buyerEmail: string): Promise<Order> {
    const o = await this.repos.orders.get(orderId);
    if (!o || o.buyerEmail.toLowerCase() !== buyerEmail.trim().toLowerCase()) throw notFound("order", orderId);
    return o;
  }

  /** Everything needed to render a seat's calendar or ticket; seat ids are unguessable. */
  async publicSeat(seatId: string): Promise<{ seat: Seat; event: Event; course?: Course | undefined; organization: Organization }> {
    const seat = await this.repos.seats.get(seatId);
    if (!seat) throw notFound("seat", seatId);
    const event = await this.repos.events.get(seat.eventId);
    if (!event) throw notFound("event", seat.eventId);
    const organization = await this.getOrganization(seat.organizationId);
    const course = event.courseId ? await this.repos.courses.get(event.courseId) : undefined;
    return { seat, event, course, organization };
  }

  // ---------- Reporting ----------

  async balancesFor(organizationId: string) {
    const all = await this.ledger.balances();
    return all
      .filter((b) => b.account.tenantId === organizationId)
      .map((b) => ({ code: b.account.code, name: b.account.name, type: b.account.type, currency: b.currency, balanceMinor: b.natural }));
  }

  async platformBalances() {
    const all = await this.ledger.balances({ tenantId: "platform" });
    return all.map((b) => ({ code: b.account.code, name: b.account.name, type: b.account.type, currency: b.currency, balanceMinor: b.natural }));
  }
}

function isEmail(v: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
}

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function validatePriceList(prices: Record<string, MinorUnits> | undefined): Record<string, MinorUnits> | undefined {
  if (!prices) return undefined;
  const out: Record<string, MinorUnits> = {};
  for (const [ccy, amount] of Object.entries(prices)) {
    assertCurrency(ccy, `price list currency ${ccy}`);
    if (!Number.isSafeInteger(amount) || amount < 0) throw new DomainError("VALIDATION", `price for ${ccy} must be a non-negative integer`);
    out[ccy] = amount;
  }
  return Object.keys(out).length ? out : undefined;
}
