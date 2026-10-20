import { createHash, createHmac, randomBytes } from "node:crypto";
import { DomainError } from "./errors.js";
import type { CoreHooks } from "./hooks.js";
import type { Clock, IdGenerator } from "./ports.js";
import type { Event, Order, Seat } from "./types.js";

// Plugging EnrollClass into other tools: API keys an organizer creates and revokes, and
// signed webhooks that automation platforms (Zapier, Make, n8n…) or the organizer's own
// code receive when things happen.

export type ApiKeyAccess = "full" | "read";

export interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  /** First characters of the key, shown so people can tell keys apart. */
  prefix: string;
  hash: string;
  access: ApiKeyAccess;
  createdAt: Date;
  createdByUserId?: string;
  lastUsedAt?: Date;
  revokedAt?: Date;
}

export const WEBHOOK_EVENTS = [
  "order.paid",
  "order.refunded",
  "seat.cancelled",
  "seat.transferred",
  "seat.substituted",
  "checkin.created",
  "event.created",
  "event.published",
  "cohort.at_risk",
  "cohort.cancelled",
  "certificate.issued",
  "waitlist.offered",
] as const;
export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

export interface WebhookEndpoint {
  id: string;
  organizationId: string;
  url: string;
  /** Signing secret, shown to the organizer so their receiver can verify deliveries. */
  secret: string;
  events: WebhookEventType[];
  description?: string;
  createdAt: Date;
  disabledAt?: Date;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  organizationId: string;
  type: WebhookEventType | "ping";
  body: string;
  status: "pending" | "succeeded" | "failed";
  attempts: number;
  responseStatus?: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationRepos {
  apiKeys: {
    create(k: ApiKey): Promise<void>;
    update(k: ApiKey): Promise<void>;
    getByHash(hash: string): Promise<ApiKey | undefined>;
    get(id: string): Promise<ApiKey | undefined>;
    listByOrganization(organizationId: string): Promise<ApiKey[]>;
  };
  webhooks: {
    create(w: WebhookEndpoint): Promise<void>;
    update(w: WebhookEndpoint): Promise<void>;
    get(id: string): Promise<WebhookEndpoint | undefined>;
    listByOrganization(organizationId: string): Promise<WebhookEndpoint[]>;
  };
  deliveries: {
    create(d: WebhookDelivery): Promise<void>;
    update(d: WebhookDelivery): Promise<void>;
    listByEndpoint(endpointId: string, limit: number): Promise<WebhookDelivery[]>;
  };
}

export function createInMemoryIntegrationRepos(): IntegrationRepos {
  const keys = new Map<string, ApiKey>();
  const hooks = new Map<string, WebhookEndpoint>();
  const deliveries = new Map<string, WebhookDelivery>();
  const byCreated = <T extends { createdAt: Date }>(a: T, b: T) => b.createdAt.getTime() - a.createdAt.getTime();
  return {
    apiKeys: {
      create: async (k) => void keys.set(k.id, { ...k }),
      update: async (k) => void keys.set(k.id, { ...k }),
      getByHash: async (h) => [...keys.values()].find((k) => k.hash === h),
      get: async (id) => keys.get(id),
      listByOrganization: async (o) => [...keys.values()].filter((k) => k.organizationId === o).sort(byCreated),
    },
    webhooks: {
      create: async (w) => void hooks.set(w.id, { ...w }),
      update: async (w) => void hooks.set(w.id, { ...w }),
      get: async (id) => hooks.get(id),
      listByOrganization: async (o) => [...hooks.values()].filter((w) => w.organizationId === o).sort(byCreated),
    },
    deliveries: {
      create: async (d) => void deliveries.set(d.id, { ...d }),
      update: async (d) => void deliveries.set(d.id, { ...d }),
      listByEndpoint: async (e, limit) => [...deliveries.values()].filter((d) => d.endpointId === e).sort(byCreated).slice(0, limit),
    },
  };
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const KEY_PREFIX = "eck_";

/** `EnrollClass-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<body>">` */
export function signWebhook(secret: string, body: string, unixSeconds: number): string {
  return `t=${unixSeconds},v1=${createHmac("sha256", secret).update(`${unixSeconds}.${body}`).digest("hex")}`;
}

/** For receivers (and tests): constant-time check of a signature header within a tolerance window. */
export function verifyWebhookSignature(secret: string, body: string, header: string, nowSeconds: number, toleranceSeconds = 300): boolean {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!Number.isFinite(t) || Math.abs(nowSeconds - t) > toleranceSeconds || !parts.v1) return false;
  const expected = signWebhook(secret, body, t).split("v1=")[1]!;
  if (expected.length !== parts.v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ parts.v1.charCodeAt(i);
  return diff === 0;
}

export interface IntegrationsOptions {
  fetch?: typeof fetch;
  /** Retry delays after the first attempt; tests pass [] or tiny values. */
  retryDelaysMs?: number[];
  /** Blocks private and loopback hosts; tests and local development turn it off. */
  allowPrivateUrls?: boolean;
}

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0|\[?::1\]?|.*\.local$|.*\.internal$)/i;

export class Integrations {
  private readonly fetchImpl: typeof fetch;
  private readonly retries: number[];
  constructor(private readonly repos: IntegrationRepos, private readonly clock: Clock, private readonly ids: IdGenerator, private readonly opts: IntegrationsOptions = {}) {
    this.fetchImpl = opts.fetch ?? fetch;
    this.retries = opts.retryDelaysMs ?? [10_000, 60_000, 300_000];
  }

