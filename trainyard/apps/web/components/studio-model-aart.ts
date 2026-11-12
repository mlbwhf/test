// What the Launching AI-Native ARTs board shows and does, ported from the design's logic
// (Trainyard Launching AI-Native ARTs.dc.html). All eighteen steps share one board state: each
// person's ratings are their own (kept by a per-browser id, as votes are), the room tally counts
// them and lets the facilitator add people without a device, consensus and the group's notes are
// the class's. "Send gaps to Roadmap" writes the gaps into this workspace's roadmap document.

import type { StateOp } from "@trainyard/core";
import { AI_NATIVE_SUCCESS_FACTORS } from "@trainyard/core";
import { api } from "@/lib/api";
import type { StudioCtx } from "./studio-model";
import { voter } from "./studio-model-lsa";
import { BLANK_ROADMAP, type RoadmapDoc } from "./planning-pages";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Op = (c: StateOp) => void;
type Item = { id: string; [k: string]: any };
type Blur = React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>;

const RATE: [string, string, string, string][] = [["F", "Fully in place", "#b8e07a", "#5fb83a"], ["P", "Partially in place", "#ffe14d", "#ffb020"], ["N", "Not in place", "#ff9fc6", "#ef4b4b"]];
const TYPE: Record<string, [string, string]> = { Activity: ["Activity", "#ff6a1f"], Discussion: ["Discussion", "#ff3d8f"], Assess: ["Assess", "#7b44f5"] };
const STAGES: [string, string][] = [["ART Outcomes", "Outcomes"], ["PI Priorities", "Priorities"], ["Features, Enablers, Experiments, Prototypes", "Outputs"], ["ART Metrics", "Measurements"], ["Customer & Business Value", "Value"]];
const OKR_OBJ = ["Inspirational", "Clear", "Memorable", "Roofshot or moonshot"];
const OKR_KR = ["Value-based", "Measurable", "Gradable", "Dashboard-ready"];
const KRS = ["Migrate 80% of services to the new architecture.", "Reduce deployment time by 30%.", "Complete the migration ahead of the Q3 roadmap deadline."];
const DTYPES = ["Intent", "Context", "Specification", "Performance", "Customer feedback"];
const DQ = ["Complete", "Accurate", "Maintained", "Securely accessed"];
const SQ: [string, string][] = [["What product(s) is your ART responsible for?", "a"], ["How do portfolio OKRs inform your ART’s product development cycle?", "b"]];

