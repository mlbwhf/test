import type {
  CorporateAccount, CorporateAccountRepo, Course, CourseRepo, Event, EventRepo, Invoice, InvoiceRepo, Order, OrderRepo, Organization, OrganizationRepo, Party, PartyRepo, ProcessedEventRepo, Refund, RefundRepo, Repos, Seat, SeatRepo, TicketType, TicketTypeRepo,
} from "@gate/core";
import type { Pool } from "./pool.js";

type Row = Record<string, unknown>;
const str = (v: unknown) => v as string;
const num = (v: unknown) => Number(v);
const date = (v: unknown) => v as Date;
const opt = <T>(v: unknown) => (v === null || v === undefined ? undefined : (v as T));

function toOrg(r: Row): Organization {
  const ref = opt<string>(r.payments_account_ref);
  return {
    id: str(r.id), name: str(r.name), country: str(r.country), currency: str(r.currency),
    payoutDestination: r.payout_destination as Organization["payoutDestination"],
    passFeeToAttendee: Boolean(r.pass_fee_to_attendee),
    ...(ref ? { paymentsAccountRef: ref } : {}),
    splitRules: (r.split_rules as Organization["splitRules"]) ?? [],
    apiKeyHash: str(r.api_key_hash), createdAt: date(r.created_at),
  };
}
function toParty(r: Row): Party {
  const ref = opt<string>(r.payments_account_ref);
  return { id: str(r.id), organizationId: str(r.organization_id), name: str(r.name), kind: r.kind as Party["kind"], ...(ref ? { paymentsAccountRef: ref } : {}), createdAt: date(r.created_at) };
}
function toCourse(r: Row): Course {
  const description = opt<string>(r.description), body = opt<string>(r.certification_body), days = opt<number>(r.duration_days);
  return { id: str(r.id), organizationId: str(r.organization_id), slug: str(r.slug), name: str(r.name), ...(description ? { description } : {}), ...(body ? { certificationBody: body } : {}), ...(days !== undefined ? { durationDays: num(days) } : {}), createdAt: date(r.created_at) };
}
function toEvent(r: Row): Event {
  const rules = opt<Event["splitRules"]>(r.split_rules);
  const courseId = opt<string>(r.course_id), endsAt = opt<Date>(r.ends_at), minEnrollment = opt<number>(r.min_enrollment);
  const sessions = ((r.sessions as Array<{ startsAt: string; endsAt: string; title?: string }>) ?? []).map((s) => ({ startsAt: new Date(s.startsAt), endsAt: new Date(s.endsAt), ...(s.title ? { title: s.title } : {}) }));
  return {
    id: str(r.id), organizationId: str(r.organization_id), ...(courseId ? { courseId } : {}), name: str(r.name), startsAt: date(r.starts_at), ...(endsAt ? { endsAt } : {}),
    timezone: str(r.timezone), format: r.format as Event["format"], sessions, instructorIds: (r.instructor_ids as string[]) ?? [],
    ...(minEnrollment !== undefined ? { minEnrollment: num(minEnrollment) } : {}),
    currency: str(r.currency), status: r.status as Event["status"], ...(rules ? { splitRules: rules } : {}), createdAt: date(r.created_at),
  };
}
function toTicketType(r: Row): TicketType {
  const prices = opt<Record<string, number>>(r.prices);
  const eb = opt<{ until: string; priceMinor: number; prices?: Record<string, number> }>(r.early_bird);
  return {
    id: str(r.id), eventId: str(r.event_id), organizationId: str(r.organization_id), name: str(r.name), priceMinor: num(r.price_minor),
    ...(prices ? { prices } : {}),
    ...(eb ? { earlyBird: { until: new Date(eb.until), priceMinor: eb.priceMinor, ...(eb.prices ? { prices: eb.prices } : {}) } } : {}),
    quantity: num(r.quantity), sold: num(r.sold),
  };
}
function toSeat(r: Row): Seat {
  const confirmedAt = opt<Date>(r.confirmed_at);
  return { id: str(r.id), organizationId: str(r.organization_id), orderId: str(r.order_id), eventId: str(r.event_id), ticketTypeId: str(r.ticket_type_id), attendee: r.attendee as Seat["attendee"], status: r.status as Seat["status"], createdAt: date(r.created_at), ...(confirmedAt ? { confirmedAt } : {}) };
}
function toOrder(r: Row): Order {
  const paymentRef = opt<string>(r.payment_ref);
  const idem = opt<string>(r.idempotency_key);
  const paidAt = opt<Date>(r.paid_at);
  return {
    id: str(r.id), organizationId: str(r.organization_id), eventId: str(r.event_id), ticketTypeId: str(r.ticket_type_id),
    quantity: num(r.quantity), buyerEmail: str(r.buyer_email), attendees: (r.attendees as Order["attendees"]) ?? [], currency: str(r.currency), status: r.status as Order["status"],
    paymentMethod: (r.payment_method as Order["paymentMethod"]) ?? "card",
    ...(opt<string>(r.corporate_account_id) ? { corporateAccountId: str(r.corporate_account_id) } : {}),
    ...(opt<Order["billingAddress"]>(r.billing_address) ? { billingAddress: r.billing_address as NonNullable<Order["billingAddress"]> } : {}),
    pricing: r.pricing as Order["pricing"], splits: r.splits as Order["splits"],
    ...(paymentRef ? { paymentRef } : {}),
    transferRefs: (r.transfer_refs as Record<string, string>) ?? {},
    refundedMinor: num(r.refunded_minor),
    ...(idem ? { idempotencyKey: idem } : {}),
    createdAt: date(r.created_at),
    ...(paidAt ? { paidAt } : {}),
  };
}
function toCorporate(r: Row): CorporateAccount {
  return { id: str(r.id), organizationId: str(r.organization_id), name: str(r.name), billingEmail: str(r.billing_email), address: r.address as CorporateAccount["address"], poRequired: Boolean(r.po_required), netTermsDays: num(r.net_terms_days), currency: str(r.currency), createdAt: date(r.created_at) };
}
function toInvoice(r: Row): Invoice {
  const corp = opt<string>(r.corporate_account_id), po = opt<string>(r.po_number), cardRef = opt<string>(r.card_payment_ref);
  const payments = ((r.payments as Array<{ id: string; amountMinor: number; method: Invoice["payments"][number]["method"]; reference?: string; receivedAt: string }>) ?? []).map((p) => ({ id: p.id, amountMinor: p.amountMinor, method: p.method, ...(p.reference ? { reference: p.reference } : {}), receivedAt: new Date(p.receivedAt) }));
  return {
    id: str(r.id), organizationId: str(r.organization_id), orderId: str(r.order_id), ...(corp ? { corporateAccountId: corp } : {}), number: str(r.number), ...(po ? { poNumber: po } : {}),
    currency: str(r.currency), subtotalMinor: num(r.subtotal_minor), taxMinor: num(r.tax_minor), totalMinor: num(r.total_minor), paidMinor: num(r.paid_minor),
    status: r.status as Invoice["status"], issuedAt: date(r.issued_at), dueAt: date(r.due_at), payments, ...(cardRef ? { cardPaymentRef: cardRef } : {}), createdAt: date(r.created_at),
  };
}
function toRefund(r: Row): Refund {
  const ref = opt<string>(r.payment_refund_ref);
  return { id: str(r.id), orderId: str(r.order_id), organizationId: str(r.organization_id), amountMinor: num(r.amount_minor), reason: str(r.reason), status: r.status as Refund["status"], ...(ref ? { paymentRefundRef: ref } : {}), createdAt: date(r.created_at) };
}

