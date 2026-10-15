import type { CrmContact, CrmDeal, CrmPort, CrmUpsertResult } from "./types.js";

export interface InMemoryContact extends CrmContact {
  id: string;
}

export interface InMemoryDeal extends CrmDeal {
  id: string;
  contactId: string;
}

/** In-memory CrmPort for tests and local development. */
export class InMemoryCrm implements CrmPort {
  readonly provider = "memory";
  /** Keyed by lower-cased email. */
  readonly contacts = new Map<string, InMemoryContact>();
  /** Keyed by externalId. */
  readonly deals = new Map<string, InMemoryDeal>();
  private seq = 0;

  async upsertContact(c: CrmContact): Promise<CrmUpsertResult> {
    const key = c.email.toLowerCase();
    const existing = this.contacts.get(key);
    if (existing) {
      const merged: InMemoryContact = {
        ...existing,
        ...stripUndefined(c),
        properties: { ...(existing.properties ?? {}), ...(c.properties ?? {}) },
      };
      this.contacts.set(key, merged);
      return { id: existing.id, created: false };
    }
    const id = `c_${++this.seq}`;
    this.contacts.set(key, { ...stripUndefined(c), email: c.email, id, properties: { ...(c.properties ?? {}) } });
    return { id, created: true };
  }

  async upsertDeal(d: CrmDeal): Promise<CrmUpsertResult> {
    const contact = await this.upsertContact({ email: d.contactEmail });
    const existing = this.deals.get(d.externalId);
    if (existing) {
      const merged: InMemoryDeal = {
        ...existing,
        ...stripUndefined(d),
        contactId: contact.id,
        properties: { ...(existing.properties ?? {}), ...(d.properties ?? {}) },
      };
      this.deals.set(d.externalId, merged);
      return { id: existing.id, created: false };
    }
    const id = `d_${++this.seq}`;
    this.deals.set(d.externalId, { ...stripUndefined(d), id, contactId: contact.id, properties: { ...(d.properties ?? {}) } } as InMemoryDeal);
    return { id, created: true };
  }
}

function stripUndefined<T extends object>(o: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
  return out as T;
}
