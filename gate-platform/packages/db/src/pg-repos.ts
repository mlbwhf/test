import type { ApiKey, AuthSession, IdentityRepos, IntegrationRepos, WebhookDelivery, WebhookEndpoint, Invitation, Membership, Role, User } from "@gate/core";
import type {
  Certificate, CertificateRepo, CorporateAccount, CorporateAccountRepo, Course, CourseRepo, Event, EventRepo, Invoice, InvoiceRepo, MessageLogEntry, MessageLogRepo, Order, OrderRepo, Organization, OrganizationRepo, Party, PartyRepo, Payout, PayoutRepo, ProcessedEventRepo, Promotion, PromotionRepo, Refund, RefundRepo, Repos, Seat, SeatRepo, SeatTransfer, SeatTransferRepo, TicketType, TicketTypeRepo, WaitlistEntry, WaitlistRepo,
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
    ...(opt<Organization["changePolicy"]>(r.change_policy) ? { changePolicy: r.change_policy as NonNullable<Organization["changePolicy"]> } : {}),
    ...(opt<Record<string, unknown>>(r.pricing) ? { pricing: pricingFromRow(r.pricing as Record<string, unknown>) } : {}),
    ...(opt<string>(r.kind) ? { kind: r.kind as NonNullable<Organization["kind"]> } : {}),
    ...(opt<Record<string, unknown>>(r.instructor_access) ? { instructorAccess: r.instructor_access as NonNullable<Organization["instructorAccess"]> } : {}),
    ...(opt<Record<string, unknown>>(r.payments_status) ? { paymentsStatus: statusFromRow(r.payments_status) } : {}),
    ...(r.payment_mode === "direct" ? { paymentMode: "direct" as const } : {}),
    ...(opt<string>(r.direct_account_ref) ? { directAccountRef: str(r.direct_account_ref) } : {}),
    ...(opt<Record<string, unknown>>(r.direct_status) ? { directStatus: statusFromRow(r.direct_status) } : {}),
    ...(r.marketplace_listing === false ? { marketplaceListing: false } : {}),
    ...(r.flexible_tickets === true ? { flexibleTickets: true } : {}),
    ...(opt<string>(r.logo_url) ? { logoUrl: str(r.logo_url) } : {}),
    releasePolicy: (r.release_policy as Organization["releasePolicy"]) ?? "on_delivery", releaseGraceHours: num(r.release_grace_hours ?? 24), minEnrollmentDecisionDays: num(r.min_enrollment_decision_days ?? 7),
    apiKeyHash: str(r.api_key_hash), createdAt: date(r.created_at),
  };
}
function statusFromRow(v: unknown): NonNullable<Organization["paymentsStatus"]> {
  return { ...(v as NonNullable<Organization["paymentsStatus"]>), checkedAt: new Date(String((v as Record<string, unknown>).checkedAt)) };
}
function pricingFromRow(p: Record<string, unknown>): NonNullable<Organization["pricing"]> {
  const { ratesUpdatedAt, ...rest } = p as unknown as NonNullable<Organization["pricing"]> & { ratesUpdatedAt?: string | Date };
  return { ...rest, ...(ratesUpdatedAt ? { ratesUpdatedAt: new Date(ratesUpdatedAt) } : {}) };
}
function toParty(r: Row): Party {
  const ref = opt<string>(r.payments_account_ref);
  return { id: str(r.id), organizationId: str(r.organization_id), name: str(r.name), kind: r.kind as Party["kind"], ...(ref ? { paymentsAccountRef: ref } : {}), createdAt: date(r.created_at) };
}
function toCourse(r: Row): Course {
  const description = opt<string>(r.description), body = opt<string>(r.certification_body), days = opt<number>(r.duration_days);
  const policy = opt<Course["changePolicy"]>(r.change_policy), prework = opt<string>(r.prework), surveyUrl = opt<string>(r.survey_url), imageUrl = opt<string>(r.image_url);
  return { id: str(r.id), organizationId: str(r.organization_id), slug: str(r.slug), name: str(r.name), ...(description ? { description } : {}), ...(body ? { certificationBody: body } : {}), ...(days !== undefined ? { durationDays: num(days) } : {}), ...(policy ? { changePolicy: policy as NonNullable<Course["changePolicy"]> } : {}), ...(prework ? { prework } : {}), ...(surveyUrl ? { surveyUrl } : {}), ...(imageUrl ? { imageUrl } : {}), ...(opt<Course["badge"]>(r.badge) ? { badge: r.badge as NonNullable<Course["badge"]> } : {}), ...(opt<string>(r.category) ? { category: r.category as NonNullable<Course["category"]> } : {}), ...(opt<string>(r.language) ? { language: str(r.language) } : {}), createdAt: date(r.created_at) };
}
function toEvent(r: Row): Event {
  const rules = opt<Event["splitRules"]>(r.split_rules);
  const courseId = opt<string>(r.course_id), endsAt = opt<Date>(r.ends_at), minEnrollment = opt<number>(r.min_enrollment);
  const sessions = ((r.sessions as Array<{ startsAt: string; endsAt: string; title?: string }>) ?? []).map((s) => ({ startsAt: new Date(s.startsAt), endsAt: new Date(s.endsAt), ...(s.title ? { title: s.title } : {}) }));
  return {
    id: str(r.id), organizationId: str(r.organization_id), ...(courseId ? { courseId } : {}), name: str(r.name), startsAt: date(r.starts_at), ...(endsAt ? { endsAt } : {}),
    timezone: str(r.timezone), format: r.format as Event["format"], sessions, instructorIds: (r.instructor_ids as string[]) ?? [],
    ...(minEnrollment !== undefined ? { minEnrollment: num(minEnrollment) } : {}),
    ...(opt<Event["meeting"]>(r.meeting) ? { meeting: r.meeting as NonNullable<Event["meeting"]> } : {}),
    ...(((r.instructor_fees as Event["instructorFees"]) ?? []).length ? { instructorFees: r.instructor_fees as NonNullable<Event["instructorFees"]> } : {}),
    ...(opt<Date>(r.at_risk_at) ? { atRiskAt: date(r.at_risk_at) } : {}), ...(opt<Date>(r.cancelled_at) ? { cancelledAt: date(r.cancelled_at) } : {}), ...(opt<string>(r.cancel_reason) ? { cancelReason: str(r.cancel_reason) } : {}),
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
  const confirmedAt = opt<Date>(r.confirmed_at), cancelledAt = opt<Date>(r.cancelled_at), from = opt<string>(r.transferred_from_seat_id), to = opt<string>(r.transferred_to_seat_id), checkedInAt = opt<Date>(r.checked_in_at);
  const att = opt<Omit<NonNullable<Seat["attendance"]>, "updatedAt"> & { updatedAt: string }>(r.attendance);
  const subs = ((r.substitutions as Array<{ from: Seat["attendee"]; at: string }>) ?? []).map((x) => ({ from: x.from, at: new Date(x.at) }));
  return {
    id: str(r.id), organizationId: str(r.organization_id), orderId: str(r.order_id), eventId: str(r.event_id), ticketTypeId: str(r.ticket_type_id), attendee: r.attendee as Seat["attendee"], status: r.status as Seat["status"], createdAt: date(r.created_at),
    ...(confirmedAt ? { confirmedAt } : {}), ...(cancelledAt ? { cancelledAt } : {}), ...(from ? { transferredFromSeatId: from } : {}), ...(to ? { transferredToSeatId: to } : {}), ...(subs.length ? { substitutions: subs } : {}),
    ...(att ? { attendance: { ...att, updatedAt: new Date(att.updatedAt) } } : {}),
    ...(checkedInAt ? { checkedInAt: date(checkedInAt) } : {}),
  };
}
function toCertificate(r: Row): Certificate {
  const revokedAt = opt<Date>(r.revoked_at);
  return { id: str(r.id), organizationId: str(r.organization_id), seatId: str(r.seat_id), eventId: str(r.event_id), courseName: str(r.course_name), attendeeName: str(r.attendee_name), attendeeEmail: str(r.attendee_email), issuedAt: date(r.issued_at), verifyCode: str(r.verify_code), ...(revokedAt ? { revokedAt } : {}), kind: (opt<string>(r.kind) ?? "completion") as NonNullable<Certificate["kind"]>, ...(opt<unknown>(r.hours) !== undefined ? { hours: num(r.hours) } : {}), ...(opt<Certificate["badge"]>(r.badge) ? { badge: r.badge as NonNullable<Certificate["badge"]> } : {}) };
}
function toTransfer(r: Row): SeatTransfer {
  const paymentRef = opt<string>(r.payment_ref), toSeatId = opt<string>(r.to_seat_id), completedAt = opt<Date>(r.completed_at);
  return { id: str(r.id), organizationId: str(r.organization_id), fromSeatId: str(r.from_seat_id), toEventId: str(r.to_event_id), toTicketTypeId: str(r.to_ticket_type_id), feeMinor: num(r.fee_minor), currency: str(r.currency), status: r.status as SeatTransfer["status"], ...(paymentRef ? { paymentRef } : {}), ...(opt<string>(r.charge_account_ref) ? { chargeAccountRef: str(r.charge_account_ref) } : {}), ...(toSeatId ? { toSeatId } : {}), createdAt: date(r.created_at), ...(completedAt ? { completedAt } : {}) };
}
function toWaitlist(r: Row): WaitlistEntry {
  const name = opt<string>(r.name), offeredAt = opt<Date>(r.offered_at), exp = opt<Date>(r.offer_expires_at), conv = opt<string>(r.converted_order_id);
  return { id: str(r.id), organizationId: str(r.organization_id), eventId: str(r.event_id), ticketTypeId: str(r.ticket_type_id), email: str(r.email), ...(name ? { name } : {}), quantity: num(r.quantity), status: r.status as WaitlistEntry["status"], createdAt: date(r.created_at), ...(offeredAt ? { offeredAt } : {}), ...(exp ? { offerExpiresAt: exp } : {}), ...(conv ? { convertedOrderId: conv } : {}) };
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
    ...(r.settlement === "direct" ? { settlement: "direct" as const } : {}),
    ...(opt<string>(r.charge_account_ref) ? { chargeAccountRef: str(r.charge_account_ref) } : {}),
    transferRefs: (r.transfer_refs as Record<string, string>) ?? {},
    refundedMinor: num(r.refunded_minor),
    heldMinor: num(r.held_minor ?? 0), fundsStatus: (r.funds_status as Order["fundsStatus"]) ?? "none", ...(opt<Date>(r.released_at) ? { releasedAt: date(r.released_at) } : {}),
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
    status: r.status as Invoice["status"], issuedAt: date(r.issued_at), dueAt: date(r.due_at), payments, ...(cardRef ? { cardPaymentRef: cardRef } : {}),
    ...(((r.reminders as unknown[]) ?? []).length ? { reminders: (r.reminders as Array<{ step: NonNullable<Invoice["reminders"]>[number]["step"]; sentAt: string }>).map((x) => ({ step: x.step, sentAt: new Date(x.sentAt) })) } : {}),
    createdAt: date(r.created_at),
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
      `INSERT INTO organizations (id, name, country, currency, payout_destination, pass_fee_to_attendee, payments_account_ref, split_rules, api_key_hash, created_at, release_policy, release_grace_hours, min_enrollment_decision_days, kind) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [o.id, o.name, o.country, o.currency, o.payoutDestination, o.passFeeToAttendee, o.paymentsAccountRef ?? null, JSON.stringify(o.splitRules), o.apiKeyHash, o.createdAt, o.releasePolicy, o.releaseGraceHours, o.minEnrollmentDecisionDays, o.kind ?? null],
    );
  }
  async update(o: Organization) {
    await this.pool.query(
      `UPDATE organizations SET name=$2, country=$3, currency=$4, payout_destination=$5, pass_fee_to_attendee=$6, payments_account_ref=$7, split_rules=$8, change_policy=$9, release_policy=$10, release_grace_hours=$11, min_enrollment_decision_days=$12, api_key_hash=$13, pricing=$14, payments_status=$15, instructor_access=$16, payment_mode=$17, direct_account_ref=$18, direct_status=$19, marketplace_listing=$20, flexible_tickets=$21, logo_url=$22 WHERE id=$1`,
      [o.id, o.name, o.country, o.currency, o.payoutDestination, o.passFeeToAttendee, o.paymentsAccountRef ?? null, JSON.stringify(o.splitRules), o.changePolicy ? JSON.stringify(o.changePolicy) : null, o.releasePolicy, o.releaseGraceHours, o.minEnrollmentDecisionDays, o.apiKeyHash, o.pricing ? JSON.stringify(o.pricing) : null, o.paymentsStatus ? JSON.stringify(o.paymentsStatus) : null, o.instructorAccess ? JSON.stringify(o.instructorAccess) : null, o.paymentMode ?? "protected", o.directAccountRef ?? null, o.directStatus ? JSON.stringify(o.directStatus) : null, o.marketplaceListing !== false, o.flexibleTickets === true, o.logoUrl ?? null],
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
  async create(c: Course) { await this.pool.query(`INSERT INTO courses (id, organization_id, slug, name, description, certification_body, duration_days, created_at, category, language) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [c.id, c.organizationId, c.slug, c.name, c.description ?? null, c.certificationBody ?? null, c.durationDays ?? null, c.createdAt, c.category ?? null, c.language ?? null]); }
  async update(c: Course) { await this.pool.query(`UPDATE courses SET slug=$2, name=$3, description=$4, certification_body=$5, duration_days=$6, change_policy=$7, prework=$8, survey_url=$9, image_url=$10, badge=$11, category=$12, language=$13 WHERE id=$1`, [c.id, c.slug, c.name, c.description ?? null, c.certificationBody ?? null, c.durationDays ?? null, c.changePolicy ? JSON.stringify(c.changePolicy) : null, c.prework ?? null, c.surveyUrl ?? null, c.imageUrl ?? null, c.badge ? JSON.stringify(c.badge) : null, c.category ?? null, c.language ?? null]); }
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
      `UPDATE events SET course_id=$2, name=$3, starts_at=$4, ends_at=$5, timezone=$6, format=$7, sessions=$8, instructor_ids=$9, min_enrollment=$10, currency=$11, status=$12, split_rules=$13, meeting=$14, instructor_fees=$15, at_risk_at=$16, cancelled_at=$17, cancel_reason=$18 WHERE id=$1`,
      [e.id, e.courseId ?? null, e.name, e.startsAt, e.endsAt ?? null, e.timezone, e.format, sessionsJson(e), JSON.stringify(e.instructorIds), e.minEnrollment ?? null, e.currency, e.status, e.splitRules ? JSON.stringify(e.splitRules) : null, e.meeting ? JSON.stringify(e.meeting) : null, JSON.stringify(e.instructorFees ?? []), e.atRiskAt ?? null, e.cancelledAt ?? null, e.cancelReason ?? null],
    );
  }
  async get(id: string) { const r = await this.pool.query(`SELECT * FROM events WHERE id=$1`, [id]); return r.rows[0] ? toEvent(r.rows[0]) : undefined; }
  async listByOrganization(orgId: string) { const r = await this.pool.query(`SELECT * FROM events WHERE organization_id=$1 ORDER BY starts_at`, [orgId]); return r.rows.map(toEvent); }
  async listByCourse(courseId: string) { const r = await this.pool.query(`SELECT * FROM events WHERE course_id=$1 ORDER BY starts_at`, [courseId]); return r.rows.map(toEvent); }
}
class PgSeats implements SeatRepo {
  constructor(private readonly pool: Pool) {}
  async create(s: Seat) { await this.pool.query(`INSERT INTO seats (id, organization_id, order_id, event_id, ticket_type_id, attendee, status, created_at, confirmed_at, transferred_from_seat_id, transferred_to_seat_id, substitutions, cancelled_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [s.id, s.organizationId, s.orderId, s.eventId, s.ticketTypeId, JSON.stringify(s.attendee), s.status, s.createdAt, s.confirmedAt ?? null, s.transferredFromSeatId ?? null, s.transferredToSeatId ?? null, JSON.stringify((s.substitutions ?? []).map((x) => ({ from: x.from, at: x.at.toISOString() }))), s.cancelledAt ?? null]); }
  async update(s: Seat) { await this.pool.query(`UPDATE seats SET event_id=$2, ticket_type_id=$3, attendee=$4, status=$5, confirmed_at=$6, transferred_from_seat_id=$7, transferred_to_seat_id=$8, substitutions=$9, cancelled_at=$10, attendance=$11, checked_in_at=$12 WHERE id=$1`, [s.id, s.eventId, s.ticketTypeId, JSON.stringify(s.attendee), s.status, s.confirmedAt ?? null, s.transferredFromSeatId ?? null, s.transferredToSeatId ?? null, JSON.stringify((s.substitutions ?? []).map((x) => ({ from: x.from, at: x.at.toISOString() }))), s.cancelledAt ?? null, s.attendance ? JSON.stringify({ ...s.attendance, updatedAt: s.attendance.updatedAt.toISOString() }) : null, s.checkedInAt ?? null]); }
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
      `INSERT INTO orders (id, organization_id, event_id, ticket_type_id, quantity, buyer_email, attendees, currency, status, pricing, splits, payment_ref, transfer_refs, refunded_minor, idempotency_key, created_at, paid_at, payment_method, corporate_account_id, billing_address, held_minor, funds_status, released_at, settlement, charge_account_ref)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
      [o.id, o.organizationId, o.eventId, o.ticketTypeId, o.quantity, o.buyerEmail, JSON.stringify(o.attendees), o.currency, o.status, JSON.stringify(o.pricing), JSON.stringify(o.splits), o.paymentRef ?? null, JSON.stringify(o.transferRefs), o.refundedMinor, o.idempotencyKey ?? null, o.createdAt, o.paidAt ?? null, o.paymentMethod, o.corporateAccountId ?? null, o.billingAddress ? JSON.stringify(o.billingAddress) : null, o.heldMinor, o.fundsStatus, o.releasedAt ?? null, o.settlement ?? null, o.chargeAccountRef ?? null],
    );
  }
  async update(o: Order) {
    await this.pool.query(
      `UPDATE orders SET status=$2, payment_ref=$3, transfer_refs=$4, refunded_minor=$5, paid_at=$6, held_minor=$7, funds_status=$8, released_at=$9, event_id=$10, ticket_type_id=$11 WHERE id=$1`,
      [o.id, o.status, o.paymentRef ?? null, JSON.stringify(o.transferRefs), o.refundedMinor, o.paidAt ?? null, o.heldMinor, o.fundsStatus, o.releasedAt ?? null, o.eventId, o.ticketTypeId],
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
  async update(i: Invoice) { await this.pool.query(`UPDATE invoices SET po_number=$2, paid_minor=$3, status=$4, due_at=$5, payments=$6, card_payment_ref=$7, reminders=$8 WHERE id=$1`, [i.id, i.poNumber ?? null, i.paidMinor, i.status, i.dueAt, paymentsJson(i), i.cardPaymentRef ?? null, JSON.stringify(i.reminders ?? [])]); }
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
class PgSeatTransfers implements SeatTransferRepo {
  constructor(private readonly pool: Pool) {}
  async create(t: SeatTransfer) { await this.pool.query(`INSERT INTO seat_transfers (id, organization_id, from_seat_id, to_event_id, to_ticket_type_id, fee_minor, currency, status, payment_ref, to_seat_id, created_at, completed_at, charge_account_ref) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [t.id, t.organizationId, t.fromSeatId, t.toEventId, t.toTicketTypeId, t.feeMinor, t.currency, t.status, t.paymentRef ?? null, t.toSeatId ?? null, t.createdAt, t.completedAt ?? null, t.chargeAccountRef ?? null]); }
  async update(t: SeatTransfer) { await this.pool.query(`UPDATE seat_transfers SET status=$2, payment_ref=$3, to_seat_id=$4, completed_at=$5 WHERE id=$1`, [t.id, t.status, t.paymentRef ?? null, t.toSeatId ?? null, t.completedAt ?? null]); }
  async get(id: string) { const r = await this.pool.query(`SELECT * FROM seat_transfers WHERE id=$1`, [id]); return r.rows[0] ? toTransfer(r.rows[0]) : undefined; }
  async getByPaymentRef(ref: string) { const r = await this.pool.query(`SELECT * FROM seat_transfers WHERE payment_ref=$1`, [ref]); return r.rows[0] ? toTransfer(r.rows[0]) : undefined; }
  async listBySeat(seatId: string) { const r = await this.pool.query(`SELECT * FROM seat_transfers WHERE from_seat_id=$1 ORDER BY created_at`, [seatId]); return r.rows.map(toTransfer); }
}
class PgWaitlist implements WaitlistRepo {
  constructor(private readonly pool: Pool) {}
  async create(e: WaitlistEntry) { await this.pool.query(`INSERT INTO waitlist_entries (id, organization_id, event_id, ticket_type_id, email, name, quantity, status, created_at, offered_at, offer_expires_at, converted_order_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [e.id, e.organizationId, e.eventId, e.ticketTypeId, e.email, e.name ?? null, e.quantity, e.status, e.createdAt, e.offeredAt ?? null, e.offerExpiresAt ?? null, e.convertedOrderId ?? null]); }
  async update(e: WaitlistEntry) { await this.pool.query(`UPDATE waitlist_entries SET status=$2, offered_at=$3, offer_expires_at=$4, converted_order_id=$5 WHERE id=$1`, [e.id, e.status, e.offeredAt ?? null, e.offerExpiresAt ?? null, e.convertedOrderId ?? null]); }
  async get(id: string) { const r = await this.pool.query(`SELECT * FROM waitlist_entries WHERE id=$1`, [id]); return r.rows[0] ? toWaitlist(r.rows[0]) : undefined; }
  async listOpenByEvent(eventId: string) { const r = await this.pool.query(`SELECT * FROM waitlist_entries WHERE event_id=$1 AND status IN ('waiting','offered') ORDER BY created_at`, [eventId]); return r.rows.map(toWaitlist); }
  async listOffered() { const r = await this.pool.query(`SELECT * FROM waitlist_entries WHERE status='offered' ORDER BY offer_expires_at`); return r.rows.map(toWaitlist); }
  async findOpen(eventId: string, email: string) { const r = await this.pool.query(`SELECT * FROM waitlist_entries WHERE event_id=$1 AND lower(email)=lower($2) AND status IN ('waiting','offered') LIMIT 1`, [eventId, email]); return r.rows[0] ? toWaitlist(r.rows[0]) : undefined; }
}
class PgCertificates implements CertificateRepo {
  constructor(private readonly pool: Pool) {}
  async create(c: Certificate) { await this.pool.query(`INSERT INTO certificates (id, organization_id, seat_id, event_id, course_name, attendee_name, attendee_email, issued_at, verify_code, revoked_at, kind, hours, badge) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [c.id, c.organizationId, c.seatId, c.eventId, c.courseName, c.attendeeName, c.attendeeEmail, c.issuedAt, c.verifyCode, c.revokedAt ?? null, c.kind ?? "completion", c.hours ?? null, c.badge ? JSON.stringify(c.badge) : null]); }
  async update(c: Certificate) { await this.pool.query(`UPDATE certificates SET revoked_at=$2, badge=$3 WHERE id=$1`, [c.id, c.revokedAt ?? null, c.badge ? JSON.stringify(c.badge) : null]); }
  async get(id: string) { const r = await this.pool.query(`SELECT * FROM certificates WHERE id=$1`, [id]); return r.rows[0] ? toCertificate(r.rows[0]) : undefined; }
  async getByCode(code: string) { const r = await this.pool.query(`SELECT * FROM certificates WHERE verify_code=$1`, [code]); return r.rows[0] ? toCertificate(r.rows[0]) : undefined; }
  async getBySeat(seatId: string) { const r = await this.pool.query(`SELECT * FROM certificates WHERE seat_id=$1`, [seatId]); return r.rows[0] ? toCertificate(r.rows[0]) : undefined; }
  async listByEvent(eventId: string) { const r = await this.pool.query(`SELECT * FROM certificates WHERE event_id=$1 ORDER BY issued_at`, [eventId]); return r.rows.map(toCertificate); }
}
class PgMessageLog implements MessageLogRepo {
  constructor(private readonly pool: Pool) {}
  async record(e: MessageLogEntry) {
    const r = await this.pool.query(`INSERT INTO message_log (key, step, organization_id, event_id, seat_id, recipient, sent_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (key) DO NOTHING`, [e.key, e.step, e.organizationId, e.eventId, e.seatId ?? null, e.to, e.sentAt]);
    return (r.rowCount ?? 0) > 0;
  }
  async listByEvent(eventId: string) {
    const r = await this.pool.query(`SELECT * FROM message_log WHERE event_id=$1 ORDER BY sent_at`, [eventId]);
    return r.rows.map((x) => ({ key: str(x.key), step: x.step as MessageLogEntry["step"], organizationId: str(x.organization_id), eventId: str(x.event_id), ...(opt<string>(x.seat_id) ? { seatId: str(x.seat_id) } : {}), to: str(x.recipient), sentAt: date(x.sent_at) }));
  }
}
class PgPayouts implements PayoutRepo {
  constructor(private readonly pool: Pool) {}
  async create(p: Payout) { await this.pool.query(`INSERT INTO payouts (id, organization_id, party_id, currency, amount_minor, method, reference, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [p.id, p.organizationId, p.partyId ?? null, p.currency, p.amountMinor, p.method, p.reference ?? null, p.createdAt]); }
  async listByOrganization(orgId: string, limit = 100) {
    const r = await this.pool.query(`SELECT * FROM payouts WHERE organization_id=$1 ORDER BY created_at DESC LIMIT $2`, [orgId, limit]);
    return r.rows.map((x) => ({ id: str(x.id), organizationId: str(x.organization_id), ...(opt<string>(x.party_id) ? { partyId: str(x.party_id) } : {}), currency: str(x.currency), amountMinor: num(x.amount_minor), method: x.method as Payout["method"], ...(opt<string>(x.reference) ? { reference: str(x.reference) } : {}), createdAt: date(x.created_at) }));
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
function toPromotion(r: Row): Promotion {
  return {
    id: str(r.id), organizationId: str(r.organization_id), courseId: str(r.course_id), placement: r.placement as Promotion["placement"], weeks: num(r.weeks),
    amountMinor: num(r.amount_minor), currency: str(r.currency), status: r.status as Promotion["status"], ...(opt<string>(r.payment_ref) ? { paymentRef: str(r.payment_ref) } : {}),
    ...(opt<Date>(r.starts_at) ? { startsAt: date(r.starts_at) } : {}), ...(opt<Date>(r.ends_at) ? { endsAt: date(r.ends_at) } : {}), createdAt: date(r.created_at),
  };
}
class PgPromotions implements PromotionRepo {
  constructor(private readonly pool: Pool) {}
  async create(p: Promotion) { await this.pool.query(`INSERT INTO promotions (id, organization_id, course_id, placement, weeks, amount_minor, currency, status, payment_ref, starts_at, ends_at, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [p.id, p.organizationId, p.courseId, p.placement, p.weeks, p.amountMinor, p.currency, p.status, p.paymentRef ?? null, p.startsAt ?? null, p.endsAt ?? null, p.createdAt]); }
  async update(p: Promotion) { await this.pool.query(`UPDATE promotions SET status=$2, payment_ref=$3, starts_at=$4, ends_at=$5 WHERE id=$1`, [p.id, p.status, p.paymentRef ?? null, p.startsAt ?? null, p.endsAt ?? null]); }
  async getByPaymentRef(ref: string) { const r = await this.pool.query(`SELECT * FROM promotions WHERE payment_ref=$1`, [ref]); return r.rows[0] ? toPromotion(r.rows[0]) : undefined; }
  async listByOrganization(orgId: string) { const r = await this.pool.query(`SELECT * FROM promotions WHERE organization_id=$1 ORDER BY created_at DESC`, [orgId]); return r.rows.map(toPromotion); }
  async listActive(at: Date) { const r = await this.pool.query(`SELECT * FROM promotions WHERE status='active' AND starts_at <= $1 AND ends_at > $1 ORDER BY starts_at`, [at]); return r.rows.map(toPromotion); }
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
    seatTransfers: new PgSeatTransfers(pool),
    waitlist: new PgWaitlist(pool),
    certificates: new PgCertificates(pool),
    messageLog: new PgMessageLog(pool),
    payouts: new PgPayouts(pool),
    refunds: new PgRefunds(pool),
    processedEvents: new PgProcessedEvents(pool),
    promotions: new PgPromotions(pool),
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


// ---------- identity ----------

function toUser(r: Row): User {
  const name = opt<string>(r.name), avatar = opt<string>(r.avatar_url), last = opt<Date>(r.last_login_at);
  return { id: str(r.id), email: str(r.email), emailVerified: Boolean(r.email_verified), ...(name ? { name } : {}), ...(avatar ? { avatarUrl: avatar } : {}), createdAt: date(r.created_at), ...(last ? { lastLoginAt: date(last) } : {}) };
}
function toMembership(r: Row): Membership {
  const party = opt<string>(r.party_id);
  return { organizationId: str(r.organization_id), userId: str(r.user_id), role: r.role as Role, ...(party ? { partyId: party } : {}), createdAt: date(r.created_at) };
}
function toInvitation(r: Row): Invitation {
  const by = opt<string>(r.invited_by_user_id), acc = opt<Date>(r.accepted_at), accBy = opt<string>(r.accepted_by_user_id), rev = opt<Date>(r.revoked_at);
  return { id: str(r.id), organizationId: str(r.organization_id), email: str(r.email), role: r.role as Role, tokenHash: str(r.token_hash), ...(by ? { invitedByUserId: by } : {}), createdAt: date(r.created_at), expiresAt: date(r.expires_at), ...(acc ? { acceptedAt: date(acc) } : {}), ...(accBy ? { acceptedByUserId: accBy } : {}), ...(rev ? { revokedAt: date(rev) } : {}) };
}
function toAuthSession(r: Row): AuthSession {
  const org = opt<string>(r.organization_id);
  return { id: str(r.id), tokenHash: str(r.token_hash), userId: str(r.user_id), ...(org ? { organizationId: org } : {}), createdAt: date(r.created_at), expiresAt: date(r.expires_at), lastSeenAt: date(r.last_seen_at) };
}

export function createPgIdentityRepos(pool: Pool): IdentityRepos {
  return {
    users: {
      async create(u) { await pool.query(`INSERT INTO users (id, email, email_verified, name, avatar_url, created_at, last_login_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [u.id, u.email, u.emailVerified, u.name ?? null, u.avatarUrl ?? null, u.createdAt, u.lastLoginAt ?? null]); },
      async update(u) { await pool.query(`UPDATE users SET email=$2, email_verified=$3, name=$4, avatar_url=$5, last_login_at=$6 WHERE id=$1`, [u.id, u.email, u.emailVerified, u.name ?? null, u.avatarUrl ?? null, u.lastLoginAt ?? null]); },
      async get(id) { const r = await pool.query(`SELECT * FROM users WHERE id=$1`, [id]); return r.rows[0] ? toUser(r.rows[0]) : undefined; },
      async getByEmail(email) { const r = await pool.query(`SELECT * FROM users WHERE email=$1`, [email.toLowerCase()]); return r.rows[0] ? toUser(r.rows[0]) : undefined; },
    },
    identities: {
      async create(i) { await pool.query(`INSERT INTO identities (provider, subject, user_id, email, created_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`, [i.provider, i.subject, i.userId, i.email ?? null, i.createdAt]); },
      async get(provider, subject) { const r = await pool.query(`SELECT * FROM identities WHERE provider=$1 AND subject=$2`, [provider, subject]); const x = r.rows[0]; return x ? { provider: str(x.provider), subject: str(x.subject), userId: str(x.user_id), ...(opt<string>(x.email) ? { email: str(x.email) } : {}), createdAt: date(x.created_at) } : undefined; },
      async listByUser(userId) { const r = await pool.query(`SELECT * FROM identities WHERE user_id=$1 ORDER BY created_at`, [userId]); return r.rows.map((x) => ({ provider: str(x.provider), subject: str(x.subject), userId: str(x.user_id), ...(opt<string>(x.email) ? { email: str(x.email) } : {}), createdAt: date(x.created_at) })); },
    },
    memberships: {
      async upsert(m) { await pool.query(`INSERT INTO memberships (organization_id, user_id, role, party_id, created_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (organization_id, user_id) DO UPDATE SET role=EXCLUDED.role, party_id=EXCLUDED.party_id`, [m.organizationId, m.userId, m.role, m.partyId ?? null, m.createdAt]); },
      async get(o, u) { const r = await pool.query(`SELECT * FROM memberships WHERE organization_id=$1 AND user_id=$2`, [o, u]); return r.rows[0] ? toMembership(r.rows[0]) : undefined; },
      async listByUser(u) { const r = await pool.query(`SELECT * FROM memberships WHERE user_id=$1 ORDER BY created_at`, [u]); return r.rows.map(toMembership); },
      async listByOrganization(o) { const r = await pool.query(`SELECT * FROM memberships WHERE organization_id=$1 ORDER BY created_at`, [o]); return r.rows.map(toMembership); },
      async delete(o, u) { await pool.query(`DELETE FROM memberships WHERE organization_id=$1 AND user_id=$2`, [o, u]); },
    },
    invitations: {
      async create(i) { await pool.query(`INSERT INTO invitations (id, organization_id, email, role, token_hash, invited_by_user_id, created_at, expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [i.id, i.organizationId, i.email, i.role, i.tokenHash, i.invitedByUserId ?? null, i.createdAt, i.expiresAt]); },
      async update(i) { await pool.query(`UPDATE invitations SET role=$2, expires_at=$3, accepted_at=$4, accepted_by_user_id=$5, revoked_at=$6 WHERE id=$1`, [i.id, i.role, i.expiresAt, i.acceptedAt ?? null, i.acceptedByUserId ?? null, i.revokedAt ?? null]); },
      async get(id) { const r = await pool.query(`SELECT * FROM invitations WHERE id=$1`, [id]); return r.rows[0] ? toInvitation(r.rows[0]) : undefined; },
      async getByTokenHash(h) { const r = await pool.query(`SELECT * FROM invitations WHERE token_hash=$1`, [h]); return r.rows[0] ? toInvitation(r.rows[0]) : undefined; },
      async listByOrganization(o) { const r = await pool.query(`SELECT * FROM invitations WHERE organization_id=$1 ORDER BY created_at`, [o]); return r.rows.map(toInvitation); },
      async listOpenByEmail(email, now) { const r = await pool.query(`SELECT * FROM invitations WHERE email=$1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > $2`, [email, now]); return r.rows.map(toInvitation); },
    },
    sessions: {
      async create(s) { await pool.query(`INSERT INTO auth_sessions (id, token_hash, user_id, organization_id, created_at, expires_at, last_seen_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [s.id, s.tokenHash, s.userId, s.organizationId ?? null, s.createdAt, s.expiresAt, s.lastSeenAt]); },
      async update(s) { await pool.query(`UPDATE auth_sessions SET organization_id=$2, expires_at=$3, last_seen_at=$4 WHERE id=$1`, [s.id, s.organizationId ?? null, s.expiresAt, s.lastSeenAt]); },
      async getByTokenHash(h) { const r = await pool.query(`SELECT * FROM auth_sessions WHERE token_hash=$1`, [h]); return r.rows[0] ? toAuthSession(r.rows[0]) : undefined; },
      async delete(id) { await pool.query(`DELETE FROM auth_sessions WHERE id=$1`, [id]); },
    },
    tokens: {
      async put(t) {
        await pool.query(`DELETE FROM auth_tokens WHERE expires_at < now() - interval '1 day'`);
        await pool.query(`INSERT INTO auth_tokens (hash, kind, payload, expires_at) VALUES ($1,$2,$3,$4)`, [t.hash, t.kind, JSON.stringify(t.payload), t.expiresAt]);
      },
      async consume(hash, kind, now) {
        const r = await pool.query(`DELETE FROM auth_tokens WHERE hash=$1 AND kind=$2 RETURNING payload, expires_at`, [hash, kind]);
        const row = r.rows[0];
        return row && date(row.expires_at) > now ? (row.payload as Record<string, unknown>) : undefined;
      },
    },
  };
}

function toApiKey(r: Row): ApiKey {
  const by = opt<string>(r.created_by_user_id), used = opt<Date>(r.last_used_at), revoked = opt<Date>(r.revoked_at);
  return { id: str(r.id), organizationId: str(r.organization_id), name: str(r.name), prefix: str(r.prefix), hash: str(r.hash), access: r.access as ApiKey["access"], createdAt: date(r.created_at), ...(by ? { createdByUserId: by } : {}), ...(used ? { lastUsedAt: used } : {}), ...(revoked ? { revokedAt: revoked } : {}) };
}
function toWebhook(r: Row): WebhookEndpoint {
  const description = opt<string>(r.description), disabled = opt<Date>(r.disabled_at);
  return { id: str(r.id), organizationId: str(r.organization_id), url: str(r.url), secret: str(r.secret), events: r.events as WebhookEndpoint["events"], ...(description ? { description } : {}), createdAt: date(r.created_at), ...(disabled ? { disabledAt: disabled } : {}) };
}
function toDelivery(r: Row): WebhookDelivery {
  const status = opt<number>(r.response_status), error = opt<string>(r.error);
  return { id: str(r.id), endpointId: str(r.endpoint_id), organizationId: str(r.organization_id), type: r.type as WebhookDelivery["type"], body: str(r.body), status: r.status as WebhookDelivery["status"], attempts: num(r.attempts), ...(status !== undefined ? { responseStatus: num(status) } : {}), ...(error ? { error } : {}), createdAt: date(r.created_at), updatedAt: date(r.updated_at) };
}

export function createPgIntegrationRepos(pool: Pool): IntegrationRepos {
  return {
    apiKeys: {
      async create(k) { await pool.query(`INSERT INTO api_keys (id, organization_id, name, prefix, hash, access, created_at, created_by_user_id, last_used_at, revoked_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [k.id, k.organizationId, k.name, k.prefix, k.hash, k.access, k.createdAt, k.createdByUserId ?? null, k.lastUsedAt ?? null, k.revokedAt ?? null]); },
      async update(k) { await pool.query(`UPDATE api_keys SET name=$2, last_used_at=$3, revoked_at=$4 WHERE id=$1`, [k.id, k.name, k.lastUsedAt ?? null, k.revokedAt ?? null]); },
      async getByHash(h) { const r = await pool.query(`SELECT * FROM api_keys WHERE hash=$1`, [h]); return r.rows[0] ? toApiKey(r.rows[0]) : undefined; },
      async get(id) { const r = await pool.query(`SELECT * FROM api_keys WHERE id=$1`, [id]); return r.rows[0] ? toApiKey(r.rows[0]) : undefined; },
      async listByOrganization(o) { const r = await pool.query(`SELECT * FROM api_keys WHERE organization_id=$1 ORDER BY created_at DESC`, [o]); return r.rows.map(toApiKey); },
    },
    webhooks: {
      async create(w) { await pool.query(`INSERT INTO webhook_endpoints (id, organization_id, url, secret, events, description, created_at, disabled_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [w.id, w.organizationId, w.url, w.secret, JSON.stringify(w.events), w.description ?? null, w.createdAt, w.disabledAt ?? null]); },
      async update(w) { await pool.query(`UPDATE webhook_endpoints SET url=$2, events=$3, description=$4, disabled_at=$5 WHERE id=$1`, [w.id, w.url, JSON.stringify(w.events), w.description ?? null, w.disabledAt ?? null]); },
      async get(id) { const r = await pool.query(`SELECT * FROM webhook_endpoints WHERE id=$1`, [id]); return r.rows[0] ? toWebhook(r.rows[0]) : undefined; },
      async listByOrganization(o) { const r = await pool.query(`SELECT * FROM webhook_endpoints WHERE organization_id=$1 ORDER BY created_at DESC`, [o]); return r.rows.map(toWebhook); },
    },
    deliveries: {
      async create(d) { await pool.query(`INSERT INTO webhook_deliveries (id, endpoint_id, organization_id, type, body, status, attempts, response_status, error, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [d.id, d.endpointId, d.organizationId, d.type, d.body, d.status, d.attempts, d.responseStatus ?? null, d.error ?? null, d.createdAt, d.updatedAt]); },
      async update(d) { await pool.query(`UPDATE webhook_deliveries SET status=$2, attempts=$3, response_status=$4, error=$5, updated_at=$6 WHERE id=$1`, [d.id, d.status, d.attempts, d.responseStatus ?? null, d.error ?? null, d.updatedAt]); },
      async listByEndpoint(e, limit) { const r = await pool.query(`SELECT * FROM webhook_deliveries WHERE endpoint_id=$1 ORDER BY created_at DESC LIMIT $2`, [e, limit]); return r.rows.map(toDelivery); },
    },
  };
}
