// What each Class Studio board shows and does, ported from the design's logic (Trainyard Class
// Studio.dc.html, renderVals) so the generated layouts in studio-views.tsx behave exactly as
// designed. The class shares one state per exercise (the frame's state, changed one op at a time);
// view choices that are one person's own (an enlarged box, the board tab, a selected spoke) stay local.

import type { Board, Frame, StateOp } from "@trainyard/core";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Op = (c: StateOp) => void;
type Item = { id: string; [k: string]: any };
type Key = React.KeyboardEvent<HTMLInputElement>;

export interface StudioCtx {
  kind: string;
  /** The activity's setup (prompt, intro, qs, exs, tag, quad, rstep, vsm, types). */
  cfg: Record<string, any>;
  S: Record<string, unknown>;
  op: Op;
  ui: Record<string, any>;
  setUi: (p: Record<string, any>) => void;
  trainer: boolean;
  readOnly: boolean;
  board: Board;
  frame: Frame;
  /** Asks the AI for a few lines; empty when AI is off or fails. */
  ask: (prompt: string) => Promise<string[]>;
}

export const STK = ["#ffd37a", "#f6b9ae", "#cfe8d4", "#cde0f2"];
const ROT = ["-1.5deg", "1deg", "-.5deg", "1.8deg"];

const CHECKS = [["Planning scope and context", "Is the scope (product, system, technology domains) of the planning process understood? Have we identified our value stream(s) and Agile Release Train(s)?"], ["Release Train Engineer", "Have we identified the Release Train Engineer? Do they understand the scope of the role in preparing the organization and preparing for the PI Planning event?"], ["Planning timeframe, iteration and PI cadence", "Have we identified the PI Planning dates, the iteration cadence, and the PI cadence?"], ["Agile Teams (SM/TCs, POs)", "Does each team have an identified Scrum Master/Team Coach and Product Owner?"], ["Team makeup/commitment", "Have we identified cross-functional Agile Teams? Are there dedicated team members on every team?"], ["Agile Team attendance", "Are all team members attending PI Planning, whether in person or involved remotely?"], ["Executive, Business Owner", "Do we know who will set and present the business context and strategy? Do we know who will assign business value and accept the plans?"], ["Business alignment", "Is there reasonable agreement on priorities amongst the Business Owners and Product Management?"], ["Architecture vision and development practices", "Do we know who will present the architecture vision and required development practices?"], ["System Team", "Has the system team been identified and formed?"], ["Shared Services", "Have the shared services (User Experience, Architecture, etc.) been identified?"], ["Other Attendees", "Do we know what other key business and technology stakeholders should attend?"], ["Agile Lifecycle Management (ALM) tooling", "Do we know how and where iterations, PIs, features, stories, measures, etc., will be maintained?"], ["Development infrastructure", "Do we have a strategy for using and improving the Continuous Delivery Pipeline?"], ["Quality practices", "Is there a strategy for applying built-in quality practices?"]];
const CTYPES = [["Communication", "#d93a2b"], ["Collaboration", "#4a5fe8"], ["Facilitate", "#2f8f5b"], ["Input/Output", "#e29a00"]];
const BOARDS = [
  { c: [["M1", 986, 269], ["D1", 380, 373], ["D2", 580, 375], ["F1", 781, 325], ["F2", 781, 423], ["F6", 986, 471], ["F3", 544, 522], ["F5", 987, 569], ["D3", 380, 614], ["D4", 581, 614], ["F4", 782, 616]], l: ["M945 269 C 870 268 830 285 795 305", "M608 374 C 690 372 740 360 775 343", "M608 374 C 670 375 680 395 682 402 C 690 425 730 423 756 423", "M808 422 C 900 420 975 385 987 295", "M380 395 C 385 480 450 520 518 522", "M408 614 C 490 612 540 590 546 545", "M580 397 C 590 520 680 616 756 616", "M580 397 C 600 450 680 510 760 530 C 840 555 900 568 960 568", "M581 592 C 585 540 620 515 680 517 C 740 518 775 490 782 445"] },
  { c: [["M1", 782, 269], ["F6", 380, 324], ["F1", 581, 324], ["F3", 782, 324], ["F5", 984, 324], ["D2", 638, 423], ["D1", 380, 471], ["F4", 843, 469], ["D7", 984, 471], ["D4", 581, 520], ["F2", 638, 569], ["D6", 984, 569], ["D3", 517, 616], ["D5", 730, 616], ["F7", 984, 616]], l: ["M740 269 C 650 270 600 285 581 303", "M581 346 C 585 372 625 365 638 400", "M581 346 C 560 390 470 395 430 400 C 400 405 385 430 380 449", "M782 346 C 780 440 700 510 608 520", "M984 346 C 990 385 1040 390 1042 430 C 1042 455 1030 468 1010 471", "M984 493 C 980 510 930 515 928 545 C 928 565 945 568 958 569", "M843 491 C 840 560 800 612 757 616", "M545 616 C 600 612 635 605 638 591"] },
  { c: [["M1", 782, 269], ["E1", 1183, 269], ["D1", 377, 325], ["F2", 580, 325], ["D5", 580, 375], ["F5", 984, 375], ["F3", 782, 422], ["D3", 377, 471], ["D7", 782, 471], ["F6", 1039, 471], ["F1", 516, 521], ["D6", 580, 569], ["F7", 1039, 568], ["D4", 377, 616], ["D2", 643, 616], ["F4", 778, 616], ["D8", 778, 666], ["D9", 984, 719]], l: ["M608 325 C 700 325 760 315 782 291", "M1011 374 C 1100 372 1170 340 1183 291", "M405 325 C 460 325 475 345 480 360 C 490 372 530 375 553 375", "M608 375 C 660 375 680 390 682 402 C 690 422 730 422 756 422", "M405 471 C 480 470 560 440 580 397", "M580 397 C 600 450 690 470 755 471", "M810 471 C 900 470 975 440 984 397", "M782 493 C 790 540 900 568 1012 568", "M608 569 C 700 565 770 540 782 493", "M405 616 C 480 612 510 580 516 543", "M405 616 C 480 614 560 610 580 591", "M806 666 C 900 650 970 560 984 397", "M984 697 V397"] },
] as { c: [string, number, number][]; l: string[] }[];
const PAIRS = [["M1-F1", "D2-F1", "D2-F2", "F2-M1", "D1-F3", "D3-F3", "D2-F4", "D2-F5", "D4-F2"], ["M1-F1", "F1-D2", "F1-D1", "F3-D4", "F5-D7", "D7-D6", "F4-D5", "D3-F2"], ["F2-M1", "F5-E1", "D1-D5", "D5-F3", "D3-D5", "D5-D7", "D7-F5", "D7-F7", "D6-D7", "D4-F1", "D4-D6", "D8-F5", "D9-F5"]];
const BR: [string, number, number, string][] = [["People", 1, 400, "#1c9c7c"], ["Process", 1, 690, "#2c8c93"], ["Tools", 0, 240, "#6f9b2a"], ["Work", 0, 520, "#c07a1c"], ["Environment", 0, 770, "#a8652a"]];
const MET = ["Flow Distribution", "Flow Velocity", "Flow Time", "Flow Load", "Flow Efficiency", "Flow Predictability"];
const ACCEL = ["Visualize and limit WIP", "Address bottlenecks", "Minimize handoffs and dependencies", "Get faster feedback", "Work in smaller batches", "Reduce queue lengths", "Optimize time ‘in the zone’", "Remediate legacy policies and practices"];
const PROBS = ["Teams consistently deprioritize enablers and tech debt because Business Owners push for more features each PI. The ART’s ability to integrate and release reliably is degrading.", "Team and ART velocity varies wildly PI to PI. The RTE suspects hidden dependencies and uneven workload distribution across teams.", "Features spend months in development before they’re validated with customers. System Demos reveal integration surprises late in the PI.", "The ART kanban is cluttered; work enters faster than it exits. Teams feel busy, but nothing is getting done.", "Shared services and test environments create long waits between development and integration. The same blockers reappear every PI.", "Business Owners are frustrated that planned PI Objectives are rarely achieved even though teams feel productive. The RTE sees mismatched cadence and inconsistent sync practices."];
const EVENTS = ["ART Sync", "Coach Sync", "PO Sync"];
const RISKS = ["Team member X is a bottleneck. They are the only one who can handle critical parts of the implementation for an important Feature that is scheduled for delivery in the Iteration.", "No system team is available yet. The integration infrastructure is in poor condition and could put the integration and/or the System Demo at risk.", "Two teams have a shared Product Owner. This might have a negative impact on the team’s Iteration Planning and demos.", "The QA team is pointing out that application performance might be at risk during Iteration 3, as there will be an influx of new users. They are unsure how this might impact the ART.", "In Iteration 3, an important supplier might be delayed with their crucial delivery. They have been late before, and this time it might impact several teams.", "There is a holiday mid-PI, and many people will be on vacation."];
const BVROWS: [string, number][] = [["Show routing calculations between the 5 most frequent destinations", 10], ["Navigate autonomously from distribution center the most frequent destination", 8], ["Parallel park for a delivery", 7], ["Return to distribution center after delivery", 10], ["Include traffic data in route planning", 7], ["Recall a delivery that is already in progress", 7], ["Reduce GPS signal loss by 25%", 2]];
const ART_Q = ["What problems do you see?", "How would you, the RTE, act if you could see these on the ART planning board at the end of Day 1 in PI Planning?", "What could be a potential solution for the specific problems?"];
const ART_COLS = ["Iteration 1.1", "Iteration 1.2", "Iteration 1.3", "Iteration 1.4", "Iteration 1.5 (IP)", "PI 2 >>>"];

