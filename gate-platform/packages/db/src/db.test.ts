import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Ledger } from "@gate/ledger";
import { Core, FakePaymentsAdapter, codes } from "@gate/core";
import { createPool, type Pool } from "./pool.js";
import { migrate } from "./migrate.js";
import { PostgresLedgerStore } from "./pg-ledger-store.js";
import { createPgRepos } from "./pg-repos.js";

const url = process.env.DATABASE_URL;

describe.skipIf(!url)("Postgres integration", () => {
  let pool: Pool;
  beforeAll(async () => {
    pool = createPool(url!);
    await pool.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
    const ran = await migrate(pool);
    expect(ran).toContain("0001_init.sql");
    expect(await migrate(pool)).toEqual([]);
  });
  afterAll(async () => { await pool?.end(); });

  it("ledger store: idempotent posts, balances, DB-enforced balance and append-only", async () => {
    const store = new PostgresLedgerStore(pool);
    const ledger = new Ledger({ store });
    const a = await ledger.createAccount({ code: "t:a", name: "A", type: "asset", currency: "USD", tenantId: "t" });
    const b = await ledger.createAccount({ code: "t:b", name: "B", type: "liability", currency: "USD", tenantId: "t" });
    const first = await ledger.post({ idempotencyKey: "k1", currency: "USD", description: "x", postings: [{ accountId: a.id, amount: 1_000 }, { accountId: b.id, amount: -1_000 }] });
    const again = await ledger.post({ idempotencyKey: "k1", currency: "USD", description: "x", postings: [{ accountId: a.id, amount: 1_000 }, { accountId: b.id, amount: -1_000 }] });
    expect(again.created).toBe(false);
    expect(again.entry.id).toBe(first.entry.id);
    expect((await ledger.balance(a.id)).natural).toBe(1_000);
    expect((await ledger.balance(b.id)).natural).toBe(1_000);
    expect((await ledger.listEntries({ accountId: a.id }))[0]?.postings).toHaveLength(2);

    // Bypass the application layer: the database itself refuses an unbalanced entry...
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`INSERT INTO ledger_entries (id, idempotency_key, currency, description, effective_at) VALUES ('bad','bad','USD','bad',now())`);
      await client.query(`INSERT INTO ledger_postings (entry_id, account_id, amount) VALUES ('bad',$1, 5), ('bad',$2,-4)`, [a.id, b.id]);
      await expect(client.query("COMMIT")).rejects.toThrow(/unbalanced/);
    } finally {
      await client.query("ROLLBACK").catch(() => undefined);
      client.release();
    }
    expect((await pool.query(`SELECT count(*)::int AS n FROM ledger_entries WHERE id = 'bad'`)).rows[0].n).toBe(0);
    // ...and refuses to mutate history.
    await expect(pool.query(`DELETE FROM ledger_postings WHERE entry_id = $1`, [first.entry.id])).rejects.toThrow(/append-only/);
    await expect(pool.query(`UPDATE ledger_entries SET description = 'edited' WHERE id = $1`, [first.entry.id])).rejects.toThrow(/append-only/);
    await ledger.assertBalanced();
  });

  it("core on Postgres: checkout, payment, split, refund", async () => {
    const payments = new FakePaymentsAdapter();
    const ledger = new Ledger({ store: new PostgresLedgerStore(pool) });
    const core = new Core({ repos: createPgRepos(pool), ledger, payments });
    const { organization: org, apiKey } = await core.createOrganization({ name: "PG Org", country: "US", currency: "USD" });
    expect((await core.authenticate(apiKey)).id).toBe(org.id);
    await core.connectPayments(org.id);
    const venue = await core.createParty(org.id, { name: "Hall", kind: "venue", paymentsAccountRef: "acct_hall" });
    const event = await core.createEvent(org.id, { name: "Conf", startsAt: new Date("2026-12-01T10:00:00Z"), splitRules: [{ partyId: venue.id, kind: "percent", bps: 1_000 }] });
    const tt = await core.createTicketType(org.id, event.id, { name: "GA", priceMinor: 5_000, quantity: 3 });

    const { order } = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 2, buyerEmail: "pg@test.io", idempotencyKey: "pg-1" });
    const dup = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 2, buyerEmail: "pg@test.io", idempotencyKey: "pg-1" });
    expect(dup.created).toBe(false);
    await expect(core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 2, buyerEmail: "pg@test.io" })).rejects.toMatchObject({ code: "SOLD_OUT" });

    const evt = payments.succeed(order.paymentRef!, order.pricing.totalMinor, "USD");
    expect((await core.handlePaymentEvent(evt)).handled).toBe(true);
    expect((await core.handlePaymentEvent(evt)).reason).toBe("duplicate");
    const paid = await core.getOrder(org.id, order.id);
    expect(paid.status).toBe("paid");
    expect(Object.keys(paid.transferRefs)).toHaveLength(2);

    const bal = await core.balancesFor(org.id);
    expect(bal.find((b) => b.code === codes.orgPayable(org.id, "USD"))?.balanceMinor).toBe(order.splits.organizerMinor);
    expect(bal.find((b) => b.code === codes.partyPayable(venue.id, "USD"))?.balanceMinor).toBe(order.splits.lines[0]!.amountMinor);

    const refund = await core.refundOrder(org.id, { orderId: order.id, reason: "test" });
    expect(refund.status).toBe("succeeded");
    expect((await core.getOrder(org.id, order.id)).status).toBe("refunded");
    expect((await core.platformBalances()).find((b) => b.code === codes.clearing("USD"))?.balanceMinor).toBe(0);
    await ledger.assertBalanced();
  });

  it("reserve is atomic under concurrency", async () => {
    const repos = createPgRepos(pool);
    const ledger = new Ledger({ store: new PostgresLedgerStore(pool) });
    const core = new Core({ repos, ledger, payments: new FakePaymentsAdapter() });
    const { organization: org } = await core.createOrganization({ name: "Race", country: "US", currency: "USD" });
    const event = await core.createEvent(org.id, { name: "Race", startsAt: new Date() });
    const tt = await core.createTicketType(org.id, event.id, { name: "Only5", priceMinor: 100, quantity: 5 });
    const results = await Promise.allSettled(Array.from({ length: 20 }, () => core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 1, buyerEmail: "r@t.io" })));
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const reasons = results.filter((r): r is PromiseRejectedResult => r.status === "rejected").map((r) => `${(r.reason as { code?: string }).code}:${(r.reason as Error).message}`);
    expect(reasons.filter((r) => !r.startsWith("SOLD_OUT")), "unexpected failures").toEqual([]);
    expect(ok).toBe(5);
    expect((await repos.ticketTypes.get(tt.id))?.sold).toBe(5);
  });
});
