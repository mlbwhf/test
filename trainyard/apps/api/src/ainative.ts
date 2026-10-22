// AI-Native ART records that extend a PI Outcome Planning session: outputs on the pipeline,
// intent/specification/context with propagation, curated data, team capabilities, Sense and
// Respond, customer demos, the assessment and its launch plan. One record per session.

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  VALUE_CATEGORY,
  advance,
  aiCostView,
  artIssues,
  assessmentSummary,
  clearReview,
  coverage,
  discard,
  editIntent,
  emptyArt,
  explorationFunnel,
  gate,
  prioritise,
  reviewQueue,
  senseRespondAgenda,
  verificationView,
  type AiNativeArt,
  type PlanningSession,
} from "@trainyard/core";
import { require } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Store } from "./store.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

const Id = z.string().min(1).max(120).regex(/^[A-Za-z0-9._:-]+$/);
const Text = z.string().trim().max(2000);
const Stage = z.enum(["discover", "specify", "build", "validate", "release", "concluded", "discarded"]);
const Output = z.object({
  id: Id,
  type: z.enum(["experiment", "prototype", "feature", "enabler"]),
  title: z.string().trim().min(1).max(200),
  teamId: Id,
  iteration: z.number().int().min(1).max(30),
  outcomeIds: z.array(Id).max(10),
  metrics: z.array(z.object({ keyResultId: Id.optional(), name: z.string().trim().max(200).optional(), expected: z.string().trim().max(300).optional() })).max(10),
  stage: Stage,
  stageHistory: z.array(z.object({ stage: Stage, at: z.string(), by: z.string().max(120).optional() })).max(60),
  intentId: Id.optional(),
  specId: Id.optional(),
  contextId: Id.optional(),
  dataAssetIds: z.array(Id).max(20).optional(),
  hypothesis: Text.optional(),
  uncertaintyReduced: Text.optional(),
  disposition: z.enum(["pending", "released", "discarded", "superseded"]),
  discardReason: Text.optional(),
  abTest: z.boolean().optional(),
  aiCostEstimate: z.number().min(0).optional(),
  aiCostActual: z.number().min(0).optional(),
  workflow: z.string().trim().max(80).optional(),
  verificationOwner: z.string().trim().max(120).optional(),
  verificationEvidence: Text.optional(),
  reviewStartedAt: z.string().optional(),
  reviewedAt: z.string().optional(),
  disclosure: z.string().trim().max(300).optional(),
});
const Intent = z.object({ id: Id, title: z.string().trim().min(1).max(200), currentState: Text, futureState: Text, strategy: Text, problems: z.array(z.string().max(300)).max(20), version: z.number().int().min(1), supersededBy: Id.optional(), propagationStatus: z.enum(["clean", "review-required"]), updatedAt: z.string() });
const Spec = z.object({ id: Id, title: z.string().trim().min(1).max(200), intentId: Id, whatItDoes: Text, boundaries: z.array(z.string().max(300)).max(30), agentPayload: z.record(z.string(), z.unknown()).optional(), contextIds: z.array(Id).max(20), version: z.number().int().min(1), reviewRequired: z.boolean(), updatedAt: z.string() });
const Context = z.object({ id: Id, title: z.string().trim().min(1).max(200), customerProfile: Text, marketConditions: Text, operatingEnvironment: Text, testImplications: z.array(z.string().max(300)).max(30), version: z.number().int().min(1), reviewRequired: z.boolean(), updatedAt: z.string() });
const Quality = z.number().min(0).max(5);
const DataAsset = z.object({ id: Id, name: z.string().trim().min(1).max(200), category: z.enum(["powers-development", "powers-products"]), quality: z.object({ complete: Quality, accurate: Quality, securelyAccessed: Quality, maintained: Quality }), subQuality: z.record(z.string(), Quality).optional(), owner: z.string().trim().max(120), lastAssessed: z.string(), latencyClass: z.enum(["record", "signal"]), confidence: z.string().max(120).optional() });
const Capability = z.enum(["product", "builder", "domainExpert", "ai"]);
const TeamCaps = z.object({ teamId: Id, members: z.array(z.object({ id: Id, name: z.string().trim().min(1).max(120), capabilities: z.array(Capability).max(4), aiValueArchitect: z.boolean().optional() })).max(20) });
const SenseRespond = z.object({ id: Id, iteration: z.number().int().min(1).max(30), heldAt: z.string().optional(), decisions: z.array(z.object({ outputId: Id.optional(), workflow: z.string().max(80).optional(), decision: z.enum(["keep", "discard", "replan", "fix-workflow"]), note: Text.optional() })).max(60), notes: Text.optional() });
const Demo = z.object({ id: Id, format: z.string().trim().min(1).max(80), iteration: z.number().int().min(1).max(30), outputIds: z.array(Id).max(20), audience: z.string().max(200).optional(), what: z.string().max(300).optional() });
const Score = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
const Assessment = z.object({
  ratings: z.array(z.object({ factor: z.string().max(80), person: z.string().max(120), score: Score, reason: Text.optional() })).max(600),
  splitsKept: z.array(z.object({ factor: z.string().max(80), positions: z.array(z.string().max(300)).max(10) })).max(12),
  gaps: z.array(z.object({ id: Id, factor: z.string().max(80), text: Text.min(1), sequence: z.enum(["before-pi-outcome-planning", "before-sense-respond", "later"]), owner: z.string().max(120).optional(), done: z.boolean().optional() })).max(100),
  launchPlanVersion: z.number().int().min(1),
  launchPlanUpdatedAt: z.string().optional(),
});
const Art = z.object({
  sessionId: Id,
  outputs: z.array(Output).max(500),
  intents: z.array(Intent).max(100),
  specs: z.array(Spec).max(300),
  contexts: z.array(Context).max(100),
  dataAssets: z.array(DataAsset).max(200),
  teams: z.array(TeamCaps).max(40),
  senseRespond: z.array(SenseRespond).max(60),
  demos: z.array(Demo).max(100),
  assessment: Assessment,
  evidence: z.array(z.object({ id: Id, at: z.string(), kind: z.enum(["intent-change", "review-cleared", "discard", "release", "concluded", "sense-respond", "assessment"]), text: Text, refs: z.array(z.string().max(120)).max(40) })).max(1000),
  krHistory: z.record(z.string(), z.array(z.object({ iteration: z.number().int().min(1).max(30), value: z.string().max(60) })).max(60)),
  fixedAiCost: z.number().min(0).optional(),
  costLimit: z.number().min(0).optional(),
});

