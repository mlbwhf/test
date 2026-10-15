import { createHash, randomBytes } from "node:crypto";
import { allocate, assertCurrency, type Ledger, type MinorUnits, type Posting } from "@gate/ledger";
import { computeSplits, priceOrder, type PayoutDestination, type SplitRule } from "@gate/pricing";
import { ChartOfAccounts } from "./accounts.js";
import { DomainError, notFound } from "./errors.js";
import type { Clock, IdGenerator, PaymentEvent, PaymentsPort, Repos } from "./ports.js";
import type { Event, Order, Organization, Party, PartyKind, Refund, TicketType } from "./types.js";

export interface CoreDeps {
  repos: Repos;
  ledger: Ledger;
  payments: PaymentsPort;
  clock?: Clock;
  ids?: IdGenerator;
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
  readonly accounts: ChartOfAccounts;
  private readonly clock: Clock;
  private readonly ids: IdGenerator;

  constructor(deps: CoreDeps) {
    this.repos = deps.repos;
    this.ledger = deps.ledger;
    this.payments = deps.payments;
    this.accounts = new ChartOfAccounts(deps.ledger);
    this.clock = deps.clock ?? defaultClock;
    this.ids = deps.ids ?? defaultIds;
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

  // ---------- Events & tickets ----------

  async createEvent(organizationId: string, input: { name: string; startsAt: Date; currency?: string | undefined; splitRules?: SplitRule[] | undefined }): Promise<Event> {
    const org = await this.getOrganization(organizationId);
    const currency = input.currency ?? org.currency;
    assertCurrency(currency);
    if (!input.name.trim()) throw new DomainError("VALIDATION", "name is required");
    if (Number.isNaN(input.startsAt.getTime())) throw new DomainError("VALIDATION", "startsAt must be a valid date");
    if (input.splitRules) {
      for (const r of input.splitRules) {
        const party = await this.repos.parties.get(r.partyId);
        if (!party || party.organizationId !== organizationId) throw new DomainError("VALIDATION", `unknown split party ${r.partyId}`);
      }
    }
    const event: Event = {
      id: this.ids.next("evt"),
      organizationId,
      name: input.name.trim(),
      startsAt: input.startsAt,
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

  async createTicketType(organizationId: string, eventId: string, input: { name: string; priceMinor: MinorUnits; quantity: number }): Promise<TicketType> {
    await this.getEvent(organizationId, eventId);
    if (!Number.isSafeInteger(input.priceMinor) || input.priceMinor < 0) throw new DomainError("VALIDATION", "priceMinor must be a non-negative integer");
    if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) throw new DomainError("VALIDATION", "quantity must be a positive integer");
    const t: TicketType = { id: this.ids.next("tt"), eventId, organizationId, name: input.name, priceMinor: input.priceMinor, quantity: input.quantity, sold: 0 };
    await this.repos.ticketTypes.create(t);
    return t;
  }

  async listTicketTypes(organizationId: string, eventId: string): Promise<TicketType[]> {
    await this.getEvent(organizationId, eventId);
    return this.repos.ticketTypes.listByEvent(eventId);
  }

  // ---------- Checkout ----------

  async createOrder(
    organizationId: string,
    input: { ticketTypeId: string; quantity: number; buyerEmail: string; idempotencyKey?: string | undefined; dryRun?: boolean | undefined },
  ): Promise<{ order: Order; clientSecret: string | null; created: boolean }> {
    const org = await this.getOrganization(organizationId);
    if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0 || input.quantity > 100) {
      throw new DomainError("VALIDATION", "quantity must be an integer between 1 and 100");
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.buyerEmail)) throw new DomainError("VALIDATION", "buyerEmail is invalid");

    if (input.idempotencyKey) {
      const prior = await this.repos.orders.getByIdempotencyKey(organizationId, input.idempotencyKey);
      if (prior) return { order: prior, clientSecret: null, created: false };
    }

    const ticketType = await this.repos.ticketTypes.get(input.ticketTypeId);
    if (!ticketType || ticketType.organizationId !== organizationId) throw notFound("ticketType", input.ticketTypeId);
    const event = await this.getEvent(organizationId, ticketType.eventId);
    if (event.status !== "live") throw new DomainError("INVALID_STATE", `event is ${event.status}`);

    const pricing = priceOrder({
      currency: event.currency,
      unitPriceMinor: ticketType.priceMinor,
      quantity: input.quantity,
      destination: org.payoutDestination,
      passFeeToAttendee: org.passFeeToAttendee,
    });
    const splits = computeSplits(pricing.organizerNetMinor, org.id, event.splitRules ?? org.splitRules);

    const order: Order = {
      id: this.ids.next("ord"),
      organizationId,
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity: input.quantity,
      buyerEmail: input.buyerEmail,
      currency: event.currency,
      status: "pending",
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

  private async markPaid(order: Order): Promise<void> {
    const ccy = order.currency;
    const org = await this.getOrganization(order.organizationId);
    const clearing = await this.accounts.clearing(ccy);
    const fees = await this.accounts.feeRevenue(ccy);
    const orgPayable = await this.accounts.orgPayable(org.id, ccy);

    const postings: Posting[] = [{ accountId: clearing.id, amount: order.pricing.totalMinor }];
    if (order.splits.organizerMinor > 0) postings.push({ accountId: orgPayable.id, amount: -order.splits.organizerMinor });
    for (const line of order.splits.lines) {
      if (line.amountMinor === 0) continue;
      const acct = await this.accounts.partyPayable(org.id, line.partyId, ccy);
      postings.push({ accountId: acct.id, amount: -line.amountMinor });
    }
    if (order.pricing.platformFeeMinor > 0) postings.push({ accountId: fees.id, amount: -order.pricing.platformFeeMinor });

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
    const transferRefs: Record<string, string> = { ...order.transferRefs };
    if (order.paymentRef && order.pricing.totalMinor > 0) {
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

    if (!order.paymentRef || order.paymentRef.startsWith("free_")) {
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

      const shares = allocate(refund.amountMinor, buckets.map((b) => b.paid));
      const clearing = await this.accounts.clearing(ccy);
      const postings: Posting[] = [{ accountId: clearing.id, amount: -refund.amountMinor }];
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
    await this.repos.orders.update({ ...order, refundedMinor: refunded, status: refunded >= total ? "refunded" : "partially_refunded" });
    await this.repos.refunds.update({ ...refund, status: "succeeded" });
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
