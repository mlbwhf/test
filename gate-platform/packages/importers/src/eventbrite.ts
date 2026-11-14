import { buildPlan, courseNameFrom, detectBadge, durationDaysBetween, slugify, type ImportItem, type ImportPlan } from "./plan.js";

// Eventbrite API v3. The organizer pastes a private token from
// https://www.eventbrite.com/platform/api-keys ; it is used for one request cycle and
// never stored.

export interface EventbriteTicketClass {
  id: string;
  name: string;
  free?: boolean;
  donation?: boolean;
  hidden?: boolean;
  cost?: { currency: string; value: number } | null;
  quantity_total?: number;
  quantity_sold?: number;
}

export interface EventbriteEvent {
  id: string;
  name: { text: string | null };
  description?: { text: string | null } | null;
  summary?: string | null;
  url?: string;
  start: { timezone: string; utc: string };
  end?: { timezone: string; utc: string } | null;
  currency: string;
  online_event?: boolean;
  capacity?: number | null;
  status: string;
  is_series_parent?: boolean;
  logo?: { url?: string | null; original?: { url?: string | null } | null } | null;
  ticket_classes?: EventbriteTicketClass[];
  /** Filled by importFromEventbrite: the event's full description (structured content), as HTML. */
  fullDescriptionHtml?: string | null;
}

export interface EventbriteOrganization { id: string; name: string }

type Fetch = typeof fetch;

const BASE = "https://www.eventbriteapi.com/v3";

export class EventbriteError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "EventbriteError";
  }
}

async function get<T>(fetchImpl: Fetch, token: string, path: string): Promise<T> {
  const res = await fetchImpl(`${BASE}${path}`, { headers: { authorization: `Bearer ${token}`, accept: "application/json" } });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error_description?: string; error?: string };
    const msg = res.status === 401 ? "Eventbrite rejected the token" : body.error_description ?? body.error ?? `Eventbrite returned ${res.status}`;
    throw new EventbriteError(msg, res.status);
  }
  return (await res.json()) as T;
}

export async function listEventbriteOrganizations(token: string, fetchImpl: Fetch = fetch): Promise<EventbriteOrganization[]> {
  const data = await get<{ organizations: EventbriteOrganization[] }>(fetchImpl, token, "/users/me/organizations/");
  return data.organizations ?? [];
}

/** Every non-cancelled event of an organization, ticket classes expanded, all pages. */
export async function listEventbriteEvents(token: string, organizationId: string, fetchImpl: Fetch = fetch): Promise<EventbriteEvent[]> {
  const events: EventbriteEvent[] = [];
  let continuation: string | undefined;
  for (let page = 0; page < 50; page++) {
    const qs = new URLSearchParams({ expand: "ticket_classes,logo", status: "draft,live,started,ended,completed", order_by: "start_asc", page_size: "50" });
    if (continuation) qs.set("continuation", continuation);
    const data = await get<{ events: EventbriteEvent[]; pagination?: { has_more_items?: boolean; continuation?: string } }>(fetchImpl, token, `/organizations/${organizationId}/events/?${qs}`);
    events.push(...(data.events ?? []));
    if (!data.pagination?.has_more_items || !data.pagination.continuation) break;
    continuation = data.pagination.continuation;
  }
  return events;
}

/** Eventbrite description HTML -> plain text with paragraphs (blank lines) and bullets kept. */
export function htmlToText(html: string): string {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "\u2019", lsquo: "\u2018", rdquo: "\u201d", ldquo: "\u201c", ndash: "\u2013", mdash: "\u2014", hellip: "\u2026", reg: "\u00ae", trade: "\u2122", copy: "\u00a9", bull: "\u2022" };
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n\u2022 ")
    .replace(/<\/(p|div|h[1-6]|ul|ol|blockquote|section|table|tr)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
      }
      return named[e.toLowerCase()] ?? m;
    })
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** The long description Eventbrite keeps apart from the event (structured content); null when there is none or it can't be read. */
export async function fetchEventbriteDescription(token: string, eventId: string, fetchImpl: Fetch = fetch): Promise<string | null> {
  try {
    const data = await get<{ modules?: Array<{ type?: string; data?: { body?: { text?: string | null } | null } | null }> }>(fetchImpl, token, `/events/${encodeURIComponent(eventId)}/structured_content/?purpose=listing`);
    const html = (data.modules ?? []).filter((m) => m.type === "text").map((m) => m.data?.body?.text ?? "").filter(Boolean).join("\n");
    return html.trim() ? html : null;
  } catch {
    return null;
  }
}

