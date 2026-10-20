import { describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";
import { Integrations, createInMemoryIntegrationRepos, signWebhook, verifyWebhookSignature } from "./integrations.js";

let n = 0;
const ids = { next: (p: string) => `${p}_${++n}` };
const clock = { now: () => new Date("2026-10-20T12:00:00Z") };
const settle = () => new Promise((r) => setTimeout(r, 20));

describe("integrations", () => {
  it("API keys: shown once, hashed, read or full, revocable", async () => {
    const ints = new Integrations(createInMemoryIntegrationRepos(), clock, ids);
    const { key, secret } = await ints.createApiKey("org_1", { name: " Zapier ", access: "read" });
    expect(secret).toMatch(/^eck_/);
    expect(key).toMatchObject({ name: "Zapier", access: "read", prefix: secret.slice(0, 10) });
    expect(JSON.stringify(key)).not.toContain(secret);
    expect((await ints.authenticateKey(secret))?.id).toBe(key.id);
    expect(await ints.authenticateKey("eck_wrong")).toBeUndefined();
    await ints.revokeApiKey("org_1", key.id);
    expect(await ints.authenticateKey(secret)).toBeUndefined();
    await expect(ints.revokeApiKey("org_2", key.id)).rejects.toThrow(/not found/);
    await expect(ints.createApiKey("org_1", { name: "", access: "full" })).rejects.toThrow(/name/);
  });

  it("webhooks: signed deliveries for subscribed events, retries until success, private URLs refused", async () => {
    const calls: Array<{ url: string; body: string; sig: string; type: string }> = [];
    let fail = 1;
    const fetchImpl = (async (url: string, init: RequestInit) => {
      const h = init.headers as Record<string, string>;
      calls.push({ url, body: String(init.body), sig: h["enrollclass-signature"]!, type: h["enrollclass-event"]! });
      if (fail-- > 0) return new Response("nope", { status: 500 });
      return new Response("ok", { status: 200 });
    }) as unknown as typeof fetch;
    const repos = createInMemoryIntegrationRepos();
    const ints = new Integrations(repos, clock, ids, { fetch: fetchImpl, retryDelaysMs: [1, 1] });
    await expect(ints.createWebhook("org_1", { url: "http://hooks.example.com/x", events: ["order.paid"] })).rejects.toThrow(/https/);
    await expect(ints.createWebhook("org_1", { url: "https://localhost/x", events: ["order.paid"] })).rejects.toThrow(/public/);
    await expect(ints.createWebhook("org_1", { url: "https://hooks.example.com/x", events: ["order.lost"] })).rejects.toThrow(/unknown event/);
    const hook = await ints.createWebhook("org_1", { url: "https://hooks.zapier.com/hooks/catch/1/abc", events: ["order.paid", "checkin.created"] });
    expect(hook.secret).toMatch(/^whsec_/);

    const payments = new FakePaymentsAdapter();
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments, clock, hooks: [ints.hooks()] });
    const { organization: org } = await core.createOrganization({ name: "A", country: "CA", currency: "CAD" });
    await core.connectPayments(org.id);
    const own = await ints.createWebhook(org.id, { url: "https://hooks.example.com/in", events: ["order.paid", "event.created"] });
    const ev = await core.createEvent(org.id, { name: "Class", startsAt: new Date("2026-11-02T14:00:00Z") });
    const tt = await core.createTicketType(org.id, ev.id, { name: "Seat", priceMinor: 1000, quantity: 5 });
    const { order } = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 1, buyerEmail: "a@x.co" });
    await core.handlePaymentEvent(payments.succeed(order.paymentRef!, order.pricing.totalMinor, "CAD"));
    await settle();

    const mine = calls.filter((c) => c.url === "https://hooks.example.com/in");
    // The first event.created fails once and is retried; order.paid may land in between.
    expect(mine.map((c) => c.type).sort()).toEqual(["event.created", "event.created", "order.paid"]);
    const paidCall = mine.find((c) => c.type === "order.paid")!;
    const paid = JSON.parse(paidCall.body);
    expect(paid).toMatchObject({ type: "order.paid", organizationId: org.id, data: { order: { id: order.id, status: "paid" }, event: { id: ev.id } } });
    expect(verifyWebhookSignature(own.secret, paidCall.body, paidCall.sig, Math.floor(clock.now().getTime() / 1000))).toBe(true);
    expect(verifyWebhookSignature(own.secret, paidCall.body + " ", paidCall.sig, Math.floor(clock.now().getTime() / 1000))).toBe(false);
    const log = await ints.listDeliveries(org.id, own.id);
    expect(log.find((d) => d.type === "event.created")).toMatchObject({ status: "succeeded", attempts: 2 });
    expect(calls.some((c) => c.url.includes("zapier"))).toBe(false);

    await ints.updateWebhook(org.id, own.id, { enabled: false });
    const before = calls.length;
    await core.createEvent(org.id, { name: "Another", startsAt: new Date("2026-11-03T14:00:00Z") });
    await settle();
    expect(calls.length).toBe(before);
    expect((await ints.testWebhook(org.id, own.id)).status).toBe("succeeded");
  });

  it("signatures expire", () => {
    const sig = signWebhook("s", "{}", 1000);
    expect(verifyWebhookSignature("s", "{}", sig, 1100)).toBe(true);
    expect(verifyWebhookSignature("s", "{}", sig, 2000)).toBe(false);
  });
});
