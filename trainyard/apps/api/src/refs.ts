// The link layer: any card on any board can point at any record in the workspace (a feature,
// an epic, a risk, a milestone, an outcome, a canvas, another board, a card on another board),
// and the card shows that record live. Resolve turns references into what to show; search finds
// a record to link; backlinks say where a record is already shown. Card types are the
// structured vocabulary behind cards.

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { BUILTIN_CARD_TYPES, refKey, withOverrides, type CardType, type Ref, type RefKind } from "@trainyard/core";
import { require } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Store, StoreState } from "./store.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

export const REF_KINDS: RefKind[] = ["item", "epic", "risk", "dependency", "milestone", "objective", "outcome", "output", "initiative", "canvas", "board", "card", "team", "person"];

export interface RefSummary {
  ref: Ref;
  kind: RefKind;
  title: string;
  subtitle?: string;
  status?: string;
  /** Card colour for the kind. */
  color: string;
  /** Where to open it. */
  href: string;
  /** A few facts worth showing on the card and in the side panel. */
  facts: Record<string, string | number>;
  /** For views: the things inside, to draw a live miniature. */
  preview?: { label: string; count: number }[];
}

const COLOR: Record<RefKind, string> = { item: "#cfe3fb", epic: "#e6e0ff", risk: "#ffe0ea", dependency: "#ffd9d3", milestone: "#ffd58a", objective: "#d9f2ef", outcome: "#e2ecd4", output: "#e8f4d6", initiative: "#ead9ff", canvas: "#ffffff", board: "#ffffff", card: "#fff6c2", team: "#eef0f3", person: "#eef0f3" };
export const KIND_LABEL: Record<RefKind, string> = { item: "Work item", epic: "Epic", risk: "Risk", dependency: "Dependency", milestone: "Milestone", objective: "PI objective", outcome: "Outcome", output: "Output", initiative: "AI initiative", canvas: "Canvas", board: "Board", card: "Card", team: "Team", person: "Person" };

