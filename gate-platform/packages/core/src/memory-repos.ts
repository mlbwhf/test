import type { AuthSession, Identity, IdentityRepos, Invitation, Membership, OneTimeToken, TokenKind, User } from "./identity.js";
import type {
  CertificateRepo, CorporateAccountRepo, CourseRepo, EventRepo, InvoiceRepo, MessageLogRepo, OrderRepo, OrganizationRepo, PartyRepo, PayoutRepo, ProcessedEventRepo, RefundRepo, Repos, SeatRepo, SeatTransferRepo, TicketTypeRepo, WaitlistRepo,
} from "./ports.js";
import type { Certificate, CorporateAccount, Course, Event, Invoice, MessageLogEntry, Order, Organization, Party, Payout, Refund, Seat, SeatTransfer, TicketType, WaitlistEntry } from "./types.js";

class MemOrganizations implements OrganizationRepo {
  private readonly byId = new Map<string, Organization>();
  async create(org: Organization) { this.byId.set(org.id, structuredClone(org)); }
  async update(org: Organization) { this.byId.set(org.id, structuredClone(org)); }
  async get(id: string) { const o = this.byId.get(id); return o && structuredClone(o); }
  async getByApiKeyHash(hash: string) { for (const o of this.byId.values()) if (o.apiKeyHash === hash) return structuredClone(o); return undefined; }
  async list() { return [...this.byId.values()].map((o) => structuredClone(o)); }
}
class MemParties implements PartyRepo {
  private readonly byId = new Map<string, Party>();
  async create(p: Party) { this.byId.set(p.id, structuredClone(p)); }
  async get(id: string) { const p = this.byId.get(id); return p && structuredClone(p); }
  async listByOrganization(orgId: string) { return [...this.byId.values()].filter((p) => p.organizationId === orgId).map((p) => structuredClone(p)); }
}
class MemCourses implements CourseRepo {
  private readonly byId = new Map<string, Course>();
  async create(c: Course) { this.byId.set(c.id, structuredClone(c)); }
  async update(c: Course) { this.byId.set(c.id, structuredClone(c)); }
  async get(id: string) { const c = this.byId.get(id); return c && structuredClone(c); }
  async getBySlug(orgId: string, slug: string) { for (const c of this.byId.values()) if (c.organizationId === orgId && c.slug === slug) return structuredClone(c); return undefined; }
  async listByOrganization(orgId: string) { return [...this.byId.values()].filter((c) => c.organizationId === orgId).map((c) => structuredClone(c)); }
}
class MemEvents implements EventRepo {
  private readonly byId = new Map<string, Event>();
  async create(e: Event) { this.byId.set(e.id, structuredClone(e)); }
  async update(e: Event) { this.byId.set(e.id, structuredClone(e)); }
  async get(id: string) { const e = this.byId.get(id); return e && structuredClone(e); }
  async listByOrganization(orgId: string) { return [...this.byId.values()].filter((e) => e.organizationId === orgId).map((e) => structuredClone(e)); }
  async listByCourse(courseId: string) { return [...this.byId.values()].filter((e) => e.courseId === courseId).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()).map((e) => structuredClone(e)); }
}
class MemSeats implements SeatRepo {
  private readonly byId = new Map<string, Seat>();
  async create(s: Seat) { this.byId.set(s.id, structuredClone(s)); }
  async update(s: Seat) { this.byId.set(s.id, structuredClone(s)); }
  async get(id: string) { const s = this.byId.get(id); return s && structuredClone(s); }
  async listByOrder(orderId: string) { return [...this.byId.values()].filter((s) => s.orderId === orderId).map((s) => structuredClone(s)); }
  async listByEvent(eventId: string) { return [...this.byId.values()].filter((s) => s.eventId === eventId).map((s) => structuredClone(s)); }
}
class MemTicketTypes implements TicketTypeRepo {
  private readonly byId = new Map<string, TicketType>();
  async create(t: TicketType) { this.byId.set(t.id, structuredClone(t)); }
  async get(id: string) { const t = this.byId.get(id); return t && structuredClone(t); }
  async listByEvent(eventId: string) { return [...this.byId.values()].filter((t) => t.eventId === eventId).map((t) => structuredClone(t)); }
  async reserve(id: string, qty: number) {
    const t = this.byId.get(id);
    if (!t) return false;
    if (t.sold + qty > t.quantity) return false;
    t.sold += qty;
    return true;
  }
  async release(id: string, qty: number) {
    const t = this.byId.get(id);
    if (t) t.sold = Math.max(0, t.sold - qty);
  }
}
class MemOrders implements OrderRepo {
  private readonly byId = new Map<string, Order>();
  async create(o: Order) { this.byId.set(o.id, structuredClone(o)); }
  async update(o: Order) { this.byId.set(o.id, structuredClone(o)); }
  async get(id: string) { const o = this.byId.get(id); return o && structuredClone(o); }
  async getByPaymentRef(ref: string) { for (const o of this.byId.values()) if (o.paymentRef === ref) return structuredClone(o); return undefined; }
  async getByIdempotencyKey(orgId: string, key: string) {
    for (const o of this.byId.values()) if (o.organizationId === orgId && o.idempotencyKey === key) return structuredClone(o);
    return undefined;
  }
  async listByOrganization(orgId: string, limit = 100) {
    return [...this.byId.values()].filter((o) => o.organizationId === orgId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit).map((o) => structuredClone(o));
  }
}
class MemCorporateAccounts implements CorporateAccountRepo {
  private readonly byId = new Map<string, CorporateAccount>();
  async create(a: CorporateAccount) { this.byId.set(a.id, structuredClone(a)); }
  async update(a: CorporateAccount) { this.byId.set(a.id, structuredClone(a)); }
  async get(id: string) { const a = this.byId.get(id); return a && structuredClone(a); }
  async getByBillingEmail(orgId: string, email: string) { for (const a of this.byId.values()) if (a.organizationId === orgId && a.billingEmail.toLowerCase() === email.toLowerCase()) return structuredClone(a); return undefined; }
  async listByOrganization(orgId: string) { return [...this.byId.values()].filter((a) => a.organizationId === orgId).map((a) => structuredClone(a)); }
}
class MemInvoices implements InvoiceRepo {
  private readonly byId = new Map<string, Invoice>();
  private readonly seq = new Map<string, number>();
  async create(i: Invoice) { this.byId.set(i.id, structuredClone(i)); }
  async update(i: Invoice) { this.byId.set(i.id, structuredClone(i)); }
  async get(id: string) { const i = this.byId.get(id); return i && structuredClone(i); }
  async getByOrder(orderId: string) { for (const i of this.byId.values()) if (i.orderId === orderId) return structuredClone(i); return undefined; }
  async getByCardPaymentRef(ref: string) { for (const i of this.byId.values()) if (i.cardPaymentRef === ref) return structuredClone(i); return undefined; }
  async listByOrganization(orgId: string, filter?: { status?: Invoice["status"][] | undefined }) {
    return [...this.byId.values()].filter((i) => i.organizationId === orgId && (!filter?.status || filter.status.includes(i.status))).sort((a, b) => a.issuedAt.getTime() - b.issuedAt.getTime()).map((i) => structuredClone(i));
  }
  async nextNumber(orgId: string, year: number) { const k = `${orgId}:${year}`; const n = (this.seq.get(k) ?? 0) + 1; this.seq.set(k, n); return n; }
}
class MemSeatTransfers implements SeatTransferRepo {
  private readonly byId = new Map<string, SeatTransfer>();
  async create(t: SeatTransfer) { this.byId.set(t.id, structuredClone(t)); }
  async update(t: SeatTransfer) { this.byId.set(t.id, structuredClone(t)); }
  async get(id: string) { const t = this.byId.get(id); return t && structuredClone(t); }
  async getByPaymentRef(ref: string) { for (const t of this.byId.values()) if (t.paymentRef === ref) return structuredClone(t); return undefined; }
  async listBySeat(seatId: string) { return [...this.byId.values()].filter((t) => t.fromSeatId === seatId).map((t) => structuredClone(t)); }
}
class MemWaitlist implements WaitlistRepo {
  private readonly byId = new Map<string, WaitlistEntry>();
  async create(e: WaitlistEntry) { this.byId.set(e.id, structuredClone(e)); }
  async update(e: WaitlistEntry) { this.byId.set(e.id, structuredClone(e)); }
  async get(id: string) { const e = this.byId.get(id); return e && structuredClone(e); }
  async listOpenByEvent(eventId: string) { return [...this.byId.values()].filter((e) => e.eventId === eventId && (e.status === "waiting" || e.status === "offered")).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map((e) => structuredClone(e)); }
  async listOffered() { return [...this.byId.values()].filter((e) => e.status === "offered").map((e) => structuredClone(e)); }
  async findOpen(eventId: string, email: string) { for (const e of this.byId.values()) if (e.eventId === eventId && e.email === email.toLowerCase() && (e.status === "waiting" || e.status === "offered")) return structuredClone(e); return undefined; }
}
class MemCertificates implements CertificateRepo {
  private readonly byId = new Map<string, Certificate>();
  async create(c: Certificate) { this.byId.set(c.id, structuredClone(c)); }
  async update(c: Certificate) { this.byId.set(c.id, structuredClone(c)); }
  async get(id: string) { const c = this.byId.get(id); return c && structuredClone(c); }
  async getByCode(code: string) { for (const c of this.byId.values()) if (c.verifyCode === code) return structuredClone(c); return undefined; }
  async getBySeat(seatId: string) { for (const c of this.byId.values()) if (c.seatId === seatId) return structuredClone(c); return undefined; }
  async listByEvent(eventId: string) { return [...this.byId.values()].filter((c) => c.eventId === eventId).map((c) => structuredClone(c)); }
}
class MemMessageLog implements MessageLogRepo {
  private readonly byKey = new Map<string, MessageLogEntry>();
  async record(e: MessageLogEntry) { if (this.byKey.has(e.key)) return false; this.byKey.set(e.key, structuredClone(e)); return true; }
  async listByEvent(eventId: string) { return [...this.byKey.values()].filter((e) => e.eventId === eventId).sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime()).map((e) => structuredClone(e)); }
}
class MemPayouts implements PayoutRepo {
  private readonly items: Payout[] = [];
  async create(p: Payout) { this.items.push(structuredClone(p)); }
  async listByOrganization(orgId: string, limit = 100) { return this.items.filter((p) => p.organizationId === orgId).slice(-limit).reverse().map((p) => structuredClone(p)); }
}
class MemRefunds implements RefundRepo {
  private readonly byId = new Map<string, Refund>();
  async create(r: Refund) { this.byId.set(r.id, structuredClone(r)); }
  async update(r: Refund) { this.byId.set(r.id, structuredClone(r)); }
  async get(id: string) { const r = this.byId.get(id); return r && structuredClone(r); }
  async getByProviderRef(ref: string) { for (const r of this.byId.values()) if (r.paymentRefundRef === ref) return structuredClone(r); return undefined; }
  async listByOrder(orderId: string) { return [...this.byId.values()].filter((r) => r.orderId === orderId).map((r) => structuredClone(r)); }
}
class MemProcessedEvents implements ProcessedEventRepo {
  private readonly seen = new Set<string>();
  async record(id: string) { if (this.seen.has(id)) return false; this.seen.add(id); return true; }
}

