import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { DomainError, type Core, type Organization } from "@gate/core";
import * as S from "./schemas.js";

// Course cover images. Files live in a directory the API owns (a Compose volume in
// production) and are served from /public/v1/media/<id>. Ids are content hashes, so the
// same picture stored twice is kept once and URLs never change (cached for a year).

export const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface MediaStore {
  put(bytes: Buffer, contentType: string): Promise<{ id: string }>;
  get(id: string): Promise<{ bytes: Buffer; contentType: string } | undefined>;
}

function checkImage(bytes: Buffer, contentType: string): string {
  const ext = IMAGE_TYPES[contentType];
  if (!ext) throw new DomainError("VALIDATION", `unsupported image type "${contentType || "unknown"}"`, `use ${Object.keys(IMAGE_TYPES).join(", ")}`);
  if (bytes.length === 0) throw new DomainError("VALIDATION", "empty image");
  if (bytes.length > MAX_IMAGE_BYTES) throw new DomainError("VALIDATION", `image is larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB`);
  if (sniffType(bytes) !== contentType) throw new DomainError("VALIDATION", "file content does not match its image type");
  return `${createHash("sha256").update(bytes).digest("hex").slice(0, 32)}.${ext}`;
}

const ID_RE = /^[a-f0-9]{32}\.(jpg|png|webp|gif)$/;
function typeOfId(id: string): string {
  const ext = id.split(".")[1];
  return Object.entries(IMAGE_TYPES).find(([, e]) => e === ext)![0];
}

export class LocalMediaStore implements MediaStore {
  constructor(private readonly dir: string) {}
  async put(bytes: Buffer, contentType: string) {
    const id = checkImage(bytes, contentType);
    await mkdir(this.dir, { recursive: true });
    const file = path.join(this.dir, id);
    try { await stat(file); } catch { await writeFile(file, bytes); }
    return { id };
  }
  async get(id: string) {
    if (!ID_RE.test(id)) return undefined;
    try { return { bytes: await readFile(path.join(this.dir, id)), contentType: typeOfId(id) }; } catch { return undefined; }
  }
}

export class InMemoryMediaStore implements MediaStore {
  private readonly files = new Map<string, Buffer>();
  async put(bytes: Buffer, contentType: string) {
    const id = checkImage(bytes, contentType);
    this.files.set(id, bytes);
    return { id };
  }
  async get(id: string) {
    const bytes = ID_RE.test(id) ? this.files.get(id) : undefined;
    return bytes ? { bytes, contentType: typeOfId(id) } : undefined;
  }
}

export function mediaUrl(publicUrl: string, id: string): string {
  return `${publicUrl}/public/v1/media/${id}`;
}

export function sniffType(b: Buffer): string {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") return "image/png";
  if (b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (b.length > 6 && b.toString("ascii", 0, 4) === "GIF8") return "image/gif";
  return "application/octet-stream";
}

/** Download an image (an Eventbrite logo, a CSV column) into the store; returns its public URL. */
export async function importImage(store: MediaStore, publicUrl: string, url: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  if (!/^https?:\/\//i.test(url)) throw new DomainError("VALIDATION", "image must be an http(s) URL");
  let res: Response;
  try {
    res = await fetchImpl(url, { headers: { accept: "image/*" }, signal: AbortSignal.timeout(15_000), redirect: "follow" });
  } catch (err) {
    throw new DomainError("PAYMENTS_UPSTREAM", `could not download image (${err instanceof Error ? err.message : String(err)})`);
  }
  if (!res.ok) throw new DomainError("PAYMENTS_UPSTREAM", `image download returned ${res.status}`);
  const declared = Number(res.headers.get("content-length") ?? "0");
  if (declared > MAX_IMAGE_BYTES) throw new DomainError("VALIDATION", "image is larger than 5 MB");
  const bytes = Buffer.from(await res.arrayBuffer());
  // Trust the bytes, not the header: CDNs often answer application/octet-stream.
  const { id } = await store.put(bytes, sniffType(bytes));
  return mediaUrl(publicUrl, id);
}

export function registerMediaRoutes(app: FastifyInstance, deps: { store: MediaStore }) {
  app.get<{ Params: { id: string } }>("/public/v1/media/:id", { schema: { tags: ["public"], security: [] } }, async (req, reply) => {
    const file = await deps.store.get(req.params.id);
    if (!file) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "no such image", requestId: req.id } });
    return reply
      .header("cache-control", "public, max-age=31536000, immutable")
      .header("x-content-type-options", "nosniff")
      .header("access-control-allow-origin", "*")
      .type(file.contentType)
      .send(file.bytes);
  });
}

