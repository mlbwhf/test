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
    expect((await app.inject({ url: `/v1/orders/${order.id}`, headers: H() })).json().status).toBe("paid");

    const bal = (await app.inject({ url: "/v1/ledger/balances", headers: H() })).json().accounts;
    expect(bal.find((a: { code: string }) => a.code.endsWith(":payable:USD")).balanceMinor).toBe(199_000);
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
});
