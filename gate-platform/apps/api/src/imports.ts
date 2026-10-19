import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { Core, DomainError, type Organization } from "@gate/core";
import { EventbriteError, importFromEventbrite, planFromCsv, type ImportItem, type ImportPlan } from "@gate/importers";
import * as S from "./schemas.js";

// Import of courses and cohorts from other ticketing tools. Every call returns the plan;
// nothing is written unless dryRun is false. Eventbrite tokens are used for the request
// and never stored or logged.

const ImportTicketTypeSchema = z.object({ name: z.string(), priceMinor: z.number().int(), quantity: z.number().int(), sold: z.number().int().optional() });
export const ImportItemSchema = z.object({
  source: z.enum(["eventbrite", "csv"]),
  sourceId: z.string(),
  sourceUrl: z.string().optional(),
  course: z.object({ slug: z.string(), name: z.string(), description: z.string().optional(), durationDays: z.number().int().optional() }),
  event: z.object({ name: z.string(), startsAt: z.string(), endsAt: z.string().optional(), timezone: z.string(), currency: z.string(), format: S.DeliveryFormat }),
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

export async function applyImportPlan(core: Core, org: Organization, plan: ImportPlan, opts: { includePast?: boolean | undefined; sourceIds?: string[] | undefined }): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  const existing = await core.listEvents(org.id);
  const existingKeys = new Set(existing.map((e) => `${e.name.trim().toLowerCase()}|${e.startsAt.toISOString()}`));
  const want = opts.sourceIds ? new Set(opts.sourceIds) : null;
  for (const item of plan.items) {
    if (want && !want.has(item.sourceId)) continue;
    const startsAt = new Date(item.event.startsAt);
    if (!opts.includePast && startsAt.getTime() < Date.now()) { results.push({ sourceId: item.sourceId, status: "skipped", reason: "starts in the past" }); continue; }
    if (existingKeys.has(`${item.event.name.trim().toLowerCase()}|${startsAt.toISOString()}`)) { results.push({ sourceId: item.sourceId, status: "exists", reason: "a cohort with this name and start already exists" }); continue; }
    try {
      results.push(await applyItem(core, org, item, startsAt));
      existingKeys.add(`${item.event.name.trim().toLowerCase()}|${startsAt.toISOString()}`);
    } catch (err) {
      results.push({ sourceId: item.sourceId, status: "failed", reason: err instanceof Error ? err.message : String(err) });
    }
  }
  return results;
}

async function applyItem(core: Core, org: Organization, item: ImportItem, startsAt: Date): Promise<ImportResult> {
  let courseId: string;
  let courseCreated = false;
  try {
    courseId = (await core.getCourseBySlug(org.id, item.course.slug)).id;
  } catch (err) {
    if (!(err instanceof DomainError) || err.code !== "NOT_FOUND") throw err;
    const course = await core.createCourse(org.id, { slug: item.course.slug, name: item.course.name, description: item.course.description, durationDays: item.course.durationDays });
    courseId = course.id;
    courseCreated = true;
  }
  const endsAt = item.event.endsAt ? new Date(item.event.endsAt) : undefined;
  const event = await core.createEvent(org.id, {
    name: item.event.name,
    startsAt,
    currency: item.event.currency,
    courseId,
    timezone: item.event.timezone,
    format: item.event.format,
    ...(endsAt && endsAt > startsAt ? { sessions: [{ startsAt, endsAt }] } : {}),
  });
  for (const t of item.ticketTypes) await core.createTicketType(org.id, event.id, { name: t.name, priceMinor: t.priceMinor, quantity: t.quantity });
  return { sourceId: item.sourceId, status: "created", courseId, courseCreated, eventId: event.id, ticketTypes: item.ticketTypes.length };
}

export function registerImports(api: FastifyInstance, deps: { core: Core; fetchImpl?: typeof fetch }, org: (req: { org?: Organization }) => Organization) {
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
    const results = dryRun ? [] : await applyImportPlan(deps.core, o, plan, req.body);
    const { organization, ...rest } = plan;
    return { plan: rest, eventbriteOrganization: organization, dryRun, results };
  });
  typed.post("/v1/imports/csv", { schema: { tags: ["imports"], body: ImportCsvBody, response: { 200: ImportResponseSchema, 400: S.ErrorSchema } } }, async (req) => {
    const o = org(req);
    const { columns: _c, unmatchedHeaders, ...plan } = planFromCsv(req.body.csv, { defaultTimezone: req.body.timezone ?? "UTC", defaultCurrency: req.body.currency ?? o.currency });
    const dryRun = req.body.dryRun ?? true;
    const results = dryRun ? [] : await applyImportPlan(deps.core, o, plan, req.body);
    return { plan, unmatchedHeaders, dryRun, results };
  });
}