  // ---------- API keys ----------

  /** The plain key is returned once; only its hash is stored. */
  async createApiKey(organizationId: string, input: { name: string; access: ApiKeyAccess; createdByUserId?: string | undefined }): Promise<{ key: ApiKey; secret: string }> {
    const name = input.name.trim();
    if (!name) throw new DomainError("VALIDATION", "give the key a name, e.g. Zapier");
    if (input.access !== "full" && input.access !== "read") throw new DomainError("VALIDATION", "access is full or read");
    const secret = `${KEY_PREFIX}${randomBytes(24).toString("base64url")}`;
    const key: ApiKey = {
      id: this.ids.next("key"), organizationId, name: name.slice(0, 80), prefix: secret.slice(0, 10), hash: sha256(secret), access: input.access,
      createdAt: this.clock.now(), ...(input.createdByUserId ? { createdByUserId: input.createdByUserId } : {}),
    };
    await this.repos.apiKeys.create(key);
    return { key, secret };
  }

  listApiKeys(organizationId: string): Promise<ApiKey[]> {
    return this.repos.apiKeys.listByOrganization(organizationId);
  }

  async revokeApiKey(organizationId: string, id: string): Promise<void> {
    const key = await this.repos.apiKeys.get(id);
    if (!key || key.organizationId !== organizationId) throw new DomainError("NOT_FOUND", "key not found");
    if (!key.revokedAt) await this.repos.apiKeys.update({ ...key, revokedAt: this.clock.now() });
  }

  /** Resolves an `eck_` key; records last use at most hourly. */
  async authenticateKey(secret: string): Promise<ApiKey | undefined> {
    if (!secret.startsWith(KEY_PREFIX)) return undefined;
    const key = await this.repos.apiKeys.getByHash(sha256(secret));
    if (!key || key.revokedAt) return undefined;
    const now = this.clock.now();
    if (!key.lastUsedAt || now.getTime() - key.lastUsedAt.getTime() > 3_600_000) await this.repos.apiKeys.update({ ...key, lastUsedAt: now });
    return key;
  }

  // ---------- Webhooks ----------

  private checkUrl(url: string) {
    let u: URL;
    try {
      u = new URL(url);
    } catch {
      throw new DomainError("VALIDATION", "that isn't a URL");
    }
    if (u.protocol !== "https:" && !this.opts.allowPrivateUrls) throw new DomainError("VALIDATION", "webhook URLs must use https");
    if (!this.opts.allowPrivateUrls && PRIVATE_HOST.test(u.hostname)) throw new DomainError("VALIDATION", "webhook URLs must be public internet addresses");
  }

