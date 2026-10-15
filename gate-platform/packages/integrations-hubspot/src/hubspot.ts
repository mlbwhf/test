import type { CrmContact, CrmDeal, CrmDealStage, CrmPort, CrmUpsertResult } from "./types.js";

export const DEFAULT_HUBSPOT_BASE_URL = "https://api.hubapi.com";
export const DEFAULT_DEAL_EXTERNAL_ID_PROPERTY = "gate_order_id";
export const DEFAULT_STAGE_MAP: Record<CrmDealStage, string> = {
  registered: "appointmentscheduled",
  paid: "closedwon",
  refunded: "closedlost",
  cancelled: "closedlost",
};
/** HubSpot-defined association type: deal -> contact. */
export const DEAL_TO_CONTACT_ASSOCIATION_TYPE_ID = 3;

const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 100;

export interface HubSpotCrmOptions {
  /** Private app access token. Never logged. */
  accessToken: string;
  baseUrl?: string | undefined;
  fetch?: typeof fetch | undefined;
  /** Injectable for tests; defaults to setTimeout-based sleep. */
  sleep?: ((ms: number) => Promise<void>) | undefined;
  pipeline?: string | undefined;
  stageMap?: Partial<Record<CrmDealStage, string>> | undefined;
  dealExternalIdProperty?: string | undefined;
}

export class HubSpotError extends Error {
  override readonly name = "HubSpotError";
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
  }
  get retryable(): boolean {
    return isRetryableStatus(this.status);
  }
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/** Splits "Ada Lovelace" into { firstName: "Ada", lastName: "Lovelace" }. */
export function splitName(name?: string | undefined): { firstName?: string | undefined; lastName?: string | undefined } {
  const trimmed = (name ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return {};
  const idx = trimmed.indexOf(" ");
  if (idx === -1) return { firstName: trimmed };
  return { firstName: trimmed.slice(0, idx), lastName: trimmed.slice(idx + 1) };
}

/** Formats minor units as a major-unit decimal string with 2 decimals ("129900" -> "1299.00"). */
export function formatAmountMajor(amountMinor: number): string {
  if (!Number.isFinite(amountMinor)) throw new TypeError("amountMinor must be a finite number");
  const sign = amountMinor < 0 ? "-" : "";
  const abs = Math.round(Math.abs(amountMinor));
  const major = Math.floor(abs / 100);
  const minor = abs % 100;
  return `${sign}${major}.${String(minor).padStart(2, "0")}`;
}

interface SearchResponse {
  total?: number;
  results?: Array<{ id: string; properties?: Record<string, string | null> }>;
}

interface ObjectResponse {
  id: string;
  properties?: Record<string, string | null>;
}

/** CrmPort backed by the HubSpot CRM v3 REST API using a private app access token. */
export class HubSpotCrm implements CrmPort {
  readonly provider = "hubspot";
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly pipeline: string;
  private readonly stageMap: Record<CrmDealStage, string>;
  private readonly dealExternalIdProperty: string;

  constructor(opts: HubSpotCrmOptions) {
    if (!opts.accessToken) throw new Error("HubSpotCrm: accessToken is required");
    this.accessToken = opts.accessToken;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_HUBSPOT_BASE_URL).replace(/\/+$/, "");
    this.fetchImpl = opts.fetch ?? globalThis.fetch;
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.pipeline = opts.pipeline ?? "default";
    this.stageMap = { ...DEFAULT_STAGE_MAP, ...stripUndefined(opts.stageMap ?? {}) };
    this.dealExternalIdProperty = opts.dealExternalIdProperty ?? DEFAULT_DEAL_EXTERNAL_ID_PROPERTY;
  }

  async upsertContact(c: CrmContact): Promise<CrmUpsertResult> {
    const properties = contactProperties(c);
    const existing = await this.findContactByEmail(c.email);
    if (existing) {
      const changed = diffProperties(existing.properties ?? {}, properties);
      if (Object.keys(changed).length > 0) {
        await this.request<ObjectResponse>("PATCH", `/crm/v3/objects/contacts/${encodeURIComponent(existing.id)}`, { properties: changed });
      }
      return { id: existing.id, created: false };
    }
    const created = await this.request<ObjectResponse>("POST", "/crm/v3/objects/contacts", { properties });
    return { id: created.id, created: true };
  }

  async upsertDeal(d: CrmDeal): Promise<CrmUpsertResult> {
    const properties = this.dealProperties(d);
    const existing = await this.findDealByExternalId(d.externalId);
    if (existing) {
      const changed = diffProperties(existing.properties ?? {}, properties);
      if (Object.keys(changed).length > 0) {
        await this.request<ObjectResponse>("PATCH", `/crm/v3/objects/deals/${encodeURIComponent(existing.id)}`, { properties: changed });
      }
      return { id: existing.id, created: false };
    }
    const contact = await this.upsertContact({ email: d.contactEmail });
    const created = await this.request<ObjectResponse>("POST", "/crm/v3/objects/deals", {
      properties,
      associations: [
        {
          to: { id: contact.id },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: DEAL_TO_CONTACT_ASSOCIATION_TYPE_ID }],
        },
      ],
    });
    return { id: created.id, created: true };
  }

  private async findContactByEmail(email: string): Promise<ObjectResponse | undefined> {
    const res = await this.request<SearchResponse>("POST", "/crm/v3/objects/contacts/search", {
      filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
      properties: ["email", "firstname", "lastname", "company", "phone"],
      limit: 1,
    });
    return res.results?.[0];
  }

  private async findDealByExternalId(externalId: string): Promise<ObjectResponse | undefined> {
    const res = await this.request<SearchResponse>("POST", "/crm/v3/objects/deals/search", {
      filterGroups: [{ filters: [{ propertyName: this.dealExternalIdProperty, operator: "EQ", value: externalId }] }],
      properties: ["dealname", "amount", "deal_currency_code", "dealstage", "pipeline", "closedate", this.dealExternalIdProperty],
      limit: 1,
    });
    return res.results?.[0];
  }

  private dealProperties(d: CrmDeal): Record<string, string> {
    const props: Record<string, string> = {
      dealname: d.name,
      amount: formatAmountMajor(d.amountMinor),
      deal_currency_code: d.currency.toUpperCase(),
      dealstage: this.stageMap[d.stage],
      pipeline: this.pipeline,
      [this.dealExternalIdProperty]: d.externalId,
    };
    if (d.closeDate) props["closedate"] = d.closeDate.toISOString();
    for (const [k, v] of Object.entries(d.properties ?? {})) props[k] = v;
    return props;
  }

  private async request<T>(method: "GET" | "POST" | "PATCH", path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let lastError: HubSpotError | undefined;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const init: RequestInit = {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };
      if (body !== undefined) init.body = JSON.stringify(body);
      const res = await this.fetchImpl(url, init);
      if (res.ok) {
        if (res.status === 204) return undefined as T;
        const text = await res.text();
        return (text ? JSON.parse(text) : undefined) as T;
      }
      const err = await toHubSpotError(res, method, path);
      if (!err.retryable || attempt === MAX_ATTEMPTS) throw err;
      lastError = err;
      await this.sleep(BACKOFF_BASE_MS * 2 ** (attempt - 1));
    }
    // Unreachable: the loop either returns or throws.
    throw lastError ?? new HubSpotError(0, `HubSpot ${method} ${path} failed`);
  }
}

