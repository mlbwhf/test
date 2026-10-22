// AI facilitation routes. Every feature returns a draft for a person to accept or edit;
// nothing here writes to the workspace. 503 NO_PROVIDER when no provider is configured.

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;
import { z } from "zod";
import { STAGES, evaluateGate, type Stage } from "@trainyard/ai-portfolio";
import { AssistError, draftObjectives, narrateDashboard, readinessBriefing, reviewBoard, reviewGate, reviewRisks, type AssistProvider } from "@trainyard/ai-assist";
import { checkDependencies, planningReadiness, teamLoad, type MetricRegistry } from "@trainyard/core";
import { require } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Store } from "./store.js";

const Id = z.string().min(1).max(200);

export function registerAssistRoutes(app: App, store: Store, metrics: MetricRegistry, provider: AssistProvider | undefined) {
  const s = () => store.state;
  const need = () => {
    if (!provider) throw new ApiError(503, "NO_PROVIDER", "AI assistance is off. Set ANTHROPIC_API_KEY on the API server to turn it on.");
    return provider;
  };
  const wrap = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof AssistError) throw new ApiError(e.code === "REFUSED" ? 422 : e.code === "NO_PROVIDER" ? 503 : 502, e.code, e.message);
      throw e;
    }
  };

  app.get("/v1/assist", async () => ({ enabled: !!provider, provider: provider?.name ?? null }));

  // Model calls cost money or CPU: a tighter limit than the rest of the API, per key or address.
  const limited = { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } };

  app.post("/v1/assist/boards/:id", { ...limited, schema: { params: z.object({ id: Id }) } }, async (req) => {
    require(req, "assist");
    const board = (s().workspace.boards ?? []).find((b) => b.id === req.params.id);
    if (!board) throw notFound("Board");
    if (board.nodes.filter((n) => n.text.trim()).length === 0) throw new ApiError(422, "EMPTY_BOARD", "There is nothing written on this board yet.");
    const res = await wrap(() => reviewBoard(need(), board));
    return { review: res.data, model: res.model, usage: { input: res.inputTokens, output: res.outputTokens } };
  });

  app.post("/v1/assist/objectives", { ...limited, schema: { body: z.object({ teamId: Id, incrementId: Id.optional() }) } }, async (req) => {
    require(req, "assist");
    const ws = s().workspace;
    const team = ws.teams.find((t) => t.id === req.body.teamId);
    if (!team) throw notFound("Team");
    const inc = req.body.incrementId ? ws.increments.find((i) => i.id === req.body.incrementId) : ws.increments[ws.increments.length - 1];
    if (!inc) throw notFound("Increment");
    const iterIds = new Set(inc.iterations.map((i) => i.id));
    const features = ws.items.filter((i) => i.level === store.plannedLevel() && i.teamId === team.id && i.iterationId && iterIds.has(i.iterationId));
    if (features.length === 0) throw new ApiError(422, "NOTHING_PLANNED", `${team.name} has nothing planned in ${inc.name}.`);
    const res = await wrap(() => draftObjectives(need(), team, features, inc.name));
    return { draft: res.data, model: res.model, usage: { input: res.inputTokens, output: res.outputTokens } };
  });

  app.post("/v1/assist/risks", limited, async (req) => {
    require(req, "assist");
    const ws = s().workspace;
    const checks = checkDependencies(ws.dependencies, ws.items, ws.increments);
    const res = await wrap(() => reviewRisks(need(), ws.risks, ws.items, ws.dependencies, checks));
    return { review: res.data, model: res.model };
  });

  app.post("/v1/assist/readiness", { ...limited, schema: { body: z.object({ incrementId: Id.optional() }) } }, async (req) => {
    require(req, "assist");
    const ws = s().workspace;
    const inc = req.body.incrementId ? ws.increments.find((i) => i.id === req.body.incrementId) : ws.increments[ws.increments.length - 1];
    if (!inc) throw notFound("Increment");
    const planned = store.plannedLevel();
    const items = ws.items.filter((i) => i.level === planned);
    const readiness = planningReadiness({ increment: inc, teams: ws.teams, items, plannedLevel: planned });
    const load = teamLoad(ws.items, ws.teams, inc, planned).map((c) => ({
      team: ws.teams.find((t) => t.id === c.teamId)?.name ?? c.teamId,
      iteration: inc.iterations.find((i) => i.id === c.iterationId)?.name ?? c.iterationId,
      load: c.load,
      capacity: c.capacity,
    }));
    const checks = checkDependencies(ws.dependencies, ws.items, ws.increments);
    const res = await wrap(() => readinessBriefing(need(), inc.name, readiness, load, checks));
    return { briefing: res.data, model: res.model };
  });

  app.post("/v1/assist/narrative", { ...limited, schema: { body: z.object({ dashboardId: Id }) } }, async (req) => {
    require(req, "assist");
    const d = s().dashboards.find((x) => x.id === req.body.dashboardId);
    if (!d) throw notFound("Dashboard");
    const outputs = metrics.runDashboard(d, store.metricContext());
    const res = await wrap(() => narrateDashboard(need(), d.name, outputs));
    return { narrative: res.data, model: res.model };
  });

  app.post("/v1/assist/gate/:id", { ...limited, schema: { params: z.object({ id: Id }), body: z.object({ to: z.enum(STAGES).optional() }) } }, async (req) => {
    require(req, "assist");
    const i = s().initiatives.find((x) => x.id === req.params.id);
    if (!i) throw notFound("AI initiative");
    const to: Stage | undefined = req.body.to ?? STAGES[STAGES.indexOf(i.stage) + 1];
    if (!to) throw new ApiError(422, "NO_NEXT_STAGE", "This initiative has no next stage.");
    const gate = evaluateGate(i, to, { model: s().model, agents: s().agents });
    const res = await wrap(() => reviewGate(need(), i, gate));
    return { review: res.data, gate, model: res.model };
  });
}