export function createInMemoryRepos(): Repos {
  return {
    organizations: new MemOrganizations(),
    parties: new MemParties(),
    courses: new MemCourses(),
    events: new MemEvents(),
    seats: new MemSeats(),
    ticketTypes: new MemTicketTypes(),
    orders: new MemOrders(),
    corporateAccounts: new MemCorporateAccounts(),
    invoices: new MemInvoices(),
    seatTransfers: new MemSeatTransfers(),
    waitlist: new MemWaitlist(),
    certificates: new MemCertificates(),
    messageLog: new MemMessageLog(),
    payouts: new MemPayouts(),
    refunds: new MemRefunds(),
    processedEvents: new MemProcessedEvents(),
  };
}

// ---------- identity (users, sessions, invitations) ----------

class MemUsers {
  private readonly byId = new Map<string, User>();
  async create(u: User) { this.byId.set(u.id, structuredClone(u)); }
  async update(u: User) { this.byId.set(u.id, structuredClone(u)); }
  async get(id: string) { const u = this.byId.get(id); return u && structuredClone(u); }
  async getByEmail(email: string) { const u = [...this.byId.values()].find((x) => x.email === email.toLowerCase()); return u && structuredClone(u); }
}
class MemIdentities {
  private readonly rows = new Map<string, Identity>();
  async create(i: Identity) { this.rows.set(`${i.provider}:${i.subject}`, structuredClone(i)); }
  async get(provider: string, subject: string) { const i = this.rows.get(`${provider}:${subject}`); return i && structuredClone(i); }
  async listByUser(userId: string) { return [...this.rows.values()].filter((i) => i.userId === userId).map((i) => structuredClone(i)); }
}
class MemMemberships {
  private readonly rows = new Map<string, Membership>();
  async upsert(m: Membership) { this.rows.set(`${m.organizationId}:${m.userId}`, structuredClone(m)); }
  async get(o: string, u: string) { const m = this.rows.get(`${o}:${u}`); return m && structuredClone(m); }
  async listByUser(u: string) { return [...this.rows.values()].filter((m) => m.userId === u).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map((m) => structuredClone(m)); }
  async listByOrganization(o: string) { return [...this.rows.values()].filter((m) => m.organizationId === o).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map((m) => structuredClone(m)); }
  async delete(o: string, u: string) { this.rows.delete(`${o}:${u}`); }
}
class MemInvitations {
  private readonly byId = new Map<string, Invitation>();
  async create(i: Invitation) { this.byId.set(i.id, structuredClone(i)); }
  async update(i: Invitation) { this.byId.set(i.id, structuredClone(i)); }
  async get(id: string) { const i = this.byId.get(id); return i && structuredClone(i); }
  async getByTokenHash(h: string) { const i = [...this.byId.values()].find((x) => x.tokenHash === h); return i && structuredClone(i); }
  async listByOrganization(o: string) { return [...this.byId.values()].filter((i) => i.organizationId === o).map((i) => structuredClone(i)); }
  async listOpenByEmail(email: string, now: Date) { return [...this.byId.values()].filter((i) => i.email === email && !i.acceptedAt && !i.revokedAt && i.expiresAt > now).map((i) => structuredClone(i)); }
}
class MemSessions {
  private readonly byId = new Map<string, AuthSession>();
  async create(s: AuthSession) { this.byId.set(s.id, structuredClone(s)); }
  async update(s: AuthSession) { this.byId.set(s.id, structuredClone(s)); }
  async getByTokenHash(h: string) { const s = [...this.byId.values()].find((x) => x.tokenHash === h); return s && structuredClone(s); }
  async delete(id: string) { this.byId.delete(id); }
}
class MemTokens {
  private readonly rows = new Map<string, OneTimeToken>();
  async put(t: OneTimeToken) { this.rows.set(t.hash, structuredClone(t)); }
  async consume(hash: string, kind: TokenKind, now: Date) {
    const t = this.rows.get(hash);
    if (!t || t.kind !== kind) return undefined;
    this.rows.delete(hash);
    return t.expiresAt > now ? structuredClone(t.payload) : undefined;
  }
}

export function createInMemoryIdentityRepos(): IdentityRepos {
  return { users: new MemUsers(), identities: new MemIdentities(), memberships: new MemMemberships(), invitations: new MemInvitations(), sessions: new MemSessions(), tokens: new MemTokens() };
}