export function mapEventbriteEvent(ev: EventbriteEvent): ImportItem | { skip: string } {
  const name = (ev.name?.text ?? "").trim();
  if (!name) return { skip: "no name" };
  if (ev.status === "canceled" || ev.status === "cancelled") return { skip: "cancelled at Eventbrite" };
  if (ev.is_series_parent) return { skip: "series parent; its dated occurrences are imported instead" };
  const warnings: string[] = [];
  const startsAt = ev.start?.utc;
  if (!startsAt) return { skip: "no start date" };
  const endsAt = ev.end?.utc ?? undefined;
  const currency = (ev.currency || "USD").toUpperCase();
  const classes = (ev.ticket_classes ?? []).filter((t) => !t.hidden || (t.quantity_sold ?? 0) > 0);
  const ticketTypes = classes
    .filter((t) => !t.donation)
    .map((t) => {
      const priceMinor = t.free || !t.cost ? 0 : Math.round(t.cost.value);
      if (t.cost && t.cost.currency && t.cost.currency.toUpperCase() !== currency) warnings.push(`ticket "${t.name}" is priced in ${t.cost.currency}, cohort currency is ${currency}`);
      const quantity = t.quantity_total && t.quantity_total > 0 ? t.quantity_total : ev.capacity && ev.capacity > 0 ? ev.capacity : 20;
      if (!t.quantity_total && !ev.capacity) warnings.push(`ticket "${t.name}" has no capacity at Eventbrite; defaulted to 20 seats`);
      return { name: t.name.trim() || "Seat", priceMinor, quantity, ...(t.quantity_sold !== undefined ? { sold: t.quantity_sold } : {}) };
    });
  if (ticketTypes.length === 0) {
    ticketTypes.push({ name: "Seat", priceMinor: 0, quantity: ev.capacity && ev.capacity > 0 ? ev.capacity : 20 });
    warnings.push("no ticket classes at Eventbrite; a free \"Seat\" ticket was added, set the price before publishing");
  }
  if (ev.ticket_classes?.some((t) => t.donation)) warnings.push("donation tickets were left out");
  if (new Date(startsAt).getTime() < Date.now()) warnings.push("starts in the past");
  const courseName = courseNameFrom(name);
  // The fullest text wins: structured content, then the event description, then the short summary.
  const description = [ev.fullDescriptionHtml ? htmlToText(ev.fullDescriptionHtml) : "", ev.description?.text?.trim() ?? "", ev.summary?.trim() ?? ""].sort((a, b) => b.length - a.length)[0] || undefined;
  const durationDays = durationDaysBetween(startsAt, endsAt);
  const imageUrl = ev.logo?.original?.url || ev.logo?.url || undefined;
  // A Credly (or Accredible, Badgr, Certopus) link in the description becomes the course badge.
  const badge = detectBadge([ev.summary, ev.description?.text, ev.fullDescriptionHtml].filter(Boolean).join("\n"), courseName);
  return {
    source: "eventbrite",
    sourceId: ev.id,
    ...(ev.url ? { sourceUrl: ev.url } : {}),
    course: { slug: slugify(courseName), name: courseName, ...(description ? { description: description.slice(0, 5000) } : {}), ...(durationDays ? { durationDays } : {}), ...(imageUrl ? { imageUrl } : {}), ...(badge ? { badge } : {}) },
    event: { name, startsAt, ...(endsAt ? { endsAt } : {}), timezone: ev.start.timezone || "UTC", currency, format: ev.online_event ? "live_virtual" : "in_person", ...(ev.status === "draft" ? { draft: true } : {}) },
    ticketTypes,
    sourceStatus: ev.status,
    warnings,
  };
}

export function planFromEventbrite(events: EventbriteEvent[]): ImportPlan {
  const items: ImportItem[] = [];
  const skipped: ImportPlan["skipped"] = [];
  for (const ev of events) {
    const r = mapEventbriteEvent(ev);
    if ("skip" in r) skipped.push({ sourceId: ev.id, name: ev.name?.text ?? "(unnamed)", reason: r.skip });
    else items.push(r);
  }
  return buildPlan("eventbrite", items, skipped);
}

/** Fetches and maps in one call. With no organizationId, the token's first organization is used. */
export async function importFromEventbrite(token: string, opts: { organizationId?: string; fetchImpl?: Fetch } = {}): Promise<ImportPlan & { organization: EventbriteOrganization | null }> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  let organization: EventbriteOrganization | null = null;
  let organizationId = opts.organizationId;
  if (!organizationId) {
    const orgs = await listEventbriteOrganizations(token, fetchImpl);
    if (orgs.length === 0) throw new EventbriteError("this token has no Eventbrite organizations", 404);
    organization = orgs[0]!;
    organizationId = organization.id;
  }
  const events = await listEventbriteEvents(token, organizationId, fetchImpl);
  // Full descriptions live in each event's structured content; read them a few at a time.
  const wanted = events.filter((e) => e.status !== "canceled" && e.status !== "cancelled" && !e.is_series_parent);
  for (let i = 0; i < wanted.length; i += 5) {
    await Promise.all(wanted.slice(i, i + 5).map(async (e) => {
      e.fullDescriptionHtml = await fetchEventbriteDescription(token, e.id, fetchImpl);
    }));
  }
  return { ...planFromEventbrite(events), organization };
}
