// PI Outcome Planning sessions: the outcome tree, the planning boards, the management review
// board, the agenda and the confidence vote for one PI of one ART. Reads are open; writes
// need "plan"; a team's vote needs "plan" too (the RTE records it, or the team with a key).

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { confidence, emptyPlanningSession, outcomeTree, planningBoard, planningIssues, teamBoard, type PlanningSession } from "@trainyard/core";
import { require } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Store } from "./store.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

const Id = z.string().min(1).max(120).regex(/^[A-Za-z0-9._:-]+$/, "letters, digits, . _ : - only");
const Text = z.string().trim().max(600);
const OutcomeKeyResult = z.object({ id: Id, text: Text, target: z.string().trim().max(60), draftTarget: z.string().trim().max(60).optional(), baseline: z.string().trim().max(60).optional(), current: z.string().trim().max(60).optional() });
const Outcome = z.object({
  id: Id,
  level: z.enum(["portfolio", "art", "pi", "team"]),
  title: z.string().trim().min(1).max(200),
  parentId: Id.optional(),
  teamId: Id.optional(),
  keyResults: z.array(OutcomeKeyResult).max(12),
  ambition: z.enum(["moonshot", "roofshot"]).optional(),
  status: z.enum(["draft", "committed", "active", "achieved", "missed", "retired"]).optional(),
  owner: z.string().trim().max(120).optional(),
  approver: z.string().trim().max(120).optional(),
});
const Milestone = z.object({ id: Id, kind: z.enum(["fixed", "learning", "sync", "release"]), label: z.string().trim().min(1).max(200), iteration: z.number().int().min(1).max(30), outcomeId: Id.optional(), teamIds: z.array(Id).max(40).optional() });
const Work = z.object({ id: Id, teamId: Id, kind: z.enum(["experiment", "prototype", "enabler", "feature"]), label: z.string().trim().min(1).max(200), iteration: z.number().int().min(1).max(30), outcomeId: Id.optional(), onArtBoard: z.boolean().optional() });
const PlanLink = z.object({ id: Id, fromId: Id, toId: Id, kind: z.enum(["depends", "relates"]), note: Text.optional() });
const Review = z.object({ id: Id, kind: z.enum(["decision-needed", "risk", "decision-confirmed", "action"]), text: Text.min(1), owner: z.string().trim().max(120).optional(), teamId: Id.optional(), answers: Id.optional() });
const Agenda = z.object({ id: Id, half: z.enum(["morning", "afternoon"]), minutes: z.number().int().min(5).max(480), title: z.string().trim().min(1).max(120), detail: Text.optional(), kind: z.enum(["plenary", "outcome-breakout", "team-breakout", "review"]), done: z.boolean().optional() });
const Vote = z.object({ teamId: Id, value: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]), concern: Text.optional() });
const Session = z.object({
  id: Id,
  artName: z.string().trim().min(1).max(120),
  vision: z.string().trim().max(300),
  piName: z.string().trim().min(1).max(60),
  iterations: z.number().int().min(2).max(12),
  stage: z.enum(["draft", "adjusted", "final"]),
  teams: z.array(z.object({ id: Id, name: z.string().trim().min(1).max(80) })).max(40),
  outcomes: z.array(Outcome).max(200),
  milestones: z.array(Milestone).max(300),
  work: z.array(Work).max(600),
  links: z.array(PlanLink).max(600).optional(),
  review: z.array(Review).max(300),
  agenda: z.array(Agenda).max(30),
  votes: z.array(Vote).max(40),
});

/** References inside a session must point at things in the same session. */
function checkRefs(s: z.infer<typeof Session>): string[] {
  const issues: string[] = [];
  const teams = new Set(s.teams.map((t) => t.id));
  const outcomes = new Map(s.outcomes.map((o) => [o.id, o]));
  if (outcomes.size !== s.outcomes.length) issues.push("every outcome needs its own id");
  for (const o of s.outcomes) {
    if (o.teamId && !teams.has(o.teamId)) issues.push(`"${o.title}" belongs to unknown team "${o.teamId}"`);
    if (o.level === "team" && !o.teamId) issues.push(`team outcome "${o.title}" has no team`);
    if (o.parentId) {
      const p = outcomes.get(o.parentId);
      if (!p) issues.push(`"${o.title}" points at unknown outcome "${o.parentId}"`);
      else if (o.level === "art" && p.level !== "portfolio") issues.push(`ART outcome "${o.title}" must trace to a portfolio outcome`);
      else if (o.level === "pi" && p.level !== "art") issues.push(`PI outcome "${o.title}" must trace to an ART outcome`);
      else if (o.level === "team" && p.level !== "pi") issues.push(`team outcome "${o.title}" must trace to a PI outcome`);
    }
  }
  for (const m of s.milestones) {
    if (m.outcomeId && outcomes.get(m.outcomeId)?.level !== "pi") issues.push(`milestone "${m.label}" must sit on a PI outcome row`);
    for (const t of m.teamIds ?? []) if (!teams.has(t)) issues.push(`milestone "${m.label}" names unknown team "${t}"`);
  }
  for (const w of s.work) {
    if (!teams.has(w.teamId)) issues.push(`"${w.label}" belongs to unknown team "${w.teamId}"`);
    if (w.outcomeId && outcomes.get(w.outcomeId)?.teamId !== w.teamId) issues.push(`"${w.label}" sits on an outcome of another team`);
  }
  const cards = new Set([...s.milestones.map((m) => m.id), ...s.work.map((w) => w.id)]);
  for (const l of s.links ?? []) {
    if (!cards.has(l.fromId) || !cards.has(l.toId)) issues.push(`a link joins a card that is not on any board`);
    if (l.fromId === l.toId) issues.push(`a link joins a card to itself`);
  }
  const reviewIds = new Set(s.review.map((r) => r.id));
  for (const r of s.review) if (r.answers && !reviewIds.has(r.answers)) issues.push(`a ${r.kind} answers an unknown item "${r.answers}"`);
  for (const v of s.votes) if (!teams.has(v.teamId)) issues.push(`a vote names unknown team "${v.teamId}"`);
  return issues;
}

