import { describe, expect, it } from "vitest";
import { GateClient } from "./client.js";
import { tools } from "./tools.js";

function fakeApi(routes: Record<string, (body?: unknown) => { status?: number; json: unknown }>) {
  const calls: Array<{ method: string; path: string; body?: unknown }> = [];
  const f = (async (url: string, init: { method: string; body?: string }) => {
    const path = url.replace("http://api", "");
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method: init.method, path, ...(body !== undefined ? { body } : {}) });
    const handler = routes[`${init.method} ${path}`];
    if (!handler) return { ok: false, status: 404, text: async () => JSON.stringify({ error: { code: "NOT_FOUND", message: `no route ${path}` } }) };
    const r = handler(body);
    return { ok: (r.status ?? 200) < 400, status: r.status ?? 200, text: async () => JSON.stringify(r.json) };
  }) as unknown as typeof fetch;
  return { client: new GateClient({ baseUrl: "http://api", apiKey: "k", fetch: f }), calls };
}
const tool = (name: string) => tools.find((t) => t.name === name)!;

describe("MCP tools", () => {
  it("get_cash_position sums balances per currency", async () => {
    const { client } = fakeApi({ "GET /v1/ledger/balances": () => ({ json: { accounts: [{ code: "a", name: "A", type: "liability", currency: "USD", balanceMinor: 100 }, { code: "b", name: "B", type: "liability", currency: "USD", balanceMinor: 50 }, { code: "c", name: "C", type: "liability", currency: "EUR", balanceMinor: 7 }] } }) });
    const r = (await tool("get_cash_position").run(client, {})) as { totalPayableByCurrency: Record<string, number> };
    expect(r.totalPayableByCurrency).toEqual({ USD: 150, EUR: 7 });
  });

  it("propose_refund never calls the refund endpoint", async () => {
    const { client, calls } = fakeApi({ "GET /v1/orders/ord_1": () => ({ json: { id: "ord_1", status: "paid", currency: "USD", pricing: { totalMinor: 10_000 }, refundedMinor: 2_000 } }) });
    const r = (await tool("propose_refund").run(client, { orderId: "ord_1", reason: "duplicate purchase" })) as { ok: boolean; requires_approval: boolean; proposal: { amountMinor: number }; approve_by_calling: { path: string } };
    expect(r.ok).toBe(true);
    expect(r.requires_approval).toBe(true);
    expect(r.proposal.amountMinor).toBe(8_000);
    expect(r.approve_by_calling.path).toBe("/v1/refunds");
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual(["GET /v1/orders/ord_1"]);
    const over = (await tool("propose_refund").run(client, { orderId: "ord_1", amountMinor: 9_000, reason: "x" })) as { ok: boolean; reason: string };
    expect(over.ok).toBe(false);
    expect(over.reason).toContain("exceeds");
  });

  it("quote_order uses the dry-run endpoint and surfaces API errors", async () => {
    const { client, calls } = fakeApi({ "POST /v1/orders?dry_run=true": (b) => ({ json: { order: { pricing: { totalMinor: 123 } }, dryRun: true, echo: b } }) });
    const r = (await tool("quote_order").run(client, { ticketTypeId: "tt", quantity: 1, buyerEmail: "a@b.co" })) as { dryRun: boolean };
    expect(r.dryRun).toBe(true);
    expect(calls[0]!.body).toEqual({ ticketTypeId: "tt", quantity: 1, buyerEmail: "a@b.co" });
    await expect(tool("list_ticket_types").run(client, { eventId: "nope" })).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("every tool has a description and a zod input shape", () => {
    for (const t of tools) {
      expect(t.description.length).toBeGreaterThan(20);
      expect(typeof t.input).toBe("object");
    }
    expect(tools.map((t) => t.name)).toContain("propose_refund");
  });
});