  private checkEvents(events: string[]): WebhookEventType[] {
    const unknown = events.filter((e) => !(WEBHOOK_EVENTS as readonly string[]).includes(e));
    if (unknown.length) throw new DomainError("VALIDATION", `unknown event ${unknown.join(", ")}`);
    if (!events.length) throw new DomainError("VALIDATION", "pick at least one event");
    return [...new Set(events)] as WebhookEventType[];
  }

  async createWebhook(organizationId: string, input: { url: string; events: string[]; description?: string | undefined }): Promise<WebhookEndpoint> {
    this.checkUrl(input.url);
    const existing = await this.repos.webhooks.listByOrganization(organizationId);
    if (existing.filter((w) => !w.disabledAt).length >= 10) throw new DomainError("CONFLICT", "an organization can have 10 webhooks", "remove one first");
    const hook: WebhookEndpoint = {
      id: this.ids.next("wh"), organizationId, url: input.url, secret: `whsec_${randomBytes(24).toString("base64url")}`, events: this.checkEvents(input.events),
      ...(input.description?.trim() ? { description: input.description.trim().slice(0, 200) } : {}), createdAt: this.clock.now(),
    };
    await this.repos.webhooks.create(hook);
    return hook;
  }

  async updateWebhook(organizationId: string, id: string, input: { events?: string[] | undefined; enabled?: boolean | undefined }): Promise<WebhookEndpoint> {
    const hook = await this.getWebhook(organizationId, id);
    const next: WebhookEndpoint = { ...hook, ...(input.events ? { events: this.checkEvents(input.events) } : {}) };
    if (input.enabled === false && !next.disabledAt) next.disabledAt = this.clock.now();
    if (input.enabled === true) delete next.disabledAt;
    await this.repos.webhooks.update(next);
    return next;
  }

  async getWebhook(organizationId: string, id: string): Promise<WebhookEndpoint> {
    const hook = await this.repos.webhooks.get(id);
    if (!hook || hook.organizationId !== organizationId) throw new DomainError("NOT_FOUND", "webhook not found");
    return hook;
  }

  listWebhooks(organizationId: string): Promise<WebhookEndpoint[]> {
    return this.repos.webhooks.listByOrganization(organizationId);
  }

  async listDeliveries(organizationId: string, id: string): Promise<WebhookDelivery[]> {
    await this.getWebhook(organizationId, id);
    return this.repos.deliveries.listByEndpoint(id, 50);
  }

  /** Sends a ping and waits for the first attempt, so the organizer sees the result right away. */
  async testWebhook(organizationId: string, id: string): Promise<WebhookDelivery> {
    const hook = await this.getWebhook(organizationId, id);
    return this.deliver(hook, "ping", { message: "Test delivery from EnrollClass" }, { retry: false });
  }

  /** Fan an event out to every enabled endpoint of the organization that subscribed to it. */
  async emit(organizationId: string, type: WebhookEventType, data: Record<string, unknown>): Promise<void> {
    const targets = (await this.repos.webhooks.listByOrganization(organizationId)).filter((w) => !w.disabledAt && w.events.includes(type));
    // Fire and forget: a slow receiver never delays a payment, a check-in or a page.
    for (const hook of targets) void this.deliver(hook, type, data, { retry: true }).catch(() => undefined);
  }

  private async deliver(hook: WebhookEndpoint, type: WebhookEventType | "ping", data: Record<string, unknown>, opts: { retry: boolean }): Promise<WebhookDelivery> {
    const now = this.clock.now();
    const id = this.ids.next("whd");
    const body = JSON.stringify({ id, type, createdAt: now.toISOString(), organizationId: hook.organizationId, data });
    let d: WebhookDelivery = { id, endpointId: hook.id, organizationId: hook.organizationId, type, body, status: "pending", attempts: 0, createdAt: now, updatedAt: now };
    await this.repos.deliveries.create(d);
    const attempt = async (): Promise<boolean> => {
      const at = this.clock.now();
      let next: WebhookDelivery = { ...d, attempts: d.attempts + 1, updatedAt: at };
      delete next.error;
      try {
        const res = await this.fetchImpl(hook.url, {
          method: "POST",
          headers: { "content-type": "application/json", "user-agent": "EnrollClass-Webhooks/1", "enrollclass-event": type, "enrollclass-delivery": id, "enrollclass-signature": signWebhook(hook.secret, body, Math.floor(at.getTime() / 1000)) },
          body,
          redirect: "manual",
          signal: AbortSignal.timeout(10_000),
        });
        next = { ...next, responseStatus: res.status, status: res.status >= 200 && res.status < 300 ? "succeeded" : "failed" };
        if (next.status === "failed") next.error = `HTTP ${res.status}`;
      } catch (err) {
        next = { ...next, status: "failed", error: (err as Error).name === "TimeoutError" ? "timed out after 10 seconds" : (err as Error).message };
      }
      d = next;
      await this.repos.deliveries.update(d);
      return d.status === "succeeded";
    };
    if (await attempt()) return d;
    if (opts.retry) {
      for (const wait of this.retries) {
        await new Promise((r) => setTimeout(r, wait));
        if (await attempt()) break;
      }
    }
    return d;
  }

