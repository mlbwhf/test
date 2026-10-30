import { beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { Core, FakePaymentsAdapter, createInMemoryRepos } from "@gate/core";
import { buildApp } from "./app.js";

let app: FastifyInstance;
let apiKey: string;
const H = () => ({ "x-api-key": apiKey, "content-type": "application/json" });
const A = () => ({ "x-api-key": apiKey });

beforeEach(async () => {
  const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
  app = await buildApp({ core, adminKey: "admin", env: "test" });
  const res = await app.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "Agile Agilist", country: "US", currency: "USD", releasePolicy: "immediate" } });
  expect(res.statusCode).toBe(201);
  apiKey = res.json().apiKey;
});

describe("API", () => {
  it("serves health and OpenAPI", async () => {
    expect((await app.inject("/health")).json()).toMatchObject({ ok: true, payments: "fake" });
    const spec = (await app.inject("/docs/json")).json();
    expect(spec.openapi).toBe("3.1.0");
    expect(Object.keys(spec.paths)).toEqual(expect.arrayContaining(["/v1/orders", "/v1/refunds", "/v1/ledger/balances", "/v1/webhooks/stripe"]));
    const fees = (await app.inject("/public/v1/fees")).json().currencies;
    expect(fees.USD).toMatchObject({ protected: { bps: 490, fixedMinor: 80, capMinor: null }, direct: { bps: 150, fixedMinor: 50, capMinor: null }, verifiedBadgeMinor: 100, fxMarginBps: 150, marketplaceBps: 500, earlyRelease: { bps: 200 }, flexible: { bps: 800, platformShareBps: 2_500 } });
    expect(Object.keys(fees)).toEqual(expect.arrayContaining(["USD", "CAD", "EUR", "GBP"]));
  });

  it("rejects missing/invalid api keys and admin keys", async () => {
    expect((await app.inject("/v1/events")).statusCode).toBe(401);
    expect((await app.inject({ url: "/v1/events", headers: { "x-api-key": "bad" } })).statusCode).toBe(401);
    expect((await app.inject({ method: "POST", url: "/v1/organizations", payload: { name: "x", country: "US", currency: "USD" } })).statusCode).toBe(401);
  });

  it("runs the full flow: event -> ticket -> order -> payment -> balances -> refund", async () => {
    const ev = await app.inject({ method: "POST", url: "/v1/events", headers: H(), payload: { name: "Leading SAFe", startsAt: "2026-11-01T09:00:00Z" } });
    expect(ev.statusCode).toBe(201);
    const eventId = ev.json().id;
    const tt = await app.inject({ method: "POST", url: `/v1/events/${eventId}/ticket-types`, headers: H(), payload: { name: "Standard", priceMinor: 100_000, quantity: 10 } });
    expect(tt.statusCode).toBe(201);

    const dry = await app.inject({ method: "POST", url: "/v1/orders?dry_run=true", headers: H(), payload: { ticketTypeId: tt.json().id, quantity: 2, buyerEmail: "a@b.co" } });
    expect(dry.statusCode).toBe(200);
    expect(dry.json().dryRun).toBe(true);
    expect(dry.json().order.pricing.totalMinor).toBe(200_000);

    const ord = await app.inject({ method: "POST", url: "/v1/orders", headers: { ...H(), "idempotency-key": "o-1" }, payload: { ticketTypeId: tt.json().id, quantity: 2, buyerEmail: "a@b.co" } });
    expect(ord.statusCode).toBe(201);
    const order = ord.json().order;
    expect(ord.json().clientSecret).toContain("secret");

    const replay = await app.inject({ method: "POST", url: "/v1/orders", headers: { ...H(), "idempotency-key": "o-1" }, payload: { ticketTypeId: tt.json().id, quantity: 2, buyerEmail: "a@b.co" } });
    expect(replay.statusCode).toBe(201);
    expect(replay.headers["idempotent-replayed"]).toBe("true");
    expect(replay.json().order.id).toBe(order.id);
    const conflict = await app.inject({ method: "POST", url: "/v1/orders", headers: { ...H(), "idempotency-key": "o-1" }, payload: { ticketTypeId: tt.json().id, quantity: 3, buyerEmail: "a@b.co" } });
    expect(conflict.statusCode).toBe(422);
    expect(conflict.json().error.code).toBe("IDEMPOTENCY_CONFLICT");

    const paid = await app.inject({ method: "POST", url: `/v1/dev/payments/${order.paymentRef}/succeed`, headers: A() });
    expect(paid.json()).toEqual({ handled: true });

    const lines = await app.inject({ url: "/v1/events/overview", headers: A() });
    expect(lines.json().items.find((l: { eventId: string }) => l.eventId === eventId)).toMatchObject({ sold: 2, capacity: 10 });
    const detail = await app.inject({ url: `/v1/events/${eventId}/overview`, headers: A() });
    expect(detail.json()).toMatchObject({ line: { eventId }, money: { grossMinor: 200_000 }, publicUrl: null });
    expect(detail.json().attendees).toHaveLength(2);
    const catalog = (await app.inject("/public/v1/catalog")).json().items;
    expect(Array.isArray(catalog)).toBe(true);
    const dup = await app.inject({ method: "POST", url: `/v1/events/${eventId}/duplicate`, headers: H(), payload: { startDate: "2026-11-08" } });
    expect(dup.statusCode).toBe(201);
    expect(dup.json().event.startsAt).toBe("2026-11-08T09:00:00.000Z");
    expect(dup.json().ticketTypes[0]).toMatchObject({ name: "Standard", quantity: 10, sold: 0 });
    expect((await app.inject({ url: `/v1/orders/${order.id}`, headers: H() })).json().status).toBe("paid");

    const bal = (await app.inject({ url: "/v1/ledger/balances", headers: H() })).json().accounts;
    expect(bal.find((a: { code: string }) => a.code.endsWith(":payable:USD")).balanceMinor).toBe(190_040);
    const entries = (await app.inject({ url: "/v1/ledger/entries", headers: H() })).json().items;
    expect(entries).toHaveLength(1);

    const rf = await app.inject({ method: "POST", url: "/v1/refunds", headers: H(), payload: { orderId: order.id, amountMinor: 100_000, reason: "one attendee cancelled" } });
    expect(rf.statusCode).toBe(201);
    expect(rf.json().refund.status).toBe("succeeded");
    expect((await app.inject({ url: `/v1/orders/${order.id}`, headers: H() })).json().status).toBe("partially_refunded");
  });

  it("returns structured validation and domain errors", async () => {
    const bad = await app.inject({ method: "POST", url: "/v1/events", headers: H(), payload: { name: "", startsAt: "not-a-date" } });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error.code).toBe("VALIDATION");
    const missing = await app.inject({ url: "/v1/events/evt_nope", headers: H() });
    expect(missing.statusCode).toBe(404);
    expect(missing.json().error).toMatchObject({ code: "NOT_FOUND" });
    const ai = await app.inject({ method: "POST", url: "/v1/copilot/triage", headers: H(), payload: { message: "hi" } });
    expect(ai.statusCode).toBe(409);
    expect(ai.json().error.hint).toContain("ANTHROPIC_API_KEY");
  });

  it("webhook route requires stripe configuration and a signature", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/webhooks/stripe", headers: { "content-type": "application/json" }, payload: "{}" });
    expect(res.statusCode).toBe(409);
  });

  it("previews and applies a CSV import of cohorts", async () => {
    const csv = [
      "name,course,start,end,timezone,currency,price,seats,format",
      '"PMP Exam Prep - Nov 2099","PMP Exam Prep",2099-11-12 09:00,2099-11-14 17:00,America/Toronto,USD,1495.00,20,live_virtual',
      '"PMP Exam Prep - Jan 2100","PMP Exam Prep",2100-01-20 09:00,2100-01-22 17:00,America/Toronto,USD,1495.00,20,live_virtual',
      '"Old class",,2020-01-05 09:00,,UTC,USD,100,10,in_person',
    ].join("\n");
    const preview = await app.inject({ method: "POST", url: "/v1/imports/csv", headers: H(), payload: { csv } });
    expect(preview.statusCode).toBe(200);
    expect(preview.json().dryRun).toBe(true);
    expect(preview.json().plan.items).toHaveLength(3);
    expect(preview.json().plan.courses).toEqual([{ slug: "old-class", name: "Old class", cohorts: 1 }, { slug: "pmp-exam-prep", name: "PMP Exam Prep", cohorts: 2 }]);
    expect(preview.json().results).toEqual([]);
    expect((await app.inject({ url: "/v1/events", headers: A() })).json().items).toHaveLength(0);

    const applied = await app.inject({ method: "POST", url: "/v1/imports/csv", headers: H(), payload: { csv, dryRun: false } });
    expect(applied.statusCode).toBe(200);
    const results = applied.json().results;
    expect(results.map((r: { status: string }) => r.status)).toEqual(["skipped", "created", "created"]);
    expect(results[1]).toMatchObject({ courseCreated: true, ticketTypes: 1 });
    expect(results[2]).toMatchObject({ courseCreated: false });
    expect(results[1].courseId).toBe(results[2].courseId);
    const events = (await app.inject({ url: "/v1/events", headers: A() })).json().items;
    expect(events).toHaveLength(2);
    expect(events.map((e: { timezone: string; format: string; endsAt: string | null }) => [e.timezone, e.format, e.endsAt !== null])).toEqual([["America/Toronto", "live_virtual", true], ["America/Toronto", "live_virtual", true]]);

    // Re-running does not duplicate.
    const again = await app.inject({ method: "POST", url: "/v1/imports/csv", headers: H(), payload: { csv, dryRun: false } });
    expect(again.json().results.map((r: { status: string }) => r.status)).toEqual(["skipped", "exists", "exists"]);
  });

  it("imports from Eventbrite through an injected fetch and rejects bad tokens", async () => {
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      if ((init?.headers as Record<string, string>).authorization !== "Bearer good-token-123") return new Response("{}", { status: 401 });
      if (url.endsWith("/users/me/organizations/")) return new Response(JSON.stringify({ organizations: [{ id: "eb1", name: "Agile Agilist" }] }));
      return new Response(JSON.stringify({ events: [{ id: "e1", name: { text: "CSM Workshop - Dec 2099" }, start: { timezone: "America/Toronto", utc: "2099-12-03T14:00:00Z" }, end: { timezone: "America/Toronto", utc: "2099-12-04T22:00:00Z" }, currency: "CAD", online_event: true, status: "live", ticket_classes: [{ id: "t", name: "Standard", cost: { currency: "CAD", value: 99500 }, quantity_total: 16, quantity_sold: 3 }] }], pagination: { has_more_items: false } }));
    }) as unknown as typeof fetch;
    const eb = await buildApp({ core, adminKey: "admin", env: "test", fetchImpl });
    const created = await eb.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "Agile Agilist", country: "CA", currency: "CAD" } });
    const key = created.json().apiKey as string;
    const bad = await eb.inject({ method: "POST", url: "/v1/imports/eventbrite", headers: { "x-api-key": key, "content-type": "application/json" }, payload: { token: "wrong-token-123" } });
    expect(bad.statusCode).toBe(401);
    const res = await eb.inject({ method: "POST", url: "/v1/imports/eventbrite", headers: { "x-api-key": key, "content-type": "application/json" }, payload: { token: "good-token-123", dryRun: false } });
    expect(res.statusCode).toBe(200);
    expect(res.json().eventbriteOrganization).toEqual({ id: "eb1", name: "Agile Agilist" });
    expect(res.json().plan.items[0].course.slug).toBe("csm-workshop");
    expect(res.json().results[0]).toMatchObject({ status: "created", ticketTypes: 1 });
    const tts = (await eb.inject({ url: `/v1/events/${res.json().results[0].eventId}/ticket-types`, headers: { "x-api-key": key } })).json().items;
    expect(tts[0]).toMatchObject({ name: "Standard", priceMinor: 99500, quantity: 16 });
  });

  it("localizes prices: settings, converted public prices, orders in the chosen currency", async () => {
    const fx = { name: "ecb" as const, latest: async (_b: string, q: string[]) => Object.fromEntries(q.map((c) => [c, c === "CAD" ? 1.36 : 0.92])) };
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter(), fx });
    const fxApp = await buildApp({ core, adminKey: "admin", env: "test" });
    const created = await fxApp.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "AA", country: "US", currency: "USD" } });
    const key = created.json().apiKey as string;
    const orgId = created.json().organization.id as string;
    const h = { "x-api-key": key, "content-type": "application/json" };
    const course = (await fxApp.inject({ method: "POST", url: "/v1/courses", headers: h, payload: { slug: "pmp", name: "PMP" } })).json();
    const event = (await fxApp.inject({ method: "POST", url: "/v1/events", headers: h, payload: { name: "PMP Nov", startsAt: "2099-11-12T14:00:00Z", courseId: course.id } })).json();
    const tt = (await fxApp.inject({ method: "POST", url: `/v1/events/${event.id}/ticket-types`, headers: h, payload: { name: "Seat", priceMinor: 149500, quantity: 10 } })).json();

    expect((await fxApp.inject({ url: "/v1/organizations/me", headers: h })).json().pricing).toEqual({ currencies: [], fxFallback: false, rounding: "whole", rates: {}, ratesUpdatedAt: null, ratesSource: null });
    const patched = await fxApp.inject({ method: "PATCH", url: "/v1/organizations/me/pricing", headers: h, payload: { currencies: ["CAD", "EUR"], fxFallback: true, rounding: "nine" } });
    expect([patched.statusCode, patched.json()]).toEqual([200, expect.anything()]);
    const refreshed = await fxApp.inject({ method: "POST", url: "/v1/organizations/me/pricing/refresh-rates", headers: { "x-api-key": key } });
    expect([refreshed.statusCode, refreshed.json()]).toEqual([200, expect.anything()]);
    expect(refreshed.json().pricing).toMatchObject({ rates: { CAD: 1.36, EUR: 0.92 }, ratesSource: "ecb" });

    const pub = (await fxApp.inject(`/public/v1/organizations/${orgId}/courses/pmp`)).json();
    expect(pub.organization.currencies).toEqual(["USD", "CAD", "EUR"]);
    expect(pub.cohorts[0].ticketTypes[0].prices).toEqual({ USD: 149500, CAD: 202900, EUR: 137900 });
    expect(pub.cohorts[0].ticketTypes[0].converted).toEqual(["CAD", "EUR"]);

    const order = await fxApp.inject({ method: "POST", url: `/public/v1/organizations/${orgId}/orders`, headers: { "content-type": "application/json" }, payload: { eventId: event.id, ticketTypeId: tt.id, quantity: 1, currency: "EUR", buyerEmail: "a@b.co", attendees: [{ email: "a@b.co", name: "A" }] } });
    expect(order.statusCode).toBe(201);
    expect(order.json().order).toMatchObject({ currency: "EUR", pricing: { unitPriceMinor: 137900 } });

    const manual = await fxApp.inject({ method: "PATCH", url: "/v1/organizations/me/pricing", headers: h, payload: { rates: { CAD: 1.4 } } });
    expect(manual.json().pricing).toMatchObject({ rates: { CAD: 1.4, EUR: 0.92 }, ratesSource: "manual" });
  });

  it("stores course images: raw upload, from URL, served with long cache, rejects non-images", async () => {
    const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000201a5a1d2d10000000049454e44ae426082", "hex");
    const fetchImpl = (async (url: string) => {
      if (url === "https://cdn.example.com/banner.png") return new Response(png, { headers: { "content-type": "application/octet-stream" } });
      if (url === "https://cdn.example.com/page.html") return new Response("<html>", { headers: { "content-type": "text/html" } });
      return new Response("", { status: 404 });
    }) as unknown as typeof fetch;
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
    const im = await buildApp({ core, adminKey: "admin", env: "test", fetchImpl, publicUrl: "https://api.test" });
    const key = (await im.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "AA", country: "US", currency: "USD" } })).json().apiKey as string;
    const course = (await im.inject({ method: "POST", url: "/v1/courses", headers: { "x-api-key": key, "content-type": "application/json" }, payload: { slug: "rte", name: "RTE" } })).json();
    expect(course.imageUrl).toBeNull();

    const up = await im.inject({ method: "PUT", url: `/v1/courses/${course.id}/image`, headers: { "x-api-key": key, "content-type": "image/png" }, payload: png });
    expect(up.statusCode).toBe(200);
    expect(up.json().imageUrl).toMatch(/^https:\/\/api\.test\/public\/v1\/media\/[a-f0-9]{32}\.png$/);
    const servedPath = new URL(up.json().imageUrl).pathname;
    const served = await im.inject(servedPath);
    expect(served.statusCode).toBe(200);
    expect(served.headers["content-type"]).toBe("image/png");
    expect(served.headers["cache-control"]).toContain("immutable");
    expect(served.rawPayload.equals(png)).toBe(true);

    const lie = await im.inject({ method: "PUT", url: `/v1/courses/${course.id}/image`, headers: { "x-api-key": key, "content-type": "image/jpeg" }, payload: png });
    expect(lie.statusCode).toBe(400);
    const notImage = await im.inject({ method: "POST", url: `/v1/courses/${course.id}/image/from-url`, headers: { "x-api-key": key, "content-type": "application/json" }, payload: { url: "https://cdn.example.com/page.html" } });
    expect(notImage.statusCode).toBe(400);
    const fromUrl = await im.inject({ method: "POST", url: `/v1/courses/${course.id}/image/from-url`, headers: { "x-api-key": key, "content-type": "application/json" }, payload: { url: "https://cdn.example.com/banner.png" } });
    expect(fromUrl.json().imageUrl).toBe(up.json().imageUrl);
    const removed = await im.inject({ method: "DELETE", url: `/v1/courses/${course.id}/image`, headers: { "x-api-key": key } });
    expect(removed.json().imageUrl).toBeNull();
    expect((await im.inject("/public/v1/media/../../etc/passwd")).statusCode).toBe(404);

    const pub = (await im.inject(`/public/v1/organizations/${course.organizationId}/courses/rte`)).json();
    expect(pub.course.imageUrl).toBeNull();
  });

  it("issues verified badges: Open Badges 3.0 credential, signed JWT, baked PNG, issuer DID and verification", async () => {
    const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000201a5a1d2d10000000049454e44ae426082", "hex");
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
    const im = await buildApp({ core, adminKey: "admin", env: "test", publicUrl: "https://api.test", webUrl: "https://app.test", ticketSecret: "a-test-ticket-secret-123" });
    const created = (await im.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "Agile Agilist", country: "US", currency: "USD" } })).json();
    const key = created.apiKey as string;
    const orgId = created.organization.id as string;
    const J = { "x-api-key": key, "content-type": "application/json" };
    const course = (await im.inject({ method: "POST", url: "/v1/courses", headers: J, payload: { slug: "safe", name: "Leading SAFe" } })).json();
    await im.inject({ method: "PUT", url: `/v1/courses/${course.id}/badge-image?name=SAFe%20Agilist`, headers: { "x-api-key": key, "content-type": "image/png" }, payload: png });
    const ev = (await im.inject({ method: "POST", url: `/v1/courses/${course.id}/cohorts`, headers: J, payload: { name: "Nov", sessions: [{ startsAt: "2099-11-20T14:00:00Z", endsAt: "2099-11-20T22:00:00Z" }] } })).json();
    const tt = (await im.inject({ method: "POST", url: `/v1/events/${ev.id}/ticket-types`, headers: J, payload: { name: "Seat", priceMinor: 100_000, quantity: 5 } })).json();
    // The verified badge adds its $1 to the paid seat's fee.
    const dry = (await im.inject({ method: "POST", url: "/v1/orders", headers: J, payload: { ticketTypeId: tt.id, quantity: 1, buyerEmail: "ada@example.com", dryRun: true } })).json();
    expect(dry.order.pricing.perTicketFeeMinor).toBe(4_900 + 80 + 100);
    const ord = (await im.inject({ method: "POST", url: "/v1/orders", headers: J, payload: { ticketTypeId: tt.id, quantity: 1, buyerEmail: "ada@example.com", attendees: [{ email: "ada@example.com", name: "Ada Lovelace" }] } })).json();
    await im.inject({ method: "POST", url: `/v1/dev/payments/${ord.order.paymentRef}/succeed`, headers: { "x-api-key": key } });
    const issued = (await im.inject({ method: "POST", url: `/v1/events/${ev.id}/certificates`, headers: J, payload: {} })).json().issued;
    const code = issued[0].verifyCode as string;

    const cert = (await im.inject(`/public/v1/certificates/${code}`)).json();
    expect(cert.verifiedBadge).toMatchObject({ name: "SAFe Agilist", credentialUrl: `https://api.test/public/v1/credentials/${code}`, jwtUrl: `https://api.test/public/v1/credentials/${code}/jwt`, pngUrl: `https://api.test/public/v1/credentials/${code}/badge.png` });

    const credential = await im.inject(`/public/v1/credentials/${code}`);
    expect(credential.headers["content-type"]).toContain("application/vc+ld+json");
    expect(credential.json()).toMatchObject({ type: ["VerifiableCredential", "OpenBadgeCredential"], issuer: { id: `did:web:api.test:issuers:${orgId}`, name: "Agile Agilist" }, credentialSubject: { achievement: { name: "SAFe Agilist" } } });
    const did = (await im.inject(`/issuers/${orgId}/did.json`)).json();
    expect(did.id).toBe(`did:web:api.test:issuers:${orgId}`);
    expect((await im.inject("/issuers/org_nope/did.json")).statusCode).toBe(404);
    expect((await im.inject(`/public/v1/achievements/${course.id}`)).json()).toMatchObject({ type: ["Achievement"], name: "SAFe Agilist" });

    const jwt = (await im.inject(`/public/v1/credentials/${code}/jwt`)).body;
    expect(JSON.parse(Buffer.from(jwt.split(".")[0]!, "base64url").toString())).toMatchObject({ alg: "EdDSA", kid: did.assertionMethod[0] });
    const ok = (await im.inject({ method: "POST", url: "/public/v1/credentials/verify", payload: { jwt } })).json();
    expect(ok).toMatchObject({ valid: true, issuer: "Agile Agilist", achievement: "SAFe Agilist", learner: "Ada Lovelace", certificateUrl: `https://app.test/cert/${code}` });
    const [h, , sig] = jwt.split(".");
    const forged = Buffer.from(JSON.stringify({ ...credential.json(), name: "Expert" })).toString("base64url");
    expect((await im.inject({ method: "POST", url: "/public/v1/credentials/verify", payload: { jwt: `${h}.${forged}.${sig}` } })).json().valid).toBe(false);

    const baked = await im.inject(`/public/v1/credentials/${code}/badge.png`);
    expect(baked.headers["content-type"]).toBe("image/png");
    expect((await im.inject({ method: "POST", url: "/public/v1/credentials/verify", payload: { png: baked.rawPayload.toString("base64") } })).json()).toMatchObject({ valid: true, learner: "Ada Lovelace" });
    expect((await im.inject({ method: "POST", url: "/public/v1/credentials/verify", payload: { png: png.toString("base64") } })).json()).toMatchObject({ valid: false, reason: "this image has no baked credential" });

    // Issued badges never change: editing the course afterwards leaves this credential valid.
    await im.inject({ method: "PATCH", url: `/v1/courses/${course.id}`, headers: J, payload: { badge: { platform: "credly", name: "SAFe", url: "https://www.credly.com/org/x/badge/safe" } } });
    expect((await im.inject({ method: "POST", url: "/public/v1/credentials/verify", payload: { jwt } })).json().valid).toBe(true);
    expect((await im.inject(`/public/v1/achievements/${course.id}`)).statusCode).toBe(404);
    expect((await im.inject("/public/v1/credentials/not-a-code")).statusCode).toBe(404);
  });

  it("class-finder referral fee, flexible tickets and the early-release quote over the API", async () => {
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
    const im = await buildApp({ core, adminKey: "admin", env: "test", publicUrl: "https://api.test" });
    const created = (await im.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "AA", country: "US", currency: "USD" } })).json();
    const J = { "x-api-key": created.apiKey as string, "content-type": "application/json" };
    const orgId = created.organization.id as string;
    const course = (await im.inject({ method: "POST", url: "/v1/courses", headers: J, payload: { slug: "safe", name: "SAFe" } })).json();
    const ev = (await im.inject({ method: "POST", url: `/v1/courses/${course.id}/cohorts`, headers: J, payload: { name: "Nov", sessions: [{ startsAt: "2099-11-20T14:00:00Z", endsAt: "2099-11-20T22:00:00Z" }] } })).json();
    const tt = (await im.inject({ method: "POST", url: `/v1/events/${ev.id}/ticket-types`, headers: J, payload: { name: "Seat", priceMinor: 100_000, quantity: 5 } })).json();
    const order = (body: object) => im.inject({ method: "POST", url: `/public/v1/organizations/${orgId}/orders`, payload: { ticketTypeId: tt.id, quantity: 1, buyerEmail: "l@x.co", dryRun: true, ...body } });

    expect((await order({ source: "marketplace" })).json().order.pricing).toMatchObject({ referralFeeMinor: 5_000, totalMinor: 100_000 });
    expect((await order({ flexible: true })).statusCode).toBe(400);
    const patched = (await im.inject({ method: "PATCH", url: "/v1/organizations/me", headers: J, payload: { flexibleTickets: true, marketplaceListing: false } })).json();
    expect(patched).toMatchObject({ flexibleTickets: true, marketplaceListing: false });
    expect((await order({ flexible: true })).json().order.pricing).toMatchObject({ flexibleMinor: 8_000, totalMinor: 108_000 });
    expect((await order({ source: "marketplace" })).json().order.pricing.referralFeeMinor).toBeUndefined();
    expect((await im.inject(`/public/v1/organizations/${orgId}/courses/safe`)).json().organization.flexibleTickets).toBe(true);
    expect((await im.inject("/public/v1/catalog")).json().items[0]).toMatchObject({ slug: "safe", listed: false });

    const quote = (await im.inject({ url: `/v1/events/${ev.id}/release-early`, headers: J })).json();
    expect(quote).toMatchObject({ eligible: false, heldMinor: 0, currency: "USD" });
    expect((await im.inject({ method: "POST", url: `/v1/events/${ev.id}/release-early`, headers: J, payload: {} })).statusCode).toBe(409);
  });

  it("invoices: signed pay link, public invoice page data, card payment to paid; forged links fail", async () => {
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
    const im = await buildApp({ core, adminKey: "admin", env: "test", publicUrl: "https://api.test", webUrl: "https://app.test", ticketSecret: "invoice-test-secret-123" });
    const created = (await im.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "AA", country: "CA", currency: "CAD" } })).json();
    const key = created.apiKey as string;
    const J = { "x-api-key": key, "content-type": "application/json" };
    const course = (await im.inject({ method: "POST", url: "/v1/courses", headers: J, payload: { slug: "safe", name: "Leading SAFe" } })).json();
    const ev = (await im.inject({ method: "POST", url: `/v1/courses/${course.id}/cohorts`, headers: J, payload: { name: "Nov", sessions: [{ startsAt: "2099-11-20T14:00:00Z", endsAt: "2099-11-20T22:00:00Z" }] } })).json();
    const tt = (await im.inject({ method: "POST", url: `/v1/events/${ev.id}/ticket-types`, headers: J, payload: { name: "Seat", priceMinor: 100_000, quantity: 5 } })).json();
    const acct = (await im.inject({ method: "POST", url: "/v1/corporate-accounts", headers: J, payload: { name: "Big Bank", billingEmail: "ap@bigbank.ca", address: { country: "CA", region: "ON" } } })).json();
    const { invoice } = (await im.inject({ method: "POST", url: "/v1/invoice-orders", headers: J, payload: { corporateAccountId: acct.id, ticketTypeId: tt.id, quantity: 2 } })).json();

    const { url } = (await im.inject({ url: `/v1/invoices/${invoice.id}/pay-link`, headers: J })).json();
    expect(url).toMatch(/^https:\/\/app\.test\/pay\/invoice\//);
    const token = decodeURIComponent(url.split("/pay/invoice/")[1]);
    const view = (await im.inject(`/public/v1/invoices/${encodeURIComponent(token)}`)).json();
    expect(view).toMatchObject({ number: invoice.number, status: "issued", organization: "AA", account: "Big Bank", cohort: "Nov", course: "Leading SAFe", seats: 2, totalMinor: invoice.totalMinor });
    expect((await im.inject(`/public/v1/invoices/${encodeURIComponent(`${invoice.id}.forged`)}`)).statusCode).toBe(404);

    const pay = (await im.inject({ method: "POST", url: `/public/v1/invoices/${encodeURIComponent(token)}/card-payment`, payload: {} })).json();
    expect(pay.clientSecret).toBeTruthy();
    await im.inject({ method: "POST", url: `/v1/dev/payments/${pay.paymentRef}/succeed`, headers: { "x-api-key": key } });
    expect((await im.inject(`/public/v1/invoices/${encodeURIComponent(token)}`)).json().status).toBe("paid");
  });

  it("schedule builder, company logo, and logo plus badge in the class finder", async () => {
    const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000201a5a1d2d10000000049454e44ae426082", "hex");
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
    const im = await buildApp({ core, adminKey: "admin", env: "test", publicUrl: "https://api.test" });
    const key = (await im.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "AA", country: "US", currency: "USD" } })).json().apiKey as string;
    const J = { "x-api-key": key, "content-type": "application/json" };
    const course = (await im.inject({ method: "POST", url: "/v1/courses", headers: J, payload: { slug: "safe", name: "Leading SAFe" } })).json();
    const ev = (await im.inject({ method: "POST", url: `/v1/courses/${course.id}/cohorts`, headers: J, payload: { name: "First", timezone: "America/New_York", sessions: [{ startsAt: "2099-01-05T14:00:00Z", endsAt: "2099-01-05T22:00:00Z" }] } })).json();
    await im.inject({ method: "POST", url: `/v1/events/${ev.id}/ticket-types`, headers: J, payload: { name: "Seat", priceMinor: 100_000, quantity: 10 } });
    await im.inject({ method: "POST", url: `/v1/events/${ev.id}/publish`, headers: J, payload: {} });

    const rule = { repeat: "weekly", everyWeeks: 2 };
    const preview = (await im.inject({ method: "POST", url: `/v1/events/${ev.id}/schedule`, headers: J, payload: { rule, from: "2099-01-05", count: 3, skip: ["2099-01-19"], dryRun: true } })).json();
    expect(preview.plan.map((p: { startDate: string; conflict: boolean }) => [p.startDate, p.conflict])).toEqual([["2099-01-05", true], ["2099-02-02", false], ["2099-02-16", false]]);
    expect(preview.created).toEqual([]);
    const built = (await im.inject({ method: "POST", url: `/v1/events/${ev.id}/schedule`, headers: J, payload: { rule, from: "2099-01-05", count: 3, skip: ["2099-01-19"], publish: true } })).json();
    expect(built.created.map((e: { status: string; startsAt: string }) => [e.status, e.startsAt])).toEqual([["live", "2099-02-02T14:00:00.000Z"], ["live", "2099-02-16T14:00:00.000Z"]]);
    expect((await im.inject({ method: "POST", url: `/v1/events/${ev.id}/schedule`, headers: J, payload: { rule: { repeat: "weekly", everyWeeks: 9 }, count: 2 } })).statusCode).toBe(400);

    const logo = (await im.inject({ method: "PUT", url: "/v1/organizations/me/logo", headers: { "x-api-key": key, "content-type": "image/png" }, payload: png })).json();
    expect(logo.logoUrl).toMatch(/^https:\/\/api\.test\/public\/v1\/media\//);
    await im.inject({ method: "PUT", url: `/v1/courses/${course.id}/badge-image?name=SAFe%20Agilist`, headers: { "x-api-key": key, "content-type": "image/png" }, payload: png });
    const [item] = (await im.inject("/public/v1/catalog")).json().items;
    expect(item).toMatchObject({ logoUrl: logo.logoUrl, classes: 3, digitalBadge: { name: "SAFe Agilist", platform: "own" } });
    expect(item.digitalBadge.imageUrl).toMatch(/\/media\//);
    expect((await im.inject(`/public/v1/organizations/${logo.id}/courses/safe`)).json().organization.logoUrl).toBe(logo.logoUrl);
    expect((await im.inject({ method: "DELETE", url: "/v1/organizations/me/logo", headers: { "x-api-key": key } })).json().logoUrl).toBeNull();
  });

  it("categories and paid promotions in the class finder", async () => {
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
    const im = await buildApp({ core, adminKey: "admin", env: "test" });
    const key = (await im.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "AA", country: "US", currency: "USD" } })).json().apiKey as string;
    const J = { "x-api-key": key, "content-type": "application/json" };
    const course = (await im.inject({ method: "POST", url: "/v1/courses", headers: J, payload: { slug: "pmp", name: "PMP Exam Prep" } })).json();
    expect(course.category).toBeNull();
    const ev = (await im.inject({ method: "POST", url: `/v1/courses/${course.id}/cohorts`, headers: J, payload: { name: "Nov", sessions: [{ startsAt: "2099-11-20T14:00:00Z", endsAt: "2099-11-20T22:00:00Z" }] } })).json();
    await im.inject({ method: "POST", url: `/v1/events/${ev.id}/ticket-types`, headers: J, payload: { name: "Seat", priceMinor: 100_000, quantity: 5 } });
    await im.inject({ method: "POST", url: `/v1/events/${ev.id}/publish`, headers: J, payload: {} });
    let catalog = (await im.inject("/public/v1/catalog")).json();
    expect(catalog.categories.map((c: { id: string }) => c.id)).toContain("project-management");
    expect(catalog.items[0]).toMatchObject({ slug: "pmp", category: "project-management", promoted: null });
    expect((await im.inject({ method: "PATCH", url: `/v1/courses/${course.id}`, headers: J, payload: { category: "leadership" } })).json().category).toBe("leadership");
    expect((await im.inject({ method: "PATCH", url: `/v1/courses/${course.id}`, headers: J, payload: { category: "cooking" } })).statusCode).toBe(400);

    const list = (await im.inject({ url: "/v1/promotions", headers: J })).json();
    expect(list).toMatchObject({ items: [], prices: { currency: "USD", weeks: [1, 2, 4], top: [7_900, 15_800, 23_700] } });
    expect((await im.inject({ method: "POST", url: "/v1/promotions", headers: J, payload: { courseId: course.id, placement: "top", weeks: 3 } })).statusCode).toBe(400);
    const created = await im.inject({ method: "POST", url: "/v1/promotions", headers: J, payload: { courseId: course.id, placement: "top", weeks: 1 } });
    expect(created.statusCode).toBe(201);
    const { promotion, clientSecret } = created.json();
    expect(clientSecret).toBeTruthy();
    expect(promotion).toMatchObject({ status: "pending_payment", amountMinor: 7_900 });
    const ref = (await core.listPromotions((await core.authenticate(key)).id))[0]!.paymentRef!;
    await im.inject({ method: "POST", url: `/v1/dev/payments/${ref}/succeed`, headers: { "x-api-key": key } });
    catalog = (await im.inject("/public/v1/catalog")).json();
    expect(catalog.items[0]).toMatchObject({ category: "leadership", promoted: "top" });
    expect((await im.inject({ url: "/v1/promotions", headers: J })).json().items[0].status).toBe("active");
    expect((await im.inject("/public/v1/fees")).json().currencies.USD.promotion).toEqual({ categoryWeekMinor: 2_900, topWeekMinor: 7_900 });
  });

  it("moves badges from Credly to EnrollClass verified badges and awards them to past learners", async () => {
    const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000201a5a1d2d10000000049454e44ae426082", "hex");
    const fetchImpl = (async (url: string) => (url.startsWith("https://images.credly.com/") ? new Response(png, { headers: { "content-type": "image/png" } }) : new Response("", { status: 404 }))) as unknown as typeof fetch;
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
    const im = await buildApp({ core, adminKey: "admin", env: "test", fetchImpl, publicUrl: "https://api.test", webUrl: "https://app.test" });
    const key = (await im.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "AA", country: "US", currency: "USD" } })).json().apiKey as string;
    const J = { "x-api-key": key, "content-type": "application/json" };
    const mk = async (slug: string, badge: object | null) => {
      const c = (await im.inject({ method: "POST", url: "/v1/courses", headers: J, payload: { slug, name: slug.toUpperCase() } })).json();
      if (badge) await im.inject({ method: "PATCH", url: `/v1/courses/${c.id}`, headers: J, payload: { badge } });
      return c.id as string;
    };
    const safe = await mk("safe", { platform: "credly", name: "SAFe Agilist", url: "https://www.credly.com/org/aa/badge/safe", imageUrl: "https://images.credly.com/safe.png" });
    const pmp = await mk("pmp", { platform: "accredible", name: "PMP Prep", url: "https://www.credential.net/pmp" });
    await mk("none", null);

    // A learner certified while the course still used Credly.
    const ev = (await im.inject({ method: "POST", url: `/v1/courses/${safe}/cohorts`, headers: J, payload: { name: "Oct", sessions: [{ startsAt: "2099-10-01T14:00:00Z", endsAt: "2099-10-01T22:00:00Z" }] } })).json();
    const tt = (await im.inject({ method: "POST", url: `/v1/events/${ev.id}/ticket-types`, headers: J, payload: { name: "Free", priceMinor: 0, quantity: 5 } })).json();
    await im.inject({ method: "POST", url: "/v1/orders", headers: J, payload: { ticketTypeId: tt.id, quantity: 1, buyerEmail: "ada@x.co" } });
    const [old] = (await im.inject({ method: "POST", url: `/v1/events/${ev.id}/certificates`, headers: J, payload: {} })).json().issued;
    expect((await im.inject(`/public/v1/certificates/${old.verifyCode}`)).json().verifiedBadge).toBeNull();
    expect((await im.inject({ method: "POST", url: `/v1/courses/${safe}/badge/award`, headers: J, payload: {} })).statusCode).toBe(409);

    let overview = (await im.inject({ url: "/v1/badges", headers: J })).json().items;
    expect(overview.find((b: { course: { id: string } }) => b.course.id === safe)).toMatchObject({ verified: false, issued: 0, awaiting: 1 });

    const all = (await im.inject({ method: "POST", url: "/v1/badges/migrate", headers: J, payload: {} })).json().results;
    expect(all).toEqual(expect.arrayContaining([{ courseId: safe, status: "moved" }, { courseId: pmp, status: "no_image", reason: expect.any(String) }]));
    expect(all).toHaveLength(2);
    const moved = (await im.inject({ url: `/v1/courses/${safe}`, headers: J })).json().badge;
    expect(moved).toMatchObject({ platform: "own", name: "SAFe Agilist" });
    expect(moved.imageUrl).toMatch(/^https:\/\/api\.test\/public\/v1\/media\//);
    expect((await im.inject({ method: "POST", url: `/v1/courses/${safe}/badge/migrate`, headers: J, payload: {} })).json().result.status).toBe("already");

    expect((await im.inject({ method: "POST", url: `/v1/courses/${safe}/badge/award`, headers: J, payload: { notify: false } })).json()).toEqual({ awarded: 1 });
    expect((await im.inject({ method: "POST", url: `/v1/courses/${safe}/badge/award`, headers: J, payload: { notify: false } })).json()).toEqual({ awarded: 0 });
    expect((await im.inject(`/public/v1/certificates/${old.verifyCode}`)).json().verifiedBadge).toMatchObject({ name: "SAFe Agilist" });
    expect((await im.inject(`/public/v1/credentials/${old.verifyCode}`)).statusCode).toBe(200);
    overview = (await im.inject({ url: "/v1/badges", headers: J })).json().items;
    expect(overview.find((b: { course: { id: string } }) => b.course.id === safe)).toMatchObject({ verified: true, issued: 1, awaiting: 0 });
  });

  it("uploads the organizer's own badge image, and imports badges, instructors, minimum, meeting link and drafts", async () => {
    const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000201a5a1d2d10000000049454e44ae426082", "hex");
    const fetchImpl = (async (url: string) => (url === "https://cdn.example.com/agile-badge.png" ? new Response(png, { headers: { "content-type": "image/png" } }) : new Response("", { status: 404 }))) as unknown as typeof fetch;
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
    const im = await buildApp({ core, adminKey: "admin", env: "test", fetchImpl, publicUrl: "https://api.test" });
    const key = (await im.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "AA", country: "US", currency: "USD" } })).json().apiKey as string;
    const J = { "x-api-key": key, "content-type": "application/json" };

    // No Credly? Upload your own badge image: it becomes the course's own badge.
    const course = (await im.inject({ method: "POST", url: "/v1/courses", headers: J, payload: { slug: "rte", name: "RTE" } })).json();
    const own = await im.inject({ method: "PUT", url: `/v1/courses/${course.id}/badge-image?name=${encodeURIComponent("RTE Practitioner")}`, headers: { "x-api-key": key, "content-type": "image/png" }, payload: png });
    expect(own.statusCode).toBe(200);
    expect(own.json().badge).toMatchObject({ platform: "own", name: "RTE Practitioner" });
    expect(own.json().badge.imageUrl).toMatch(/^https:\/\/api\.test\/public\/v1\/media\//);
    expect(own.json().badge.url).toBeUndefined();
    // With a Credly badge, the upload only replaces its image.
    await im.inject({ method: "PATCH", url: `/v1/courses/${course.id}`, headers: J, payload: { badge: { platform: "credly", name: "RTE", url: "https://www.credly.com/org/aa/badge/rte" } } });
    const img = (await im.inject({ method: "PUT", url: `/v1/courses/${course.id}/badge-image`, headers: { "x-api-key": key, "content-type": "image/png" }, payload: png })).json();
    expect(img.badge).toMatchObject({ platform: "credly", url: "https://www.credly.com/org/aa/badge/rte" });
    expect((await im.inject({ method: "PATCH", url: `/v1/courses/${course.id}`, headers: J, payload: { badge: { platform: "own", name: "No image" } } })).statusCode).toBe(400);

    const csv = [
      "Event Name,Course,Start Date,Price,Capacity,Minimum,Trainer,Zoom Link,Credly Badge,Badge Image,Certification Body,Status",
      '"PMP Prep - Dec 2099",PMP Prep,2099-12-01 09:00,1495,20,6,"Jane Doe; Ali Khan",https://zoom.us/j/1,https://www.credly.com/org/acme/badge/pmp,,PMI,active',
      '"Agile Taster - Dec 2099",Agile Taster,2099-12-03 13:00,0,40,,Ali Khan,,,https://cdn.example.com/agile-badge.png,,draft',
    ].join("\n");
    const applied = (await im.inject({ method: "POST", url: "/v1/imports/csv", headers: J, payload: { csv, dryRun: false, timezone: "America/Toronto" } })).json();
    expect(applied.results).toEqual([
      expect.objectContaining({ status: "created", badge: "set", instructors: 2, instructorsCreated: ["Jane Doe", "Ali Khan"] }),
      expect.objectContaining({ status: "created", badge: "set", instructors: 1, draft: true }),
    ]);
    expect(applied.results[1].instructorsCreated).toBeUndefined(); // Ali Khan reused
    const pmp = (await im.inject({ url: `/v1/courses/${applied.results[0].courseId}`, headers: J })).json();
    expect(pmp).toMatchObject({ certificationBody: "PMI", badge: { platform: "credly", url: "https://www.credly.com/org/acme/badge/pmp" } });
    const agile = (await im.inject({ url: `/v1/courses/${applied.results[1].courseId}`, headers: J })).json();
    expect(agile.badge).toMatchObject({ platform: "own", name: "Agile Taster" });
    expect(agile.badge.imageUrl).toMatch(/^https:\/\/api\.test\/public\/v1\/media\//);
    const pmpEvent = (await im.inject({ url: `/v1/events/${applied.results[0].eventId}`, headers: J })).json();
    expect(pmpEvent).toMatchObject({ minEnrollment: 6, status: "live", meeting: { provider: "manual", joinUrl: "https://zoom.us/j/1" } });
    expect(pmpEvent.instructorIds).toHaveLength(2);
    expect((await im.inject({ url: `/v1/events/${applied.results[1].eventId}`, headers: J })).json().status).toBe("draft");
  });

  it("copies the Eventbrite event image into the course when importing", async () => {
    const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 1)]);
    const fetchImpl = (async (url: string) => {
      if (url.startsWith("https://img.evbuc.com/")) return new Response(jpg, { headers: { "content-type": "image/jpeg" } });
      if (url.endsWith("/users/me/organizations/")) return new Response(JSON.stringify({ organizations: [{ id: "eb1", name: "AA" }] }));
      expect(url).toContain("expand=ticket_classes%2Clogo");
      return new Response(JSON.stringify({ events: [
        { id: "e1", name: { text: "RTE - Dec 2099" }, logo: { url: "https://img.evbuc.com/small.jpg", original: { url: "https://img.evbuc.com/orig.jpg" } }, start: { timezone: "UTC", utc: "2099-12-03T14:00:00Z" }, end: null, currency: "USD", status: "live", ticket_classes: [{ id: "t", name: "Seat", cost: { currency: "USD", value: 90000 }, quantity_total: 20 }] },
        { id: "e2", name: { text: "RTE - Jan 2100" }, logo: { url: "https://img.evbuc.com/other.jpg" }, start: { timezone: "UTC", utc: "2100-01-03T14:00:00Z" }, end: null, currency: "USD", status: "live", ticket_classes: [{ id: "t", name: "Seat", cost: { currency: "USD", value: 90000 }, quantity_total: 20 }] },
      ], pagination: { has_more_items: false } }));
    }) as unknown as typeof fetch;
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
    const im = await buildApp({ core, adminKey: "admin", env: "test", fetchImpl, publicUrl: "https://api.test" });
    const created = (await im.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "AA", country: "US", currency: "USD" } })).json();
    const h = { "x-api-key": created.apiKey as string, "content-type": "application/json" };
    const res = await im.inject({ method: "POST", url: "/v1/imports/eventbrite", headers: h, payload: { token: "good-token-123", dryRun: false } });
    expect(res.statusCode).toBe(200);
    expect(res.json().plan.items[0].course.imageUrl).toBe("https://img.evbuc.com/orig.jpg");
    expect(res.json().results.map((r: { image: string }) => r.image)).toEqual(["copied", "kept"]);
    const course = (await im.inject({ url: `/v1/courses/${res.json().results[0].courseId}`, headers: h })).json();
    expect(course.imageUrl).toMatch(/^https:\/\/api\.test\/public\/v1\/media\/[a-f0-9]{32}\.jpg$/);
    const served = await im.inject(new URL(course.imageUrl).pathname);
    expect(served.rawPayload.equals(jpg)).toBe(true);
  });
});