function checkRefs(a: z.infer<typeof Art>, session: PlanningSession): string[] {
  const issues: string[] = [];
  const outcomes = new Set(session.outcomes.map((o) => o.id));
  const krs = new Set(session.outcomes.flatMap((o) => o.keyResults.map((k) => k.id)));
  const teams = new Set(session.teams.map((t) => t.id));
  const intents = new Set(a.intents.map((i) => i.id));
  const specs = new Set(a.specs.map((s) => s.id));
  const contexts = new Set(a.contexts.map((c) => c.id));
  const assets = new Set(a.dataAssets.map((d) => d.id));
  for (const o of a.outputs) {
    for (const x of o.outcomeIds) if (!outcomes.has(x)) issues.push(`"${o.title}" links unknown outcome "${x}"`);
    for (const m of o.metrics) if (m.keyResultId && !krs.has(m.keyResultId)) issues.push(`"${o.title}" links unknown key result "${m.keyResultId}"`);
    if (!teams.has(o.teamId)) issues.push(`"${o.title}" belongs to unknown team "${o.teamId}"`);
    if (o.intentId && !intents.has(o.intentId)) issues.push(`"${o.title}" points at unknown intent "${o.intentId}"`);
    if (o.specId && !specs.has(o.specId)) issues.push(`"${o.title}" points at unknown specification "${o.specId}"`);
    if (o.contextId && !contexts.has(o.contextId)) issues.push(`"${o.title}" points at unknown context "${o.contextId}"`);
    for (const d of o.dataAssetIds ?? []) if (!assets.has(d)) issues.push(`"${o.title}" uses unknown data asset "${d}"`);
    if (o.stage === "discarded" && !o.discardReason?.trim()) issues.push(`"${o.title}" is discarded without a reason`);
    if (VALUE_CATEGORY[o.type] === "learning" && o.stage !== "discover" && !o.hypothesis?.trim()) issues.push(`"${o.title}" is a learning item without a hypothesis`);
  }
  for (const s of a.specs) {
    if (!intents.has(s.intentId)) issues.push(`specification "${s.title}" points at unknown intent "${s.intentId}"`);
    for (const c of s.contextIds) if (!contexts.has(c)) issues.push(`specification "${s.title}" points at unknown context "${c}"`);
  }
  for (const t of a.teams) if (!teams.has(t.teamId)) issues.push(`capabilities for unknown team "${t.teamId}"`);
  return issues;
}