/** The board kinds drawn from the design. */
export const STUDIO_KINDS = new Set(["talk", "quad", "check", "connect", "trust", "bound", "next", "vsm", "ba", "rca", "metrics", "ctx", "accel", "wheel", "evt", "kanban", "pitch", "disc", "bv", "roam", "art"]);

export function studioModel(c: StudioCtx): Record<string, any> {
  const { S, cfg, ui, setUi, trainer } = c;
  const op: Op = (x) => (c.readOnly ? undefined : c.op(x));
  const list = <T = Item>(k: string): T[] => (Array.isArray(S[k]) ? (S[k] as T[]) : []);
  const str = (k: string) => (typeof S[k] === "string" ? (S[k] as string) : "");
  const setStr = (k: string, v: string) => op({ key: k, op: "set", value: v || null });
  const stkOf = (k: string, col = (j: number) => STK[j % 4]) => list<Item>(k).map((x, j) => ({ t: x.text, c: col(j), rot: ROT[j % 4] }));
  const push = (k: string) => (e: Key) => {
    const t = e.currentTarget;
    if (e.key === "Enter" && t.value.trim()) {
      const v = t.value.trim();
      t.value = "";
      op({ key: k, op: "push", value: { text: v } });
    }
  };
  const v: Record<string, any> = { ex: { prompt: cfg.prompt ?? "" }, isTrainer: trainer };

  switch (c.kind) {
    case "talk":
    case "ba":
    case "bv":
      v.stk = stkOf("stk");
      v.addStk = push("stk");
      v.addPh = "Add a note for the group, press Enter";
      break;
    case "quad":
      v.quads = [0, 1, 2, 3].map((i) => ({ list: list<Item>(`q:${i}`).map((x, j) => ({ t: x.text, c: STK[(i + j) % 4], rot: ROT[j % 4] })), onKey: push(`q:${i}`) }));
      break;
  }

  if (c.kind === "check") {
    const CC: Record<string, string> = { Y: "#2f8f5b", N: "#d93a2b", D: "#b27400" }, CT: Record<string, string> = { Y: "#cfe8d4", N: "#f6b9ae", D: "#ffd37a" };
    const ans = (i: number) => str(`chk:${i}`) || undefined;
    const setAns = (i: number, val: string | null) => setStr(`chk:${i}`, ans(i) === val ? "" : (val ?? ""));
    const tally = (k: string) => CHECKS.filter((_, i) => ans(i) === k).length, answered = tally("Y") + tally("N") + tally("D");
    const cview = ui.cview || "board";
    const ck: Record<string, any> = {
      cars: CHECKS.map((_, i) => ({ bg: ans(i) ? CT[ans(i)!] : "#fffaf0" })),
      tally: [["Y", "Yes"], ["N", "No"], ["D", "Depends"]].map((p) => ({ label: p[1] + " " + tally(p[0]!), bg: CT[p[0]!] })).concat([{ label: "Open " + (15 - answered), bg: "#fffaf0" }]),
      cards: CHECKS.map((cc, i) => ({ t: cc[0], d: cc[1], bg: ans(i) ? CT[ans(i)!] : "#fffaf0", btns: [["Y", "Yes"], ["N", "No"], ["D", "Depends"]].map((b) => ({ l: b[0], aria: b[1], col: CC[b[0]!], bg: ans(i) === b[0] ? CC[b[0]!] : "#fff", fg: ans(i) === b[0] ? "#fff" : CC[b[0]!], go: () => setAns(i, b[0]!) })) })),
      views: [["board", "Sort board"], ["grid", "Cards"]].map((vv) => ({ label: vv[1], bg: cview === vv[0] ? "#ffb627" : "#fffaf0", go: () => setUi({ cview: vv[0] }) })),
      isBoard: cview === "board",
      isGrid: cview === "grid",
      summary: answered < 15 ? `${answered} of 15 answered. ${15 - answered} cars still on the siding.` : `Ready to roll: ${tally("Y")} must-haves, ${tally("N")} not needed, ${tally("D")} depend on context. Be ready to explain every Depends.`,
    };
    ck.rows = CHECKS.map((cc, i) => ({ n: i + 1, t: cc[0], d: cc[1], val: ans(i) || "", bg: ans(i) ? CT[ans(i)!] : "#fffaf0", col: ans(i) ? CC[ans(i)!] : "#0d1815", fg: ans(i) ? CC[ans(i)!] : "#0d1815", set: (e: React.ChangeEvent<HTMLSelectElement>) => setStr(`chk:${i}`, e.target.value) }));
    const si = Math.min(ui.csel || 0, 14);
    ck.sel = { t: CHECKS[si]![0], d: CHECKS[si]![1], btns: ck.cards[si].btns };
    ck.lanes = ([[null, "On the siding", "#fffaf0", "#efe8d8"], ["Y", "Must be in place", CT.Y, "#fffaf0"], ["N", "Not needed", CT.N, "#fffaf0"], ["D", "Depends on context", CT.D, "#fffaf0"]] as [string | null, string, string, string][]).map((L) => {
      const items = CHECKS.map((cc, i) => ({ t: cc[0], i })).filter((x) => (ans(x.i) || null) === L[0]);
      return {
        title: L[1], bg: L[2], tint: L[3], count: items.length,
        over: (e: React.DragEvent) => e.preventDefault(),
        drop: (e: React.DragEvent) => {
          e.preventDefault();
          const i = +e.dataTransfer.getData("text/plain");
          if (Number.isFinite(i)) setStr(`chk:${i}`, L[0] ?? "");
          setUi({ csel: i });
        },
        items: items.map((x) => ({ t: x.t, sh: x.i === si ? "3px 3px 0 #0d1815" : "none", ring: x.i === si ? "3px solid #ffb627" : "none", drag: (e: React.DragEvent) => e.dataTransfer.setData("text/plain", String(x.i)), pick: () => setUi({ csel: x.i }) })),
      };
    });
    v.ck = ck;
  }

  if (c.kind === "connect") {
    const types: [string, string][] = cfg.types ?? CTYPES;
    const cl = list<Item>("conn"), ctype = ui.ctype ?? 0;
    v.conn = {
      count: cl.length,
      clear: () => cl.length && op({ key: "conn", op: "remove", id: cl[cl.length - 1]!.id }),
      click: (e: React.MouseEvent) => {
        const r = (e.currentTarget as Element).getBoundingClientRect();
        op({ key: "conn", op: "push", value: { x: Math.round(((e.clientX - r.left) / r.width) * 1600), y: Math.round(((e.clientY - r.top) / r.height) * 900), type: ctype, note: "" } });
      },
      lines: cl.map((p, i) => ({ d: `M786 408 V${p.y < 440 ? 440 : 455} H${p.x} V${p.y}`, x: p.x, y: p.y, ty: p.y + 9, n: i + 1, col: types[p.type]?.[1] ?? "#d93a2b" })),
      items: cl.map((p, i) => ({ n: i + 1, col: types[p.type]?.[1], type: types[p.type]?.[0], note: p.note, save: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => op({ key: "conn", op: "update", id: p.id, value: { note: e.target.value } }) })),
    };
    v.ctypes = types.map((t, i) => ({ label: t[0], c: t[1], bg: ctype === i ? "#ffd37a" : "#fffaf0", sh: ctype === i ? "2px 2px 0 #0d1815" : "none", go: () => setUi({ ctype: i }) }));
  }

  if (c.kind === "art") {
    const ab = ui.abd || 0, B = BOARDS[ab]!;
    const mv = (S[`mv:${ab}`] as Record<string, [number, number]> | undefined) ?? {};
    const P = (id: string): [number, number] => mv[id] ?? [B.c.find((k) => k[0] === id)![1], B.c.find((k) => k[0] === id)![2]];
    const GX = Array.from({ length: 7 }, (_, i) => Math.round(372 + i * 202.6)), GY = [269, 325, 375, 423, 471, 520, 569, 616, 666, 719];
    const near = (a: number[], val: number) => a.reduce((m, x) => (Math.abs(x - val) < Math.abs(m - val) ? x : m));
    const setMv = (m: Record<string, [number, number]>) => op({ key: `mv:${ab}`, op: "set", value: Object.keys(m).length ? m : null });
    const bk = (i: number) => `b${i}:`;
    const nb = (i: number) => [0, 1, 2].reduce((a, q) => a + list(bk(i) + q).length, 0);
    v.art = {
      title: "Example ART planning board #" + (ab + 1),
      tabs: [0, 1, 2].map((i) => ({ label: "Board #" + (i + 1), n: nb(i), bg: i === ab ? "#ffd37a" : "#fffaf0", sh: i === ab ? "2px 2px 0 #0d1815" : "none", go: () => setUi({ abd: i }) })),
      prev: () => ab > 0 && setUi({ abd: ab - 1 }), next: () => ab < 2 && setUi({ abd: ab + 1 }), pop: ab > 0 ? 1 : 0.35, nop: ab < 2 ? 1 : 0.35,
      cols: ART_COLS.map((cc, i) => ({ tx: 372 + i * 202.6, label: cc })),
      vl: [69, 272, 474, 677, 880, 1082, 1285, 1488].map((x) => ({ x })),
      hl: [190, 239, 301, 349, 398, 447, 495, 544, 593, 641, 690, 752].map((y) => ({ y, w: y === 641 ? 5 : 1.5 })),
      rows: ([["Milestones/", 258], ["Events", 283], ["Unicorns", 333], ["Dolphins", 382], ["Bears", 430], ["Eagles", 479], ["Iguanas", 528], ["Antelope", 577], ["Tarantulas", 625], ["Needs UX Help", 674], ["Needs Sys", 716], ["Arch Help", 741]] as [string, number][]).map((r) => ({ label: r[0], ty: r[1] })),
      links: B.l.map((d, i) => {
        const [a, b] = PAIRS[ab]![i]!.split("-") as [string, string];
        if (!mv[a] && !mv[b]) return { d };
        const p = P(a), q = P(b), m = (p[0] + q[0]) / 2;
        return { d: p[0] === q[0] ? `M${p[0]} ${p[1]} V${q[1]}` : `M${p[0]} ${p[1]} C${m} ${p[1]} ${m} ${q[1]} ${q[0]} ${q[1]}` };
      }),
      cur: trainer ? "grab" : "default", mode: trainer ? "TRAINER · DRAG TICKETS" : "VIEW ONLY", modeBg: trainer ? "#ffb627" : "#efe8d8",
      canReset: trainer && Object.keys(mv).length > 0, reset: () => setMv({}),
      move: (e: React.PointerEvent<SVGSVGElement>) => {
        const d = ui.drag as string | undefined;
        if (!d) return;
        const sv = e.currentTarget, pt = sv.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = sv.getScreenCTM();
        if (!ctm) return;
        const q = pt.matrixTransform(ctm.inverse());
        const to: [number, number] = [near(GX, q.x), near(GY, q.y)];
        const cur = mv[d];
        if (!cur || cur[0] !== to[0] || cur[1] !== to[1]) setMv({ ...mv, [d]: to });
      },
      up: () => setUi({ drag: null }),
      cards: B.c.map((k) => {
        const t = k[0][0], p = P(k[0]);
        return { id: k[0], down: () => trainer && setUi({ drag: k[0] }), x: p[0] - 26, y: p[1] - 18, tx: p[0], ty: p[1] + 8, bg: t === "D" ? "#c00000" : t === "F" ? "#9fcbf5" : "#ff9f0a", st: t === "D" ? "#e8a0a0" : t === "F" ? "#d6e8fa" : "#ffd08a", fg: t === "D" ? "#fff" : "#333" };
      }),
      qs: ART_Q.map((q, i) => ({ q, list: stkOf(bk(ab) + i), onKey: push(bk(ab) + i) })),
    };
  }

  if (c.kind === "bv") v.bv = { rows: BVROWS.map((r, i) => ({ n: i + 1, t: r[0], v: r[1], bg: i === 6 ? "#ffe3a3" : "transparent", ol: i === 6 ? "3px solid #ffb627" : "none" })) };

  if (c.kind === "roam") {
    const rs = (i: number) => str(`roam:${i}`);
    const setR = (i: number, val: string | null) => setStr(`roam:${i}`, val ?? "");
    const ROAM = [["R", "Resolved", "Addressed; the risk is no longer a concern"], ["O", "Owned", "Someone has taken responsibility"], ["A", "Accepted", "Nothing more can be done; if it occurs, the release may be compromised"], ["M", "Mitigated", "The team has a plan to adjust as necessary"]];
    const dragR = (i: number) => (e: React.DragEvent) => e.dataTransfer.setData("text/plain", "r" + i);
    const dropTo = (val: string | null) => (e: React.DragEvent) => {
      e.preventDefault();
      const d = e.dataTransfer.getData("text/plain");
      if (d[0] === "r") setR(+d.slice(1), val);
    };
    const placed = RISKS.filter((_, i) => rs(i)).length;
    v.roam = {
      trayLabel: placed === 6 ? "ALL SIX RISKS SORTED" : 6 - placed + " OF 6 RISKS STILL TO SORT",
      tray: RISKS.map((t, i) => ({ t, drag: dragR(i), i })).filter((x) => !rs(x.i)), trayOver: (e: React.DragEvent) => e.preventDefault(), trayDrop: dropTo(null),
      quads: ROAM.map((q, qi) => ({ l: q[0], name: q[1], desc: q[2], bl: qi % 2 ? "3px solid #0d1815" : "none", bt: qi > 1 ? "3px solid #0d1815" : "none", bg: "transparent", over: (e: React.DragEvent) => e.preventDefault(), drop: dropTo(q[0]!), items: RISKS.map((_, i) => ({ n: i + 1, drag: dragR(i), back: () => setR(i, null), i })).filter((x) => rs(x.i) === q[0]) })),
      rows: RISKS.map((t, i) => ({ n: i + 1, t, bg: rs(i) ? "#fff3f0" : "transparent", note: str(`note:${i}`), save: (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => setStr(`note:${i}`, e.target.value), btns: ROAM.map((q) => ({ l: q[0], aria: q[1], bg: rs(i) === q[0] ? "#0d1815" : "#fff", fg: rs(i) === q[0] ? "#fff" : "#0d1815", go: () => setR(i, rs(i) === q[0] ? null : q[0]!) })) })),
    };
  }

  if (c.kind === "disc") {
    const QH = ["#ffd37a", "#cde0f2", "#cfe8d4", "#f6b9ae"], qd = !!cfg.quad, qs: string[] = cfg.qs ?? [];
    v.disc = {
      grid: qd ? "repeat(auto-fit,minmax(min(100%," + (qs.length === 3 ? 260 : 380) + "px),1fr))" : "repeat(auto-fit,minmax(240px,1fr))",
      gap: qd ? "16px" : "12px", sh: qd ? "4px 4px 0 #0d1815" : "none", hp: qd ? "14px 16px" : "12px 14px 0", hb: qd ? "2px solid #0d1815" : "none", nb: qd ? "34px" : "26px", nf: qd ? "16px" : "13px", qf: qd ? "17px" : "15px", bp: qd ? "14px 16px 16px" : "10px 14px 12px", mh: qd ? "210px" : "36px", sp: qd ? "10px 14px" : "7px 10px", sf: qd ? "15px" : "13px",
      intro: cfg.intro || "", hasTag: !!cfg.tag, tag: cfg.tag || "", hasEx: !!cfg.exs, ex: cfg.exs || [],
      qs: qs.map((q, i) => ({ n: i + 1, q, hc: qd ? QH[i % 4] : "transparent", list: stkOf(`d:${i}`), onKey: push(`d:${i}`) })),
    };
  }

  if (c.kind === "kanban") {
    type Lane = { label: string; wip: string };
    type Col = { id: string; name: string; lanes: Lane[]; pol: string };
    const L1 = (w: string): Lane[] => [{ label: "", wip: w }], L2 = (a: string, b: string): Lane[] => [{ label: "In Progress", wip: a }, { label: "Ready", wip: b }];
    const KDEF: Col[] = ([["Funnel", L1(""), "• All new ideas welcome"], ["Analyzing", L1("2"), "• Benefit hypothesis\n• Calculate WSJF\n• WIP limited"], ["Ready", L1("6"), "• Features approved by Product Management\n• Continuous WSJF\n• WIP limited"], ["Implementing", L1("4"), "• Features decomposed into stories\n• Teams define, build, and validate the solution\n• WIP limited"], ["Validating on Staging", L2("5", "6"), "• Features integrated and deployed to staging\n• Features demoed and approved by Product Management\n• WIP limited"], ["Deployment to Production", L2("4", "3"), "• Finish deployment testing of features\n• Features deployed to production, sometimes toggled off\n• WIP limited"], ["Releasing", L1("5"), "• Features released to customers incrementally or all at once\n• Benefit hypothesis evaluated\n• WIP limited"], ["Done", L1(""), ""]] as [string, Lane[], string][]).map((x, i) => ({ id: "c" + i, name: x[0], lanes: x[1], pol: x[2] }));
    const cols = (S.kcols as Col[] | undefined) ?? KDEF, cards = list<Item>("kcards"), kv = (S.kv as number | undefined) ?? 0, nC = cols.length;
    const setCols = (next: Col[]) => op({ key: "kcols", op: "set", value: next });
    // Cards keep their column by index: moving or removing columns moves or drops them.
    const remap = (fn: (x: number) => number | null) => cards.forEach((k) => {
      const to = fn(k.col);
      if (to === null) op({ key: "kcards", op: "remove", id: k.id });
      else if (to !== k.col) op({ key: "kcards", op: "update", id: k.id, value: { col: to } });
    });
    const patchCol = (i: number, p: Partial<Col>) => setCols(cols.map((x, j) => (j === i ? { ...x, ...p } : x)));
    const patchLane = (i: number, j: number, p: Partial<Lane>) => patchCol(i, { lanes: cols[i]!.lanes.map((l, y) => (y === j ? { ...l, ...p } : l)) });
    const swap = (i: number, j: number) => {
      setCols(cols.map((x, k) => (k === i ? cols[j]! : k === j ? cols[i]! : x)));
      remap((x) => (x === i ? j : x === j ? i : x));
    };
    const addAt = (p: number) => {
      setCols([...cols.slice(0, p), { id: "n" + Date.now().toString(36), name: "New column", lanes: L1(""), pol: "" }, ...cols.slice(p)]);
      remap((x) => (x >= p ? x + 1 : x));
    };
    v.kan = {
      reset: () => {
        op({ key: "kcols", op: "set", value: null });
        cards.forEach((k) => op({ key: "kcards", op: "remove", id: k.id }));
        op({ key: "kv", op: "set", value: kv + 1 });
      },
      addEnd: () => addAt(nC),
      cols: cols.map((cc, i) => ({
        key: cc.id + ":" + kv + ":" + cc.lanes.length + ":" + cc.name + ":" + cc.pol, name: cc.name, pol: cc.pol, gbl: i ? "2px solid #6b6b6b" : "none", addBefore: () => addAt(i), w: cc.lanes.length > 1 ? "260px" : "170px", bl: "2px solid #6b6b6b", lo: i ? 1 : 0.25, ro: i < nC - 1 ? 1 : 0.25, lb: cc.lanes.length > 1 ? "1.5px solid #6b6b6b" : "none",
        left: () => i > 0 && swap(i, i - 1), right: () => i < nC - 1 && swap(i, i + 1),
        remove: () => {
          if (nC <= 2) return;
          setCols(cols.filter((_, x) => x !== i));
          remap((x) => (x === i ? null : x > i ? x - 1 : x));
        },
        split: () => {
          if (cc.lanes.length > 1) {
            patchCol(i, { lanes: L1(cc.lanes[0]!.wip) });
            cards.filter((k) => k.col === i && k.lane).forEach((k) => op({ key: "kcards", op: "update", id: k.id, value: { lane: 0 } }));
          } else patchCol(i, { lanes: L2(cc.lanes[0]!.wip, "") });
        },
        splitLabel: cc.lanes.length > 1 ? "MERGE" : "SPLIT",
        saveName: (e: React.FocusEvent<HTMLInputElement>) => e.target.value !== cc.name && patchCol(i, { name: e.target.value }),
        savePol: (e: React.FocusEvent<HTMLTextAreaElement>) => e.target.value !== cc.pol && patchCol(i, { pol: e.target.value }),
        lanes: cc.lanes.map((l, j) => ({
          label: l.label, wip: l.wip, ld: cc.lanes.length > 1 ? "block" : "none", bl: j ? "2px dashed #6b6b6b" : "none",
          saveWip: (e: React.FocusEvent<HTMLInputElement>) => e.target.value !== l.wip && patchLane(i, j, { wip: e.target.value }),
          over: (e: React.DragEvent) => e.preventDefault(),
          drop: (e: React.DragEvent) => {
            e.preventDefault();
            const id = e.dataTransfer.getData("text/plain").replace(/^k/, "");
            if (cards.some((k) => k.id === id)) op({ key: "kcards", op: "update", id, value: { col: i, lane: j } });
          },
          add: (e: Key) => {
            const t = e.currentTarget;
            if (e.key === "Enter" && t.value.trim()) {
              const val = t.value.trim();
              t.value = "";
              op({ key: "kcards", op: "push", value: { t: val, col: i, lane: j } });
            }
          },
          cards: cards.filter((k) => k.col === i && (k.lane || 0) === j).map((k) => ({ t: k.t, drag: (e: React.DragEvent) => e.dataTransfer.setData("text/plain", "k" + k.id), del: () => op({ key: "kcards", op: "remove", id: k.id }) })),
        })),
      })),
    };
  }

  if (c.kind === "pitch") {
    v.pitch = {
      cells: ([["What will happen if DevOps capabilities are not built?", "1", "1", "150px"], ["How can the RTE support the building of DevOps capabilities?", "2", "1", "150px"], ["Two-minute pitch outline", "3", "1 / span 2", "300px"], ["What metrics will you use to support your pitch?", "1", "2", "150px"], ["Additional notes", "2", "2", "150px"]] as string[][]).map((cc, i) => ({ t: cc[0], gc: cc[1], gr: cc[2], mh: cc[3], v: str(`p:${i}`), key: `p:${i}|${str(`p:${i}`)}`, save: (e: React.FocusEvent<HTMLTextAreaElement>) => setStr(`p:${i}`, e.target.value) })),
    };
  }

  if (c.kind === "evt") {
    const ev = str("evt");
    v.evt = {
      events: EVENTS, sel: ev, ph: ev ? "…" : "Choose an event first",
      pick: (e: React.ChangeEvent<HTMLSelectElement>) => setStr("evt", e.target.value),
      rows: [["Purpose", "Why it exists and why it matters to the RTE"], ["Attendees and agenda", "Facilitators, attendees, timing and cadence"], ["Inputs/outputs", "What goes in and what comes out"], ["Anti-patterns", "What goes wrong, or happens if it is canceled"], ["Success criteria", "How the RTE knows it worked"], ["Tips", "General advice"]].map((r, i) => {
        const k = `t:${ev}:${i}`;
        return { t: r[0], hint: r[1], key: k + "|" + str(k), v: str(k), save: (e: React.FocusEvent<HTMLTextAreaElement>) => setStr(k, e.target.value) };
      }),
    };
  }

  if (c.kind === "wheel") {
    const WN = [["Facilitate", "PI Planning"], ["Manage ART", "execution"], ["Manage risks", "and dependencies"], ["Foster relentless", "improvement"], ["Coach leaders", "and teams"], ["Communicate", "and align"]], WC = ["#ffd37a", "#f6b9ae", "#cfe8d4", "#cde0f2", "#d9cdf0", "#ffb627"];
    const wsel = ui.wsel as number | undefined, pol = (a: number, r: number): [number, number] => [220 + r * Math.cos(a), 220 + r * Math.sin(a)], wk = (i: number) => `w:${i}`;
    v.wheel = {
      segs: WN.map((_, i) => {
        const a0 = ((i * 60 - 120) * Math.PI) / 180, a1 = (((i + 1) * 60 - 120) * Math.PI) / 180, p = pol(a0, 214), q = pol(a1, 214), r = pol(a1, 62), t = pol(a0, 62);
        return { d: "M" + p + " A214 214 0 0 1 " + q + " L" + r + " A62 62 0 0 0 " + t + " Z", fill: WC[i], sw: wsel === i ? 6 : 2, go: () => setUi({ wsel: i }) };
      }),
      labels: WN.flatMap((n, i) => {
        const a = ((i * 60 - 90) * Math.PI) / 180, cc = pol(a, 142);
        return [{ x: cc[0], y: cc[1] - 2, t: n[0] }, { x: cc[0], y: cc[1] + 16, t: n[1] }];
      }),
      badges: WN.map((_, i) => ({ i, n: list(wk(i)).length, c: pol(((i * 60 - 90) * Math.PI) / 180, 188) })).filter((b) => b.n).map((b) => ({ n: b.n, x: b.c[0], y: b.c[1], ty: b.c[1] + 5 })),
      hint: wsel === undefined ? "CLICK A SPOKE OF THE WHEEL" : "RESPONSIBILITY " + (wsel + 1) + " OF 6",
      title: wsel === undefined ? "Which responsibility would be hardest in your organization?" : WN[wsel]!.join(" "),
      list: wsel === undefined ? [] : stkOf(wk(wsel)),
      add: wsel === undefined ? () => {} : push(wk(wsel)),
    };
  }

  if (c.kind === "metrics") {
    const msel = (S.msel as string[] | undefined) ?? [];
    const mpick = (m: string) => () => op({ key: "msel", op: "set", value: msel.includes(m) ? msel.filter((x) => x !== m) : [...msel, m] });
    v.met = {
      chips: MET.map((m) => ({ label: m, on: msel.includes(m), mark: msel.includes(m) ? "✓ " : "", bg: msel.includes(m) ? "#ffd37a" : "#fffaf0", sh: msel.includes(m) ? "2px 2px 0 #0d1815" : "none", go: mpick(m) })),
      none: msel.length === 0,
      cards: MET.filter((m) => msel.includes(m)).map((m) => ({
        name: m,
        fields: [["Purpose", "What question does this metric help you answer?"], ["Data source", "Where could you collect this data (for example, from a tool, report, or board)?"], ["Action", "How would you use the results to improve flow?"]].map((f, j) => {
          const k = `m:${m}:${j}`;
          return { l: f[0], q: f[1], key: k + "|" + str(k), v: str(k), save: (e: React.FocusEvent<HTMLTextAreaElement>) => setStr(k, e.target.value) };
        }),
      })),
      rk: "refl|" + str("refl"), rv: str("refl"), rs: (e: React.FocusEvent<HTMLTextAreaElement>) => setStr("refl", e.target.value),
    };
  }

  if (c.kind === "ctx") {
    const ins = list<Item>("ins");
    const VERD = ["Safe to implement directly", "Addresses the wrong problem"];
    v.ctx = {
      label: ins.length < 2 ? "PICK 1–2 INSIGHTS FROM THE HANDOUT · TYPE EACH ONE AND PRESS ENTER" : "DECIDE FOR EACH: SAFE TO IMPLEMENT, OR THE WRONG PROBLEM?",
      ph: ins.length < 2 ? "Paste or type an insight from the handout" : "Two insights selected. Remove one to swap.", op: ins.length < 2 ? 1 : 0.45,
      add: (e: Key) => {
        const t = e.currentTarget;
        if (e.key === "Enter" && t.value.trim() && ins.length < 2) {
          const val = t.value.trim();
          t.value = "";
          op({ key: "ins", op: "push", value: { t: val, v: null } });
        }
      },
      items: ins.map((i, x) => ({
        n: x + 1, t: i.t, key: `i${x}:${i.t}|${str("iw:" + i.t)}`, why: str("iw:" + i.t), save: (e: React.FocusEvent<HTMLTextAreaElement>) => setStr("iw:" + i.t, e.target.value), del: () => op({ key: "ins", op: "remove", id: i.id }),
        opts: VERD.map((l, vi) => ({ label: l, bg: i.v === vi ? (vi ? "#f6b9ae" : "#cfe8d4") : "#fff", go: () => op({ key: "ins", op: "update", id: i.id, value: { v: i.v === vi ? null : vi } }) })),
      })),
    };
  }

  if (c.kind === "accel") {
    type Ac = { a: string; m: string[] };
    const ac = (i: number): Ac => ({ a: "", m: [], ...((S[`ac:${i}`] as Ac | undefined) ?? {}) });
    const setAc = (i: number, p: Partial<Ac>) => op({ key: `ac:${i}`, op: "set", value: { ...ac(i), ...p } });
    const usedBy = (a: string) => PROBS.map((_, i) => i).find((i) => ac(i).a === a);
    const matched = PROBS.filter((_, i) => ac(i).a).length;
    v.acc = {
      tally: matched + " of 6 matched · " + (8 - matched) + " accelerators left",
      rows: PROBS.map((t, i) => {
        const r = ac(i);
        return {
          n: i + 1, t, val: r.a, bg: r.a ? "#fff3d0" : "#fffaf0", pick: (e: React.ChangeEvent<HTMLSelectElement>) => setAc(i, { a: e.target.value }),
          opts: ACCEL.map((a) => ({ v: a, l: a + (usedBy(a) !== undefined && usedBy(a) !== i ? " (used in #" + (usedBy(a)! + 1) + ")" : ""), dis: usedBy(a) !== undefined && usedBy(a) !== i })),
          mets: MET.map((m) => ({ label: m.replace("Flow ", ""), on: r.m.includes(m), bg: r.m.includes(m) ? "#ffd37a" : "#fff", go: () => setAc(i, { m: r.m.includes(m) ? r.m.filter((x) => x !== m) : [...r.m, m] }) })),
        };
      }),
    };
  }

  if (c.kind === "rca") Object.assign(v, rcaModel(c, op, list, str, setStr));

  if (c.kind === "ba") {
    const BAD = [["Leadership and Culture (L&C)", "#8ecfd0", "Leadership and|Culture (L&C)"], ["Team and Technical Agility (TTA)", "#0a85a3", "Team and Technical|Agility (TTA)"], ["Product Development Flow (PDF)", "#9a3320", "Product Development|Flow (PDF)"], ["Large Solution Integration and Development (LSID)", "#cc9348", "Large Solution Integration|and Development (LSID)"], ["Lean Portfolio Management (LPM)", "#1b6038", "Lean Portfolio|Management (LPM)"]];
    const ORD = [1, 2, 3, 4, 0], bval = (i: number) => (typeof S[`ba:${i}`] === "number" ? (S[`ba:${i}`] as number) : 3), ang = (k: number) => ((-90 + 72 * k) * Math.PI) / 180, RR = 150;
    const px = (k: number, r: number) => [r * Math.cos(ang(k)), r * Math.sin(ang(k))], arc = (k: number, val: number) => {
      const r = (RR * val) / 5, a = px(k, r), b = px(k + 1, r);
      return "M0 0 L" + a[0] + " " + a[1] + " A" + r + " " + r + " 0 0 1 " + b[0] + " " + b[1] + " Z";
    };
    const bdim = ORD.map((di, k) => ({ di, k })), lowest = BAD.map((d, i) => ({ d, v: bval(i) })).sort((a, b) => a.v - b.v)[0]!;
    v.ba = {
      dims: BAD.map((d, i) => ({ name: d[0], c: d[1], v: bval(i), set: (e: React.ChangeEvent<HTMLInputElement>) => op({ key: `ba:${i}`, op: "set", value: +e.target.value }) })),
      rings: [1, 2, 3, 4, 5].map((n) => ({ r: (RR * n) / 5 })), wedges: bdim.map((o) => ({ d: arc(o.k, bval(o.di)), c: BAD[o.di]![1] })),
      spokes: bdim.map((o) => {
        const p = px(o.k, RR);
        return { x: p[0], y: p[1] };
      }),
      poly: bdim.map((o) => px(o.k + 0.5, ((RR * bval(o.di)) / 5) * 1.0).join(",")).join(" "),
      labels: bdim.map((o) => {
        const m = o.k + 0.5, p = px(m, RR + 24), nn = BAD[o.di]![2]!.split("|"), right = Math.cos(ang(m)) > 0.1, left = Math.cos(ang(m)) < -0.1, down = Math.sin(ang(m)) > 0;
        return { x: p[0], y: p[1]! + (down ? 8 : -6), y2: p[1]! + (down ? 22 : 8), y3: p[1]! + (down ? 36 : 22), a: right ? "start" : left ? "end" : "middle", n1: nn[0], n2: nn[1], v: bval(o.di).toFixed(2) };
      }),
      insight: "Lowest score: " + lowest.d[0] + " (" + lowest.v.toFixed(2) + "). What is one change that would move it up a point?",
    };
  }

  if (c.kind === "vsm") Object.assign(v, vsmModel(c, op));

  if (c.kind === "bound") {
    v.bound = {
      lanes: [["AI is helpful here but needs human review", "Synthesizing team health survey data before I&A", "#cfd8d9"], ["AI should not be used here", "Determining team capacity or deciding who owns a dependency", "#e8ebea"]].map((L, i) => ({ title: L[0], ex: L[1], bg: L[2], bt: i ? "2px solid #fff" : "none", add: push(`L${i}`), list: stkOf(`L${i}`, () => (i ? STK[1]! : STK[3]!)) })),
    };
  }

  if (c.kind === "next") {
    const NV = ["Alignment", "Respect for People", "Transparency", "Relentless Improvement"], NP = ["Take an economic view", "Apply systems thinking", "Assume variability; preserve options", "Build incrementally with fast, integrated learning cycles", "Base milestones on objective evaluation of working systems", "Make value flow without interruptions", "Apply cadence; synchronize with cross-domain planning", "Unlock the intrinsic motivation of knowledge workers", "Decentralize decision-making", "Organize around value"];
    const nsel = (S.nsel as string[] | undefined) ?? [], ntog = (l: string) => () => op({ key: "nsel", op: "set", value: nsel.includes(l) ? nsel.filter((x) => x !== l) : [...nsel, l] });
    const nsv = (k: string) => (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => setStr(k, e.target.value);
    const d30 = new Date(Date.now() + 30 * 864e5);
    v.nx = {
      t1: str("n1"), t2: str("n2"), t3: str("n3"), s1: nsv("n1"), s2: nsv("n2"), s3: nsv("n3"), p1: str("n1") || "Not yet written", p3: str("n3") || "Not yet written", chosen: nsel,
      date: d30.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      values: NV.map((l) => ({ label: l, on: nsel.includes(l), bg: nsel.includes(l) ? "#ffb627" : "#fffaf0", go: ntog(l) })),
      principles: NP.map((l) => ({ label: l, on: nsel.includes(l), bg: nsel.includes(l) ? "#cfe8d4" : "#fffaf0", go: ntog(l) })),
    };
  }

  if (c.kind === "trust") {
    const pins = list<Item>("pins"), pk = ui.pick as number | null | undefined, pkPin = pk != null ? pins[pk] : undefined, actK = pkPin ? `act:${pkPin.id}` : "";
    const PC = ["#ffd37a", "#cde0f2", "#cfe8d4", "#f6b9ae", "#d9cdf0"];
    v.trust = {
      count: pins.length,
      undo: () => {
        if (!pins.length) return;
        op({ key: "pins", op: "remove", id: pins[pins.length - 1]!.id });
        if (pk != null && pk >= pins.length - 1) setUi({ pick: null });
      },
      click: (e: React.MouseEvent) => {
        const r = (e.currentTarget as Element).getBoundingClientRect();
        op({ key: "pins", op: "push", value: { x: Math.round(((e.clientX - r.left) / r.width) * 1000) / 10, y: Math.round(((e.clientY - r.top) / r.height) * 1000) / 10, label: "", why: "" } });
      },
      pins: pins.map((p, i) => ({ n: i + 1, x: p.x + "%", y: p.y + "%", bg: PC[i % 5] })),
      items: pins.map((p, i) => ({
        n: i + 1, bg: PC[i % 5], label: p.label, why: p.why, lk: p.id + "l" + p.label, wk: p.id + "w" + p.why, rowBg: pk === i ? "#fff3d0" : "#fffaf0", starBg: pk === i ? "#ffb627" : "#fff",
        saveLabel: (e: React.FocusEvent<HTMLInputElement>) => e.target.value !== p.label && op({ key: "pins", op: "update", id: p.id, value: { label: e.target.value } }),
        saveWhy: (e: React.FocusEvent<HTMLTextAreaElement>) => e.target.value !== p.why && op({ key: "pins", op: "update", id: p.id, value: { why: e.target.value } }),
        pick: () => setUi({ pick: pk === i ? null : i }),
      })),
      hasPick: !!pkPin, pickName: pkPin ? pkPin.label || "activity " + (pk! + 1) : "", acts: actK ? stkOf(actK) : [], addAct: actK ? push(actK) : () => {},
    };
  }

  return v;
}

/** The problem-solving workshop: six boxes, the fishbone with five whys per bone, votes, Pareto, backlog. */
function rcaModel(c: StudioCtx, op: Op, list: <T = Item>(k: string) => T[], str: (k: string) => string, setStr: (k: string, v: string) => void): Record<string, any> {
  const { cfg, ui, setUi } = c;
  type Why = Item & { t: string; v: number };
  type Idea = Item & { t: string; v: number };
  const E = ["what", "when", "where", "impact"] as const;
  const p1 = Object.fromEntries(E.map((k) => [k, str(`p1:${k}`)])) as Record<(typeof E)[number], string>;
  const p4 = Object.fromEntries(E.map((k) => [k, str(`p4:${k}`)])) as Record<(typeof E)[number], string>;
  const rv = (c.S.rv as number | undefined) ?? 0;
  const whys = (b: string) => list<Why>(`why:${b}`);
  const ideas = list<Idea>("ideas");
  const picks = (c.S.picks as string[] | undefined) ?? [];
  const busy = ui.busy as string | null | undefined, focus = ui.focus as string | null | undefined;
  const trunc = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1) + "…" : t);
  const probText = [p1.what, p1.when, p1.where, p1.impact].filter(Boolean).join(" ");
  const BRN = BR;
  const allC = BRN.flatMap((b) => whys(b[0]).map((w) => ({ b: b[0], t: w.t, v: w.v }))).filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
  const tot = allC.reduce((a, x) => a + x.v, 0);
  let run = 0;
  const ranked = allC.map((x, i) => {
    const before = run;
    run += x.v;
    return { ...x, rank: i + 1, cum: Math.round((run / tot) * 100), vital: before / tot < 0.8 };
  });
  const topN = ranked.slice(0, 8), mx = Math.max(5, topN.length ? topN[0]!.v : 5), PY = (val: number) => 10 + 220 * (1 - val / mx);
  const par = {
    none: ranked.length === 0, has: ranked.length > 0, top: ranked.length ? ranked[0]!.t : "",
    grid: Array.from({ length: mx + 1 }, (_, i) => ({ y: PY(i), ty: PY(i) + 4, l: i })),
    bars: topN.map((x, i) => ({ x: 56 + i * 72, w: 44, y: PY(x.v), h: (220 * x.v) / mx, cx: 78 + i * 72, ly: 248, fill: x.vital ? "#2c8c93" : "#b9d6d8", rank: "#" + x.rank })),
    line: topN.map((x, i) => 78 + i * 72 + "," + (10 + 220 * (1 - x.cum / 100))).join(" "), y80: 10 + 220 * 0.2, y80t: 10 + 220 * 0.2 - 4,
    rows: ranked.map((x) => ({ rank: "#" + x.rank, t: x.t, b: x.b.toUpperCase(), v: x.v, cum: x.cum, bg: x.vital ? "#b6e05a" : "#e6efc7" })),
  };
  const bxf = (b: (typeof BR)[number], y: number) => b[2] - 0.6 * (b[1] ? 300 - y : y - 300);
  const vote = (b: string, w: Why, d: number) => op({ key: `why:${b}`, op: "update", id: w.id, value: { v: Math.max(0, w.v + d) } });
  const mk = (b: (typeof BR)[number]) => {
    const ws = whys(b[0]), full = ws.length >= 5, key = b[0];
    const addV = (e: React.SyntheticEvent<HTMLInputElement>) => {
      const t = e.currentTarget, val = t.value.trim();
      if (val && !full) {
        t.value = "";
        op({ key: `why:${key}`, op: "push", value: { t: val, v: 0 } });
      }
    };
    return {
      ws, full, key,
      add: (e: Key) => e.key === "Enter" && addV(e),
      blur: addV,
      suggest: async () => {
        if (full || busy) return;
        setUi({ busy: key });
        const out = await c.ask('Fishbone root cause analysis. Problem: "' + (probText || "not stated yet") + '". Branch: ' + key + ". Existing chain of whys: " + (ws.map((w) => w.t).join(" -> ") || "none") + ". Give the next 2 likely causes in this chain, each under 12 words, one per line, no numbering.");
        out.slice(0, 5 - ws.length).slice(0, 2).forEach((t) => op({ key: `why:${key}`, op: "push", value: { t, v: 0 } }));
        setUi({ busy: null });
      },
    };
  };
  const sy = (b: (typeof BR)[number], k: number) => (b[1] ? 262 - 48 * k : 338 + 48 * k);
  const FC: Record<string, string> = { People: "#9a8de0", Process: "#6cc0ec", Tools: "#9ad98a", Work: "#f2e27a", Environment: "#f2a77a" };
  const tvOf = (b: (typeof BR)[number]) => whys(b[0]).reduce((a, w) => a + w.v, 0), allTv = BRN.reduce((a, b) => a + tvOf(b), 0), opB = (b: (typeof BR)[number]) => (!focus || focus === b[0] ? 1 : 0.28);
  const fish = {
    bones: BRN.map((b) => ({ x1: b[2] - 150, y1: b[1] ? 50 : 550, x2: b[2], y2: 300, c: FC[b[0]], sw: 6 + (allTv ? tvOf(b) / allTv : 0) * 14, op: opB(b) * (allTv && tvOf(b) === 0 ? 0.6 : 1) })),
    nodes: BRN.map((b, i) => ({ pts: b[2] - 24 + ",288 " + (b[2] + 14) + ",288 " + (b[2] + 26) + ",300 " + (b[2] + 14) + ",312 " + (b[2] - 24) + ",312", tx: b[2] - 2, ty: 306, n: i + 1, c: FC[b[0]], op: opB(b) })),
    dots: BRN.flatMap((b) => {
      const m = mk(b);
      return [0, 1, 2, 3, 4].filter((k) => k <= m.ws.length && !(k === m.ws.length && m.full)).map((k) => {
        const y = sy(b, k), w = m.ws[k];
        return { cx: bxf(b, y), cy: y, r: w ? 7 + Math.min(w.v, 6) * 2 : 7, c: FC[b[0]], fill: w ? FC[b[0]] : "transparent", dash: w ? "0" : "4 3", op: opB(b) };
      });
    }),
    glows: BRN.flatMap((b) => whys(b[0]).map((w, k) => ({ w, k, b })).filter((x) => x.w.v >= 3).map((x) => ({ cx: bxf(x.b, sy(x.b, x.k)), cy: sy(x.b, x.k), r: 10 + x.w.v * 2.5, c: FC[x.b[0]] }))),
    cats: BRN.map((b, i) => {
      const m = mk(b), cx = b[2] - 150, cy = b[1] ? 36 : 566;
      return { name: b[0], ini: String(i + 1), c: FC[b[0]], votes: tvOf(b), op: opB(b), on: focus === b[0], bd: focus === b[0] ? "3px solid #fff" : "3px solid transparent", sh: focus === b[0] ? "0 0 0 3px " + FC[b[0]] : "none", l: (cx - 190 + 26) / 10 + "%", t: (cy - 22) / 6 + "%", sug: busy === b[0] ? "…" : "✦", focus: () => setUi({ focus: focus === b[0] ? null : b[0] }), suggest: m.suggest };
    }),
    slots: BRN.flatMap((b) => {
      const m = mk(b);
      return [0, 1, 2, 3, 4].map((k) => {
        const y = sy(b, k), w = m.ws[k];
        return { l: (bxf(b, y) - 18 - 170) / 10 + "%", t: (y - 20) / 6 + "%", c: FC[b[0]], op: opB(b), filled: !!w, input: !w && k === m.ws.length, tx: w ? w.t : "", num: "CAUSE 0" + (k + 1), v: w ? w.v : 0, bg: w && w.v ? FC[b[0]] : "transparent", fg: w && w.v ? "#1b2230" : FC[b[0]], ph: k === 0 ? "Cause 1…" : "Why " + (k + 1) + "?", add: m.add, blur: m.blur, up: () => w && vote(b[0], w, 1), del: () => w && op({ key: `why:${b[0]}`, op: "remove", id: w.id }) };
      });
    }),
    headText: trunc(p1.what || probText || "Problem", 60), topLabel: ranked.length ? "TOP CAUSE · " + ranked[0]!.b.toUpperCase() : "", top: ranked.length ? trunc(ranked[0]!.t, 60) : "",
  };
  const vital = ranked.filter((x) => x.vital);
  const ideasSorted = picks.map((t) => ideas.find((x) => x.t === t)).filter((x): x is Idea => !!x);
  const setPick = (t: string) => op({ key: "picks", op: "set", value: picks.includes(t) ? picks.filter((x) => x !== t) : picks.length < 3 ? [...picks, t] : picks });
  const PH = { what: "What happened?", when: "When did it happen?", where: "Where did it happen?", impact: "What was the impact?" }, FL = [["what", "What"], ["when", "When"], ["where", "Where"], ["impact", "Impact"]] as const;
  // Box 4 starts from box 1 with the biggest root cause as its "what", until someone writes over it.
  const dv4 = ranked.length ? { what: ranked[0]!.t, when: p1.when, where: p1.where, impact: p1.impact } : { what: "", when: "", where: "", impact: "" };
  const pf = (pk: "p1" | "p4", ver: string | number) => FL.map((q) => {
    const dv = pk === "p4" ? dv4[q[0]] : "", own = pk === "p1" ? p1[q[0]] : p4[q[0]], val = own || dv;
    return { label: q[1], ph: PH[q[0]], key: pk + ver + q[0] + "|" + val, v: val, bg: pk === "p1" ? "#fff59d" : "#f9b5b5", save: (e: React.FocusEvent<HTMLTextAreaElement>) => {
      const t = e.target.value;
      setStr(`${pk}:${q[0]}`, t === dv ? "" : t);
    } };
  });
  const zz = (ui.rzoom as string | null | undefined) ?? null, RS = zz ? "zoom" : ui.rcaAll ? "all" : cfg.rstep || "rca";
  const SH: Record<string, string> = { agree: "WORK IN YOUR GROUP · WRITE THE PROBLEM IN BOX 1 (WHAT · WHEN · WHERE · IMPACT)", rca: "BRAINSTORM CAUSES ON THE BONES · USE THE FIVE WHYS · ▲ TO VOTE", restate: "DOT VOTE · BOX 3 RANKS BY PARETO · RESTATE THE PROBLEM IN BOX 4", brainstorm: "ONE IDEA PER STICKY · DISCUSS · AFFINITY GROUP · DOT VOTE · TOP IDEAS FILL BOX 6", readout: "READ OUT: START WITH THE ORIGINAL PROBLEM, END WITH THE BACKLOG ITEMS", zoom: "ENLARGED · EDIT HERE, THE FULL BOARD UPDATES LIVE", all: "THE WHOLE BOARD ON ONE PAGE · WORK ANY BOX IN ANY ORDER, BOXES 3 AND 6 FILL THEMSELVES FROM THE VOTES" };
  const inS = (...a: string[]) => RS === "all" || a.includes(RS), inA = (...a: string[]) => a.includes(RS);
  const votes = BRN.flatMap((b) => whys(b[0]).map((w) => ({ b: b[0].toUpperCase(), c: FC[b[0]], t: w.t, v: w.v, bg: w.v ? "#b6e05a" : "#fff", up: () => vote(b[0], w, 1) })));
  const BG: [string, number, number, string][] = [["People", 1, 250, "#7a6bd0"], ["Process", 1, 440, "#2a8fc4"], ["Tools", 0, 170, "#3f9a4a"], ["Work", 0, 350, "#c29a14"], ["Environment", 0, 540, "#d9763a"]];
  const bsy = (t: number, k: number) => (t ? 250 - 38 * k : 310 + 38 * k), bbx = (g: (typeof BG)[number], y: number) => g[2] - 0.526 * Math.abs(280 - y);
  const brOf = (g: (typeof BG)[number]) => BRN.find((b) => b[0] === g[0])!;
  const brd = {
    bones: BG.map((g) => ({ x1: g[2] - 100, y1: g[1] ? 90 : 470, x2: g[2], y2: 280, c: g[3] })),
    labels: BG.map((g) => ({ name: g[0], c: g[3], l: (g[2] - 100 - 70) / 10 + "%", t: ((g[1] ? 62 : 502) - 17) / 5.6 + "%", sug: busy === g[0] ? "…" : "✦", suggest: mk(brOf(g)).suggest })),
    dots: BG.flatMap((g) => {
      const m = mk(brOf(g));
      return [0, 1, 2, 3, 4].filter((k) => k <= m.ws.length && !(k === m.ws.length && m.full)).map((k) => {
        const y = bsy(g[1], k), w = m.ws[k];
        return { cx: bbx(g, y), cy: y, r: w ? 5 + Math.min(w.v, 5) * 1.6 : 5, fill: w ? g[3] : "#fff", c: g[3], dash: w ? "0" : "3 2" };
      });
    }),
    slots: BG.flatMap((g) => {
      const m = mk(brOf(g));
      return [0, 1, 2, 3, 4].map((k) => {
        const y = bsy(g[1], k), w = m.ws[k];
        return { c: g[3], l: (bbx(g, y) - 10 - 130) / 10 + "%", tp: (y - 17) / 5.6 + "%", filled: !!w, input: !w && k === m.ws.length, tx: w ? w.t : "", v: w ? w.v : 0, bg: w && w.v ? "#b6e05a" : "#fff", ph: k === 0 ? "Cause 1…" : "Why " + (k + 1) + "?", add: m.add, blur: m.blur, up: () => w && vote(g[0], w, 1), del: () => w && op({ key: `why:${g[0]}`, op: "remove", id: w.id }) };
      });
    }),
  };
  const setZ = (id: string) => () => setUi({ rzoom: id }), nW = votes.length, tV = votes.reduce((a, x) => a + x.v, 0), p1Full = !!probText, p4Full = !!(p4.what || (ranked.length && p1.what));
  const zoom = {
    on: !!zz, back: () => setUi({ rzoom: null }),
    chips: [["b1", "1", "Problem", p1Full ? "✓" : "–"], ["fish", "2", "Causes", nW + " whys"], ["b3", "3", "Top cause", ranked.length ? "ranked" : "–"], ["b4", "4", "Restate", p4Full ? "✓" : "–"], ["b5", "5", "Ideas", ideas.length + ""], ["b6", "6", "Backlog", ideasSorted.length + ""]].map((x) => ({ n: x[1], label: x[2], info: x[3], bg: zz === x[0] ? "#ffb627" : "transparent", fg: zz === x[0] ? "#0d1815" : "#d3e7ea", bd: zz === x[0] ? "#ffb627" : "#9fc5cb", go: setZ(x[0]!) })),
  };
  const z = { b1: setZ("b1"), b4: setZ("b4"), b5: setZ("b5"), b3: setZ("b3"), b6: setZ("b6"), fish: setZ("fish"), fishInfo: nW + " causes · " + tV + " votes" };
  const st = (t: string) => str(`st:${t}`) || "To do", own = (t: string) => str(`own:${t}`);
  const rca = {
    z, zoom, brd, stepHint: SH[RS], showToggle: cfg.rstep !== "all", allOn: !!ui.rcaAll, allLabel: ui.rcaAll ? "← Back to this step" : "Show full board", toggleAll: () => setUi({ rcaAll: !ui.rcaAll }),
    probText: probText || "Not written yet. Go back to “Agree on the problem”.",
    branches: BRN.map((b) => {
      const m = mk(b), col = FC[b[0]];
      return {
        name: b[0], c: col, op: opB(b), count: m.ws.length, sug: busy === b[0] ? "…" : "✦ Suggest", suggest: m.suggest, canAdd: !m.full, hasAny: m.ws.length > 0,
        ph: m.ws.length ? "Why does that happen? Type, then click away" : "What is the first cause? Type, then click away", add: m.add, blur: m.blur,
        tickets: m.ws.map((w, k) => ({
          arrow: k > 0, label: k === 0 ? "CAUSE" : "WHY " + (k + 1), t: w.t, v: w.v, key: w.id + "-" + w.t, bg: w.v ? "#2a3448" : "#232c3d", sh: w.v ? "0 0 0 2px " + col + "55" : "none", vbg: w.v ? col : "transparent", vfg: w.v ? "#1b2230" : col,
          save: (e: React.FocusEvent<HTMLTextAreaElement>) => {
            const t = e.target.value.trim();
            if (t && t !== w.t) op({ key: `why:${b[0]}`, op: "update", id: w.id, value: { t } });
          },
          up: () => vote(b[0], w, 1), down: () => vote(b[0], w, -1), del: () => op({ key: `why:${b[0]}`, op: "remove", id: w.id }),
        })),
      };
    }),
    votes, noWhys: votes.length === 0,
    show: { board: RS === "all", fish: inA("rca", "readout") || zz === "fish", right: inA("agree", "restate", "brainstorm", "readout") || (!!zz && zz !== "fish"), bar: inA("rca", "restate", "brainstorm") || ["fish", "b4", "b5"].includes(zz ?? ""), b1: inS("agree", "readout") || zz === "b1", b4: inS("restate", "readout") || zz === "b4", guide: inS("agree", "restate") || zz === "b1" || zz === "b4", exm: inA("restate") || zz === "b4", vote: inA("restate"), b5: inS("brainstorm", "readout") || zz === "b5", b3: inS("restate", "readout") || zz === "b3", b6: inS("brainstorm", "readout") || zz === "b6" },
    rightCols: zz ? "minmax(0,1fr)" : "minmax(0,1fr) minmax(0,1fr)", p1: pf("p1", ""), p4: pf("p4", rv), fish, par,
    // Re-import: box 4 forgets what was typed and starts again from box 1 and the top cause.
    draft: () => {
      E.forEach((k) => op({ key: `p4:${k}`, op: "set", value: null }));
      op({ key: "rv", op: "set", value: rv + 1 });
    },
    ideas: {
      sugLabel: busy === "ideas" ? "…" : "✦ Suggest ideas",
      add: (e: Key) => {
        const t = e.currentTarget;
        if (e.key === "Enter" && t.value.trim()) {
          const val = t.value.trim();
          t.value = "";
          op({ key: "ideas", op: "push", value: { t: val, v: 0 } });
        }
      },
      suggest: async () => {
        if (busy) return;
        setUi({ busy: "ideas" });
        const out = await c.ask('Problem: "' + ([p4.what, p4.when, p4.where, p4.impact].filter(Boolean).join(" ") || probText || "not stated") + '". Biggest root cause: ' + (vital[0] ? vital[0].t : "not yet voted") + ". Suggest 3 concrete improvement ideas an Agile Release Train could try, each under 14 words, one per line, no numbering.");
        out.slice(0, 3).forEach((t) => op({ key: "ideas", op: "push", value: { t, v: 0 } }));
        setUi({ busy: null });
      },
      list: ideas.map((x) => ({ t: x.t, v: x.v, star: () => setPick(x.t), starL: picks.includes(x.t) ? "★" : "☆", starC: picks.includes(x.t) ? "#d98a00" : "#4d5a52", bg: x.v ? "#fff" : "#e8f7fb", up: () => op({ key: "ideas", op: "update", id: x.id, value: { v: x.v + 1 } }), down: () => op({ key: "ideas", op: "update", id: x.id, value: { v: Math.max(0, x.v - 1) } }), del: () => op({ key: "ideas", op: "remove", id: x.id }) })),
    },
    copyLabel: ui.copied ? "Copied ✓" : "Copy backlog",
    autoPick: () => op({ key: "picks", op: "set", value: ideas.filter((x) => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 3).map((x) => x.t) }),
    pickCount: picks.length + "/3 picked",
    copy: () => {
      const txt = ideasSorted.map((x, k) => k + 1 + ". " + x.t + " [" + st(x.t) + (own(x.t) ? ", " + own(x.t) : "") + "]").join("\n");
      void navigator.clipboard?.writeText(txt).catch(() => undefined);
      setUi({ copied: true });
      setTimeout(() => setUi({ copied: false }), 1500);
    },
    bl: { none: ideasSorted.length === 0, items: ideasSorted.map((x, k) => ({ n: k + 1, t: x.t, v: x.v, st: st(x.t), own: own(x.t), key: "o" + x.t + "|" + own(x.t), op: st(x.t) === "Done" ? 0.6 : 1, setSt: (e: React.ChangeEvent<HTMLSelectElement>) => setStr(`st:${x.t}`, e.target.value), setOwn: (e: React.FocusEvent<HTMLInputElement>) => setStr(`own:${x.t}`, e.target.value) })) },
  };
  return { rca };
}