class PgOrganizations implements OrganizationRepo {
  constructor(private readonly pool: Pool) {}
  async create(o: Organization) {
    await this.pool.query(
      `INSERT INTO organizations (id, name, country, currency, payout_destination, pass_fee_to_attendee, payments_account_ref, split_rules, api_key_hash, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [o.id, o.name, o.country, o.currency, o.payoutDestination, o.passFeeToAttendee, o.paymentsAccountRef ?? null, JSON.stringify(o.splitRules), o.apiKeyHash, o.createdAt],
    );
  }
  async update(o: Organization) {
    await this.pool.query(
      `UPDATE organizations SET name=$2, country=$3, currency=$4, payout_destination=$5, pass_fee_to_attendee=$6, payments_account_ref=$7, split_rules=$8 WHERE id=$1`,
      [o.id, o.name, o.country, o.currency, o.payoutDestination, o.passFeeToAttendee, o.paymentsAccountRef ?? null, JSON.stringify(o.splitRules)],
    );
  }
  async get(id: string) { const r = await this.pool.query(`SELECT * FROM organizations WHERE id=$1`, [id]); return r.rows[0] ? toOrg(r.rows[0]) : undefined; }
  async getByApiKeyHash(h: string) { const r = await this.pool.query(`SELECT * FROM organizations WHERE api_key_hash=$1`, [h]); return r.rows[0] ? toOrg(r.rows[0]) : undefined; }
  async list() { const r = await this.pool.query(`SELECT * FROM organizations ORDER BY created_at`); return r.rows.map(toOrg); }
}
class PgParties implements PartyRepo {
  constructor(private readonly pool: Pool) {}
  async create(p: Party) { await this.pool.query(`INSERT INTO parties (id, organization_id, name, kind, payments_account_ref, created_at) VALUES ($1,$2,$3,$4,$5,$6)`, [p.id, p.organizationId, p.name, p.kind, p.paymentsAccountRef ?? null, p.createdAt]); }
  async get(id: string) { const r = await this.pool.query(`SELECT * FROM parties WHERE id=$1`, [id]); return r.rows[0] ? toParty(r.rows[0]) : undefined; }
  async listByOrganization(orgId: string) { const r = await this.pool.query(`SELECT * FROM parties WHERE organization_id=$1 ORDER BY created_at`, [orgId]); return r.rows.map(toParty); }
}
class PgCourses implements CourseRepo {
  constructor(private readonly pool: Pool) {}
  async create(c: Course) { await this.pool.query(`INSERT INTO courses (id, organization_id, slug, name, description, certification_body, duration_days, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [c.id, c.organizationId, c.slug, c.name, c.description ?? null, c.certificationBody ?? null, c.durationDays ?? null, c.createdAt]); }
  async update(c: Course) { await this.pool.query(`UPDATE courses SET slug=$2, name=$3, description=$4, certification_body=$5, duration_days=$6 WHERE id=$1`, [c.id, c.slug, c.name, c.description ?? null, c.certificationBody ?? null, c.durationDays ?? null]); }
  async get(id: string) { const r = await this.pool.query(`SELECT * FROM courses WHERE id=$1`, [id]); return r.rows[0] ? toCourse(r.rows[0]) : undefined; }
  async getBySlug(orgId: string, slug: string) { const r = await this.pool.query(`SELECT * FROM courses WHERE organization_id=$1 AND slug=$2`, [orgId, slug]); return r.rows[0] ? toCourse(r.rows[0]) : undefined; }
  async listByOrganization(orgId: string) { const r = await this.pool.query(`SELECT * FROM courses WHERE organization_id=$1 ORDER BY name`, [orgId]); return r.rows.map(toCourse); }
}
const sessionsJson = (e: Event) => JSON.stringify(e.sessions.map((s) => ({ startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString(), ...(s.title ? { title: s.title } : {}) })));
class PgEvents implements EventRepo {
  constructor(private readonly pool: Pool) {}
  async create(e: Event) {
    await this.pool.query(
      `INSERT INTO events (id, organization_id, course_id, name, starts_at, ends_at, timezone, format, sessions, instructor_ids, min_enrollment, currency, status, split_rules, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [e.id, e.organizationId, e.courseId ?? null, e.name, e.startsAt, e.endsAt ?? null, e.timezone, e.format, sessionsJson(e), JSON.stringify(e.instructorIds), e.minEnrollment ?? null, e.currency, e.status, e.splitRules ? JSON.stringify(e.splitRules) : null, e.createdAt],
    );
  }
  async update(e: Event) {
    await this.pool.query(
      `UPDATE events SET course_id=$2, name=$3, starts_at=$4, ends_at=$5, timezone=$6, format=$7, sessions=$8, instructor_ids=$9, min_enrollment=$10, currency=$11, status=$12, split_rules=$13 WHERE id=$1`,
      [e.id, e.courseId ?? null, e.name, e.startsAt, e.endsAt ?? null, e.timezone, e.format, sessionsJson(e), JSON.stringify(e.instructorIds), e.minEnrollment ?? null, e.currency, e.status, e.splitRules ? JSON.stringify(e.splitRules) : null],
    );
  }
  async get(id: string) { const r = await this.pool.query(`SELECT * FROM events WHERE id=$1`, [id]); return r.rows[0] ? toEvent(r.rows[0]) : undefined; }
  async listByOrganization(orgId: string) { const r = await this.pool.query(`SELECT * FROM events WHERE organization_id=$1 ORDER BY starts_at`, [orgId]); return r.rows.map(toEvent); }
  async listByCourse(courseId: string) { const r = await this.pool.query(`SELECT * FROM events WHERE course_id=$1 ORDER BY starts_at`, [courseId]); return r.rows.map(toEvent); }
}
class PgSeats implements SeatRepo {
  constructor(private readonly pool: Pool) {}
  async create(s: Seat) { await this.pool.query(`INSERT INTO seats (id, organization_id, order_id, event_id, ticket_type_id, attendee, status, created_at, confirmed_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [s.id, s.organizationId, s.orderId, s.eventId, s.ticketTypeId, JSON.stringify(s.attendee), s.status, s.createdAt, s.confirmedAt ?? null]); }
  async update(s: Seat) { await this.pool.query(`UPDATE seats SET event_id=$2, ticket_type_id=$3, attendee=$4, status=$5, confirmed_at=$6 WHERE id=$1`, [s.id, s.eventId, s.ticketTypeId, JSON.stringify(s.attendee), s.status, s.confirmedAt ?? null]); }
  async get(id: string) { const r = await this.pool.query(`SELECT * FROM seats WHERE id=$1`, [id]); return r.rows[0] ? toSeat(r.rows[0]) : undefined; }
  async listByOrder(orderId: string) { const r = await this.pool.query(`SELECT * FROM seats WHERE order_id=$1 ORDER BY created_at`, [orderId]); return r.rows.map(toSeat); }
  async listByEvent(eventId: string) { const r = await this.pool.query(`SELECT * FROM seats WHERE event_id=$1 ORDER BY created_at`, [eventId]); return r.rows.map(toSeat); }
}
const earlyBirdJson = (t: TicketType) => t.earlyBird ? JSON.stringify({ until: t.earlyBird.until.toISOString(), priceMinor: t.earlyBird.priceMinor, ...(t.earlyBird.prices ? { prices: t.earlyBird.prices } : {}) }) : null;
class PgTicketTypes implements TicketTypeRepo {
  constructor(private readonly pool: Pool) {}
  async create(t: TicketType) { await this.pool.query(`INSERT INTO ticket_types (id, event_id, organization_id, name, price_minor, prices, early_bird, quantity, sold) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [t.id, t.eventId, t.organizationId, t.name, t.priceMinor, t.prices ? JSON.stringify(t.prices) : null, earlyBirdJson(t), t.quantity, t.sold]); }
  async get(id: string) { const r = await this.pool.query(`SELECT * FROM ticket_types WHERE id=$1`, [id]); return r.rows[0] ? toTicketType(r.rows[0]) : undefined; }
  async listByEvent(eventId: string) { const r = await this.pool.query(`SELECT * FROM ticket_types WHERE event_id=$1 ORDER BY price_minor, name`, [eventId]); return r.rows.map(toTicketType); }
  async reserve(id: string, qty: number) {
    const r = await this.pool.query(`UPDATE ticket_types SET sold = sold + $2 WHERE id=$1 AND sold + $2 <= quantity RETURNING id`, [id, qty]);
    return (r.rowCount ?? 0) > 0;
  }
  async release(id: string, qty: number) { await this.pool.query(`UPDATE ticket_types SET sold = GREATEST(0, sold - $2) WHERE id=$1`, [id, qty]); }
}
class PgOrders implements OrderRepo {
  constructor(private readonly pool: Pool) {}
  async create(o: Order) {
    await this.pool.query(
      `INSERT INTO orders (id, organization_id, event_id, ticket_type_id, quantity, buyer_email, attendees, currency, status, pricing, splits, payment_ref, transfer_refs, refunded_minor, idempotency_key, created_at, paid_at, payment_method, corporate_account_id, billing_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
      [o.id, o.organizationId, o.eventId, o.ticketTypeId, o.quantity, o.buyerEmail, JSON.stringify(o.attendees), o.currency, o.status, JSON.stringify(o.pricing), JSON.stringify(o.splits), o.paymentRef ?? null, JSON.stringify(o.transferRefs), o.refundedMinor, o.idempotencyKey ?? null, o.createdAt, o.paidAt ?? null, o.paymentMethod, o.corporateAccountId ?? null, o.billingAddress ? JSON.stringify(o.billingAddress) : null],
    );
  }
  async update(o: Order) {
    await this.pool.query(
      `UPDATE orders SET status=$2, payment_ref=$3, transfer_refs=$4, refunded_minor=$5, paid_at=$6 WHERE id=$1`,
      [o.id, o.status, o.paymentRef ?? null, JSON.stringify(o.transferRefs), o.refundedMinor, o.paidAt ?? null],
    );
  }
  async get(id: string) { const r = await this.pool.query(`SELECT * FROM orders WHERE id=$1`, [id]); return r.rows[0] ? toOrder(r.rows[0]) : undefined; }
  async getByPaymentRef(ref: string) { const r = await this.pool.query(`SELECT * FROM orders WHERE payment_ref=$1`, [ref]); return r.rows[0] ? toOrder(r.rows[0]) : undefined; }
  async getByIdempotencyKey(orgId: string, key: string) { const r = await this.pool.query(`SELECT * FROM orders WHERE organization_id=$1 AND idempotency_key=$2`, [orgId, key]); return r.rows[0] ? toOrder(r.rows[0]) : undefined; }
  async listByOrganization(orgId: string, limit = 100) { const r = await this.pool.query(`SELECT * FROM orders WHERE organization_id=$1 ORDER BY created_at DESC LIMIT $2`, [orgId, limit]); return r.rows.map(toOrder); }
}
class PgCorporateAccounts implements CorporateAccountRepo {
  constructor(private readonly pool: Pool) {}
  async create(a: CorporateAccount) { await this.pool.query(`INSERT INTO corporate_accounts (id, organization_id, name, billing_email, address, po_required, net_terms_days, currency, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [a.id, a.organizationId, a.name, a.billingEmail, JSON.stringify(a.address), a.poRequired, a.netTermsDays, a.currency, a.createdAt]); }
  async update(a: CorporateAccount) { await this.pool.query(`UPDATE corporate_accounts SET name=$2, billing_email=$3, address=$4, po_required=$5, net_terms_days=$6, currency=$7 WHERE id=$1`, [a.id, a.name, a.billingEmail, JSON.stringify(a.address), a.poRequired, a.netTermsDays, a.currency]); }
  async get(id: string) { const r = await this.pool.query(`SELECT * FROM corporate_accounts WHERE id=$1`, [id]); return r.rows[0] ? toCorporate(r.rows[0]) : undefined; }
  async getByBillingEmail(orgId: string, email: string) { const r = await this.pool.query(`SELECT * FROM corporate_accounts WHERE organization_id=$1 AND lower(billing_email)=lower($2)`, [orgId, email]); return r.rows[0] ? toCorporate(r.rows[0]) : undefined; }
  async listByOrganization(orgId: string) { const r = await this.pool.query(`SELECT * FROM corporate_accounts WHERE organization_id=$1 ORDER BY name`, [orgId]); return r.rows.map(toCorporate); }
}
const paymentsJson = (i: Invoice) => JSON.stringify(i.payments.map((p) => ({ ...p, receivedAt: p.receivedAt.toISOString() })));
class PgInvoices implements InvoiceRepo {
  constructor(private readonly pool: Pool) {}
  async create(i: Invoice) {
    await this.pool.query(
      `INSERT INTO invoices (id, organization_id, order_id, corporate_account_id, number, po_number, currency, subtotal_minor, tax_minor, total_minor, paid_minor, status, issued_at, due_at, payments, card_payment_ref, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [i.id, i.organizationId, i.orderId, i.corporateAccountId ?? null, i.number, i.poNumber ?? null, i.currency, i.subtotalMinor, i.taxMinor, i.totalMinor, i.paidMinor, i.status, i.issuedAt, i.dueAt, paymentsJson(i), i.cardPaymentRef ?? null, i.createdAt],
    );
  }
  async update(i: Invoice) { await this.pool.query(`UPDATE invoices SET po_number=$2, paid_minor=$3, status=$4, due_at=$5, payments=$6, card_payment_ref=$7 WHERE id=$1`, [i.id, i.poNumber ?? null, i.paidMinor, i.status, i.dueAt, paymentsJson(i), i.cardPaymentRef ?? null]); }
  async get(id: string) { const r = await this.pool.query(`SELECT * FROM invoices WHERE id=$1`, [id]); return r.rows[0] ? toInvoice(r.rows[0]) : undefined; }
  async getByOrder(orderId: string) { const r = await this.pool.query(`SELECT * FROM invoices WHERE order_id=$1`, [orderId]); return r.rows[0] ? toInvoice(r.rows[0]) : undefined; }
  async getByCardPaymentRef(ref: string) { const r = await this.pool.query(`SELECT * FROM invoices WHERE card_payment_ref=$1`, [ref]); return r.rows[0] ? toInvoice(r.rows[0]) : undefined; }
  async listByOrganization(orgId: string, filter?: { status?: Invoice["status"][] | undefined }) {
    const r = filter?.status
      ? await this.pool.query(`SELECT * FROM invoices WHERE organization_id=$1 AND status = ANY($2) ORDER BY issued_at`, [orgId, filter.status])
      : await this.pool.query(`SELECT * FROM invoices WHERE organization_id=$1 ORDER BY issued_at`, [orgId]);
    return r.rows.map(toInvoice);
  }
  async nextNumber(orgId: string, year: number) {
    const r = await this.pool.query<{ last_value: number }>(
      `INSERT INTO invoice_sequences (organization_id, year, last_value) VALUES ($1,$2,1)
       ON CONFLICT (organization_id, year) DO UPDATE SET last_value = invoice_sequences.last_value + 1 RETURNING last_value`,
      [orgId, year],
    );
    return Number(r.rows[0]!.last_value);
  }
}
class PgRefunds implements RefundRepo {
  constructor(private readonly pool: Pool) {}
  async create(x: Refund) { await this.pool.query(`INSERT INTO refunds (id, order_id, organization_id, amount_minor, reason, status, payment_refund_ref, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [x.id, x.orderId, x.organizationId, x.amountMinor, x.reason, x.status, x.paymentRefundRef ?? null, x.createdAt]); }
  async update(x: Refund) { await this.pool.query(`UPDATE refunds SET status=$2, payment_refund_ref=$3 WHERE id=$1`, [x.id, x.status, x.paymentRefundRef ?? null]); }
  async get(id: string) { const r = await this.pool.query(`SELECT * FROM refunds WHERE id=$1`, [id]); return r.rows[0] ? toRefund(r.rows[0]) : undefined; }
  async getByProviderRef(ref: string) { const r = await this.pool.query(`SELECT * FROM refunds WHERE payment_refund_ref=$1`, [ref]); return r.rows[0] ? toRefund(r.rows[0]) : undefined; }
  async listByOrder(orderId: string) { const r = await this.pool.query(`SELECT * FROM refunds WHERE order_id=$1 ORDER BY created_at`, [orderId]); return r.rows.map(toRefund); }
}
class PgProcessedEvents implements ProcessedEventRepo {
  constructor(private readonly pool: Pool) {}
  async record(id: string) {
    const r = await this.pool.query(`INSERT INTO processed_events (provider_event_id) VALUES ($1) ON CONFLICT DO NOTHING`, [id]);
    return (r.rowCount ?? 0) > 0;
  }
}

export function createPgRepos(pool: Pool): Repos {
  return {
    organizations: new PgOrganizations(pool),
    parties: new PgParties(pool),
    courses: new PgCourses(pool),
    events: new PgEvents(pool),
    seats: new PgSeats(pool),
    ticketTypes: new PgTicketTypes(pool),
    orders: new PgOrders(pool),
    corporateAccounts: new PgCorporateAccounts(pool),
    invoices: new PgInvoices(pool),
    refunds: new PgRefunds(pool),
    processedEvents: new PgProcessedEvents(pool),
  };
}

/** HTTP idempotency records for the API layer. */
export interface IdempotencyRecord { requestHash: string; statusCode: number; response: unknown }
export interface IdempotencyStore {
  get(organizationId: string, key: string): Promise<IdempotencyRecord | undefined>;
  put(organizationId: string, key: string, rec: IdempotencyRecord): Promise<void>;
}
export class PgIdempotencyStore implements IdempotencyStore {
  constructor(private readonly pool: Pool) {}
  async get(orgId: string, key: string) {
    const r = await this.pool.query(`SELECT request_hash, status_code, response FROM api_idempotency WHERE organization_id=$1 AND key=$2`, [orgId, key]);
    const row = r.rows[0];
    return row ? { requestHash: str(row.request_hash), statusCode: num(row.status_code), response: row.response } : undefined;
  }
  async put(orgId: string, key: string, rec: IdempotencyRecord) {
    await this.pool.query(`INSERT INTO api_idempotency (organization_id, key, request_hash, status_code, response) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`, [orgId, key, rec.requestHash, rec.statusCode, JSON.stringify(rec.response)]);
  }
}
