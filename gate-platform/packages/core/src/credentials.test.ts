import { describe, expect, it } from "vitest";
import { verify } from "node:crypto";
import { crc32 } from "node:zlib";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";
import { CredentialSigner, OB3_CONTEXT, badgeSnapshot, bakePng, buildCredential, identityMatches, issuerDid, issuerDidDocument, issuesVerifiedBadge, unbakePng } from "./credentials.js";
import type { Certificate, Course, Organization } from "./types.js";

const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f000500020127efa3d50000000049454e44ae426082", "hex");
const urls = { api: "https://api.enrollclass.com", certificatePage: (c: string) => `https://app.enrollclass.com/cert/${c}` };
const org = { id: "org_1", name: "Agile Agilist" } as Organization;
const course = { id: "course_1", name: "Leading SAFe", description: "Two days of SAFe.", badge: { platform: "own", name: "SAFe Agilist", imageUrl: "https://api.enrollclass.com/public/v1/media/abc.png" } } as Course;
const cert = { id: "cert_1", organizationId: "org_1", seatId: "seat_1", eventId: "evt_1", courseName: "Leading SAFe", attendeeName: "Ada Lovelace", attendeeEmail: "Ada@Example.com", issuedAt: new Date("2026-11-21T22:00:00Z"), verifyCode: "VC-ABC123", kind: "completion", badge: badgeSnapshot(course, org) } as Certificate & { badge: NonNullable<Certificate["badge"]> };

