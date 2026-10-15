import type {
  EventRepo, OrderRepo, OrganizationRepo, PartyRepo, ProcessedEventRepo, RefundRepo, Repos, TicketTypeRepo,
} from "./ports.js";
import type { Event, Order, Organization, Party, Refund, TicketType } from "./types.js";

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
class MemEvents implements EventRepo {
  private readonly byId = new Map<string, Event>();
  async create(e: Event) { this.byId.set(e.id, structuredClone(e)); }
  async update(e: Event) { this.byId.set(e.id, structuredClone(e)); }
  async get(id: string) { const e = this.byId.get(id); return e && structuredClone(e); }
  async listByOrganization(orgId: string) { return [...this.byId.values()].filter((e) => e.organizationId === orgId).map((e) => structuredClone(e)); }
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
    events: new MemEvents(),
    ticketTypes: new MemTicketTypes(),
    orders: new MemOrders(),
    refunds: new MemRefunds(),
    processedEvents: new MemProcessedEvents(),
  };
}
