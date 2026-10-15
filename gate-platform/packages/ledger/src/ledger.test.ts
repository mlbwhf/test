import { describe, expect, it, beforeEach } from "vitest";
import fc from "fast-check";
import { Ledger, LedgerError } from "./ledger.js";
import { InMemoryLedgerStore } from "./memory-store.js";
import type { Account } from "./types.js";

let ledger: Ledger;
let cash: Account;
let payable: Account;
let revenue: Account;

beforeEach(async () => {
  ledger = new Ledger({ store: new InMemoryLedgerStore(), now: () => new Date("2026-01-01T00:00:00Z") });
  cash = await ledger.createAccount({ code: "platform:clearing", name: "Clearing", type: "asset", currency: "USD", tenantId: "platform" });
  payable = await ledger.createAccount({ code: "org:1:payable", name: "Org payable", type: "liability", currency: "USD", tenantId: "org_1" });
  revenue = await ledger.createAccount({ code: "platform:revenue", name: "Fees", type: "revenue", currency: "USD", tenantId: "platform" });
});

describe("Ledger.post", () => {
  it("posts a balanced entry and updates natural balances", async () => {
    const res = await ledger.post({
      idempotencyKey: "order_1:paid",
      currency: "USD",
      description: "Ticket sale",
      postings: [
        { accountId: cash.id, amount: 10_000 },
        { accountId: payable.id, amount: -9_700 },
        { accountId: revenue.id, amount: -300 },
      ],
    });
    expect(res.created).toBe(true);
    expect((await ledger.balance(cash.id)).natural).toBe(10_000);
    expect((await ledger.balance(payable.id)).natural).toBe(9_700);
    expect((await ledger.balance(revenue.id)).natural).toBe(300);
    await ledger.assertBalanced();
  });

  it("rejects unbalanced entries", async () => {
    await expect(
      ledger.post({
        idempotencyKey: "x",
        currency: "USD",
        description: "bad",
        postings: [
          { accountId: cash.id, amount: 100 },
          { accountId: payable.id, amount: -99 },
        ],
      }),
    ).rejects.toMatchObject({ code: "UNBALANCED" } satisfies Partial<LedgerError>);
  });

  it("rejects currency mismatch, zero postings, unknown accounts", async () => {
    const eur = await ledger.createAccount({ code: "eur", name: "EUR", type: "asset", currency: "EUR", tenantId: "platform" });
    await expect(
      ledger.post({ idempotencyKey: "a", currency: "USD", description: "", postings: [{ accountId: cash.id, amount: 1 }, { accountId: eur.id, amount: -1 }] }),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
    await expect(
      ledger.post({ idempotencyKey: "b", currency: "USD", description: "", postings: [{ accountId: cash.id, amount: 0 }, { accountId: payable.id, amount: 0 }] }),
    ).rejects.toMatchObject({ code: "ZERO_POSTING" });
    await expect(
      ledger.post({ idempotencyKey: "c", currency: "USD", description: "", postings: [{ accountId: "nope", amount: 1 }, { accountId: payable.id, amount: -1 }] }),
    ).rejects.toMatchObject({ code: "UNKNOWN_ACCOUNT" });
  });

  it("is idempotent on key and rejects a reused key with a different body", async () => {
    const body = {
      idempotencyKey: "order_2:paid",
      currency: "USD",
      description: "sale",
      postings: [
        { accountId: cash.id, amount: 500 },
        { accountId: payable.id, amount: -500 },
      ],
    };
    const first = await ledger.post(body);
    const second = await ledger.post(body);
    expect(second.created).toBe(false);
    expect(second.entry.id).toBe(first.entry.id);
    expect((await ledger.balance(cash.id)).signed).toBe(500);
    await expect(
      ledger.post({ ...body, postings: [{ accountId: cash.id, amount: 600 }, { accountId: payable.id, amount: -600 }] }),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });

  it("ensureAccount is a no-op for existing codes", async () => {
    const again = await ledger.ensureAccount({ code: "platform:clearing", name: "x", type: "asset", currency: "USD", tenantId: "platform" });
    expect(again.id).toBe(cash.id);
    await expect(
      ledger.ensureAccount({ code: "platform:clearing", name: "x", type: "asset", currency: "EUR", tenantId: "platform" }),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
  });

  it("property: any sequence of balanced entries keeps the ledger balanced", async () => {
    const accounts = [cash, payable, revenue];
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            from: fc.integer({ min: 0, max: 2 }),
            to: fc.integer({ min: 0, max: 2 }),
            amount: fc.integer({ min: 1, max: 1_000_000 }),
          }).filter((t) => t.from !== t.to),
          { maxLength: 50 },
        ),
        async (transfers) => {
          for (const [i, t] of transfers.entries()) {
            await ledger.post({
              idempotencyKey: `p:${i}:${t.from}:${t.to}:${t.amount}:${Math.random()}`,
              currency: "USD",
              description: "prop",
              postings: [
                { accountId: accounts[t.from]!.id, amount: t.amount },
                { accountId: accounts[t.to]!.id, amount: -t.amount },
              ],
            });
          }
          await ledger.assertBalanced();
        },
      ),
      { numRuns: 30 },
    );
  });
});
