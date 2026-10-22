// SAFe canvases: LACE mission, portfolio canvas (current and future), SWOT, TOWS, portfolio
// vision, development value stream and ART canvases, ART launch readiness, epic hypothesis,
// Lean business case, feature and enabler canvases. Reads are open; writes need "plan".

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  CANVAS_TYPES,
  artCanvasFrom,
  canvasChevrons,
  canvasType,
  dvsCanvasFrom,
  emptyCanvas,
  futureStateFrom,
  launchReadiness,
  towsSuggestions,
  wsjfOf,
  type Canvas,
  type CanvasTypeId,
} from "@trainyard/core";
import { require } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Store } from "./store.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

const Id = z.string().min(1).max(120).regex(/^[A-Za-z0-9._:-]+$/, "letters, digits, . _ : - only");
const TypeId = z.enum(CANVAS_TYPES.map((t) => t.id) as [CanvasTypeId, ...CanvasTypeId[]]);
const Body = z.object({
  type: TypeId,
  title: z.string().trim().min(1).max(200),
  state: z.enum(["current", "future"]).optional(),
  links: z.object({ identificationId: Id.optional(), devStreamId: Id.optional(), artId: Id.optional(), sourceCanvasIds: z.array(Id).max(10).optional() }).optional(),
  fields: z.record(z.string().max(60), z.unknown()),
});

let seq = 0;
const newId = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`;

export function registerCanvasRoutes(app: App, store: Store) {
  const list = () => (store.state.canvases ??= []);
  const find = (id: string) => list().find((c) => c.id === id) ?? (() => { throw notFound("Canvas"); })();
  const vsiOf = (c: Canvas) => store.state.valueStreams?.identifications.find((v) => v.id === c.links?.identificationId) ?? store.state.valueStreams?.identifications[0];
  const view = (c: Canvas) => {
    const def = canvasType(c.type)!;
    const vsi = vsiOf(c);
    const chevrons = Object.fromEntries(def.sections.filter((s) => s.kind === "chevrons").map((s) => [s.key, canvasChevrons(c, vsi, s.chevrons ?? "operational")]));
    const wsjf = Object.fromEntries(def.sections.filter((s) => s.kind === "wsjf").map((s) => [s.key, wsjfOf(c.fields[s.key] as Record<string, string> | undefined)]));
    return { ...c, derived: { chevrons, wsjf, ...(c.type === "art-launch" ? { readiness: launchReadiness(c, store.now().toISOString()) } : {}) } };
  };
  const save = async (req: { principal: import("./auth.js").Principal }, c: Canvas, action: string) => {
    const exists = list().some((x) => x.id === c.id);
    store.state.canvases = exists ? list().map((x) => (x.id === c.id ? c : x)) : [...list(), c];
    await store.commit(req.principal, action, { id: c.id, type: c.type });
  };

  app.get("/v1/canvases", async () => ({ types: CANVAS_TYPES, canvases: list().map((c) => ({ id: c.id, type: c.type, title: c.title, state: c.state, updatedAt: c.updatedAt })) }));
  app.get("/v1/canvases/:id", { schema: { params: z.object({ id: Id }) } }, async (req) => ({ canvas: view(find(req.params.id)), type: canvasType(find(req.params.id).type) }));

  app.post("/v1/canvases", { schema: { body: z.object({ type: TypeId, title: z.string().trim().min(1).max(200).optional() }) } }, async (req, reply) => {
    require(req, "plan");
    const def = canvasType(req.body.type)!;
    const c = emptyCanvas(req.body.type, newId("canvas"), req.body.title ?? def.name, store.now().toISOString());
    await save(req, c, "canvas.create");
    return reply.code(201).send({ canvas: view(c) });
  });

  app.put("/v1/canvases/:id", { bodyLimit: 2 * 1024 * 1024, schema: { params: z.object({ id: Id }), body: Body } }, async (req) => {
    require(req, "plan");
    const def = canvasType(req.body.type)!;
    const unknown = Object.keys(req.body.fields).filter((k) => !def.sections.some((s) => s.key === k));
    if (unknown.length) throw new ApiError(422, "UNKNOWN_SECTIONS", `${def.name} has no section ${unknown.map((k) => `"${k}"`).join(", ")}.`);
    const prev = list().find((c) => c.id === req.params.id);
    const c: Canvas = {
      id: req.params.id,
      type: req.body.type,
      title: req.body.title,
      ...(req.body.state ? { state: req.body.state } : {}),
      ...(req.body.links ? { links: req.body.links as NonNullable<Canvas["links"]> } : prev?.links ? { links: prev.links } : {}),
      fields: req.body.fields as Canvas["fields"],
      updatedAt: store.now().toISOString(),
    };
    await save(req, c, prev ? "canvas.update" : "canvas.create");
    return { canvas: view(c) };
  });

  app.delete("/v1/canvases/:id", { schema: { params: z.object({ id: Id }) } }, async (req, reply) => {
    require(req, "plan");
    find(req.params.id);
    store.state.canvases = list().filter((c) => c.id !== req.params.id);
    await store.commit(req.principal, "canvas.delete", { id: req.params.id });
    return reply.code(204).send();
  });

  app.post("/v1/canvases/from-identification", { schema: { body: z.object({ identificationId: Id, kind: z.enum(["dvs", "art"]), refId: Id }) } }, async (req, reply) => {
    require(req, "plan");
    const vsi = store.state.valueStreams?.identifications.find((v) => v.id === req.body.identificationId);
    if (!vsi) throw notFound("Value stream identification");
    let c: Canvas;
    try {
      c = req.body.kind === "dvs" ? dvsCanvasFrom(vsi, req.body.refId, newId("canvas-dvs"), store.now().toISOString()) : artCanvasFrom(vsi, req.body.refId, newId("canvas-art"), store.now().toISOString());
    } catch (e) {
      throw new ApiError(404, "NOT_FOUND", (e as Error).message);
    }
    await save(req, c, "canvas.create");
    return reply.code(201).send({ canvas: view(c) });
  });

  app.get("/v1/canvases/:id/tows-suggestions", { schema: { params: z.object({ id: Id }) } }, async (req) => {
    const swot = find(req.params.id);
    if (swot.type !== "swot") throw new ApiError(422, "NOT_SWOT", "TOWS suggestions come from a SWOT canvas.");
    return { suggestions: towsSuggestions(swot) };
  });

  app.post("/v1/canvases/future-state", { schema: { body: z.object({ currentId: Id, towsId: Id }) } }, async (req, reply) => {
    require(req, "plan");
    const current = find(req.body.currentId);
    const tows = find(req.body.towsId);
    if (current.type !== "portfolio-canvas") throw new ApiError(422, "NOT_PORTFOLIO_CANVAS", "Pick the current-state portfolio canvas.");
    if (tows.type !== "tows") throw new ApiError(422, "NOT_TOWS", "Pick a TOWS canvas.");
    const { canvas, vision } = futureStateFrom(current, tows, { canvas: newId("canvas-future"), vision: newId("canvas-vision") }, store.now().toISOString());
    store.state.canvases = [...list(), canvas, vision];
    await store.commit(req.principal, "canvas.future-state", { from: current.id, tows: tows.id, canvas: canvas.id, vision: vision.id });
    return reply.code(201).send({ canvas: view(canvas), vision: view(vision) });
  });
}
