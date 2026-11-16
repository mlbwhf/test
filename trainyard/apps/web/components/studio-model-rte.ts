// What the RTE class's lesson 6 assessment and lesson 7 boards show and do, ported from the design's
// logic (Trainyard Class Studio.dc.html, renderVals: ttaV, tuckV, facV, susV) so the generated layouts
// in studio-views-rte.tsx behave as designed. The assessment's statements are the course's own (core RTE_TTA).

import { RTE_TTA, RTE_TUCKMAN_QUESTIONS, type StateOp } from "@trainyard/core";
import { STK, type StudioCtx } from "./studio-model";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Item = { id: string; text: string };
type Key = React.KeyboardEvent<HTMLInputElement>;
type Blur = React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>;
const ROT = ["-1.5deg", "1deg", "-.5deg", "1.8deg"];

export const RTE_KINDS = new Set(["tta", "tuck", "fac", "sus"]);

// Dimension: name, colour, tint.
const TTA_C = [["#0a85a3", "#bfe3ec"], ["#c98b2f", "#f3dfbf"], ["#1b6038", "#c6e2cf"]];
const TTA_D: [string, string, string][] = RTE_TTA.dimensions.map((n, i) => [n, TTA_C[i]![0]!, TTA_C[i]![1]!]);
const TTA_S = RTE_TTA.subs, TTA_A = RTE_TTA.scale, TTA_EX = RTE_TTA.example;

/** The assessment's scores from its answers ("sub.statement" -> 0–5): the mean of the answered statements, N/A and blanks left out, as in the workbook. */
export function ttaScores(ans: (id: string) => number | null | undefined): { subs: (number | null)[]; dims: (number | null)[] } {
  const avg = (a: (number | null | undefined)[]) => {
    const v = a.filter((x): x is number => typeof x === "number" && x > 0);
    return v.length ? v.reduce((p, x) => p + x, 0) / v.length : null;
  };
  const flat = TTA_S.flatMap((sd, si) => sd[2].map((_, k) => ({ di: sd[0], id: si + "." + k })));
  return { subs: TTA_S.map((sd, si) => avg(sd[2].map((_, k) => ans(si + "." + k)))), dims: TTA_D.map((_, di) => avg(flat.filter((f) => f.di === di).map((f) => ans(f.id)))) };
}

// Tuckman stage: name, colour, idea prompts for each of the two questions.
const TUCK: [string, string, string[], string[]][] = [
  ["Forming", "#1a86a6", ["Polite, cautious; people wait to be told what to do", "Teams unsure how their work fits the ART", "Few cross-team conversations"], ["Share a clear ART vision and working agreements", "Run team-building in the ART launch", "Make roles and the ART events explicit"]],
  ["Storming", "#1d6b3a", ["Conflict over priorities and dependencies", "Teams blame each other for misses", "ART events feel like overhead"], ["Facilitate conflict in the open, not in hallways", "Make dependencies visible on the ART planning board", "Coach Scrum Masters/Team Coaches on conflict"]],
  ["Norming", "#a3322a", ["Working agreements are followed without reminders", "Teams help each other with impediments", "PI objectives are mostly met"], ["Step back so teams self-organize", "Grow communities of practice", "Use I&A to tackle systemic problems"]],
  ["Performing", "#c98b2f", ["Predictability in the 80–100% band", "Teams solve cross-team issues themselves", "Relentless improvement is routine"], ["Serve and remove systemic impediments", "Celebrate wins and connect them to the vision", "Challenge the ART to the next level of flow"]],
];
const TUCK_Q = RTE_TUCKMAN_QUESTIONS;
const FAC_H = ["ART Sync", "PI Planning", "the Inspect & Adapt event"];
const FAC_LIB = ["1-2-4-All", "Lean Coffee", "Fist of five", "Silent writing first", "Visible timebox", "Parking lot", "ROAM board", "Dot voting", "Round robin", "Working agreements up front", "Pre-reads sent early", "Gallery walk", "Fishbowl", "Breakout room hosts", "Check-in / check-out"];
const SUS_EV = ["PI Planning", "ART Sync", "System Demo", "Inspect & Adapt", "Iteration Review", "IP iteration", "Other"];
const SUS_SAY: [string, string, string][] = [["win", "Name the victory", "What happened, who made it happen, and why it matters"], ["vision", "Connect it to the vision", "How this win moves the ART toward its vision or PI objectives"], ["next", "Invite the next step", "What you ask the teams to do or keep doing"]];

