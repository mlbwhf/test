import { describe, expect, it } from "vitest";
import { HubSpotCrm, HubSpotError, formatAmountMajor, splitName } from "./hubspot.js";

interface Recorded {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: any;
}

type Responder = (req: Recorded) => { status: number; body?: unknown } | undefined;

function fakeFetch(responder: Responder): { fetch: typeof fetch; requests: Recorded[] } {
  const requests: Recorded[] = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const rec: Recorded = {
      method: init?.method ?? "GET",
      path: url.pathname,
      headers: { ...((init?.headers as Record<string, string>) ?? {}) },
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    requests.push(rec);
    const out = responder(rec) ?? { status: 404, body: { message: "no handler" } };
    return new Response(out.body === undefined ? null : JSON.stringify(out.body), {
      status: out.status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return { fetch: fetchImpl, requests };
}

const TOKEN = "pat-na1-secret-token";

describe("helpers", () => {
  it("splitName splits on the first space", () => {
    expect(splitName("Ada Lovelace")).toEqual({ firstName: "Ada", lastName: "Lovelace" });
    expect(splitName("  Ada   King Lovelace ")).toEqual({ firstName: "Ada", lastName: "King Lovelace" });
    expect(splitName("Ada")).toEqual({ firstName: "Ada" });
    expect(splitName(undefined)).toEqual({});
    expect(splitName("   ")).toEqual({});
  });

  it("formatAmountMajor renders minor units with 2 decimals", () => {
    expect(formatAmountMajor(129900)).toBe("1299.00");
    expect(formatAmountMajor(5)).toBe("0.05");
    expect(formatAmountMajor(0)).toBe("0.00");
    expect(formatAmountMajor(-1050)).toBe("-10.50");
  });
});

describe("HubSpotCrm.upsertContact", () => {
  it("creates on first call, then patches only changed properties", async () => {
    const store = new Map<string, Record<string, string>>();
    const { fetch, requests } = fakeFetch((req) => {
      if (req.method === "POST" && req.path === "/crm/v3/objects/contacts/search") {
        const email = req.body.filterGroups[0].filters[0].value as string;
        const found = [...store.entries()].find(([, p]) => p["email"] === email);
        return { status: 200, body: { total: found ? 1 : 0, results: found ? [{ id: found[0], properties: found[1] }] : [] } };
      }
      if (req.method === "POST" && req.path === "/crm/v3/objects/contacts") {
        store.set("101", { ...req.body.properties });
        return { status: 201, body: { id: "101", properties: req.body.properties } };
      }
      if (req.method === "PATCH" && req.path === "/crm/v3/objects/contacts/101") {
        store.set("101", { ...store.get("101"), ...req.body.properties });
        return { status: 200, body: { id: "101", properties: store.get("101") } };
      }
      return undefined;
    });

    const crm = new HubSpotCrm({ accessToken: TOKEN, fetch, sleep: async () => {} });

    const first = await crm.upsertContact({ email: "ada@example.com", firstName: "Ada", lastName: "Lovelace", properties: { gate_last_course: "Maths" } });
    expect(first).toEqual({ id: "101", created: true });
    expect(requests.map((r) => `${r.method} ${r.path}`)).toEqual(["POST /crm/v3/objects/contacts/search", "POST /crm/v3/objects/contacts"]);
    expect(requests[0]!.body.filterGroups[0].filters[0]).toEqual({ propertyName: "email", operator: "EQ", value: "ada@example.com" });
    expect(requests[1]!.body.properties).toEqual({ email: "ada@example.com", firstname: "Ada", lastname: "Lovelace", gate_last_course: "Maths" });
    expect(requests[1]!.headers["Authorization"]).toBe(`Bearer ${TOKEN}`);

    requests.length = 0;
    const second = await crm.upsertContact({ email: "ada@example.com", firstName: "Ada", lastName: "Lovelace", company: "Analytical Engines", properties: { gate_last_course: "Physics" } });
    expect(second).toEqual({ id: "101", created: false });
    expect(requests.map((r) => `${r.method} ${r.path}`)).toEqual(["POST /crm/v3/objects/contacts/search", "PATCH /crm/v3/objects/contacts/101"]);
    // Only the changed properties are sent.
    expect(requests[1]!.body.properties).toEqual({ company: "Analytical Engines", gate_last_course: "Physics" });

    requests.length = 0;
    const third = await crm.upsertContact({ email: "ada@example.com", firstName: "Ada" });
    expect(third).toEqual({ id: "101", created: false });
    // Nothing changed: no PATCH issued.
    expect(requests.map((r) => `${r.method} ${r.path}`)).toEqual(["POST /crm/v3/objects/contacts/search"]);
  });
});

describe("HubSpotCrm.upsertDeal", () => {
  it("creates a deal with mapped stage, formatted amount and a contact association", async () => {
    const { fetch, requests } = fakeFetch((req) => {
      if (req.path === "/crm/v3/objects/deals/search") return { status: 200, body: { total: 0, results: [] } };
      if (req.path === "/crm/v3/objects/contacts/search") return { status: 200, body: { total: 1, results: [{ id: "77", properties: { email: "buyer@example.com" } }] } };
      if (req.method === "POST" && req.path === "/crm/v3/objects/deals") return { status: 201, body: { id: "9001" } };
      return undefined;
    });
    const crm = new HubSpotCrm({ accessToken: TOKEN, fetch, sleep: async () => {}, pipeline: "training", stageMap: { paid: "123456" } });

    const closeDate = new Date("2026-10-15T12:00:00.000Z");
    const result = await crm.upsertDeal({
      externalId: "ord_1",
      name: "Maths — Autumn — buyer@example.com",
      amountMinor: 129900,
      currency: "gbp",
      stage: "paid",
      closeDate,
      contactEmail: "buyer@example.com",
      properties: { gate_course: "Maths" },
    });
    expect(result).toEqual({ id: "9001", created: true });
    expect(requests.map((r) => `${r.method} ${r.path}`)).toEqual([
      "POST /crm/v3/objects/deals/search",
      "POST /crm/v3/objects/contacts/search",
      "POST /crm/v3/objects/deals",
    ]);
    expect(requests[0]!.body.filterGroups[0].filters[0]).toEqual({ propertyName: "gate_order_id", operator: "EQ", value: "ord_1" });
    const create = requests[2]!.body;
    expect(create.properties).toEqual({
      dealname: "Maths — Autumn — buyer@example.com",
      amount: "1299.00",
      deal_currency_code: "GBP",
      dealstage: "123456",
      pipeline: "training",
      closedate: "2026-10-15T12:00:00.000Z",
      gate_order_id: "ord_1",
      gate_course: "Maths",
    });
    expect(create.associations).toEqual([
      { to: { id: "77" }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }] },
    ]);
  });

  it("patches an existing deal without re-associating", async () => {
    const { fetch, requests } = fakeFetch((req) => {
      if (req.path === "/crm/v3/objects/deals/search") {
        return { status: 200, body: { total: 1, results: [{ id: "9001", properties: { dealname: "x", dealstage: "closedwon", gate_order_id: "ord_1", amount: "10.00" } }] } };
      }
      if (req.method === "PATCH" && req.path === "/crm/v3/objects/deals/9001") return { status: 200, body: { id: "9001" } };
      return undefined;
    });
    const crm = new HubSpotCrm({ accessToken: TOKEN, fetch, sleep: async () => {} });
    const result = await crm.upsertDeal({ externalId: "ord_1", name: "x", amountMinor: 1000, currency: "GBP", stage: "refunded", contactEmail: "buyer@example.com" });
    expect(result).toEqual({ id: "9001", created: false });
    expect(requests.map((r) => `${r.method} ${r.path}`)).toEqual(["POST /crm/v3/objects/deals/search", "PATCH /crm/v3/objects/deals/9001"]);
    expect(requests[1]!.body.properties).toEqual({ deal_currency_code: "GBP", dealstage: "closedlost", pipeline: "default" });
    expect(requests[1]!.body.associations).toBeUndefined();
  });
});

describe("HubSpotCrm errors and retries", () => {
  it("retries a 429 with exponential backoff and then succeeds", async () => {
    let searches = 0;
    const { fetch, requests } = fakeFetch((req) => {
      if (req.path === "/crm/v3/objects/contacts/search") {
        searches++;
        if (searches < 3) return { status: 429, body: { message: "Rate limited" } };
        return { status: 200, body: { total: 1, results: [{ id: "5", properties: { email: "a@b.c" } }] } };
      }
      return undefined;
    });
    const sleeps: number[] = [];
    const crm = new HubSpotCrm({ accessToken: TOKEN, fetch, sleep: async (ms) => { sleeps.push(ms); } });
    const result = await crm.upsertContact({ email: "a@b.c" });
    expect(result).toEqual({ id: "5", created: false });
    expect(requests).toHaveLength(3);
    expect(sleeps).toEqual([100, 200]);
  });

  it("gives up after 3 attempts on persistent 5xx", async () => {
    const { fetch, requests } = fakeFetch(() => ({ status: 503, body: { message: "down" } }));
    const sleeps: number[] = [];
    const crm = new HubSpotCrm({ accessToken: TOKEN, fetch, sleep: async (ms) => { sleeps.push(ms); } });
    await expect(crm.upsertContact({ email: "a@b.c" })).rejects.toMatchObject({ name: "HubSpotError", status: 503, retryable: true });
    expect(requests).toHaveLength(3);
    expect(sleeps).toEqual([100, 200]);
  });

  it("throws HubSpotError with status and message on a non-retryable 400 without retrying", async () => {
    const { fetch, requests } = fakeFetch(() => ({ status: 400, body: { status: "error", message: "Property values were not valid", category: "VALIDATION_ERROR" } }));
    const crm = new HubSpotCrm({ accessToken: TOKEN, fetch, sleep: async () => { throw new Error("should not sleep"); } });
    let caught: unknown;
    try {
      await crm.upsertContact({ email: "a@b.c" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(HubSpotError);
    const err = caught as HubSpotError;
    expect(err.status).toBe(400);
    expect(err.retryable).toBe(false);
    expect(err.message).toContain("400");
    expect(err.message).toContain("Property values were not valid");
    expect(err.message).not.toContain(TOKEN);
    expect(JSON.stringify(err.body)).not.toContain(TOKEN);
    expect(requests).toHaveLength(1);
  });
});