export function registerAiNativeRoutes(app: App, store: Store) {
  const all = () => (store.state.aiNativeArts ??= []);
  const session = (id: string) => (store.state.outcomePlanning ?? []).find((s) => s.id === id) ?? (() => { throw notFound("PI outcome planning session"); })();
  const find = (id: string) => all().find((a) => a.sessionId === id) ?? emptyArt(session(id).id, store.now().toISOString());
  const put = (a: AiNativeArt) => {
    store.state.aiNativeArts = [...all().filter((x) => x.sessionId !== a.sessionId), a];
  };
  const derived = (a: AiNativeArt, s: PlanningSession) => ({
    gates: Object.fromEntries(a.outputs.map((o) => [o.id, gate(o, { intents: a.intents, specs: a.specs })])),
    reviewQueue: reviewQueue(a),
    coverage: a.teams.map(coverage),
    funnel: explorationFunnel(a, s),
    cost: aiCostView(a),
    verification: verificationView(a, store.now().toISOString()),
    assessment: assessmentSummary(a.assessment),
    issues: artIssues(a, s),
  });

  app.get("/v1/outcome-planning/:id/art", { schema: { params: z.object({ id: Id }) } }, async (req) => {
    const s = session(req.params.id);
    const a = find(s.id);
    return { art: a, derived: derived(a, s) };
  });

  app.put("/v1/outcome-planning/:id/art", { bodyLimit: 4 * 1024 * 1024, schema: { params: z.object({ id: Id }), body: Art } }, async (req) => {
    require(req, "plan");
    const s = session(req.params.id);
    if (req.body.sessionId !== s.id) throw new ApiError(400, "ID_MISMATCH", "sessionId must match the URL.");
    const refs = checkRefs(req.body, s);
    if (refs.length) throw new ApiError(422, "BAD_REFERENCES", refs.join("; "), refs);
    const a: AiNativeArt = { ...(req.body as AiNativeArt), updatedAt: store.now().toISOString() };
    put(a);
    await store.commit(req.principal, "ai-native.update", { session: s.id, outputs: a.outputs.length, intents: a.intents.length });
    return { art: a, derived: derived(a, s) };
  });

  // Pipeline moves: advance through the gate, or discard with a reason (as easy as advancing).
  app.post("/v1/outcome-planning/:id/art/outputs/:outputId/advance", { schema: { params: z.object({ id: Id, outputId: Id }) } }, async (req) => {
    require(req, "plan");
    const s = session(req.params.id);
    const a = find(s.id);
    const o = a.outputs.find((x) => x.id === req.params.outputId) ?? (() => { throw notFound("Output"); })();
    const g = gate(o, { intents: a.intents, specs: a.specs });
    if (!g.ok) throw new ApiError(422, "GATE", g.reasons.join(" "), g.reasons);
    const next = advance(o, { intents: a.intents, specs: a.specs }, store.now().toISOString(), req.principal.name);
    const kind = next.stage === "release" ? "release" : next.stage === "concluded" ? "concluded" : null;
    const evidence: AiNativeArt["evidence"] = kind ? [...a.evidence, { id: `ev-${a.evidence.length + 1}`, at: next.stageHistory.at(-1)!.at, kind, text: `${kind === "release" ? "Released" : "Concluded"} "${next.title}"${next.uncertaintyReduced ? `: ${next.uncertaintyReduced}` : ""}.`, refs: [next.id] }] : a.evidence;
    const updated: AiNativeArt = { ...a, outputs: a.outputs.map((x) => (x.id === o.id ? next : x)), evidence, updatedAt: store.now().toISOString() };
    put(updated);
    await store.commit(req.principal, "ai-native.advance", { session: s.id, output: o.id, to: next.stage });
    return { output: next, derived: derived(updated, s) };
  });

  app.post("/v1/outcome-planning/:id/art/outputs/:outputId/discard", { schema: { params: z.object({ id: Id, outputId: Id }), body: z.object({ reason: z.string().trim().min(1).max(1000) }) } }, async (req) => {
    require(req, "plan");
    const s = session(req.params.id);
    const a = find(s.id);
    const o = a.outputs.find((x) => x.id === req.params.outputId) ?? (() => { throw notFound("Output"); })();
    const next = discard(o, req.body.reason, store.now().toISOString(), req.principal.name);
    const updated = { ...a, outputs: a.outputs.map((x) => (x.id === o.id ? next : x)), evidence: [...a.evidence, { id: `ev-${a.evidence.length + 1}`, at: store.now().toISOString(), kind: "discard" as const, text: `Discarded "${next.title}": ${next.discardReason}`, refs: [next.id] }], updatedAt: store.now().toISOString() };
    put(updated);
    await store.commit(req.principal, "ai-native.discard", { session: s.id, output: o.id });
    return { output: next, derived: derived(updated, s) };
  });

  app.post("/v1/outcome-planning/:id/art/outputs/:outputId/priority", { schema: { params: z.object({ id: Id, outputId: Id }), body: z.object({ businessValue: z.number().optional(), timeCriticality: z.number().optional(), riskOpportunity: z.number().optional(), jobSize: z.number().optional(), informationGain: z.number().optional(), costAndTime: z.number().optional() }) } }, async (req) => {
    const a = find(session(req.params.id).id);
    const o = a.outputs.find((x) => x.id === req.params.outputId) ?? (() => { throw notFound("Output"); })();
    const inputs = Object.fromEntries(Object.entries(req.body).filter(([, v]) => v !== undefined)) as Parameters<typeof prioritise>[1];
    return { priority: prioritise(o, inputs) };
  });

  // Intent edits propagate; reviews are cleared one record at a time.
  app.post("/v1/outcome-planning/:id/art/intents/:intentId/edit", { schema: { params: z.object({ id: Id, intentId: Id }), body: z.object({ title: z.string().trim().min(1).max(200).optional(), currentState: Text.optional(), futureState: Text.optional(), strategy: Text.optional(), problems: z.array(z.string().max(300)).max(20).optional() }) } }, async (req) => {
    require(req, "plan");
    const s = session(req.params.id);
    const a = find(s.id);
    let updated: AiNativeArt;
    try {
      const patch = Object.fromEntries(Object.entries(req.body).filter(([, v]) => v !== undefined)) as Parameters<typeof editIntent>[2];
      updated = editIntent(a, req.params.intentId, patch, store.now().toISOString());
    } catch (e) {
      throw notFound((e as Error).message.replace(/\.$/, ""));
    }
    updated = { ...updated, updatedAt: store.now().toISOString() };
    put(updated);
    await store.commit(req.principal, "ai-native.intent", { session: s.id, intent: req.params.intentId, version: updated.intents.find((i) => i.id === req.params.intentId)?.version });
    return { art: updated, derived: derived(updated, s) };
  });

  app.post("/v1/outcome-planning/:id/art/reviews/:recordId/clear", { schema: { params: z.object({ id: Id, recordId: Id }) } }, async (req) => {
    require(req, "plan");
    const s = session(req.params.id);
    const a = find(s.id);
    if (!a.specs.some((x) => x.id === req.params.recordId) && !a.contexts.some((x) => x.id === req.params.recordId)) throw notFound("Record");
    const updated = { ...clearReview(a, req.params.recordId, store.now().toISOString()), updatedAt: store.now().toISOString() };
    put(updated);
    await store.commit(req.principal, "ai-native.review-cleared", { session: s.id, record: req.params.recordId });
    return { art: updated, derived: derived(updated, s) };
  });

  // The Sense and Respond agenda, pulled from data.
  app.get("/v1/outcome-planning/:id/art/sense-respond/:iteration", { schema: { params: z.object({ id: Id, iteration: z.coerce.number().int().min(1).max(30) }) } }, async (req) => {
    const s = session(req.params.id);
    const a = find(s.id);
    return { agenda: senseRespondAgenda(a, s, req.params.iteration, { krHistory: a.krHistory }) };
  });
}
