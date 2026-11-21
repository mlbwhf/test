// Azure DevOps on the Kanban and team boards: a workspace connects one organization and project
// (the token sealed like the other connections), a board is linked to a work item type, and from
// then on its cards are work items. Pulling brings the tracker's items in; adding a card creates a
// work item; changing a card (title, state, kind, size, value, iteration) is written to Azure
// DevOps before it is kept here, so the two never disagree silently.

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { ADO_NAME, AdoBoardsClient, TrackerHttpError, type AdoCard, type AdoFields, type AdoState, type FetchLike } from "@trainyard/connectors";
import { KANBAN_LEVELS, kanbanLevelOf, type Board, type KanbanItem, type KanbanLevel, type KanbanSpec, type StateOp } from "@trainyard/core";
import { require } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { SecretBox } from "./secrets.js";
import type { Store } from "./store.js";

type App = FastifyInstance<any, any, any, any, ZodTypeProvider>;

/** The workspace's Azure DevOps connection; the token is sealed. */
export interface AdoConnection {
  organization: string;
  project: string;
  sealed: string;
  /** The project's name as Azure DevOps returned it when the connection was checked. */
  account: string;
  createdBy: string;
  createdAt: string;
}

/** How one board is linked: kept in the board's `fields.ado`. */
export interface AdoBoardLink {
  /** The work item type the cards are, e.g. "Epic", "Feature", "User Story". */
  type: string;
  areaPath?: string;
  /** The Azure DevOps state each board state writes, by board state index. */
  states: string[];
  /** Team board: the iteration paths of Iteration 1 to 4 and the IP iteration, in order. */
  iterations?: string[];
  linkedAt: string;
  pulledAt?: string;
}

type Item = KanbanItem & { adoId?: number; url?: string; rev?: number; iter?: number };
const levelOf = (b: Board): KanbanLevel | null => (b.fields?.teamBoard ? "team" : kanbanLevelOf(b));
const linkOf = (b: Board): AdoBoardLink | null => {
  const l = b.fields?.ado as AdoBoardLink | undefined;
  return l && typeof l === "object" && typeof l.type === "string" && Array.isArray(l.states) ? l : null;
};
// Kinds that Azure DevOps has no field for are carried as a tag.
const TAG: Record<string, string> = { compliance: "Compliance", spike: "Spike" };
const ourTags = new Set(Object.values(TAG).map((t) => t.toLowerCase()));

/** The Azure DevOps state each board state should write, when the project's states are known: by name, else by category. */
export function suggestStates(spec: KanbanSpec, states: AdoState[]): string[] {
  const live = states.filter((s) => s.category !== "Removed");
  const by = (cat: string) => live.filter((s) => s.category === cat).map((s) => s.name);
  const proposed = by("Proposed"), progress = by("InProgress"), resolved = by("Resolved"), done = by("Completed");
  const first = proposed[0] ?? live[0]?.name ?? "New", last = done[done.length - 1] ?? live[live.length - 1]?.name ?? first;
  const build = spec.states.map((s, i) => (s.build ? i : -1)).filter((i) => i >= 0);
  return spec.states.map((s, i) => {
    const same = live.find((x) => x.name.toLowerCase() === s.name.toLowerCase());
    if (same) return same.name;
    if (i === spec.states.length - 1) return last;
    if (s.build) {
      const pos = build.indexOf(i), pool = [...progress, ...resolved];
      return pool[Math.min(pos, pool.length - 1)] ?? progress[0] ?? first;
    }
    // Before the build states: the proposed states in order, the last of them repeated.
    return proposed[Math.min(i, proposed.length - 1)] ?? first;
  });
}

/** The board state a work item belongs in: where it already is if that still matches, else the first board state that writes its Azure DevOps state. */
export function boardStateFor(link: AdoBoardLink, adoState: string, current?: number): number {
  if (current !== undefined && link.states[current] === adoState) return current;
  const i = link.states.indexOf(adoState);
  return i >= 0 ? i : (current ?? 0);
}

const kindOf = (spec: KanbanSpec, c: AdoCard): string => {
  const tags = new Set(c.tags.map((t) => t.toLowerCase()));
  for (const [kind, tag] of Object.entries(TAG)) if (spec.types[kind] && tags.has(tag.toLowerCase())) return kind;
  return c.valueArea === "Architectural" && spec.types.enabler ? "enabler" : "business";
};

