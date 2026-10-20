import { createHash, createHmac, createPrivateKey, createPublicKey, sign, verify, type KeyObject } from "node:crypto";
import { crc32 } from "node:zlib";
import type { Certificate, CertificateBadge, Course, Organization } from "./types.js";

// Verified digital badges: Open Badges 3.0 credentials (W3C Verifiable Credentials 2.0) that
// EnrollClass issues for courses with an EnrollClass badge. Each certificate is one credential;
// it is built from the certificate, course and organization, and signed with Ed25519 (VC-JOSE,
// compact JWS). Every organization is its own issuer (did:web under the API host) whose DID
// document publishes the platform's verification key, so any Open Badges verifier can check it.

export const OB3_CONTEXT = ["https://www.w3.org/ns/credentials/v2", "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"];

/** Ed25519 signing key, derived from a server secret so it survives restarts without new configuration. */
export class CredentialSigner {
  readonly privateKey: KeyObject;
  readonly publicKey: KeyObject;
  /** Short fingerprint of the public key; part of the key id, so a new key never collides with an old one. */
  readonly keyId: string;

  constructor(secret: string) {
    if (!secret || secret.length < 16) throw new Error("credential secret must be at least 16 characters");
    const seed = createHmac("sha256", "enrollclass/credentials/ed25519/v1").update(secret).digest();
    // PKCS#8 wrapper for a raw 32-byte Ed25519 seed (RFC 8410).
    const der = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), seed]);
    this.privateKey = createPrivateKey({ key: der, format: "der", type: "pkcs8" });
    this.publicKey = createPublicKey(this.privateKey);
    this.keyId = `key-${createHash("sha256").update(this.publicJwk().x).digest("base64url").slice(0, 12)}`;
  }

  publicJwk(): { kty: "OKP"; crv: "Ed25519"; x: string } {
    const jwk = this.publicKey.export({ format: "jwk" }) as { x: string };
    return { kty: "OKP", crv: "Ed25519", x: jwk.x };
  }

  /** Compact JWS (VC-JOSE: typ vc+jwt) over the credential. Ed25519 is deterministic, so the same credential always signs the same. */
  signJwt(payload: object, kid: string): string {
    const header = { alg: "EdDSA", typ: "vc+jwt", cty: "vc", kid };
    const input = `${b64(JSON.stringify(header))}.${b64(JSON.stringify(payload))}`;
    return `${input}.${sign(null, Buffer.from(input), this.privateKey).toString("base64url")}`;
  }

  /** Checks a compact JWS against this key; returns the payload when the signature is good. */
  verifyJwt(jwt: string): { header: Record<string, unknown>; payload: Record<string, unknown> } | null {
    const parts = jwt.trim().split(".");
    if (parts.length !== 3) return null;
    const [h, p, s] = parts as [string, string, string];
    try {
      const header = JSON.parse(Buffer.from(h, "base64url").toString("utf8")) as Record<string, unknown>;
      if (header.alg !== "EdDSA") return null;
      if (!verify(null, Buffer.from(`${h}.${p}`), this.publicKey, Buffer.from(s, "base64url"))) return null;
      return { header, payload: JSON.parse(Buffer.from(p, "base64url").toString("utf8")) as Record<string, unknown> };
    } catch {
      return null;
    }
  }
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");

export interface CredentialUrls {
  /** Public API base, e.g. https://api.enrollclass.com (its host names the issuers' did:web). */
  api: string;
  /** Where people see the certificate, e.g. https://app.enrollclass.com/cert/CODE. */
  certificatePage: (code: string) => string;
}

/** did:web:api.enrollclass.com:issuers:<orgId>, resolved at https://api.enrollclass.com/issuers/<orgId>/did.json. */
export function issuerDid(apiBase: string, organizationId: string): string {
  const host = new URL(apiBase).host.replace(":", "%3A");
  return `did:web:${host}:issuers:${organizationId}`;
}

export function issuerDidDocument(apiBase: string, organizationId: string, signer: CredentialSigner) {
  const id = issuerDid(apiBase, organizationId);
  const vm = `${id}#${signer.keyId}`;
  return {
    "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/suites/jws-2020/v1"],
    id,
    verificationMethod: [{ id: vm, type: "JsonWebKey2020", controller: id, publicKeyJwk: signer.publicJwk() }],
    assertionMethod: [vm],
    authentication: [vm],
  };
}

/** True for the courses EnrollClass issues verifiable badges for (an uploaded "own" badge). */
export function issuesVerifiedBadge(course: Pick<Course, "badge"> | undefined): boolean {
  return course?.badge?.platform === "own" && Boolean(course.badge.imageUrl);
}

/** What a certificate freezes about the badge when it is issued. */
export function badgeSnapshot(course: Course, organization: Organization): CertificateBadge {
  return {
    courseId: course.id,
    name: course.badge!.name,
    imageUrl: course.badge!.imageUrl!,
    description: course.description?.trim() || `Awarded by ${organization.name} for completing ${course.name}.`,
    criteria: `Completed ${course.name}${course.certificationBody ? ` (${course.certificationBody})` : ""}, delivered by ${organization.name}, as recorded on the learner's EnrollClass certificate.`,
    issuerName: organization.name,
  };
}