describe("turnstile", () => {
  it("checkout: EnrollClass's own pages need a token, organizers' websites do not, 'always' means everyone", async () => {
    const seen: (string | undefined)[] = [];
    const turnstile = { orders: "own-pages" as "own-pages" | "always", verify: async (t: string | undefined) => { seen.push(t); return t === "good"; } };
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
    const im = await buildApp({ core, adminKey: "admin", env: "test", publicUrl: "https://api.enrollclass.test", webUrl: "https://app.enrollclass.test", turnstile });
    const created = (await im.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "AA", country: "US", currency: "USD" } })).json();
    const J = { "x-api-key": created.apiKey as string, "content-type": "application/json" };
    const orgId = created.organization.id as string;
    const course = (await im.inject({ method: "POST", url: "/v1/courses", headers: J, payload: { slug: "safe", name: "SAFe" } })).json();
    const ev = (await im.inject({ method: "POST", url: `/v1/courses/${course.id}/cohorts`, headers: J, payload: { name: "Nov", sessions: [{ startsAt: "2099-11-20T14:00:00Z", endsAt: "2099-11-20T22:00:00Z" }] } })).json();
    const tt = (await im.inject({ method: "POST", url: `/v1/events/${ev.id}/ticket-types`, headers: J, payload: { name: "Seat", priceMinor: 0, quantity: 50 } })).json();
    let n = 0;
    const order = (headers: Record<string, string>, body: object = {}) => {
      const email = `learner${++n}@example.com`;
      return im.inject({ method: "POST", url: `/public/v1/organizations/${orgId}/orders`, headers: { ...headers, "content-type": "application/json" }, payload: { ticketTypeId: tt.id, quantity: 1, buyerEmail: email, attendees: [{ email }], ...body } });
    };
    const own = { origin: "https://app.enrollclass.test" };
    const bare = { referer: "https://enrollclass.test/classes" };
    const theirs = { origin: "https://training.example.com" };

    // Price previews never need a token, not even from our own pages.
    expect([200, 201]).toContain((await order(own, { dryRun: true })).statusCode);
    const refused = await order(own);
    expect(refused.statusCode).toBe(400);
    expect(JSON.stringify(refused.json())).toContain("confirm you're not a robot");
    expect((await order(bare)).statusCode).toBe(400);
    expect((await order(own, { turnstileToken: "forged" })).statusCode).toBe(400);
    expect((await order(own, { turnstileToken: "good" })).statusCode).toBe(201);
    // The widget on an organizer's website: no token needed, but one that is sent is still checked.
    expect((await order(theirs)).statusCode).toBe(201);
    expect((await order(theirs, { turnstileToken: "forged" })).statusCode).toBe(400);
    expect((await order({})).statusCode).toBe(201);
    turnstile.orders = "always";
    expect((await order(theirs)).statusCode).toBe(400);
    expect((await order({})).statusCode).toBe(400);
    expect((await order(theirs, { turnstileToken: "good" })).statusCode).toBe(201);
    expect(seen).toEqual([undefined, undefined, "forged", "good", "forged", undefined, undefined, "good"]);
  });
});