/** A work item as a card, keeping what only the board knows (its fields, its exact state) from the card it replaces. */
export function cardFromAdo(spec: KanbanSpec, link: AdoBoardLink, c: AdoCard, old?: Item): Item {
  const team = spec.level === "team", size = team ? c.storyPoints : c.effort;
  const iter = link.iterations && c.iterationPath ? link.iterations.indexOf(c.iterationPath) + 1 : 0;
  const { size: _s, bv: _b, tc: _t, ...kept } = old ?? ({} as Item);
  return {
    ...kept,
    id: old?.id ?? `ado-${c.id}`,
    name: c.title,
    type: kindOf(spec, c),
    state: boardStateFor(link, c.state, old?.state),
    ...(size !== undefined ? { size } : {}),
    ...(c.businessValue !== undefined ? { bv: c.businessValue } : {}),
    ...(c.timeCriticality !== undefined ? { tc: c.timeCriticality } : {}),
    ...(team ? { iter } : {}),
    adoId: c.id,
    url: c.url,
    rev: c.rev,
  };
}

/** What a change to a card writes to Azure DevOps. Only the fields the change touches. */
export function adoFieldsFor(spec: KanbanSpec, link: AdoBoardLink, project: string, before: Partial<Item>, change: Record<string, unknown>, tags: string[] = []): AdoFields {
  const out: AdoFields = {}, team = spec.level === "team";
  const num = (v: unknown) => (typeof v === "number" && v > 0 ? v : undefined);
  if (typeof change.name === "string" && change.name !== before.name) out.title = change.name;
  if (typeof change.state === "number" && change.state !== before.state) {
    const to = link.states[change.state];
    // Several board states may write the same tracker state; then there is nothing to write.
    if (to && to !== (before.state !== undefined ? link.states[before.state] : undefined)) out.state = to;
  }
  if ("size" in change && change.size !== before.size) out[team ? "storyPoints" : "effort"] = num(change.size);
  if ("bv" in change && change.bv !== before.bv) out.businessValue = num(change.bv);
  if ("tc" in change && change.tc !== before.tc) out.timeCriticality = num(change.tc);
  if (team && typeof change.iter === "number" && change.iter !== before.iter && link.iterations) out.iterationPath = link.iterations[change.iter - 1] ?? project;
  if (typeof change.type === "string" && change.type !== before.type) {
    out.valueArea = change.type === "enabler" ? "Architectural" : "Business";
    const tag = TAG[change.type];
    out.tags = [...tags.filter((t) => !ourTags.has(t.toLowerCase())), ...(tag ? [tag] : [])];
  }
  return out;
}

