// Team capacity: read the breakdown per iteration, change the mode, the members and their
// allocation, or type the figures in. Every change recomputes team.capacity, which the PI
// planning board's load meters read.

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { applyCapacity, iterationCapacity, type Team } from "@trainyard/core";
import { require } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Store } from "./store.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

const Id = z.string().min(1).max(120);
const Member = z.object({
  personId: Id,
  allocation: z.number().min(0).max(1),
  contributes: z.boolean(),
  vacationDays: z.record(z.string().max(80), z.number().int().min(0).max(15)).optional(),
});
const Patch = z.object({
  capacityMode: z.enum(["manual", "calculated", "velocity"]).optional(),
  pointsPerFullTime: z.number().min(1).max(40).optional(),
  members: z.array(Member).max(60).optional(),
  /** Manual figures per iteration id; applied to the stored capacity whatever the mode. */
  capacity: z.record(z.string().max(80), z.number().min(0).max(1000)).optional(),
  /** New people to create on the fly, returned with their ids. */
  newPeople: z.array(z.object({ name: z.string().trim().min(1).max(120), role: z.string().trim().min(1).max(60) })).max(20).optional(),
});

export function registerCapacityRoutes(app: App, store: Store) {
  const s = () => store.state;
  const team = (id: string): Team => s().workspace.teams.find((t) => t.id === id) ?? (() => { throw notFound("Team"); })();
  const view = (t: Team, incrementId?: string) => {
    const ws = s().workspace;
    const inc = incrementId ? ws.increments.find((i) => i.id === incrementId) : ws.increments[ws.increments.length - 1];
    if (!inc) throw notFound("Increment");
    return {
      team: t,
      increment: { id: inc.id, name: inc.name },
      people: ws.people,
      iterations: inc.iterations.map((it) => iterationCapacity(t, it, ws)),
    };
  };

  app.get("/v1/teams/:id/capacity", { schema: { params: z.object({ id: Id }), querystring: z.object({ incrementId: z.string().optional() }) } }, async (req) => view(team(req.params.id), req.query.incrementId));

  app.patch("/v1/teams/:id/capacity", { schema: { params: z.object({ id: Id }), querystring: z.object({ incrementId: z.string().optional() }), body: Patch } }, async (req) => {
    require(req, "plan");
    const ws = s().workspace;
    const t = team(req.params.id);
    const created: { id: string; name: string }[] = [];
    for (const p of req.body.newPeople ?? []) {
      const id = `p-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`;
      ws.people.push({ id, name: p.name, roles: [p.role] });
      created.push({ id, name: p.name });
    }
    if (req.body.members) {
      for (const m of req.body.members) if (!ws.people.some((p) => p.id === m.personId)) throw new ApiError(422, "UNKNOWN_PERSON", `No person "${m.personId}" in the workspace.`);
      t.members = req.body.members.map((m) => ({ personId: m.personId, allocation: m.allocation, contributes: m.contributes, ...(m.vacationDays ? { vacationDays: m.vacationDays } : {}) }));
      t.memberIds = req.body.members.map((m) => m.personId);
    }
    if (req.body.capacityMode) t.capacityMode = req.body.capacityMode;
    if (req.body.pointsPerFullTime !== undefined) t.pointsPerFullTime = req.body.pointsPerFullTime;
    if (req.body.capacity) Object.assign(t.capacity, req.body.capacity);
    const next = applyCapacity(t, ws);
    t.capacity = next.capacity;
    await store.commit(req.principal, "team.capacity", { id: t.id, mode: t.capacityMode ?? "manual", members: t.members?.length ?? 0 });
    return { ...view(t, req.query.incrementId), created };
  });
}