function contactProperties(c: CrmContact): Record<string, string> {
  const props: Record<string, string> = { email: c.email };
  if (c.firstName !== undefined) props["firstname"] = c.firstName;
  if (c.lastName !== undefined) props["lastname"] = c.lastName;
  if (c.company !== undefined) props["company"] = c.company;
  if (c.phone !== undefined) props["phone"] = c.phone;
  for (const [k, v] of Object.entries(c.properties ?? {})) props[k] = v;
  return props;
}

/** Returns only the properties whose value differs from what HubSpot currently holds. */
function diffProperties(current: Record<string, string | null>, desired: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(desired)) {
    if ((current[k] ?? "") !== v) out[k] = v;
  }
  return out;
}

async function toHubSpotError(res: Response, method: string, path: string): Promise<HubSpotError> {
  let body: unknown;
  let message: string | undefined;
  try {
    const text = await res.text();
    if (text) {
      try {
        body = JSON.parse(text);
        const b = body as { message?: unknown };
        if (typeof b?.message === "string") message = b.message;
      } catch {
        body = text;
        message = text;
      }
    }
  } catch {
    // ignore body read failures
  }
  // The message is built from path and status only; the token is never included.
  return new HubSpotError(res.status, `HubSpot ${method} ${path} failed with ${res.status}${message ? `: ${message}` : ""}`, body);
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
  return out as Partial<T>;
}
