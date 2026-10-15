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
});