export function registerCourseImageRoutes(api: FastifyInstance, deps: { core: Core; store: MediaStore; publicUrl: string; fetchImpl?: typeof fetch }, org: (req: { org?: Organization }) => Organization) {
  const typed = api.withTypeProvider<ZodTypeProvider>();
  for (const type of Object.keys(IMAGE_TYPES)) {
    if (!api.hasContentTypeParser(type)) api.addContentTypeParser(type, { parseAs: "buffer", bodyLimit: MAX_IMAGE_BYTES }, (_req, body, done) => done(null, body));
  }
  // Raw image body with an image/jpeg|png|webp|gif content type, up to 5 MB.
  typed.put("/v1/courses/:id/image", { schema: { tags: ["courses"], params: z.object({ id: z.string() }), response: { 200: S.CourseSchema, 400: S.ErrorSchema, 404: S.ErrorSchema } } }, async (req) => {
    const o = org(req);
    await deps.core.getCourse(o.id, req.params.id);
    if (!Buffer.isBuffer(req.body)) throw new DomainError("VALIDATION", "send the image bytes with an image/* content type");
    const { id } = await deps.store.put(req.body, (req.headers["content-type"] ?? "").split(";")[0]!.trim().toLowerCase());
    return S.toCourse(await deps.core.updateCourse(o.id, req.params.id, { imageUrl: mediaUrl(deps.publicUrl, id) }));
  });
  typed.post("/v1/courses/:id/image/from-url", { schema: { tags: ["courses"], params: z.object({ id: z.string() }), body: z.object({ url: z.string().url() }), response: { 200: S.CourseSchema, 400: S.ErrorSchema, 404: S.ErrorSchema, 502: S.ErrorSchema } } }, async (req) => {
    const o = org(req);
    await deps.core.getCourse(o.id, req.params.id);
    const imageUrl = await importImage(deps.store, deps.publicUrl, req.body.url, deps.fetchImpl);
    return S.toCourse(await deps.core.updateCourse(o.id, req.params.id, { imageUrl }));
  });
  // Company logo (raw bytes, as above): Find a class, course pages and the schedule widget.
  typed.put("/v1/organizations/me/logo", { schema: { tags: ["organizations"], response: { 200: S.OrganizationSchema, 400: S.ErrorSchema } } }, async (req) => {
    const o = org(req);
    if (!Buffer.isBuffer(req.body)) throw new DomainError("VALIDATION", "send the image bytes with an image/* content type");
    const { id } = await deps.store.put(req.body, (req.headers["content-type"] ?? "").split(";")[0]!.trim().toLowerCase());
    return S.toOrganization(await deps.core.updateOrganization(o.id, { logoUrl: mediaUrl(deps.publicUrl, id) }));
  });
  typed.delete("/v1/organizations/me/logo", { schema: { tags: ["organizations"], response: { 200: S.OrganizationSchema } } }, async (req) => S.toOrganization(await deps.core.updateOrganization(org(req).id, { logoUrl: null })));
  // The course's badge image (raw bytes, as above). With no badge yet it becomes the
  // organizer's own badge, issued with EnrollClass certificates.
  typed.put("/v1/courses/:id/badge-image", { schema: { tags: ["courses"], params: z.object({ id: z.string() }), querystring: z.object({ name: z.string().max(200).optional() }), response: { 200: S.CourseSchema, 400: S.ErrorSchema, 404: S.ErrorSchema } } }, async (req) => {
    const o = org(req);
    const course = await deps.core.getCourse(o.id, req.params.id);
    if (!Buffer.isBuffer(req.body)) throw new DomainError("VALIDATION", "send the image bytes with an image/* content type");
    const { id } = await deps.store.put(req.body, (req.headers["content-type"] ?? "").split(";")[0]!.trim().toLowerCase());
    const imageUrl = mediaUrl(deps.publicUrl, id);
    const name = req.query.name?.trim() || course.badge?.name || course.name;
    const badge = course.badge ? { ...course.badge, name, imageUrl } : { platform: "own" as const, name, imageUrl };
    return S.toCourse(await deps.core.updateCourse(o.id, req.params.id, { badge }));
  });
  // Move a course's badge from Credly (or another platform) to an EnrollClass verified badge:
  // same name, image copied into our media store. Fails when the badge has no image to copy.
  async function migrateBadge(orgId: string, courseId: string): Promise<{ courseId: string; status: "moved" | "already" | "no_badge" | "no_image" | "failed"; reason?: string }> {
    const course = await deps.core.getCourse(orgId, courseId);
    const badge = course.badge;
    if (!badge) return { courseId, status: "no_badge" };
    if (badge.platform === "own") return { courseId, status: "already" };
    if (!badge.imageUrl) return { courseId, status: "no_image", reason: "the badge has no image; upload or design one" };
    try {
      const imageUrl = badge.imageUrl.startsWith(`${deps.publicUrl}/public/v1/media/`) ? badge.imageUrl : await importImage(deps.store, deps.publicUrl, badge.imageUrl, deps.fetchImpl);
      await deps.core.updateCourse(orgId, courseId, { badge: { platform: "own", name: badge.name, imageUrl } });
      return { courseId, status: "moved" };
    } catch (err) {
      return { courseId, status: "failed", reason: err instanceof Error ? err.message : String(err) };
    }
  }
  const MigrateResult = z.object({ courseId: z.string(), status: z.enum(["moved", "already", "no_badge", "no_image", "failed"]), reason: z.string().optional() });
  typed.post("/v1/courses/:id/badge/migrate", { schema: { tags: ["badges"], params: z.object({ id: z.string() }), response: { 200: z.object({ result: MigrateResult, course: S.CourseSchema }), 404: S.ErrorSchema } } }, async (req) => {
    const o = org(req);
    const result = await migrateBadge(o.id, req.params.id);
    return { result, course: S.toCourse(await deps.core.getCourse(o.id, req.params.id)) };
  });
  typed.post("/v1/badges/migrate", { schema: { tags: ["badges"], description: "Move every course badge hosted elsewhere (Credly, Accredible…) to EnrollClass verified badges.", body: z.object({ courseIds: z.array(z.string()).max(500).optional() }).optional(), response: { 200: z.object({ results: z.array(MigrateResult) }) } } }, async (req) => {
    const o = org(req);
    const ids = req.body?.courseIds ?? (await deps.core.repos.courses.listByOrganization(o.id)).filter((c) => c.badge && c.badge.platform !== "own").map((c) => c.id);
    const results = [];
    for (const id of ids) results.push(await migrateBadge(o.id, id));
    return { results };
  });
  typed.post("/v1/courses/:id/badge/award", { schema: { tags: ["badges"], description: "Award the course's verified badge to learners who already hold a certificate for it.", params: z.object({ id: z.string() }), body: z.object({ notify: z.boolean().optional() }).optional(), response: { 200: z.object({ awarded: z.number().int() }), 404: S.ErrorSchema, 409: S.ErrorSchema } } }, async (req) => deps.core.awardBadgeToPastLearners(org(req).id, req.params.id, { notify: req.body?.notify ?? true }));
  typed.get("/v1/badges", { schema: { tags: ["badges"], response: { 200: z.object({ items: z.array(z.object({ course: S.CourseSchema, verified: z.boolean(), issued: z.number().int(), awaiting: z.number().int() })) }) } } }, async (req) => ({
    items: (await deps.core.badgeOverview(org(req).id)).map((b) => ({ ...b, course: S.toCourse(b.course) })),
  }));
  typed.delete("/v1/courses/:id/image", { schema: { tags: ["courses"], params: z.object({ id: z.string() }), response: { 200: S.CourseSchema, 404: S.ErrorSchema } } }, async (req) => S.toCourse(await deps.core.updateCourse(org(req).id, req.params.id, { imageUrl: "" })));
}