// The technique chip being dragged onto a box (the browser's drag data is the fallback).
let facDrag: string | null = null;

export function rteModel(c: StudioCtx): Record<string, any> {
  const { S, ui, setUi } = c;
  const op = (x: StateOp) => (c.readOnly ? undefined : c.op(x));
  const list = (k: string): Item[] => (Array.isArray(S[k]) ? (S[k] as Item[]) : []);
  const str = (k: string) => (typeof S[k] === "string" ? (S[k] as string) : "");
  const set = (k: string, value: unknown) => op({ key: k, op: "set", value: value === "" || value === undefined ? null : value });
  const add = (k: string, text: string) => op({ key: k, op: "push", value: { text } });
  const push = (k: string) => (e: Key) => {
    const t = e.currentTarget;
    if (e.key === "Enter" && t.value.trim()) {
      const text = t.value.trim();
      t.value = "";
      add(k, text);
    }
  };
  const stl = (k: string) => list(k).map((x, j) => ({ t: x.text, c: STK[j % 4], rot: ROT[j % 4], del: () => op({ key: k, op: "remove", id: x.id }) }));
  const v: Record<string, any> = {};

  if (c.kind === "tta") {
    // One key holds the round: its number, the loaded example (if any); each answer is its own key in
    // that round, so people rating at once never overwrite each other and "clear" is a single change.
    const round = (S.tta ?? {}) as { e?: number; base?: Record<string, number> };
    const e = round.e ?? 0, base = round.base ?? {};
    const ans = (id: string): number | null => {
      const own = S[`a${e}:${id}`];
      const val = typeof own === "number" ? own : base[id];
      return typeof val === "number" && val >= 0 ? val : null;
    };
    const flat = TTA_S.flatMap((sd, si) => sd[2].map((t, k) => ({ si, di: sd[0], t, id: si + "." + k })));
    const { subs: subV, dims: dimV } = ttaScores(ans);
    const f2 = (x: number | null | undefined) => (x == null ? "–" : x.toFixed(1)), nAns = flat.filter((f) => ans(f.id) != null).length;
    const TR = 150, tang = (k: number) => ((-90 + (360 / 7) * k) * Math.PI) / 180, tpx = (k: number, r: number) => [r * Math.cos(tang(k)), r * Math.sin(tang(k))] as [number, number];
    const tarc = (k: number, val: number) => {
      const r = (TR * val) / 5, a = tpx(k - 0.5, r), b = tpx(k + 0.5, r);
      return "M0 0 L" + a[0].toFixed(1) + " " + a[1].toFixed(1) + " A" + r.toFixed(1) + " " + r.toFixed(1) + " 0 0 1 " + b[0].toFixed(1) + " " + b[1].toFixed(1) + " Z";
    };
    const scored = TTA_S.map((_, si) => ({ si, v: subV[si] })).filter((o): o is { si: number; v: number } => o.v != null).sort((a, b) => a.v - b.v);
    const lowStm = flat.filter((f) => (ans(f.id) ?? 0) > 0).sort((a, b) => ans(a.id)! - ans(b.id)!).slice(0, 3);
    v.tta = {
      prog: nAns + " / " + flat.length + " answered", progW: Math.round((nAns / flat.length) * 100) + "%",
      scale: TTA_A.map((a) => ({ l: a[1], sh: a[2] })),
      subs: TTA_S.map((sd, si) => {
        const d = TTA_D[sd[0]]!, sv = subV[si];
        return {
          name: sd[1], dim: d[0], c: d[1], tint: d[2], v: f2(sv), barW: sv == null ? "0%" : (sv / 5) * 100 + "%",
          rows: sd[2].map((t, k) => {
            const id = si + "." + k, cur = ans(id);
            // Picking the selected answer again clears it (-1: blank, also over a loaded example).
            return { t, bg: cur == null ? "#fff" : "#fffaf0", opts: TTA_A.map((a) => ({ sh: a[2], tip: a[1], bg: cur === a[0] ? (a[0] === 0 ? "#4d5a52" : d[1]) : "#fff", fg: cur === a[0] ? "#fff" : "#0d1815", go: () => set(`a${e}:${id}`, cur === a[0] ? -1 : a[0]) })) };
          }),
        };
      }),
      dims: TTA_D.map((d, di) => ({ n: d[0], c: d[1], v: f2(dimV[di]) })),
      rings: [1, 2, 3, 4, 5].map((n) => ({ r: (TR * n) / 5, ty: -((TR * n) / 5) - 3, l: String(n) })),
      wedges: TTA_S.map((sd, si) => ({ d: tarc(si, subV[si] || 0), c: TTA_D[sd[0]]![1], op: subV[si] == null ? 0 : 0.85 })),
      spokes: TTA_S.map((_, si) => {
        const p = tpx(si - 0.5, TR);
        return { x: p[0].toFixed(1), y: p[1].toFixed(1) };
      }),
      labels: TTA_S.map((sd, si) => {
        const p = tpx(si, TR + 30), x = p[0];
        return { x: x.toFixed(1), y: (p[1] - 6).toFixed(1), y2: (p[1] + 9).toFixed(1), a: Math.abs(x) < 20 ? "middle" : x > 0 ? "start" : "end", n: sd[1], v: f2(subV[si]), c: TTA_D[sd[0]]![1] };
      }),
      insight: scored.length ? "Strongest: " + TTA_S[scored[scored.length - 1]!.si]![1] + " (" + f2(scored[scored.length - 1]!.v) + "). Biggest opportunity: " + TTA_S[scored[0]!.si]![1] + " (" + f2(scored[0]!.v) + ")." : "Answer the statements to draw your radar.",
      hasLow: lowStm.length > 0, low: lowStm.map((f) => ({ t: f.t, v: String(ans(f.id)), c: TTA_D[f.di]![1], go: () => add("stk", f.t) })),
      example: () => set("tta", { e: e + 1, base: Object.fromEntries(flat.map((f, i) => [f.id, TTA_EX[i]])) }),
      clear: () => set("tta", { e: e + 1 }),
    };
    v.stk = list("stk").map((x, j) => ({ t: x.text, c: STK[j % 4], rot: ROT[j % 4] }));
    v.addStk = push("stk");
  }

  if (c.kind === "tuck") {
    const at = typeof S.at === "number" ? (S.at as number) : null, ideas = !!S.ideas;
    v.tuck = {
      ideas, ideaL: ideas ? "Hide idea prompts" : "Show idea prompts", togIdeas: () => set("ideas", ideas ? null : true),
      heads: TUCK.map((t, i) => ({ n: i + 1, name: t[0], c: t[1], here: at === i, pinBg: at === i ? "#ffd37a" : "transparent", pinL: at === i ? "◆ YOUR ART" : "Mark your ART here", mark: () => set("at", at === i ? null : i) })),
      rows: TUCK_Q.map((q, r) => ({
        q,
        cells: TUCK.map((t, i) => {
          const k = `t:${r}.${i}`;
          return { c: t[1], list: stl(k), onKey: push(k), ideas: (r ? t[3] : t[2]).map((x) => ({ t: x, go: () => add(k, x) })) };
        }),
      })),
      arrow: TUCK.map((t, i) => ({ n: i + 1, name: t[0] + (i === 3 ? "!" : ""), c: t[1], ring: at === i ? "4px solid #ffd37a" : "3px solid #fff" })),
    };
  }

  // The facilitation techniques and Sustaining the victory share one state (config.shared), so the
  // techniques a team captured are there to pick from when it practises what to say.
  if (c.kind === "fac") {
    const fcell = Math.min(3, Math.max(0, Number(ui.fc ?? 0))), own = str("own");
    v.fac = {
      cells: [...FAC_H, own].map((h, i) => {
        const k = `f:${i}`, star = str(`star:${i}`);
        return {
          head: "Techniques to facilitate " + (i < 3 ? h : ""), own: i === 3, ownV: own, ownK: "own|" + own, setOwn: (e: Blur) => e.target.value !== own && set("own", e.target.value),
          bd: fcell === i ? "#ff3d8f" : "#0d1815", act: fcell === i ? "▼ chips go here" : "Click to send chips here", pick: () => setUi({ fc: i }),
          list: list(k).map((x) => ({ t: x.text, c: star === x.id ? "#ffd37a" : "#fff", star: star === x.id ? "★" : "☆", tog: () => set(`star:${i}`, star === x.id ? null : x.id), del: () => op({ key: k, op: "remove", id: x.id }) })),
          onKey: push(k),
          over: (e: React.DragEvent) => e.preventDefault(),
          drop: (e: React.DragEvent) => {
            e.preventDefault();
            const t = facDrag ?? e.dataTransfer.getData("text/plain");
            facDrag = null;
            if (t && FAC_LIB.includes(t)) add(k, t);
          },
        };
      }),
      lib: FAC_LIB.map((t) => ({
        t,
        ds: (e: React.DragEvent) => {
          facDrag = t;
          try {
            e.dataTransfer.setData("text/plain", t);
          } catch {
            // Some browsers refuse drag data; the remembered chip is enough.
          }
        },
        go: () => add(`f:${fcell}`, t),
      })),
    };
  }

  if (c.kind === "sus") {
    const facAll = [...new Set([0, 1, 2, 3].flatMap((i) => list(`f:${i}`).map((x) => x.text)))];
    const uses = Array.isArray(S.uses) ? (S.uses as string[]) : [], evN = str("ev"), who = str("who"), evTxt = str("evTxt"), ready = !!S.ready;
    const say = (k: string) => str(`say:${k}`);
    v.sus = {
      qs: ["How are you connecting team victories to the vision?", "How are you creating connections between yourself and the teams?"].map((q, i) => ({ n: i + 1, q, list: stl(`sd:${i}`), onKey: push(`sd:${i}`) })),
      who, whoK: "who|" + who, setWho: (e: Blur) => e.target.value !== who && set("who", e.target.value),
      evs: SUS_EV.map((x) => ({ v: x, bg: evN === x ? "#0d1815" : "#fff", fg: evN === x ? "#fff" : "#0d1815", go: () => set("ev", evN === x ? null : x) })),
      evOther: evN === "Other", evTxt, evK: "evt|" + evTxt, setEvTxt: (e: Blur) => e.target.value !== evTxt && set("evTxt", e.target.value),
      says: SUS_SAY.map((q, i) => ({ n: i + 1, l: q[1], ph: q[2], v: say(q[0]), k: "say|" + q[0] + "|" + say(q[0]), set: (e: Blur) => e.target.value !== say(q[0]) && set(`say:${q[0]}`, e.target.value) })),
      hasFac: facAll.length > 0, noFac: facAll.length === 0,
      facs: facAll.map((t) => ({ t, bg: uses.includes(t) ? "#cfe8d4" : "#fff", mk: uses.includes(t) ? "✓ " : "+ ", go: () => set("uses", uses.includes(t) ? uses.filter((x) => x !== t) : [...uses, t]) })),
      ready, readyL: ready ? "✓ Ready to share" : "Mark ready to share", readyBg: ready ? "#5ff0e0" : "#fff", togReady: () => set("ready", ready ? null : true),
      rWho: who || "one person’s", rEv: (evN === "Other" ? evTxt || "event" : evN) || "upcoming PI event", rSay: SUS_SAY.map((q) => ({ l: q[1], t: say(q[0]) || "…" })),
      rUses: uses.filter((t) => facAll.includes(t)).length ? uses.filter((t) => facAll.includes(t)).join(" · ") : "No techniques picked yet",
    };
  }
  return v;
}