export function adoBoards(store: Store, secrets: SecretBox, fetchFn?: FetchLike) {
  const s = () => store.state as typeof store.state & { ado?: AdoConnection };
  const publicConnection = (c: AdoConnection | undefined) => (c ? { organization: c.organization, project: c.project, account: c.account, createdAt: c.createdAt } : null);
  const clientFor = (c: { organization: string; project: string; pat: string }) => new AdoBoardsClient({ ...c, ...(fetchFn ? { fetch: fetchFn } : {}) });
  const client = () => {
    const c = s().ado;
    if (!c) throw new ApiError(409, "ADO_NOT_CONNECTED", "Azure DevOps is not connected. Connect it under Setup, Jira & Azure DevOps.");
    return clientFor({ organization: c.organization, project: c.project, pat: secrets.open(c.sealed) });
  };
  /** Azure DevOps' own refusals, said in a way the person can act on. */
  const upstream = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof ApiError) throw e;
      if (e instanceof TrackerHttpError) {
        if (e.status === 401 || e.status === 203) throw new ApiError(401, "ADO_AUTH", "Azure DevOps did not accept the token. Create a personal access token with Work Items (Read & write) and connect again.");
        if (e.status === 403) throw new ApiError(403, "ADO_FORBIDDEN", "The token may not do this in Azure DevOps. It needs Work Items (Read & write) on this project.");
        if (e.status === 404) throw new ApiError(404, "ADO_NOT_FOUND", "Azure DevOps did not find that organization, project, work item type or work item.");
        let detail = "";
        try {
          detail = String((JSON.parse(e.body) as { message?: string }).message ?? "");
        } catch {
          // Not JSON: say only the status.
        }
        throw new ApiError(502, "ADO_REFUSED", `Azure DevOps refused the change (${e.status})${detail ? `: ${detail.slice(0, 300)}` : "."}`);
      }
      throw new ApiError(502, "ADO_UPSTREAM", e instanceof Error ? e.message.slice(0, 300) : "Azure DevOps could not be reached.");
    }
  };
  const frameOf = (b: Board) => b.frames[0] ?? (() => { throw notFound("Board frame"); })();
  const itemsOf = (b: Board): Item[] => {
    const st = (frameOf(b).state ??= {});
    return Array.isArray(st.items) ? (st.items as Item[]) : [];
  };

  const pull = async (b: Board, link: AdoBoardLink) => {
    const spec = KANBAN_LEVELS[levelOf(b)!];
    const cards = await upstream(() => client().cards(link.type, link.areaPath));
    const mine = itemsOf(b), byAdo = new Map(mine.filter((i) => i.adoId !== undefined).map((i) => [i.adoId!, i]));
    const seen = new Set(cards.map((c) => c.id));
    let added = 0, updated = 0;
    const next: Item[] = cards.map((c) => {
      const old = byAdo.get(c.id), card = cardFromAdo(spec, link, c, old);
      if (!old) added++;
      else if (old.rev !== c.rev) updated++;
      return card;
    });
    // Cards never sent to Azure DevOps stay; cards whose work item is gone or out of scope leave the board.
    const local = mine.filter((i) => i.adoId === undefined), removed = mine.filter((i) => i.adoId !== undefined && !seen.has(i.adoId)).length;
    (frameOf(b).state ??= {}).items = [...next, ...local];
    link.pulledAt = store.now().toISOString();
    b.fields = { ...(b.fields ?? {}), ado: link };
    return { added, updated, removed, total: next.length };
  };

  return {
    /** The routes that connect the workspace and link a board; `board` finds a board the caller may edit. */
    routes(app: App, board: (req: FastifyRequest, id: string) => Board) {
      const Id = z.string().min(1).max(200);
      app.get("/v1/ado", async () => ({ connection: publicConnection(s().ado), persistent: secrets.persistent }));
      app.put("/v1/ado", { schema: { body: z.object({ organization: z.string().trim().regex(ADO_NAME), project: z.string().trim().regex(ADO_NAME), pat: z.string().min(20).max(4000) }) } }, async (req) => {
        require(req, "sync");
        const p = await upstream(() => clientFor(req.body).project());
        s().ado = { organization: req.body.organization, project: req.body.project, sealed: secrets.seal(req.body.pat), account: p.name, createdBy: req.principal.userId, createdAt: store.now().toISOString() };
        await store.commit(req.principal, "ado.connect", { organization: req.body.organization, project: req.body.project });
        return { connection: publicConnection(s().ado) };
      });
      app.delete("/v1/ado", async (req, reply) => {
        require(req, "sync");
        delete s().ado;
        await store.commit(req.principal, "ado.disconnect", {});
        return reply.code(204).send();
      });
      // What a link can choose from: the project's work item types and iterations, and a type's states.
      app.get("/v1/ado/meta", { schema: { querystring: z.object({ type: z.string().max(120).optional(), level: z.enum(["portfolio", "solution", "art", "team"]).optional() }) } }, async (req) => {
        require(req, "plan");
        const c = client();
        const [types, iterations] = await upstream(() => Promise.all([c.types(), c.iterations()]));
        const states = req.query.type ? await upstream(() => c.states(req.query.type!)) : [];
        return { types, iterations, states, suggested: req.query.type && req.query.level ? suggestStates(KANBAN_LEVELS[req.query.level], states) : [] };
      });
      app.get("/v1/boards/:id/ado", { schema: { params: z.object({ id: Id }) } }, async (req) => {
        require(req, "plan");
        const b = board(req, req.params.id);
        return { link: linkOf(b), level: levelOf(b), connection: publicConnection(s().ado) };
      });
      app.put("/v1/boards/:id/ado", { schema: { params: z.object({ id: Id }), body: z.object({ type: z.string().trim().min(1).max(120), areaPath: z.string().trim().max(400).optional(), states: z.array(z.string().trim().min(1).max(120)).min(2).max(12), iterations: z.array(z.string().trim().min(1).max(400)).max(5).optional() }) } }, async (req) => {
        require(req, "plan");
        const b = board(req, req.params.id), level = levelOf(b);
        if (!level) throw new ApiError(422, "NOT_A_KANBAN", "Only the Kanban boards and the team PI board link to Azure DevOps.");
        if (req.body.states.length !== KANBAN_LEVELS[level].states.length) throw new ApiError(422, "STATES_MISMATCH", `This board has ${KANBAN_LEVELS[level].states.length} states; choose an Azure DevOps state for each.`);
        const link: AdoBoardLink = { type: req.body.type, states: req.body.states, ...(req.body.areaPath ? { areaPath: req.body.areaPath } : {}), ...(req.body.iterations?.length ? { iterations: req.body.iterations } : {}), linkedAt: store.now().toISOString() };
        const report = await pull(b, link);
        await store.commit(req.principal, "board.ado.link", { board: b.id, type: link.type, ...report });
        return { link, ...report };
      });
      app.post("/v1/boards/:id/ado/pull", { schema: { params: z.object({ id: Id }) } }, async (req) => {
        require(req, "plan");
        const b = board(req, req.params.id), link = linkOf(b);
        if (!link) throw new ApiError(409, "ADO_NOT_LINKED", "This board is not linked to Azure DevOps.");
        const report = await pull(b, link);
        await store.commit(req.principal, "board.ado.pull", { board: b.id, ...report });
        return { link, ...report };
      });
      // Unlinking keeps the cards as they are; they stop following Azure DevOps.
      app.delete("/v1/boards/:id/ado", { schema: { params: z.object({ id: Id }) } }, async (req, reply) => {
        require(req, "plan");
        const b = board(req, req.params.id);
        if (b.fields) delete b.fields.ado;
        await store.commit(req.principal, "board.ado.unlink", { board: b.id });
        return reply.code(204).send();
      });
    },

    /**
     * Called before a change to a linked board's cards is kept: writes it to Azure DevOps first.
     * A new card becomes a work item (the op's value gains its id); a changed card is patched.
     * Removing a card leaves the work item alone. Throws when Azure DevOps refuses, so nothing is kept.
     */
    async writeBack(b: Board, op: StateOp): Promise<void> {
      const link = linkOf(b), level = levelOf(b);
      if (!link || !level || op.key !== "items" || !s().ado) return;
      const spec = KANBAN_LEVELS[level], project = s().ado!.project;
      if (op.op === "push") {
        const v = op.value as Record<string, unknown>;
        if (typeof v.name !== "string" || !v.name.trim()) return;
        const fields = adoFieldsFor(spec, link, project, {}, { ...v, state: undefined });
        const state0 = link.states[typeof v.state === "number" ? v.state : 0];
        const made = await upstream(() => client().create(link.type, { ...fields, title: v.name as string }, link.areaPath));
        // A new work item starts in the type's first state; move it if the card starts elsewhere.
        const card = state0 && made.state !== state0 ? await upstream(() => client().update(made.id, { state: state0 })) : made;
        Object.assign(v, { adoId: card.id, url: card.url, rev: card.rev });
      } else if (op.op === "update") {
        const before = itemsOf(b).find((i) => i.id === op.id);
        if (!before || before.adoId === undefined) return;
        const fields = adoFieldsFor(spec, link, project, before, op.value);
        if (!Object.keys(fields).length) return;
        if (fields.tags) {
          // Tags are written whole, so keep the work item's other tags.
          const current = (await upstream(() => client().cards(link.type, link.areaPath))).find((c) => c.id === before.adoId);
          fields.tags = adoFieldsFor(spec, link, project, before, op.value, current?.tags ?? []).tags!;
        }
        const card = await upstream(() => client().update(before.adoId!, fields));
        op.value.rev = card.rev;
      }
    },
  };
}
