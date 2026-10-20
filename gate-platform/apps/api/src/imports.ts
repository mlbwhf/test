import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { Core, DomainError, type Organization } from "@gate/core";
import { EventbriteError, importFromEventbrite, planFromCsv, type ImportItem, type ImportPlan } from "@gate/importers";
import * as S from "./schemas.js";
import { importImage, type MediaStore } from "./media.js";

// Import of courses and cohorts from other ticketing tools. Every call returns the plan;
// nothing is written unless dryRun is false. Eventbrite tokens are used for the request
// and never stored or logged.

const ImportTicketTypeSchema = z.object({ name: z.string(), priceMinor: z.number().int(), quantity: z.number().int(), sold: z.number().int().optional() });
export const ImportItemSchema = z.object({
  source: z.enum(["eventbrite", "csv"]),
  sourceId: z.string(),
  sourceUrl: z.string().optional(),
  course: z.object({
    slug: z.string(), name: z.string(), description: z.string().optional(), durationDays: z.number().int().optional(), imageUrl: z.string().optional(),
    badge: z.object({ platform: z.enum(["credly", "accredible", "badgr", "certopus", "other", "own"]), name: z.string(), url: z.string().optional(), imageUrl: z.string().optional() }).optional(),
    certificationBody: z.string().optional(),
  }),
  event: z.object({
    name: z.string(), startsAt: z.string(), endsAt: z.string().optional(), timezone: z.string(), currency: z.string(), format: S.DeliveryFormat,
    instructors: z.array(z.string()).optional(), minEnrollment: z.number().int().optional(), meetingUrl: z.string().optional(), draft: z.boolean().optional(),
  }),
  ticketTypes: z.array(ImportTicketTypeSchema),
  sourceStatus: z.string().optional(),
  warnings: z.array(z.string()),
});
const ImportResultSchema = z.object({
  sourceId: z.string(),
  status: z.enum(["created", "exists", "skipped", "failed"]),
  reason: z.string().optional(),
  courseId: z.string().optional(),
  courseCreated: z.boolean().optional(),
  eventId: z.string().optional(),
  ticketTypes: z.number().int().optional(),
  image: z.enum(["copied", "kept", "failed", "none"]).optional(),
  imageError: z.string().optional(),
  /** set: the course got the source's badge; kept: the course already had one. */
  badge: z.enum(["set", "kept", "failed", "none"]).optional(),
  /** Instructors linked to the class; new names are created as instructors. */
  instructors: z.number().int().optional(),
  instructorsCreated: z.array(z.string()).optional(),
  draft: z.boolean().optional(),
});
export const ImportResponseSchema = z.object({
  plan: z.object({
    source: z.enum(["eventbrite", "csv"]),
    items: z.array(ImportItemSchema),
    courses: z.array(z.object({ slug: z.string(), name: z.string(), cohorts: z.number().int() })),
    skipped: z.array(z.object({ sourceId: z.string(), name: z.string(), reason: z.string() })),
  }),
  eventbriteOrganization: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
  unmatchedHeaders: z.array(z.string()).optional(),
  dryRun: z.boolean(),
  results: z.array(ImportResultSchema),
});

const ApplyOptions = {
  /** Preview only (default). */
  dryRun: z.boolean().optional(),
  /** Import cohorts whose start date has passed (default false). */
  includePast: z.boolean().optional(),
  /** Restrict to these sourceIds; default all. */
  sourceIds: z.array(z.string()).max(500).optional(),
};
export const ImportEventbriteBody = z.object({ token: z.string().min(10).max(200), eventbriteOrganizationId: z.string().optional(), ...ApplyOptions });
export const ImportCsvBody = z.object({ csv: z.string().min(1).max(2_000_000), timezone: z.string().optional(), currency: S.Currency.optional(), ...ApplyOptions });

type ImportResult = z.infer<typeof ImportResultSchema>;

export interface ApplyDeps { media?: MediaStore | undefined; publicUrl?: string | undefined; fetchImpl?: typeof fetch | undefined }