/** What a reference points at right now, or null when it is gone. */
export function resolveRef(state: StoreState, ref: Ref): RefSummary | null {
  const ws = state.workspace;
  const base = (kind: RefKind, id: string, title: string, href: string, extra: Partial<RefSummary> = {}): RefSummary => ({ ref: { kind, id, ...(ref.boardId ? { boardId: ref.boardId } : {}) }, kind, title, color: COLOR[kind], href, facts: {}, ...extra });
  switch (ref.kind) {
    case "item": {
      const i = ws.items.find((x) => x.id === ref.id);
      if (!i) return null;
      const team = ws.teams.find((t) => t.id === i.teamId);
      const iter = ws.increments.flatMap((inc) => inc.iterations).find((it) => it.id === i.iterationId);
      return base("item", i.id, i.title, "/board", { subtitle: `${i.level}${team ? ` · ${team.name}` : ""}`, status: i.status, facts: { level: i.level, ...(i.estimate !== undefined ? { points: i.estimate } : {}), ...(i.businessValue !== undefined ? { "business value": i.businessValue } : {}), ...(iter ? { iteration: iter.name } : {}), ...(i.source.externalId ? { [i.source.system]: i.source.externalId } : {}) } });
    }
    case "epic": {
      const e = ws.portfolio?.epics.find((x) => x.id === ref.id);
      if (!e) return null;
      const vs = ws.portfolio?.valueStreams.find((v) => v.id === e.valueStreamId);
      const cod = e.wsjf.userBusinessValue + e.wsjf.timeCriticality + e.wsjf.riskReductionOpportunity;
      return base("epic", e.id, e.title, "/portfolio", { subtitle: `${e.kind === "enabler" ? "Enabler epic" : "Epic"}${vs ? ` · ${vs.name}` : ""}`, status: e.state, facts: { WSJF: e.wsjf.jobSize ? Math.round((cod / e.wsjf.jobSize) * 10) / 10 : 0, state: e.state } });
    }
    case "risk": {
      const r = ws.risks.find((x) => x.id === ref.id);
      return r ? base("risk", r.id, r.title, "/board", { status: r.roam, facts: { ROAM: r.roam, raised: r.raisedAt.slice(0, 10) } }) : null;
    }
    case "dependency": {
      const d = ws.dependencies.find((x) => x.id === ref.id);
      if (!d) return null;
      const p = ws.items.find((x) => x.id === d.providerId);
      const c = ws.items.find((x) => x.id === d.consumerId);
      return base("dependency", d.id, `${p?.title ?? d.providerId} → ${c?.title ?? d.consumerId}`, "/board", { status: d.status, facts: { provides: p?.title ?? "", "needed by": c?.title ?? "", status: d.status }, ...(d.note ? { subtitle: d.note } : {}) });
    }
    case "milestone": {
      for (const inc of ws.increments) {
        const m = (inc.milestones ?? []).find((x) => x.id === ref.id);
        if (m) {
          const it = inc.iterations.find((x) => x.id === m.iterationId);
          return base("milestone", m.id, m.label, "/board", { subtitle: `${m.kind} · ${inc.name}${it ? ` · ${it.name}` : " · after the PI"}`, status: m.kind, facts: { kind: m.kind, ...(m.date ? { date: m.date } : {}), ...(it ? { iteration: it.name } : {}) } });
        }
      }
      return null;
    }
    case "objective": {
      const o = ws.objectives.find((x) => x.id === ref.id);
      if (!o) return null;
      const team = ws.teams.find((t) => t.id === o.teamId);
      return base("objective", o.id, o.title, "/board", { subtitle: `${team?.name ?? o.teamId} · ${o.incrementId}`, status: o.committed ? "committed" : "uncommitted", facts: { "planned BV": o.plannedValue, ...(o.actualValue !== undefined ? { "actual BV": o.actualValue } : {}) } });
    }
    case "outcome": {
      for (const sess of state.outcomePlanning ?? []) {
        const o = sess.outcomes.find((x) => x.id === ref.id);
        if (o) return base("outcome", o.id, o.title, "/outcome-planning", { subtitle: `${o.level} outcome · ${sess.artName} ${sess.piName}`, ...(o.status ? { status: o.status } : {}), facts: { "key results": o.keyResults.length, ...(o.ambition ? { ambition: o.ambition } : {}) } });
      }
      return null;
    }
    case "output": {
      for (const art of state.aiNativeArts ?? []) {
        const o = art.outputs.find((x) => x.id === ref.id);
        if (o) return base("output", o.id, o.title, "/outcome-planning", { subtitle: `${o.type} · iteration ${o.iteration}`, status: o.stage, facts: { type: o.type, stage: o.stage } });
      }
      return null;
    }
    case "initiative": {
      const i = state.initiatives.find((x) => x.id === ref.id);
      return i ? base("initiative", i.id, i.name, `/ai/${encodeURIComponent(i.id)}`, { subtitle: `AI initiative · ${i.stage}`, status: i.stage, facts: { stage: i.stage, "risk tier": i.riskTier } }) : null;
    }
    case "canvas": {
      const c = (state.canvases ?? []).find((x) => x.id === ref.id);
      if (!c) return null;
      const filled = Object.values(c.fields).filter((v) => (Array.isArray(v) ? v.length : typeof v === "string" ? v.trim() : v)).length;
      return base("canvas", c.id, c.title, `/canvases/${encodeURIComponent(c.id)}`, { subtitle: `${c.type}${c.state ? ` · ${c.state} state` : ""}`, facts: { sections: filled }, preview: Object.entries(c.fields).slice(0, 6).map(([k, v]) => ({ label: k, count: Array.isArray(v) ? v.length : v ? 1 : 0 })) });
    }
    case "board": {
      const b = (ws.boards ?? []).find((x) => x.id === ref.id);
      if (!b) return null;
      return base("board", b.id, b.name, `/boards/${encodeURIComponent(b.id)}`, { subtitle: `${b.isTemplate ? "template" : b.origin.system} · ${b.nodes.length} cards`, facts: { cards: b.nodes.length, frames: b.frames.length, connectors: b.edges.length }, preview: b.frames.slice(0, 8).map((f) => ({ label: f.title, count: b.nodes.filter((n) => n.frameId === f.id && !n.fields.placeholder).length })) });
    }
    case "card": {
      const b = (ws.boards ?? []).find((x) => x.id === ref.boardId);
      const n = b?.nodes.find((x) => x.id === ref.id);
      if (!b || !n) return null;
      const frame = b.frames.find((f) => f.id === n.frameId);
      return { ref: { kind: "card", id: n.id, boardId: b.id }, kind: "card", title: n.text, subtitle: `${b.name}${frame ? ` · ${frame.title}` : ""}`, color: n.color ?? COLOR.card, href: `/boards/${encodeURIComponent(b.id)}`, facts: { board: b.name, ...(typeof n.fields.storyPoints === "number" ? { points: n.fields.storyPoints } : {}) } };
    }
    case "team": {
      const t = ws.teams.find((x) => x.id === ref.id);
      return t ? base("team", t.id, t.name, "/board", { facts: { members: t.memberIds.length } }) : null;
    }
    case "person": {
      const p = ws.people.find((x) => x.id === ref.id);
      return p ? base("person", p.id, p.name, "/users", { subtitle: p.roles.join(", "), facts: {} }) : null;
    }
  }
}