export function registerOutcomeRoutes(app: App, store: Store) {
  const all = () => (store.state.outcomePlanning ??= []);
  const derived = (s: PlanningSession) => ({
    tree: outcomeTree(s),
    board: planningBoard(s),
    teamBoards: Object.fromEntries(s.teams.map((t) => [t.id, teamBoard(s, t.id)])),
    confidence: confidence(s),
    issues: planningIssues(s),
  });
  const find = (id: string) => all().find((s) => s.id === id) ?? (() => { throw notFound("PI outcome planning session"); })();

  app.get("/v1/outcome-planning", async () => ({
    sessions: all().map((s) => ({ id: s.id, artName: s.artName, piName: s.piName, stage: s.stage, teams: s.teams.length, outcomes: s.outcomes.length, confidence: confidence(s), updatedAt: s.updatedAt })),
  }));

  app.get("/v1/outcome-planning/:id", { schema: { params: z.object({ id: Id }) } }, async (req) => {
    const s = find(req.params.id);
    return { session: s, derived: derived(s) };
  });

  app.post("/v1/outcome-planning", { schema: { body: z.object({ id: Id, artName: z.string().trim().min(1).max(120), piName: z.string().trim().min(1).max(60), iterations: z.number().int().min(2).max(12).optional(), teams: z.array(z.object({ id: Id, name: z.string().trim().min(1).max(80) })).max(40).optional() }) } }, async (req, reply) => {
    require(req, "plan");
    if (all().some((s) => s.id === req.body.id)) throw new ApiError(409, "EXISTS", "A session with this id already exists.");
    // Without a team list, the workspace's teams join the session.
    const teams = req.body.teams ?? store.state.workspace.teams.map((t) => ({ id: t.id, name: t.name }));
    const s = emptyPlanningSession(req.body.id, req.body.artName, req.body.piName, teams, store.now().toISOString(), req.body.iterations);
    all().push(s);
    await store.commit(req.principal, "outcome-planning.create", { id: s.id });
    return reply.code(201).send({ session: s, derived: derived(s) });
  });

  app.put("/v1/outcome-planning/:id", { bodyLimit: 2 * 1024 * 1024, schema: { params: z.object({ id: Id }), body: Session } }, async (req) => {
    require(req, "plan");
    if (req.body.id !== req.params.id) throw new ApiError(400, "ID_MISMATCH", "The id in the body must match the URL.");
    const refs = checkRefs(req.body);
    if (refs.length) throw new ApiError(422, "BAD_REFERENCES", refs.join("; "), refs);
    const doc: PlanningSession = { ...(req.body as PlanningSession), updatedAt: store.now().toISOString() };
    const exists = all().some((s) => s.id === doc.id);
    store.state.outcomePlanning = exists ? all().map((s) => (s.id === doc.id ? doc : s)) : [...all(), doc];
    await store.commit(req.principal, exists ? "outcome-planning.update" : "outcome-planning.create", { id: doc.id, stage: doc.stage, outcomes: doc.outcomes.length, milestones: doc.milestones.length });
    return { session: doc, derived: derived(doc) };
  });

  // One team's fist of five, replacing its earlier vote.
  app.post("/v1/outcome-planning/:id/votes", { schema: { params: z.object({ id: Id }), body: Vote } }, async (req) => {
    require(req, "plan");
    const s = find(req.params.id);
    if (!s.teams.some((t) => t.id === req.body.teamId)) throw notFound("Team");
    const { concern, ...rest } = req.body;
    s.votes = [...s.votes.filter((v) => v.teamId !== req.body.teamId), { ...rest, ...(concern ? { concern } : {}) }];
    s.updatedAt = store.now().toISOString();
    await store.commit(req.principal, "outcome-planning.vote", { id: s.id, teamId: req.body.teamId, value: req.body.value });
    return { confidence: confidence(s), votes: s.votes };
  });

  app.delete("/v1/outcome-planning/:id", { schema: { params: z.object({ id: Id }) } }, async (req, reply) => {
    require(req, "plan");
    find(req.params.id);
    store.state.outcomePlanning = all().filter((s) => s.id !== req.params.id);
    await store.commit(req.principal, "outcome-planning.delete", { id: req.params.id });
    return reply.code(204).send();
  });
}
