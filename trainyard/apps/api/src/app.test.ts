import { describe, expect, it } from "vitest";
import type { PushChange, TrackerConnector } from "@trainyard/connectors";
import type { WorkItem } from "@trainyard/core";
import { buildApp } from "./app.js";
import { Store } from "./store.js";

async function setup(opts: { apiKey?: string } = {}) {
  const store = new Store();
  const app = await buildApp({ store, ...opts });
  const call = async (method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", url: string, payload?: unknown) => {
    const res = await app.inject({ method, url, ...(payload !== undefined ? { payload: payload as object } : {}), headers: opts.apiKey ? { authorization: `Bearer ${opts.apiKey}` } : {} });
    return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : undefined };
  };
  return { app, store, call };
}

describe("operating model", () => {
  it("lists templates and serves the current model without issues", async () => {
    const { call } = await setup();
    const t = await call("GET", "/v1/templates");
    expect(t.body.templates.map((m: { id: string }) => m.id)).toContain("safe-ai-native");
    const m = await call("GET", "/v1/model");
    expect(m.body.model.id).toBe("safe-ai-native");
    expect(m.body.issues).toEqual([]);
  });

  it("rejects an invalid model with readable issues and accepts a fork", async () => {
    const { call } = await setup();
    const { body } = await call("GET", "/v1/model");
    const bad = await call("PUT", "/v1/model", { ...body.model, cadence: { ...body.model.cadence, iterationWeeks: 12 } });
    expect(bad.status).toBe(422);
    expect(bad.body.error.details[0].path).toBe("cadence.iterationWeeks");
    const fork = await call("POST", "/v1/model/fork", { templateId: "less", name: "Our LeSS" });
    expect(fork.body.model).toMatchObject({ name: "Our LeSS", basedOn: "less" });
    expect((await call("POST", "/v1/model/fork", { templateId: "nope", name: "x" })).status).toBe(404);
  });
});

describe("board", () => {
  it("returns the current PI with load, dependency checks and readiness", async () => {
    const { call } = await setup();
    const { status, body } = await call("GET", "/v1/board");
    expect(status).toBe(200);
    expect(body.increment.id).toBe("pi-26-4");
    expect(body.plannedLevel).toBe("feature");
    expect(body.items.length).toBe(14);
    expect(body.load).toHaveLength(4 * 7);
    expect(body.dependencyChecks.some((c: { severity: string }) => c.severity === "critical")).toBe(true);
  });

  it("moves a tracked item and queues it for sync with its original value", async () => {
    const { call, store } = await setup();
    const res = await call("PATCH", "/v1/items/f-1", { iterationId: "pi-26-4.5" });
    expect(res.status).toBe(200);
    expect(res.body.pendingSync).toEqual(["iterationId"]);
    expect(store.state.pending[0]).toMatchObject({ itemId: "f-1", fields: ["iterationId"], base: { iterationId: "pi-26-4.1" } });
    expect((await call("PATCH", "/v1/items/f-1", { iterationId: "nope" })).status).toBe(404);
    expect((await call("PATCH", "/v1/items/f-1", { teamId: "t-payments" })).body.error.code).toBe("TEAM_OWNED_BY_TRACKER");
  });

  it("creates dependencies and ROAMs risks", async () => {
    const { call } = await setup();
    const dep = await call("POST", "/v1/dependencies", { providerId: "f-13", consumerId: "f-1" });
    expect(dep.status).toBe(201);
    expect(dep.body.check.severity).toBe("critical");
    expect((await call("POST", "/v1/dependencies", { providerId: "f-1", consumerId: "f-1" })).status).toBe(422);
    expect((await call("DELETE", `/v1/dependencies/${dep.body.dependency.id}`)).status).toBe(204);
    const risk = await call("PATCH", "/v1/risks/r-3", { roam: "owned", ownerId: "p-steward" });
    expect(risk.body.risk).toMatchObject({ roam: "owned", ownerId: "p-steward" });
  });
});

describe("dashboards", () => {
  it("runs both default dashboards without widget errors", async () => {
    const { call } = await setup();
    for (const id of ["art-overview", "ai-portfolio"]) {
      const { body } = await call("GET", `/v1/dashboards/${id}`);
      const errors = body.outputs.filter((o: { error?: string }) => o.error);
      expect(errors).toEqual([]);
    }
  });

  it("saves a custom dashboard and rejects unknown metrics", async () => {
    const { call } = await setup();
    const widgets = [{ id: "w1", title: "Load by team", metric: "flow-load", viz: "bar", groupBy: "team" }];
    expect((await call("PUT", "/v1/dashboards/mine", { name: "Mine", widgets })).status).toBe(200);
    expect((await call("GET", "/v1/dashboards")).body.dashboards.map((d: { id: string }) => d.id)).toContain("mine");
    const bad = await call("PUT", "/v1/dashboards/mine", { name: "Mine", widgets: [{ ...widgets[0], metric: "made-up" }] });
    expect(bad.status).toBe(422);
    const run = await call("POST", "/v1/metrics/run", { widgets });
    expect(run.body.outputs[0].result.points.length).toBe(4);
  });
});