export function aartModel(c: StudioCtx): Record<string, any> {
  const { S, cfg, ui, setUi } = c;
  const op: Op = (x) => (c.readOnly ? undefined : c.op(x));
  const list = <T = Item>(k: string): T[] => (Array.isArray(S[k]) ? (S[k] as T[]) : []);
  const str = (k: string) => (typeof S[k] === "string" ? (S[k] as string) : "");
  const obj = <T extends object>(k: string, d: T): T => (S[k] && typeof S[k] === "object" && !Array.isArray(S[k]) ? ({ ...d, ...(S[k] as object) } as T) : d);
  const set = (k: string, v: unknown) => op({ key: k, op: "set", value: v ?? null });
  const me = voter();
  const SFS = AI_NATIVE_SUCCESS_FACTORS;
  const keys = Object.keys(SFS).flatMap((sf) => SFS[sf]!.statements.map((_: [string, string], i: number) => `${sf}:${i}`));
  // One person's rating of a statement, and the rating they gave first (for "changed · was").
  const mineOf = (key: string) => list<Item>(`r:${key}`).find((x) => x.voter === me)?.v ?? "";
  const firstOf = (key: string) => list<Item>(`f:${key}`).find((x) => x.voter === me)?.v ?? "";
  const rate = (key: string, v: string, mode: string) => {
    const cur = list<Item>(`r:${key}`).find((x) => x.voter === me);
    if (cur) op({ key: `r:${key}`, op: "update", id: cur.id, value: { v } });
    else op({ key: `r:${key}`, op: "push", value: { voter: me, v } });
    if (mode === "assess" && !firstOf(key)) op({ key: `f:${key}`, op: "push", value: { voter: me, v } });
  };
  // The room: everyone's ratings, plus what the facilitator adds by hand.
  const roomOf = (key: string): [number, number, number] => {
    const adj = obj<{ a: [number, number, number] }>(`ra:${key}`, { a: [0, 0, 0] }).a;
    const rs = list<Item>(`r:${key}`);
    return RATE.map(([k], i) => Math.max(0, rs.filter((x) => x.v === k).length + (adj[i] ?? 0))) as [number, number, number];
  };
  const tally = (key: string, i: number, d: number) => { const adj = [...obj<{ a: [number, number, number] }>(`ra:${key}`, { a: [0, 0, 0] }).a] as [number, number, number]; adj[i] = (adj[i] ?? 0) + d; set(`ra:${key}`, { a: adj }); };
  const rk = (k: string) => RATE.find((r) => r[0] === k);
  const short = (v: string) => (v ? rk(v)![1].replace(" in place", "") : "not rated");
  const pills = (key: string, mode: string, cur: string) => RATE.map(([k, n, col]) => ({ n, bg: cur === k ? col : "#fff", go: () => rate(key, k, mode) }));
  const kind: string = cfg.step ?? "text";
  const type = TYPE[c.frame.activity?.kind ?? "Activity"] ?? TYPE.Activity!;
  const lines = (c.frame.activity?.steps ?? "").split("\n").filter(Boolean);
  const v: Record<string, any> = {
    cur: { color: type[1], typeName: type[0], title: (c.frame.title ?? "").replace(/^[^:]+:\s*/, ""), lines: lines.map((t, i) => ({ t, dot: i === 0 && lines.length > 1 && !/^(Individually|In your|As a|Then|Now|Navigate|Take|Choose|Consider|Pick|Score|Notice|What|How|First|If)/.test(t) ? "none" : "block" })) },
    rated: keys.filter((k) => mineOf(k)).length,
    isScale: kind === "scale", isFlow: kind === "flow", isOkr: kind === "okr", isSf: kind === "sf", isStrategy: kind === "strategy", isData: kind === "data", isGap: kind === "gap",
    hasNotes: !!cfg.notes, notes: str(`notes:${c.frame.id}`), setNotes: (e: Blur) => set(`notes:${c.frame.id}`, e.target.value || null),
  };
  // The practice statement
  const room = roomOf("scale"), tot = room.reduce((a, b) => a + b, 0), used = room.filter((x) => x > 0).length;
  v.scalePills = pills("scale", "x", mineOf("scale"));
  v.scaleRoom = RATE.map(([, n, , c2], i) => ({ n, count: room[i], pct: tot ? (room[i]! / tot) * 100 : 0, c: c2, inc: () => tally("scale", i, 1), dec: () => tally("scale", i, -1) }));
  v.scaleVerdict = !tot ? "Tally the room to see where you agree." : used === 1 ? "Full agreement. Ask how you got there so fast." : "The room is split. Ask what each person pictured when they scored.";
  // Compare workflows
  const flow = obj<Record<string, string>>("flow", {});
  v.stages = STAGES.map(([t, sub], i) => ({ t, sub, arrow: i < 4 ? "block" : "none", val: flow[i] ?? "", bd: flow[i] ? "#7b44f5" : "#14123a", set: (e: Blur) => set("flow", { ...flow, [i]: e.target.value }) }));
  const filled = STAGES.filter((_, i) => (flow[i] ?? "").trim()).length;
  v.flowMsg = filled === 5 ? "All five stages described. Now compare: where does your ART skip a stage, or measure outputs instead of outcomes?" : `${filled} of 5 stages described. Blank stages are often where the gap lives.`;
  v.flowColor = filled === 5 ? "#2f7d1f" : "#5b5b6e";
  // Evaluate an OKR
  const ok = obj<Record<string, boolean>>("okr", {});
  const tog = (k: string) => () => set("okr", { ...ok, [k]: !ok[k] });
  v.okrObj = OKR_OBJ.map((n, i) => ({ n, bg: ok["o" + i] ? "#b8e07a" : "#fff", go: tog("o" + i) }));
  v.okrKrs = KRS.map((t, k) => ({ t, crit: OKR_KR.map((n, i) => ({ n, mark: ok[`k${k}${i}`] ? "✓" : "○", bg: ok[`k${k}${i}`] ? "#b8e07a" : "#fff", go: tog(`k${k}${i}`) })) }));
  const sc = Object.keys(ok).filter((k) => ok[k]).length;
  v.okrScore = sc;
  v.okrPct = (sc / 16) * 100;
  v.okrMsg = sc === 0 ? "Nothing marked yet." : sc < 8 ? "Several criteria are missing. Is “Complete the migration ahead of the deadline” a result or a task?" : sc < 14 ? "Getting there. Check which Key Result nobody could grade without a debate." : "This OKR passes your bar. Would the room agree?";
  // Assess, discuss, adjust a success factor
  if (kind === "sf") {
    const sf: string = cfg.sf ?? "sf1", mode: string = cfg.mode ?? "assess", F = SFS[sf]!;
    v.sfTitle = F.title;
    v.showRoom = mode === "discuss";
    v.sfRows = F.statements.map(([t]: [string, string], i: number) => {
      const key = `${sf}:${i}`, m = mineOf(key), rm = roomOf(key), u = rm.filter((x) => x > 0).length, first = firstOf(key), ch = mode === "adjust" && first && first !== m;
      return { t, bg: i % 2 ? "#eef0f4" : "#fff", pills: pills(key, mode, m), changed: !!ch, was: ch ? short(first) : "", split: u > 1 ? "Split room. Talk it through." : u === 1 ? "Aligned" : "", splitColor: u > 1 ? "#c8372d" : "#2f7d1f", room: RATE.map(([, n, , c2], j) => ({ short: n.split(" ")[0], c: c2, count: rm[j], inc: () => tally(key, j, 1), dec: () => tally(key, j, -1) })) };
    });
  }
  // Does strategy reach your ART?
  const strat = obj<Record<string, string>>("strat", {});
  v.strat = SQ.map(([q, k]) => ({ q, val: strat[k] ?? "", set: (e: Blur) => set("strat", { ...strat, [k]: e.target.value }) }));
  const sa = (strat.a ?? "").trim(), sb = (strat.b ?? "").trim();
  v.stratMsg = !sa ? "If you cannot name the product, SF2 statement 1 is probably not fully in place." : !sb ? "Now the harder one: trace one portfolio OKR into your PI." : "Compare with a partner. Did your answers name the same OKR?";
  v.stratColor = sa && sb ? "#2f7d1f" : "#5b5b6e";
  // Who is responsible for great data?
  const d = obj<{ type: string; source: string; q: Record<string, boolean>; action: string }>("data", { type: "", source: "", q: {}, action: "" });
  v.dataTypes = DTYPES.map((n) => ({ n, bg: d.type === n ? "#ffe14d" : "#fff", go: () => set("data", { ...d, type: n }) }));
  v.dataSource = d.source;
  v.setSource = (e: Blur) => set("data", { ...d, source: e.target.value });
  v.dataAction = d.action;
  v.setAction = (e: Blur) => set("data", { ...d, action: e.target.value });
  v.dataQ = DQ.map((n) => ({ n, mark: d.q[n] ? "✓" : "○", bg: d.q[n] ? "#b8e07a" : "#fff", go: () => set("data", { ...d, q: { ...d.q, [n]: !d.q[n] } }) }));
  const missing = DQ.filter((n) => !d.q[n]);
  v.dataMsg = !d.type || !d.source.trim() ? "Pick a type and name a real source." : !missing.length ? "Meets all four. Then what keeps it that way?" : `Fails: ${missing.join(", ").toLowerCase()}${d.action.trim() ? `. Fix: ${d.action.trim()}` : ". Name one action that closes the gap."}`;
  v.dataColor = missing.length && d.type ? "#c8372d" : "#2f7d1f";
  // Gap analysis: the consensus per statement, and the launch plan on the roadmap
  if (kind === "gap") {
    const tot3: Record<string, number> = { F: 0, P: 0, N: 0 };
    const consOf = (key: string) => str(`c:${key}`) || mineOf(key);
    v.gapSf = Object.keys(SFS).map((sf) => ({ title: SFS[sf]!.title, rows: SFS[sf]!.statements.map(([t]: [string, string], i: number) => { const key = `${sf}:${i}`, val = consOf(key); if (val) tot3[val] = (tot3[val] ?? 0) + 1; return { t, mine: short(mineOf(key)), pills: RATE.map(([k, , col]) => ({ k, bg: val === k ? col : "#fff", go: () => set(`c:${key}`, k) })) }; }) }));
    v.gapTotals = RATE.map(([k, n, col]) => ({ n, count: tot3[k] ?? 0, bg: col }));
    const sent = typeof S.sent === "number" ? (S.sent as number) : -1;
    v.sendLabel = ui.sending ? "Sending…" : sent < 0 ? "Send gaps to Roadmap" : sent === 0 ? "Nothing new to send" : `${sent} cards sent · open Roadmap`;
    v.sendGaps = async () => {
      if (ui.sending || !c.trainer) return;
      setUi({ sending: true });
      try {
        const r = (await api<{ doc: RoadmapDoc | null }>("GET", "/v1/docs/roadmap")).doc ?? structuredClone(BLANK_ROADMAP);
        const have = new Set(r.items.map((i) => i.title));
        let n = 0;
        for (const sf of Object.keys(SFS)) SFS[sf]!.statements.forEach((st: [string, string], i: number) => { const val = consOf(`${sf}:${i}`), title = `Launch: ${st[1]}`; if ((val === "N" || val === "P") && !have.has(title)) { r.items.push({ id: `aa${sf}${i}`, title, type: val === "N" ? "epic" : "enabler", lane: r.lanes[0]?.id ?? "a1", start: 1, len: val === "N" ? 2 : 1, committed: false, placed: false }); n++; } });
        await api("PUT", "/v1/docs/roadmap", { doc: r });
        set("sent", n);
      } finally {
        setUi({ sending: false });
      }
    };
  }
  return v;
}
