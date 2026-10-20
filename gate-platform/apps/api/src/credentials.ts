import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { CredentialSigner, achievementFor, badgeSnapshot, bakePng, buildCredential, issuerDidDocument, issuesVerifiedBadge, isPng, unbakePng, type Certificate, type CertificateBadge, type Core } from "@gate/core";
import type { MediaStore } from "./media.js";

// Public endpoints of EnrollClass verified badges (Open Badges 3.0). Anyone can fetch an
// issuer's DID document, a course's achievement and a learner's credential (as JSON, as a
// signed vc+jwt, or baked into the badge PNG), and check a credential with /verify.

export interface CredentialRouteDeps {
  core: Core;
  signer: CredentialSigner;
  media: MediaStore;
  /** Public API base URL: names the issuers (did:web) and the credential ids. */
  publicUrl: string;
  webUrl: string;
  fetchImpl?: typeof fetch | undefined;
}

const NotFound = z.object({ error: z.object({ code: z.string(), message: z.string() }) });
const notFound = (message: string) => ({ error: { code: "NOT_FOUND", message } });

export function registerCredentialRoutes(app: FastifyInstance, deps: CredentialRouteDeps) {
  const pub = app.withTypeProvider<ZodTypeProvider>();
  const urls = { api: deps.publicUrl, certificatePage: (code: string) => `${deps.webUrl}/cert/${encodeURIComponent(code)}` };
  const kidFor = (orgId: string) => issuerDidDocument(deps.publicUrl, orgId, deps.signer).assertionMethod[0]!;

  /** The credential for a certificate code, or null when there is none (unknown, revoked, or issued without an EnrollClass badge). */
  async function credentialFor(code: string) {
    const v = await deps.core.verifyCertificate(code);
    if (!v.valid || !v.certificate?.badge) return null;
    const certificate = v.certificate as Certificate & { badge: CertificateBadge };
    const credential = buildCredential(certificate, urls);
    return { credential, jwt: deps.signer.signJwt(credential, kidFor(certificate.organizationId)), badge: certificate.badge, certificate };
  }

  // did:web:<api host>:issuers:<orgId>
  pub.get("/issuers/:orgId/did.json", { schema: { tags: ["credentials"], security: [], params: z.object({ orgId: z.string() }), response: { 200: z.any(), 404: NotFound } } }, async (req, reply) => {
    try {
      await deps.core.getOrganization(req.params.orgId);
    } catch {
      return reply.code(404).send(notFound("unknown issuer"));
    }
    reply.header("content-type", "application/did+json").header("cache-control", "public, max-age=3600");
    return issuerDidDocument(deps.publicUrl, req.params.orgId, deps.signer);
  });

  pub.get("/public/v1/achievements/:courseId", { schema: { tags: ["credentials"], security: [], params: z.object({ courseId: z.string() }), response: { 200: z.any(), 404: NotFound } } }, async (req, reply) => {
    const course = await deps.core.repos.courses.get(req.params.courseId);
    if (!course || !issuesVerifiedBadge(course)) return reply.code(404).send(notFound("no verified badge for this course"));
    reply.header("cache-control", "public, max-age=900");
    return { "@context": ["https://www.w3.org/ns/credentials/v2", "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"], ...achievementFor(badgeSnapshot(course, await deps.core.getOrganization(course.organizationId)), course.organizationId, urls) };
  });

  pub.get("/public/v1/credentials/:code", { schema: { tags: ["credentials"], security: [], description: "Open Badges 3.0 credential (JSON-LD). Signed form: /jwt; baked image: /badge.png.", params: z.object({ code: z.string() }), response: { 200: z.any(), 404: NotFound } } }, async (req, reply) => {
    const c = await credentialFor(req.params.code);
    if (!c) return reply.code(404).send(notFound("no verified badge for this code"));
    reply.header("content-type", "application/vc+ld+json; charset=utf-8");
    return c.credential;
  });

  pub.get("/public/v1/credentials/:code/jwt", { schema: { tags: ["credentials"], security: [], params: z.object({ code: z.string() }), response: { 200: z.string(), 404: NotFound } } }, async (req, reply) => {
    const c = await credentialFor(req.params.code);
    if (!c) return reply.code(404).send(notFound("no verified badge for this code"));
    reply.header("content-type", "application/vc+jwt");
    return c.jwt;
  });

  // The badge image with the signed credential inside: what learners upload to a backpack or wallet.
  pub.get("/public/v1/credentials/:code/badge.png", { schema: { tags: ["credentials"], security: [], params: z.object({ code: z.string() }) } }, async (req, reply) => {
    const c = await credentialFor(req.params.code);
    if (!c) return reply.code(404).send(notFound("no verified badge for this code"));
    const image = await badgeImage(c.badge.imageUrl);
    if (!image || !isPng(image)) return reply.code(409).send({ error: { code: "INVALID_STATE", message: "the badge image is not a PNG, so the credential can't be baked into it; download the credential instead" } });
    const slug = (c.badge.name || "badge").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "badge";
    reply.header("content-type", "image/png").header("content-disposition", `attachment; filename="${slug}.png"`).header("cache-control", "private, max-age=300");
    return reply.send(bakePng(image, c.jwt));
  });

  // Paste a credential (vc+jwt, or the JSON with an embedded jwt) or upload a baked PNG as base64.
  pub.post("/public/v1/credentials/verify", {
    schema: {
      tags: ["credentials"], security: [],
      body: z.object({ jwt: z.string().max(100_000).optional(), png: z.string().max(8_000_000).optional() }),
      response: { 200: z.object({ valid: z.boolean(), reason: z.string().optional(), issuer: z.string().optional(), achievement: z.string().optional(), learner: z.string().optional(), issuedAt: z.string().optional(), certificateUrl: z.string().optional() }) },
    },
  }, async (req) => {
    const token = req.body.jwt ?? (req.body.png ? unbakePng(Buffer.from(req.body.png, "base64")) : null);
    if (!token) return { valid: false, reason: req.body.png ? "this image has no baked credential" : "send jwt or png" };
    const checked = deps.signer.verifyJwt(token);
    if (!checked) return { valid: false, reason: "the signature does not match an EnrollClass issuer key" };
    const id = String(checked.payload.id ?? "");
    const code = decodeURIComponent(id.split("/public/v1/credentials/")[1] ?? "");
    const current = code ? await credentialFor(code) : null;
    if (!current) return { valid: false, reason: "this credential has been revoked or no longer exists" };
    if (current.jwt !== token) return { valid: false, reason: "this credential has been changed since it was issued" };
    return {
      valid: true,
      issuer: current.credential.issuer.name,
      achievement: current.credential.credentialSubject.achievement.name,
      learner: current.certificate.attendeeName,
      issuedAt: current.certificate.issuedAt.toISOString(),
      certificateUrl: urls.certificatePage(code),
    };
  });

  async function badgeImage(imageUrl: string): Promise<Buffer | null> {
    const ours = `${deps.publicUrl}/public/v1/media/`;
    if (imageUrl.startsWith(ours)) {
      const got = await deps.media.get(imageUrl.slice(ours.length));
      return got?.bytes ?? null;
    }
    try {
      const res = await (deps.fetchImpl ?? fetch)(imageUrl, { redirect: "follow" });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.length <= 5 * 1024 * 1024 ? buf : null;
    } catch {
      return null;
    }
  }
}