export function achievementFor(badge: CertificateBadge, organizationId: string, urls: CredentialUrls) {
  return {
    id: `${urls.api}/public/v1/achievements/${badge.courseId}`,
    type: ["Achievement"],
    name: badge.name,
    description: badge.description,
    criteria: { narrative: badge.criteria },
    image: { id: badge.imageUrl, type: "Image", caption: badge.name },
    creator: { id: issuerDid(urls.api, organizationId), type: ["Profile"], name: badge.issuerName },
  };
}

/**
 * The Open Badges 3.0 credential for one certificate, from the badge frozen on it at issue
 * time. The learner is identified by a salted hash of their email (never the address itself);
 * the certificate page is the evidence.
 */
export function buildCredential(certificate: Certificate & { badge: CertificateBadge }, urls: CredentialUrls) {
  const badge = certificate.badge;
  const salt = createHash("sha256").update(`salt:${certificate.verifyCode}`).digest("hex").slice(0, 16);
  const identityHash = `sha256$${createHash("sha256").update(certificate.attendeeEmail.trim().toLowerCase() + salt).digest("hex")}`;
  const issuer = { id: issuerDid(urls.api, certificate.organizationId), type: ["Profile"], name: badge.issuerName };
  return {
    "@context": OB3_CONTEXT,
    id: `${urls.api}/public/v1/credentials/${encodeURIComponent(certificate.verifyCode)}`,
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    name: badge.name,
    issuer,
    validFrom: certificate.issuedAt.toISOString(),
    credentialSubject: {
      type: ["AchievementSubject"],
      identifier: [{ type: "IdentityObject", identityHash, identityType: "emailAddress", hashed: true, salt }],
      achievement: achievementFor(badge, certificate.organizationId, urls),
    },
    evidence: [{ id: urls.certificatePage(certificate.verifyCode), type: ["Evidence"], name: `Certificate of ${certificate.kind === "attendance" ? "attendance" : "completion"}: ${certificate.courseName}` }],
  };
}

/** Does a hashed IdentityObject belong to this email? (What a verifier asks when the learner shares the badge.) */
export function identityMatches(identifier: { identityHash: string; salt?: string }, email: string): boolean {
  const hash = `sha256$${createHash("sha256").update(email.trim().toLowerCase() + (identifier.salt ?? "")).digest("hex")}`;
  return hash === identifier.identityHash;
}

// ---------- Baking (Open Badges 3.0 §5.3): the signed credential inside the PNG ----------

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function isPng(bytes: Buffer): boolean {
  return bytes.length > 8 && bytes.subarray(0, 8).equals(PNG_SIGNATURE);
}

/** Inserts an iTXt chunk with keyword "openbadgecredential" carrying the JWT, just before IEND. */
export function bakePng(png: Buffer, credentialJwt: string): Buffer {
  if (!isPng(png)) throw new Error("not a PNG");
  const chunks: Buffer[] = [png.subarray(0, 8)];
  let pos = 8;
  let baked = false;
  while (pos + 8 <= png.length) {
    const len = png.readUInt32BE(pos);
    const type = png.subarray(pos + 4, pos + 8).toString("latin1");
    const end = pos + 12 + len;
    if (end > png.length) throw new Error("truncated PNG");
    // Drop an older credential so re-baking never leaves two.
    const isOldBadge = type === "iTXt" && png.subarray(pos + 8, pos + 8 + 20).toString("latin1").startsWith("openbadgecredential\0");
    if (type === "IEND") {
      chunks.push(chunk("iTXt", Buffer.concat([Buffer.from("openbadgecredential\0\0\0\0\0", "latin1"), Buffer.from(credentialJwt, "utf8")])));
      baked = true;
    }
    if (!isOldBadge) chunks.push(png.subarray(pos, end));
    pos = end;
    if (type === "IEND") break;
  }
  if (!baked) throw new Error("PNG has no IEND chunk");
  return Buffer.concat(chunks);
}

/** Reads the baked credential back out of a PNG (what a backpack does on import). */
export function unbakePng(png: Buffer): string | null {
  if (!isPng(png)) return null;
  let pos = 8;
  while (pos + 8 <= png.length) {
    const len = png.readUInt32BE(pos);
    const type = png.subarray(pos + 4, pos + 8).toString("latin1");
    if (type === "iTXt") {
      const data = png.subarray(pos + 8, pos + 8 + len);
      const key = "openbadgecredential\0";
      if (data.subarray(0, key.length).toString("latin1") === key) {
        // keyword\0, compression flag, compression method, language\0, translated keyword\0, text
        let i = key.length + 2;
        i = data.indexOf(0, i) + 1;
        i = data.indexOf(0, i) + 1;
        return data.subarray(i).toString("utf8");
      }
    }
    pos += 12 + len;
  }
  return null;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}