describe("AI portfolio", () => {
  it("shows the next gate's blockers on each initiative", async () => {
    const { call } = await setup();
    const { body } = await call("GET", "/v1/ai/initiatives/ai-support");
    expect(body.initiative.nextGate.to).toBe("pilot");
    expect(body.initiative.nextGate.allowed).toBe(false);
    expect(body.agents.map((a: { id: string }) => a.id)).toEqual(["agent-triage", "agent-reply"]);
    expect(body.items.length).toBeGreaterThan(0);
  });

  it("walks an initiative through a gate: evidence, evals, sign-off, advance", async () => {
    const { call } = await setup();
    const blocked = await call("POST", "/v1/ai/initiatives/ai-support/advance", { to: "pilot" });
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe("GATE_BLOCKED");

    await call("POST", "/v1/ai/initiatives/ai-support/evidence", { kind: "eval-report", url: "https://wiki.example/eval", addedBy: "p-pm" });
    const { body: cur } = await call("GET", "/v1/ai/initiatives/ai-support");
    const evals = cur.initiative.evals.map((e: { name: string; direction: string; threshold: number; latest?: number }) => ({ name: e.name, direction: e.direction, threshold: e.threshold, latest: e.direction === "max" ? 0.6 : e.latest }));
    await call("PUT", "/v1/ai/initiatives/ai-support/evals", { evals });
    expect((await call("POST", "/v1/ai/initiatives/ai-support/sign-off", { stage: "pilot", personId: "p-pm" })).status).toBe(403);
    await call("POST", "/v1/ai/initiatives/ai-support/sign-off", { stage: "pilot", personId: "p-ava" });

    const gate = await call("GET", "/v1/ai/initiatives/ai-support/gate?to=pilot");
    expect(gate.body.gate.blockers).toEqual([]);
    const moved = await call("POST", "/v1/ai/initiatives/ai-support/advance", { to: "pilot" });
    expect(moved.status).toBe(200);
    expect(moved.body.initiative.stage).toBe("pilot");
  });

  it("creates initiatives owned by a person and enforces agent rules", async () => {
    const { call } = await setup();
    const bad = await call("POST", "/v1/ai/initiatives", { name: "X", problem: "Y", useCase: "agent", riskTier: "minimal", ownerId: "agent-triage" });
    expect(bad.body.error.code).toBe("OWNER_NOT_A_PERSON");
    const ok = await call("POST", "/v1/ai/initiatives", { name: "Invoice matching", problem: "Manual matching", useCase: "agent", riskTier: "minimal", ownerId: "p-pm" });
    expect(ok.status).toBe(201);
    expect(ok.body.initiative.stage).toBe("idea");

    const noOwner = await call("POST", "/v1/ai/agents", { name: "Rogue", purpose: "Does things", autonomy: 4 });
    expect(noOwner.status).toBe(422);
    expect(noOwner.body.error.details).toHaveLength(2);
    const agent = await call("POST", "/v1/ai/agents", { name: "Matcher", purpose: "Matches invoices", accountableId: "p-pm", autonomy: 2, teamId: "t-payments", initiativeId: ok.body.initiative.id });
    expect(agent.status).toBe(201);
    expect((await call("PATCH", `/v1/ai/agents/${agent.body.agent.id}`, { autonomy: 4 })).status).toBe(422);
    expect((await call("PATCH", `/v1/ai/agents/${agent.body.agent.id}`, { status: "paused" })).status).toBe(200);
    const listed = await call("GET", "/v1/ai/agents");
    expect(listed.body.agents.find((a: { id: string }) => a.id === "agent-pi-prep").issues).toEqual(["name the human accountable for this agent."]);
  });
});

describe("sync", () => {
  class FakeJira implements TrackerConnector {
    readonly system = "jira" as const;
    pushed: PushChange[] = [];
    constructor(private readonly items: () => WorkItem[]) {}
    async pull() {
      return this.items();
    }
    async push(c: PushChange) {
      this.pushed.push(c);
    }
  }

  it("reports a missing connection", async () => {
    const { call } = await setup();
    expect((await call("POST", "/v1/sync/ado")).body.error.code).toBe("NOT_CONNECTED");
  });

  it("pushes queued moves and clears the queue", async () => {
    const { call, store } = await setup();
    const remote = store.state.workspace.items.filter((i) => i.source.system === "jira").map((i) => structuredClone(i));
    const fake = new FakeJira(() => remote);
    store.connectors.set("jira", fake);
    await call("PATCH", "/v1/items/f-1", { iterationId: "pi-26-4.5" });
    const dry = await call("POST", "/v1/sync/jira?dry_run=true");
    expect(dry.body).toMatchObject({ dryRun: true, pushed: 1, conflicts: [] });
    expect(fake.pushed).toHaveLength(0);
    const real = await call("POST", "/v1/sync/jira");
    expect(real.body.pushed).toBe(1);
    expect(fake.pushed[0]).toMatchObject({ kind: "update", fields: ["iterationId"] });
    expect(store.state.pending).toEqual([]);
    expect(store.state.workspace.items.find((i) => i.id === "f-1")!.iterationId).toBe("pi-26-4.5");
  });
});

describe("cors", () => {
  it("allows the web app to PATCH and DELETE", async () => {
    const { app } = await setup();
    const res = await app.inject({ method: "OPTIONS", url: "/v1/items/f-1", headers: { origin: "http://localhost:3100", "access-control-request-method": "PATCH" } });
    expect(res.statusCode).toBe(204);
    expect(res.headers["access-control-allow-methods"]).toContain("PATCH");
  });
});

describe("auth", () => {
  it("requires the API key when configured", async () => {
    const { app } = await setup({ apiKey: "k" });
    expect((await app.inject({ method: "GET", url: "/v1/model" })).statusCode).toBe(401);
    expect((await app.inject({ method: "GET", url: "/v1/model", headers: { authorization: "Bearer k" } })).statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: "/health" })).statusCode).toBe(200);
  });
});