export async function applyImportPlan(core: Core, org: Organization, plan: ImportPlan, opts: { includePast?: boolean | undefined; sourceIds?: string[] | undefined }, deps: ApplyDeps = {}): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  const existing = await core.listEvents(org.id);
  const existingKeys = new Set(existing.map((e) => `${e.name.trim().toLowerCase()}|${e.startsAt.toISOString()}`));
  const want = opts.sourceIds ? new Set(opts.sourceIds) : null;
  // Instructors by lower-cased name, shared by every item so a new name is created once.
  const instructors = new Map((await core.repos.parties.listByOrganization(org.id)).filter((p) => p.kind === "instructor").map((p) => [p.name.trim().toLowerCase(), p.id]));
  for (const item of plan.items) {
    if (want && !want.has(item.sourceId)) continue;
    const startsAt = new Date(item.event.startsAt);
    if (!opts.includePast && startsAt.getTime() < Date.now()) { results.push({ sourceId: item.sourceId, status: "skipped", reason: "starts in the past" }); continue; }
    if (existingKeys.has(`${item.event.name.trim().toLowerCase()}|${startsAt.toISOString()}`)) { results.push({ sourceId: item.sourceId, status: "exists", reason: "a cohort with this name and start already exists" }); continue; }
    try {
      results.push(await applyItem(core, org, item, startsAt, deps, instructors));
      existingKeys.add(`${item.event.name.trim().toLowerCase()}|${startsAt.toISOString()}`);
    } catch (err) {
      results.push({ sourceId: item.sourceId, status: "failed", reason: err instanceof Error ? err.message : String(err) });
    }
  }
  return results;
}

async function applyItem(core: Core, org: Organization, item: ImportItem, startsAt: Date, deps: ApplyDeps, instructors: Map<string, string>): Promise<ImportResult> {
  let courseId: string;
  let courseCreated = false;
  let hasImage = false;
  let hasBadge = false;
  try {
    const existing = await core.getCourseBySlug(org.id, item.course.slug);
    courseId = existing.id;
    hasImage = Boolean(existing.imageUrl);
    hasBadge = Boolean(existing.badge);
    if (item.course.certificationBody && !existing.certificationBody) await core.updateCourse(org.id, courseId, { certificationBody: item.course.certificationBody });
  } catch (err) {
    if (!(err instanceof DomainError) || err.code !== "NOT_FOUND") throw err;
    const course = await core.createCourse(org.id, { slug: item.course.slug, name: item.course.name, description: item.course.description, durationDays: item.course.durationDays, certificationBody: item.course.certificationBody });
    courseId = course.id;
    courseCreated = true;
  }
  // The course's digital badge: a platform link (Credly…) or the organizer's own badge image,
  // copied into our media store like the cover so it keeps working at the source.
  let badge: ImportResult["badge"] = "none";
  const src = item.course.badge;
  if (src) {
    if (hasBadge) badge = "kept";
    else {
      try {
        let imageUrl = src.imageUrl;
        if (imageUrl && deps.media) imageUrl = await importImage(deps.media, deps.publicUrl ?? "", imageUrl, deps.fetchImpl);
        await core.updateCourse(org.id, courseId, { badge: { platform: src.platform, name: src.name, ...(src.url ? { url: src.url } : {}), ...(imageUrl ? { imageUrl } : {}) } });
        badge = "set";
      } catch {
        badge = "failed";
      }
    }
  }
  // Copy the source cover image into our own media store the first time the course gets one,
  // so the page keeps working if the event is later deleted at the source.
  let image: ImportResult["image"] = "none";
  let imageError: string | undefined;
  if (item.course.imageUrl) {
    if (hasImage) image = "kept";
    else if (deps.media) {
      try {
        const imageUrl = await importImage(deps.media, deps.publicUrl ?? "", item.course.imageUrl, deps.fetchImpl);
        await core.updateCourse(org.id, courseId, { imageUrl });
        hasImage = true;
        image = "copied";
      } catch (err) {
        image = "failed";
        imageError = err instanceof Error ? err.message : String(err);
      }
    }
  }
  const endsAt = item.event.endsAt ? new Date(item.event.endsAt) : undefined;
  const instructorIds: string[] = [];
  const instructorsCreated: string[] = [];
  for (const name of item.event.instructors ?? []) {
    const key = name.trim().toLowerCase();
    let id = instructors.get(key);
    if (!id) {
      id = (await core.createParty(org.id, { name: name.trim(), kind: "instructor" })).id;
      instructors.set(key, id);
      instructorsCreated.push(name.trim());
    }
    if (!instructorIds.includes(id)) instructorIds.push(id);
  }
  const event = await core.createEvent(org.id, {
    name: item.event.name,
    startsAt,
    currency: item.event.currency,
    courseId,
    timezone: item.event.timezone,
    format: item.event.format,
    ...(endsAt && endsAt > startsAt ? { sessions: [{ startsAt, endsAt }] } : {}),
    ...(instructorIds.length ? { instructorIds } : {}),
    ...(item.event.minEnrollment ? { minEnrollment: item.event.minEnrollment } : {}),
    ...(item.event.draft ? { status: "draft" as const } : {}),
  });
  for (const t of item.ticketTypes) await core.createTicketType(org.id, event.id, { name: t.name, priceMinor: t.priceMinor, quantity: t.quantity });
  if (item.event.meetingUrl) await core.setMeeting(org.id, event.id, { provider: "manual", joinUrl: item.event.meetingUrl });
  return {
    sourceId: item.sourceId, status: "created", courseId, courseCreated, eventId: event.id, ticketTypes: item.ticketTypes.length, image, ...(imageError ? { imageError } : {}),
    badge, instructors: instructorIds.length, ...(instructorsCreated.length ? { instructorsCreated } : {}), ...(item.event.draft ? { draft: true } : {}),
  };
}