  /** Core hooks that turn platform events into webhook deliveries. */
  hooks(): CoreHooks {
    const ev = (e: Event) => ({ id: e.id, name: e.name, courseId: e.courseId ?? null, startsAt: e.startsAt.toISOString(), endsAt: e.endsAt?.toISOString() ?? null, timezone: e.timezone, format: e.format, status: e.status, currency: e.currency, instructorIds: e.instructorIds });
    const order = (o: Order) => ({ id: o.id, eventId: o.eventId, status: o.status, buyerEmail: o.buyerEmail, quantity: o.quantity, currency: o.currency, totalMinor: o.pricing.totalMinor, refundedMinor: o.refundedMinor, paymentMethod: o.paymentMethod });
    const seat = (s: Seat) => ({ id: s.id, eventId: s.eventId, orderId: s.orderId, status: s.status, attendee: s.attendee, checkedInAt: s.checkedInAt?.toISOString() ?? null });
    return {
      orderPaid: async (c) => this.emit(c.organization.id, "order.paid", { order: order(c.order), event: ev(c.event), course: c.course ? { id: c.course.id, slug: c.course.slug, name: c.course.name } : null, ticketType: { id: c.ticketType.id, name: c.ticketType.name }, seats: c.seats.map(seat) }),
      orderRefunded: async (c) => this.emit(c.organization.id, "order.refunded", { order: order(c.order), refund: { id: c.refund.id, amountMinor: c.refund.amountMinor, reason: c.refund.reason }, fully: c.fully, event: ev(c.event) }),
      seatChanged: async (c) => this.emit(c.seat.organizationId, c.kind === "cancelled" ? "seat.cancelled" : c.kind === "transferred" ? "seat.transferred" : "seat.substituted", { seat: seat(c.seat), ...(c.kind === "transferred" ? { previousSeat: seat(c.previousSeat) } : {}), ...(c.kind === "substituted" ? { previousAttendee: c.previousAttendee } : {}) }),
      checkedIn: async (c) => this.emit(c.seat.organizationId, "checkin.created", { seat: seat(c.seat) }),
      eventCreated: async (c) => this.emit(c.event.organizationId, "event.created", { event: ev(c.event) }),
      eventPublished: async (c) => this.emit(c.event.organizationId, "event.published", { event: ev(c.event) }),
      cohortAtRisk: async (c) => this.emit(c.organization.id, "cohort.at_risk", { event: ev(c.event), confirmed: c.confirmed, minimum: c.minimum }),
      cohortCancelled: async (c) => this.emit(c.organization.id, "cohort.cancelled", { event: ev(c.event), refunded: c.refunded, transferred: c.transferred, targetEventId: c.target?.id ?? null }),
      certificateIssued: async (c) => this.emit(c.certificate.organizationId, "certificate.issued", { certificate: { id: c.certificate.id, kind: c.certificate.kind ?? "completion", verifyCode: c.certificate.verifyCode, attendeeName: c.certificate.attendeeName, attendeeEmail: c.certificate.attendeeEmail, courseName: c.certificate.courseName }, event: ev(c.event) }),
      waitlistOffered: async (c) => (c.organization ? this.emit(c.organization.id, "waitlist.offered", { entry: { id: c.entry.id, email: c.entry.email, quantity: c.entry.quantity }, event: ev(c.event) }) : undefined),
    };
  }
}