/** Every record a card could link to, as summaries, for search. */
export function allRefs(state: StoreState): RefSummary[] {
  const ws = state.workspace;
  const refs: Ref[] = [
    ...ws.items.map((i) => ({ kind: "item" as const, id: i.id })),
    ...(ws.portfolio?.epics ?? []).map((e) => ({ kind: "epic" as const, id: e.id })),
    ...ws.risks.map((r) => ({ kind: "risk" as const, id: r.id })),
    ...ws.dependencies.map((d) => ({ kind: "dependency" as const, id: d.id })),
    ...ws.increments.flatMap((inc) => (inc.milestones ?? []).map((m) => ({ kind: "milestone" as const, id: m.id }))),
    ...ws.objectives.map((o) => ({ kind: "objective" as const, id: o.id })),
    ...(state.outcomePlanning ?? []).flatMap((s) => s.outcomes.map((o) => ({ kind: "outcome" as const, id: o.id }))),
    ...(state.aiNativeArts ?? []).flatMap((a) => a.outputs.map((o) => ({ kind: "output" as const, id: o.id }))),
    ...state.initiatives.map((i) => ({ kind: "initiative" as const, id: i.id })),
    ...(state.canvases ?? []).map((c) => ({ kind: "canvas" as const, id: c.id })),
    ...(ws.boards ?? []).map((b) => ({ kind: "board" as const, id: b.id })),
    ...(ws.boards ?? []).flatMap((b) => b.nodes.filter((n) => n.text.trim() && !n.ref).map((n) => ({ kind: "card" as const, id: n.id, boardId: b.id }))),
    ...ws.teams.map((t) => ({ kind: "team" as const, id: t.id })),
    ...ws.people.map((p) => ({ kind: "person" as const, id: p.id })),
  ];
  return refs.map((r) => resolveRef(state, r)).filter((x): x is RefSummary => !!x);
}