export function registerImports(api: FastifyInstance, deps: { core: Core; fetchImpl?: typeof fetch; media?: MediaStore; publicUrl?: string }, org: (req: { org?: Organization }) => Organization) {
  const typed = api.withTypeProvider<ZodTypeProvider>();
  typed.post("/v1/imports/eventbrite", { schema: { tags: ["imports"], body: ImportEventbriteBody, response: { 200: ImportResponseSchema, 400: S.ErrorSchema, 401: S.ErrorSchema, 502: S.ErrorSchema } } }, async (req) => {
    const o = org(req);
    let plan;
    try {
      plan = await importFromEventbrite(req.body.token, { ...(req.body.eventbriteOrganizationId ? { organizationId: req.body.eventbriteOrganizationId } : {}), ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}) });
    } catch (err) {
      if (err instanceof EventbriteError) throw new DomainError(err.status === 401 ? "UNAUTHORIZED" : "PAYMENTS_UPSTREAM", err.message, "check the private token at eventbrite.com/platform/api-keys");
      throw err;
    }
    const dryRun = req.body.dryRun ?? true;
    const results = dryRun ? [] : await applyImportPlan(deps.core, o, plan, req.body, deps);
    const { organization, ...rest } = plan;
    return { plan: rest, eventbriteOrganization: organization, dryRun, results };
  });
  typed.post("/v1/imports/csv", { schema: { tags: ["imports"], body: ImportCsvBody, response: { 200: ImportResponseSchema, 400: S.ErrorSchema } } }, async (req) => {
    const o = org(req);
    const { columns: _c, unmatchedHeaders, ...plan } = planFromCsv(req.body.csv, { defaultTimezone: req.body.timezone ?? "UTC", defaultCurrency: req.body.currency ?? o.currency });
    const dryRun = req.body.dryRun ?? true;
    const results = dryRun ? [] : await applyImportPlan(deps.core, o, plan, req.body, deps);
    return { plan, unmatchedHeaders, dryRun, results };
  });
}