/** Value stream maps: rows of steps (current) or Exploration, Integration, Deployment (future). */
function vsmModel(c: StudioCtx, op: Op): Record<string, any> {
  type Step = { id: string; n: string; pt: string; dt: string; ca: string };
  type Lane = { id: string; name: string; note: string; steps: Step[] };
  const vkind = c.cfg.vsm as "current" | "future" | undefined;
  let seq = 0;
  const nid = () => Math.random().toString(36).slice(2, 8);
  // The starting layout has fixed ids, so it renders the same until someone changes it.
  const fixed = () => "s" + seq++;
  const mkStep = (id: () => string): Step => ({ id: id(), n: "", pt: "", dt: "", ca: "" });
  const vdef = (id: () => string): Lane[] => (vkind === "future" ? ([["Exploration", 3], ["Integration", 6], ["Deployment", 4]] as [string, number][]).map((g) => ({ id: id(), name: g[0], note: "", steps: Array.from({ length: g[1] }, () => mkStep(id)) })) : [6, 3, 4].map((n) => ({ id: id(), name: "", note: "", steps: Array.from({ length: n }, () => mkStep(id)) })));
  const lanesV = (c.S.lanes as Lane[] | undefined) ?? vdef(fixed);
  const setV = (fn: (l: Lane[]) => Lane[]) => op({ key: "lanes", op: "set", value: fn(lanesV) });
  const num = (val: string) => {
    const m = String(val || "").match(/-?\d+(\.\d+)?/);
    return m ? +m[0] : 0;
  };
  const allS = lanesV.flatMap((l) => l.steps), tPT = allS.reduce((a, x) => a + num(x.pt), 0), tDT = allS.reduce((a, x) => a + num(x.dt), 0), cas = allS.filter((x) => x.ca).map((x) => num(x.ca));
  const setS = (li: number, si: number, p: Partial<Step>) => setV((ls) => ls.map((l, a) => (a === li ? { ...l, steps: l.steps.map((x, b) => (b === si ? { ...x, ...p } : x)) } : l)));
  // The future state starts from the current-state map on the same board.
  const cur = c.board.frames.find((f) => f.activity?.board === "vsm" && f.activity.config?.vsm === "current");
  const prevLanes = ((cur?.state?.lanes as Lane[] | undefined) ?? []);
  const vsm = {
    future: vkind === "future",
    hint: vkind === "future" ? "GROUP THE STEPS (EXPLORATION · INTEGRATION · DEPLOYMENT), SHRINK THE DELAYS, AND NAME THE FIX IN EACH CALLOUT" : "FILL THE BOXES, PROCESS TIME, DELAY BEFORE EACH STEP AND %C&A. DELAYS OVER 40 HRS AND %C&A UNDER 80 ARE FLAGGED AUTOMATICALLY",
    addLabel: vkind === "future" ? "+ Add group" : "+ Add row",
    sum: [{ l: "Steps " + allS.length, bg: "#fffaf0" }, { l: "Process " + tPT + " hrs", bg: "#cde0f2" }, { l: "Delay " + tDT + " hrs", bg: "#f6b9ae" }, { l: "Flow efficiency " + (tPT + tDT ? Math.round((tPT / (tPT + tDT)) * 100) : 0) + "%", bg: "#cfe8d4" }, { l: "Lowest %C&A " + (cas.length ? Math.min(...cas) + "%" : "–"), bg: "#ffd37a" }],
    addLane: () => setV((ls) => [...ls, { id: nid(), name: "", note: "", steps: [mkStep(nid), mkStep(nid), mkStep(nid)] }]),
    copy: () => setV((ls) => {
      const names = ["Exploration", "Integration", "Deployment"];
      return (prevLanes.length ? prevLanes : ls).map((l, i) => ({ ...l, id: nid(), name: ls[i] ? ls[i]!.name : names[i] || "", note: "", steps: l.steps.map((x) => ({ ...x, id: nid() })) }));
    }),
    lanes: lanesV.map((l, li) => ({
      key: l.id + "n" + l.name, nkey: l.id + "c" + l.note, name: l.name, note: l.note, bd: vkind === "future" ? "2px solid #8a8a8a" : "2px solid #0d181833", hd: vkind === "future" ? "flex" : "none",
      saveName: (e: React.FocusEvent<HTMLInputElement>) => e.target.value !== l.name && setV((ls) => ls.map((x, a) => (a === li ? { ...x, name: e.target.value } : x))),
      saveNote: (e: React.FocusEvent<HTMLTextAreaElement>) => e.target.value !== l.note && setV((ls) => ls.map((x, a) => (a === li ? { ...x, note: e.target.value } : x))),
      del: () => setV((ls) => (ls.length > 1 ? ls.filter((_, a) => a !== li) : ls)),
      addStep: () => setV((ls) => ls.map((x, a) => (a === li ? { ...x, steps: [...x.steps, mkStep(nid)] } : x))),
      steps: l.steps.map((x, si) => {
        const first = li === 0 && si === 0, d = num(x.dt), cc = x.ca ? num(x.ca) : 100, slow = d >= 40;
        return {
          id: x.id + "|" + x.n + "|" + x.pt + "|" + x.dt + "|" + x.ca, n: x.n, pt: x.pt, dt: x.dt, ca: x.ca, w: first ? "120px" : "164px", cw: first ? "0px" : "44px", bd: "2px solid #1f4a6b", dbd: slow ? "2px solid #ef5a43" : "none", cbd: x.ca && cc < 80 ? "2px solid #ef5a43" : "none", slow, days: Math.round(d / 24), poor: !!x.ca && cc < 80,
          saveN: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => e.target.value !== x.n && setS(li, si, { n: e.target.value }),
          savePt: (e: React.FocusEvent<HTMLInputElement>) => e.target.value !== x.pt && setS(li, si, { pt: e.target.value }),
          saveDt: (e: React.FocusEvent<HTMLInputElement>) => e.target.value !== x.dt && setS(li, si, { dt: e.target.value }),
          saveCa: (e: React.FocusEvent<HTMLInputElement>) => e.target.value !== x.ca && setS(li, si, { ca: e.target.value }),
          del: () => setV((ls) => ls.map((q, a) => (a === li ? { ...q, steps: q.steps.filter((_, b) => b !== si) } : q))),
        };
      }),
    })),
  };
  return { vsm };
}