describe("verified badges (Open Badges 3.0)", () => {
  it("builds a standard credential: contexts, issuer DID, hashed learner identity, achievement and evidence", () => {
    const c = buildCredential(cert, urls);
    expect(c["@context"]).toEqual(OB3_CONTEXT);
    expect(c.type).toEqual(["VerifiableCredential", "OpenBadgeCredential"]);
    expect(c.id).toBe("https://api.enrollclass.com/public/v1/credentials/VC-ABC123");
    expect(c.issuer).toEqual({ id: "did:web:api.enrollclass.com:issuers:org_1", type: ["Profile"], name: "Agile Agilist" });
    expect(c.credentialSubject.achievement.description).toBe("Two days of SAFe.");
    expect(c.validFrom).toBe("2026-11-21T22:00:00.000Z");
    expect(c.credentialSubject.achievement).toMatchObject({ id: "https://api.enrollclass.com/public/v1/achievements/course_1", type: ["Achievement"], name: "SAFe Agilist", image: { id: course.badge!.imageUrl, type: "Image" } });
    const id = c.credentialSubject.identifier[0]!;
    expect(JSON.stringify(c)).not.toContain("example.com"); // the email is never in the badge
    expect(identityMatches(id, "ada@example.com")).toBe(true);
    expect(identityMatches(id, "someone@else.com")).toBe(false);
    expect(c.evidence[0]!.id).toBe("https://app.enrollclass.com/cert/VC-ABC123");
    expect(issuesVerifiedBadge(course)).toBe(true);
    expect(issuesVerifiedBadge({ badge: { platform: "credly", name: "x", url: "https://www.credly.com/b" } })).toBe(false);
    expect(issuerDid("http://localhost:4000", "org_1")).toBe("did:web:localhost%3A4000:issuers:org_1");
  });

  it("signs deterministically with a key derived from the server secret, published in the issuer's DID document", () => {
    const signer = new CredentialSigner("a-long-enough-server-secret");
    const again = new CredentialSigner("a-long-enough-server-secret");
    const other = new CredentialSigner("a-different-server-secret!!");
    const c = buildCredential(cert, urls);
    const doc = issuerDidDocument(urls.api, org.id, signer);
    const kid = doc.assertionMethod[0]!;
    const jwt = signer.signJwt(c, kid);
    expect(again.signJwt(c, kid)).toBe(jwt);
    expect(again.keyId).toBe(signer.keyId);
    expect(other.keyId).not.toBe(signer.keyId);

    const ok = signer.verifyJwt(jwt);
    expect(ok?.header).toMatchObject({ alg: "EdDSA", typ: "vc+jwt", kid });
    expect(ok?.payload).toMatchObject({ id: c.id, issuer: { id: doc.id } });
    expect(other.verifyJwt(jwt)).toBeNull();
    const [h, p, s] = jwt.split(".");
    const forged = Buffer.from(JSON.stringify({ ...c, name: "Something else" })).toString("base64url");
    expect(signer.verifyJwt(`${h}.${forged}.${s}`)).toBeNull();
    expect(signer.verifyJwt("not-a-jwt")).toBeNull();

    // An outside verifier only needs the DID document's public key.
    const jwk = doc.verificationMethod[0]!.publicKeyJwk;
    const { createPublicKey } = require("node:crypto") as typeof import("node:crypto");
    const pub = createPublicKey({ key: jwk, format: "jwk" });
    expect(verify(null, Buffer.from(`${h}.${p}`), pub, Buffer.from(s!, "base64url"))).toBe(true);
  });

  it("bakes the signed credential into the badge PNG and reads it back; re-baking replaces it", () => {
    const signer = new CredentialSigner("a-long-enough-server-secret");
    const jwt = signer.signJwt(buildCredential(cert, urls), "did:x#k");
    const baked = bakePng(PNG, jwt);
    expect(unbakePng(baked)).toBe(jwt);
    expect(unbakePng(PNG)).toBeNull();
    // Valid PNG structure: every chunk's CRC checks out and IEND is last.
    let pos = 8, last = "";
    while (pos < baked.length) {
      const len = baked.readUInt32BE(pos);
      last = baked.subarray(pos + 4, pos + 8).toString("latin1");
      expect(baked.readUInt32BE(pos + 8 + len)).toBe(crc32(baked.subarray(pos + 4, pos + 8 + len)) >>> 0);
      pos += 12 + len;
    }
    expect(last).toBe("IEND");
    const rebaked = bakePng(baked, "second.jwt.token");
    expect(unbakePng(rebaked)).toBe("second.jwt.token");
    expect(rebaked.length).toBeLessThan(baked.length + 40);
    expect(() => bakePng(Buffer.from("GIF89a"), jwt)).toThrow();
  });

  it("adds the verified badge fee to paid seats of courses that issue one; free seats stay free", async () => {
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
    const { organization } = await core.createOrganization({ name: "Agile Agilist", country: "US", currency: "USD" });
    const c = await core.createCourse(organization.id, { slug: "safe", name: "Leading SAFe" });
    const ev = await core.createEvent(organization.id, { name: "Nov", courseId: c.id, startsAt: new Date("2027-01-10T14:00:00Z") });
    const tt = await core.createTicketType(organization.id, ev.id, { name: "Seat", priceMinor: 100_000, quantity: 10 });
    const free = await core.createTicketType(organization.id, ev.id, { name: "Free", priceMinor: 0, quantity: 10 });
    const price = async (ticketTypeId: string) => (await core.createOrder(organization.id, { ticketTypeId, quantity: 2, buyerEmail: "a@b.co", dryRun: true })).order.pricing;

    const base = (await price(tt.id)).perTicketFeeMinor;
    await core.updateCourse(organization.id, c.id, { badge: { platform: "credly", name: "SAFe", url: "https://www.credly.com/org/x/badge/safe" } });
    expect((await price(tt.id)).perTicketFeeMinor).toBe(base); // outside platforms: no EnrollClass badge fee
    await core.updateCourse(organization.id, c.id, { badge: { platform: "own", name: "SAFe", imageUrl: "https://api.enrollclass.com/public/v1/media/a.png" } });
    expect((await price(tt.id)).perTicketFeeMinor).toBe(base + 100);
    expect((await price(tt.id)).platformFeeMinor).toBe(2 * (base + 100));
    expect((await price(free.id)).platformFeeMinor).toBe(0);
  });

  it("freezes the badge on each certificate at issue time, so later course edits never change issued badges", async () => {
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
    const { organization } = await core.createOrganization({ name: "Agile Agilist", country: "US", currency: "USD" });
    const c = await core.createCourse(organization.id, { slug: "safe", name: "Leading SAFe" });
    await core.updateCourse(organization.id, c.id, { badge: { platform: "own", name: "SAFe Agilist", imageUrl: "https://x.test/a.png" } });
    const ev = await core.createEvent(organization.id, { name: "Nov", courseId: c.id, startsAt: new Date("2027-01-10T14:00:00Z") });
    const free = await core.createTicketType(organization.id, ev.id, { name: "Free", priceMinor: 0, quantity: 10 });
    await core.createOrder(organization.id, { ticketTypeId: free.id, quantity: 1, buyerEmail: "a@b.co" });
    const [issued] = await core.issueCertificates(organization.id, ev.id);
    expect(issued!.badge).toMatchObject({ courseId: c.id, name: "SAFe Agilist", imageUrl: "https://x.test/a.png", issuerName: "Agile Agilist" });
    await core.updateCourse(organization.id, c.id, { badge: { platform: "credly", name: "Other", url: "https://www.credly.com/b" } });
    expect((await core.verifyCertificate(issued!.verifyCode)).certificate!.badge!.name).toBe("SAFe Agilist");
  });
});