export function searchRefs(state: StoreState, q: string, kinds?: RefKind[], limit = 30): RefSummary[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const pool = allRefs(state).filter((r) => !kinds || kinds.includes(r.kind));
  if (!terms.length) return pool.slice(0, limit);
  const score = (r: RefSummary) => {
    const hay = `${r.title} ${r.subtitle ?? ""} ${Object.values(r.facts).join(" ")} ${r.ref.id}`.toLowerCase();
    let s = 0;
    for (const t of terms) {
      if (!hay.includes(t)) return 0;
      s += r.title.toLowerCase().includes(t) ? 3 : 1;
      if (r.title.toLowerCase().startsWith(t)) s += 2;
    }
    return s;
  };
  return pool.map((r) => ({ r, s: score(r) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.r);
}

export interface Backlink {
  boardId: string;
  boardName: string;
  nodeId: string;
  frame?: string;
  /** "link" when the card points at the record, "view" when a board embeds it. */
  as: "link" | "view";
}

/** Where a record is shown: every card on every board that points at it. */
export function backlinks(state: StoreState, ref: Ref): Backlink[] {
  const key = refKey(ref);
  const out: Backlink[] = [];
  for (const b of state.workspace.boards ?? []) {
    for (const n of b.nodes) {
      if (n.ref && refKey(n.ref) === key) out.push({ boardId: b.id, boardName: b.name, nodeId: n.id, ...(n.frameId ? { frame: b.frames.find((f) => f.id === n.frameId)?.title ?? "" } : {}), as: n.kind === "view" ? "view" : "link" });
    }
  }
  return out;
}

/** Edits on a linked card go back to the record: the title, for the kinds that have one. */
export function writeThrough(state: StoreState, ref: Ref, text: string): boolean {
  const ws = state.workspace;
  const t = text.trim();
  if (!t) return false;
  switch (ref.kind) {
    case "item": { const i = ws.items.find((x) => x.id === ref.id); if (i) { i.title = t; return true; } return false; }
    case "epic": { const e = ws.portfolio?.epics.find((x) => x.id === ref.id); if (e) { e.title = t; return true; } return false; }
    case "risk": { const r = ws.risks.find((x) => x.id === ref.id); if (r) { r.title = t; return true; } return false; }
    case "milestone": { for (const inc of ws.increments) { const m = (inc.milestones ?? []).find((x) => x.id === ref.id); if (m) { m.label = t; return true; } } return false; }
    case "objective": { const o = ws.objectives.find((x) => x.id === ref.id); if (o) { o.title = t; return true; } return false; }
    case "outcome": { for (const s of state.outcomePlanning ?? []) { const o = s.outcomes.find((x) => x.id === ref.id); if (o) { o.title = t; return true; } } return false; }
    case "canvas": { const c = (state.canvases ?? []).find((x) => x.id === ref.id); if (c) { c.title = t; return true; } return false; }
    case "board": { const b = (ws.boards ?? []).find((x) => x.id === ref.id); if (b) { b.name = t; return true; } return false; }
    case "card": { const n = (ws.boards ?? []).find((x) => x.id === ref.boardId)?.nodes.find((x) => x.id === ref.id); if (n) { n.text = t; return true; } return false; }
    default: return false;
  }
}

export const cardTypes = (state: StoreState): CardType[] => [...withOverrides(BUILTIN_CARD_TYPES, state.cardTypeOverrides), ...(state.cardTypes ?? [])];

const RefBody = z.object({ kind: z.enum(REF_KINDS as [RefKind, ...RefKind[]]), id: z.string().min(1).max(200), boardId: z.string().min(1).max(200).optional() });
const FieldBody = z.object({ key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/), label: z.string().trim().min(1).max(60), type: z.enum(["text", "number", "select", "date", "person", "ref", "url"]), options: z.array(z.string().trim().min(1).max(60)).max(30).optional(), refKinds: z.array(z.enum(REF_KINDS as [RefKind, ...RefKind[]])).optional(), required: z.boolean().optional() });
const TypeBody = z.object({ name: z.string().trim().min(1).max(60), color: z.string().regex(/^#[0-9a-fA-F]{6}$/), badge: z.string().trim().max(16), blurb: z.string().trim().max(300).default(""), fields: z.array(FieldBody).max(30), refKind: z.enum(REF_KINDS as [RefKind, ...RefKind[]]).optional() });

const asRef = (r: { kind: RefKind; id: string; boardId?: string | undefined }): Ref => ({ kind: r.kind, id: r.id, ...(r.boardId ? { boardId: r.boardId } : {}) });

export function registerRefRoutes(app: App, store: Store) {
  app.get("/v1/search", { schema: { querystring: z.object({ q: z.string().max(200).default(""), kinds: z.string().max(300).optional(), limit: z.coerce.number().int().min(1).max(100).default(30) }) } }, async (req) => {
    const kinds = req.query.kinds ? (req.query.kinds.split(",").filter((k): k is RefKind => (REF_KINDS as string[]).includes(k))) : undefined;
    return { results: searchRefs(store.state, req.query.q, kinds, req.query.limit), kinds: REF_KINDS.map((k) => ({ kind: k, label: KIND_LABEL[k] })) };
  });

  app.post("/v1/refs/resolve", { schema: { body: z.object({ refs: z.array(RefBody).max(500) }) } }, async (req) => ({
    refs: Object.fromEntries(req.body.refs.map((r) => [refKey(asRef(r)), resolveRef(store.state, asRef(r))])),
  }));

  app.get("/v1/refs/backlinks", { schema: { querystring: RefBody } }, async (req) => {
    const ref = asRef(req.query);
    const summary = resolveRef(store.state, ref);
    if (!summary) throw notFound(KIND_LABEL[req.query.kind]);
    return { record: summary, backlinks: backlinks(store.state, ref) };
  });

  // ---- card types --------------------------------------------------------------------
  app.get("/v1/card-types", async () => ({ types: cardTypes(store.state) }));
  app.post("/v1/card-types", { schema: { body: TypeBody.extend({ id: z.string().regex(/^[a-z][a-z0-9-]{1,40}$/).optional() }) } }, async (req, reply) => {
    require(req, "model");
    const id = req.body.id ?? req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (cardTypes(store.state).some((t) => t.id === id)) throw new ApiError(409, "TYPE_EXISTS", `A card type "${id}" already exists.`);
    const t: CardType = { id, name: req.body.name, color: req.body.color, badge: req.body.badge, blurb: req.body.blurb, fields: req.body.fields.map((f) => ({ ...f, ...(f.options ? { options: f.options } : {}) })) as CardType["fields"], ...(req.body.refKind ? { refKind: req.body.refKind } : {}) };
    store.state.cardTypes = [...(store.state.cardTypes ?? []), t];
    await store.commit(req.principal, "card-type.create", { id });
    return reply.code(201).send({ type: t });
  });
  app.put("/v1/card-types/:id", { schema: { params: z.object({ id: z.string().min(1).max(60) }), body: TypeBody } }, async (req) => {
    require(req, "model");
    if (BUILTIN_CARD_TYPES.some((t) => t.id === req.params.id)) {
      // Built-in types keep their fields and meaning; their look is the admin's.
      const o = { id: req.params.id, color: req.body.color, badge: req.body.badge, blurb: req.body.blurb };
      store.state.cardTypeOverrides = [...(store.state.cardTypeOverrides ?? []).filter((x) => x.id !== o.id), o];
      await store.commit(req.principal, "card-type.recolour", { id: o.id, color: o.color });
      return { type: cardTypes(store.state).find((t) => t.id === o.id) };
    }
    const prev = (store.state.cardTypes ?? []).find((t) => t.id === req.params.id) ?? (() => { throw notFound("Card type"); })();
    const t: CardType = { ...prev, name: req.body.name, color: req.body.color, badge: req.body.badge, blurb: req.body.blurb, fields: req.body.fields as CardType["fields"], ...(req.body.refKind ? { refKind: req.body.refKind } : {}) };
    if (!req.body.refKind) delete t.refKind;
    store.state.cardTypes = (store.state.cardTypes ?? []).map((x) => (x.id === t.id ? t : x));
    await store.commit(req.principal, "card-type.update", { id: t.id });
    return { type: t };
  });
  app.delete("/v1/card-types/:id", { schema: { params: z.object({ id: z.string().min(1).max(60) }) } }, async (req, reply) => {
    require(req, "model");
    if (BUILTIN_CARD_TYPES.some((t) => t.id === req.params.id)) throw new ApiError(409, "BUILTIN", "Built-in card types cannot be removed.");
    const before = (store.state.cardTypes ?? []).length;
    store.state.cardTypes = (store.state.cardTypes ?? []).filter((t) => t.id !== req.params.id);
    if (store.state.cardTypes.length === before) throw notFound("Card type");
    await store.commit(req.principal, "card-type.delete", { id: req.params.id });
    return reply.code(204).send();
  });
}
