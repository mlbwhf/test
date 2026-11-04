"use client";

// The planning suite's pages, ported from the design prototypes' logic (Trainyard Roadmap, OKR
// Board and PI Planning Board .dc.html): each keeps the prototype's state shape and rules and
// renders the generated layout in planning-views.tsx. What the prototype kept in browser storage
// lives in the workspace's documents (lib/doc.ts); the epic title is still the join key between
// the roadmap, the OKR board and the planning room, as in the prototype.

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { Loading } from "@/components/ui";
import { OkrBoardView, PlanningRoomView, RoadmapView } from "@/components/planning-views";
import { useDoc, useDocOnce, type DocKey } from "@/lib/doc";
import { ALICE_FEATURES, GEEKBOOKS_FEATURES, type BacklogFeature } from "@/components/handout-scenarios";
import { api, ApiFailure } from "@/lib/api";

const page = (bg: string) => ({ margin: "-16px", padding: "0 0 60px", background: bg, minHeight: "100vh", fontFamily: "'Instrument Sans', sans-serif", color: "#14123a" }) as React.CSSProperties;
const Note = ({ text }: { text: string | null }) => (text ? <div style={{ margin: "0 5vw", padding: "10px 16px", background: "#fff4c2", border: "2px solid #14123a", borderRadius: 12, fontWeight: 600 }}>{text}</div> : null);

// ---- Roadmap -------------------------------------------------------------------------------
export type RoadItem = { id: string; title: string; type: "epic" | "enabler" | "feature"; lane: string; start: number; len: number; committed: boolean; placed: boolean };
export type RoadmapDoc = { lanes: { id: string; name: string; info: string }[]; items: RoadItem[]; miles: { id: string; title: string; at: number; release: boolean }[] };
const COL: Record<string, string> = { epic: "#4a5fe8", enabler: "#c8372d", feature: "#14123a" };
const TN: Record<string, string> = { epic: "Epic", enabler: "Enabler", feature: "Feature" };
const MAX = 12;
function toB64(buf: ArrayBuffer): string {
  let out = "";
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i += 0x8000) out += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(out);
}
const TINT = ["#cfe9e4", "#e6e0f7", "#f6e3c9"];
const BAND = ["Forecast in quarters", "Forecast in half years", "Forecast in years"];
const nid = (p: string) => p + Math.random().toString(36).slice(2, 8);
export const ROADMAP_SAMPLE: RoadmapDoc = {
  lanes: [{ id: "a1", name: "ART 1", info: "Navigation" }, { id: "a2", name: "ART 2", info: "Perception" }, { id: "a3", name: "ART 3", info: "Delivery" }],
  items: [
    { id: "i1", title: "GPS", type: "epic", lane: "a1", start: 1, len: 1, committed: true, placed: true },
    { id: "i2", title: "Follow route", type: "epic", lane: "a1", start: 2, len: 2, committed: true, placed: true },
    { id: "i3", title: "Make turns", type: "epic", lane: "a1", start: 4, len: 2, committed: false, placed: true },
    { id: "i4", title: "Mapping software", type: "enabler", lane: "a1", start: 6, len: 3, committed: false, placed: true },
    { id: "i5", title: "Surround cameras", type: "enabler", lane: "a2", start: 1, len: 2, committed: true, placed: true },
    { id: "i6", title: "Stay in lane", type: "epic", lane: "a2", start: 3, len: 2, committed: true, placed: true },
    { id: "i7", title: "Obey traffic laws", type: "epic", lane: "a2", start: 5, len: 3, committed: false, placed: true },
    { id: "i8", title: "Forward radar", type: "enabler", lane: "a3", start: 1, len: 1, committed: true, placed: true },
    { id: "i9", title: "Ultrasonic sensors", type: "enabler", lane: "a3", start: 2, len: 2, committed: true, placed: true },
    { id: "i10", title: "Delivery spike", type: "enabler", lane: "a3", start: 6, len: 3, committed: false, placed: true },
    { id: "i11", title: "Self-park", type: "epic", lane: "a3", start: 9, len: 3, committed: false, placed: false },
    { id: "i12", title: "Real-time status", type: "feature", lane: "a1", start: 1, len: 1, committed: false, placed: false },
  ],
  miles: [
    { id: "m1", title: "Annual suppliers’ event", at: 1, release: false },
    { id: "m2", title: "Route following v1.0", at: 5, release: true },
    { id: "m3", title: "First field test", at: 7, release: false },
    { id: "m4", title: "On-road certification", at: 10, release: false },
  ],
};
export const BLANK_ROADMAP: RoadmapDoc = { lanes: [{ id: "a1", name: "ART 1", info: "Name this train" }, { id: "a2", name: "ART 2", info: "Name this train" }], items: [], miles: [] };

type RoadState = RoadmapDoc & { tab: "timeline" | "plan"; from: number; count: number; curPI: number; sel: { k: "i" | "m"; id: string } | null; checked: Record<string, boolean>; newText: string; ghost: { x: number; y: number; id: string } | null; flash: string | null };

export function RoadmapPage() {
  const { doc, loaded, save, error } = useDoc<RoadmapDoc>("roadmap");
  const [s, setS] = useState<RoadState | null>(null);
  const sRef = useRef<RoadState | null>(null);
  sRef.current = s;
  useEffect(() => {
    if (loaded && !s) setS({ ...structuredClone(doc ?? ROADMAP_SAMPLE), tab: "timeline", from: 1, count: 12, curPI: 1, sel: null, checked: {}, newText: "", ghost: null, flash: null });
  }, [loaded, doc, s]);
  useEffect(() => {
    if (s) save({ lanes: s.lanes, items: s.items, miles: s.miles });
  }, [s, save]);
  const set = useCallback((fn: (t: RoadState) => Partial<RoadState>) => setS((t) => (t ? { ...t, ...fn(t) } : t)), []);
  if (!s) return <Loading error={error ? new ApiFailure(0, "ERROR", error) : null} />;
  const upd = (id: string, patch: Partial<RoadItem>) => set((t) => ({ items: t.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  const cell = () => { const t = document.querySelector("[data-track]"); if (!t) return null; const r = t.getBoundingClientRect(); return { r, w: r.width / sRef.current!.count }; };
  const laneAt = (x: number, y: number) => {
    const el = document.elementsFromPoint(x, y).map((e) => e.closest && e.closest("[data-lane]")).find(Boolean) as Element | undefined;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { lane: el.getAttribute("data-lane")!, cell: Math.floor((x - r.left) / (r.width / sRef.current!.count)) + sRef.current!.from };
  };
  const drag = (e: React.PointerEvent, id: string, mode: "move" | "resize" | "new") => {
    e.stopPropagation();
    if (e.button) return;
    const it = s.items.find((i) => i.id === id)!, c = cell();
    const d = { x0: e.clientX, y0: e.clientY, start0: it.start, len0: it.len, moved: false, w: c ? c.w : 80 };
    const mv = (ev: PointerEvent) => {
      const dx = ev.clientX - d.x0;
      if (!d.moved && Math.abs(dx) + Math.abs(ev.clientY - d.y0) < 4) return;
      d.moved = true;
      if (mode === "new") { set(() => ({ ghost: { x: ev.clientX + 12, y: ev.clientY + 12, id } })); return; }
      if (mode === "resize") { upd(id, { len: Math.max(1, Math.min(MAX + 1 - d.start0, d.len0 + Math.round(dx / d.w))) }); return; }
      const hit = laneAt(ev.clientX, ev.clientY);
      const start = Math.max(1, Math.min(MAX + 1 - d.len0, d.start0 + Math.round(dx / d.w)));
      upd(id, hit ? { start, lane: hit.lane } : { start });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
      if (mode === "new") {
        set(() => ({ ghost: null }));
        if (d.moved) { const hit = laneAt(ev.clientX, ev.clientY); if (hit) upd(id, { placed: true, lane: hit.lane, start: Math.max(1, Math.min(MAX, hit.cell)) }); }
      }
      set(() => ({ sel: { k: "i", id } }));
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
  };
  const pack = (laneId: string) => {
    const ends: number[] = [], out: { i: RoadItem; r: number; s: number; e: number }[] = [];
    s.items.filter((i) => i.placed && i.lane === laneId).sort((a, b) => a.start - b.start).forEach((i) => {
      let r = ends.findIndex((e) => e <= i.start);
      if (r < 0) { r = ends.length; ends.push(0); }
      ends[r] = i.start + i.len;
      const a = Math.max(i.start, s.from), e = Math.min(i.start + i.len, s.from + s.count);
      if (e > a) out.push({ i, r, s: a, e });
    });
    return { out, rows: Math.max(ends.length, 1) };
  };
  const addCardRaw = (title: string, extra: Partial<RoadItem> = {}) => { const id = nid("n"); set((t) => ({ items: [...t.items, { id, title, type: "feature", lane: t.lanes[0]?.id ?? "", start: t.from, len: 1, committed: false, placed: false, ...extra }], sel: { k: "i", id } })); };
  const N = s.count, from = s.from;
  const selI = s.sel?.k === "i" ? s.items.find((i) => i.id === s.sel!.id) : undefined;
  const selM = s.sel?.k === "m" ? s.miles.find((m) => m.id === s.sel!.id) : undefined;
  const seg = (on: boolean) => ({ bg: on ? "#14123a" : "transparent", fg: on ? "#fff" : "#14123a" });
  const pct = (n: number) => `${(n * 100) / N}%`;
  const lanes = s.lanes.map((l) => {
    const { out, rows } = pack(l.id);
    return {
      id: l.id, name: l.name, info: `${s.items.filter((i) => i.placed && i.lane === l.id).length} cards`, h: Math.max(84, rows * 46 + 14),
      dbl: (e: React.MouseEvent) => { if (e.target !== e.currentTarget) return; const r = e.currentTarget.getBoundingClientRect(); addCardRaw("New card", { placed: true, lane: l.id, start: Math.floor((e.clientX - r.left) / (r.width / N)) + from, type: "epic" }); },
      items: out.map(({ i, r, s: a, e }) => { const on = selI?.id === i.id; return { title: i.title, left: pct(a - from), w: `calc(${pct(e - a)} - 4px)`, top: 7 + r * 46, color: COL[i.type], border: i.committed ? "solid" : "dashed", op: i.committed ? 1 : 0.82, outline: on ? "3px solid #ff3d8f" : "none", z: on ? 5 : 1, anim: s.flash === i.id ? "pulse .7s 3" : "none", down: (ev: React.PointerEvent) => drag(ev, i.id, "move"), resize: (ev: React.PointerEvent) => drag(ev, i.id, "resize") }; }),
    };
  });
  const pis: any[] = [], bands: any[] = [];
  for (let k = 0; k < N; k++) { const a = from + k, b = a <= 4 ? 0 : a <= 8 ? 1 : 2; pis.push({ label: "PI " + a, tint: TINT[b] }); bands.push({ tint: TINT[b], label: k === 0 || a === 5 || a === 9 ? BAND[b] : "" }); }
  const miles = s.miles.filter((m) => m.at >= from && m.at < from + N).map((m) => ({ title: m.title, left: `calc(${pct(m.at - from + 0.5)} - ${N > 6 ? 55 : 80}px)`, w: `${N > 6 ? 110 : 160}px`, fill: m.release ? "#ffe14d" : "#8a8a99", outline: selM?.id === m.id ? "3px solid #ff3d8f" : "none", pick: (e: React.MouseEvent) => { e.stopPropagation(); set(() => ({ sel: { k: "m", id: m.id } })); } }));
  const cards = s.items.map((i) => ({
    title: i.title, color: COL[i.type], op: i.placed ? 1 : 0.6, cursor: i.placed ? "default" : "grab", bg: selI?.id === i.id ? "#fff4c2" : "#fff",
    sub: TN[i.type] + (i.placed ? ` · ${s.lanes.find((l) => l.id === i.lane)?.name ?? ""} · PI ${i.start}` : " · not on board"),
    checked: !!s.checked[i.id], toggle: () => set((t) => ({ checked: { ...t.checked, [i.id]: !t.checked[i.id] } })), stop: (e: React.SyntheticEvent) => e.stopPropagation(),
    action: i.placed ? "Locate" : "Place", down: (e: React.PointerEvent) => { if (!i.placed) drag(e, i.id, "new"); },
    locate: () => {
      if (i.placed) { const nf = i.start < from || i.start >= from + N ? Math.max(1, Math.min(MAX + 1 - N, i.start)) : from; set(() => ({ tab: "timeline", from: nf, sel: { k: "i", id: i.id }, flash: i.id })); setTimeout(() => set(() => ({ flash: null })), 2200); }
      else upd(i.id, { placed: true, start: from, lane: i.lane || s.lanes[0]?.id || "" });
    },
  }));
  const unplacedChecked = s.items.filter((i) => s.checked[i.id] && !i.placed).length;
  const planCols = [0, 1, 2].map((o) => {
    const pi = s.curPI + o, its = s.items.filter((i) => i.placed && i.start === pi);
    const mk = (i: RoadItem) => ({ title: i.title, color: COL[i.type], lane: `${s.lanes.find((l) => l.id === i.lane)?.name ?? ""} · ${i.len} ${i.len > 1 ? "PIs" : "PI"}`, bd: selI?.id === i.id ? "#ff3d8f" : "transparent", pick: () => { if (o === 0) upd(i.id, { committed: !i.committed }); set(() => ({ sel: { k: "i", id: i.id } })); }, left: (e: React.MouseEvent) => { e.stopPropagation(); upd(i.id, { start: Math.max(1, i.start - 1) }); }, right: (e: React.MouseEvent) => { e.stopPropagation(); upd(i.id, { start: Math.min(MAX, i.start + 1) }); } });
    const groups = o === 0 ? [{ name: "COMMITTED", hd: "flex", cards: its.filter((i) => i.committed).map(mk) }, { name: "UNCOMMITTED", hd: "flex", cards: its.filter((i) => !i.committed).map(mk) }] : [{ name: "", hd: "none", cards: its.map(mk) }];
    const ms = s.miles.filter((m) => m.at === pi).map((m) => ({ title: m.title, fill: m.release ? "#ffe14d" : "#8a8a99" }));
    return { title: o === 0 ? `PI ${pi} Plan` : `PI +${o} (PI ${pi})`, groups, miles: ms, noMiles: !ms.length, empty: !its.length, isFirst: o === 0 };
  });
  const mapI = (f: (i: RoadItem) => Partial<RoadItem>) => set((t) => ({ items: t.items.map((i) => (selI && i.id === selI.id ? { ...i, ...f(i) } : i)) }));
  const mapM = (f: (m: RoadmapDoc["miles"][number]) => Partial<RoadmapDoc["miles"][number]>) => set((t) => ({ miles: t.miles.map((m) => (selM && m.id === selM.id ? { ...m, ...f(m) } : m)) }));
  const sel = selI ? { isCard: true, title: selI.title, startLabel: selI.len > 1 ? `${selI.start}–${selI.start + selI.len - 1}` : String(selI.start), commitLabel: selI.committed ? "Committed" : "Uncommitted", commitBg: selI.committed ? "#5ff0e0" : "#fff" } : selM ? { isMile: true, title: selM.title, at: selM.at, relLabel: selM.release ? "Release" : "Milestone", relBg: selM.release ? "#ffe14d" : "#fff" } : null;
  const v = {
    tabs: ([["timeline", "Roadmap"], ["plan", "PI plan"]] as const).map(([k, n]) => ({ n, ...seg(s.tab === k), go: () => set(() => ({ tab: k })) })),
    zooms: ([[12, "Portfolio · 1–3 yr"], [6, "Solution · 6 PIs"], [3, "PI roadmap · 3 PIs"]] as const).map(([n, l]) => ({ n: l, ...seg(N === n), go: () => set((t) => ({ count: n, from: Math.max(1, Math.min(MAX + 1 - n, n === 12 ? 1 : t.from)) })) })),
    isTimeline: s.tab === "timeline", isPlan: s.tab === "plan", cellPct: 100 / N, pis, bands, showBands: true, lanes, miles, cards, planCols, curPI: s.curPI,
    legend: [{ c: COL.epic, n: "Epic" }, { c: COL.enabler, n: "Enabler" }, { c: COL.feature, n: "Feature" }],
    windowLabel: `PI ${from}–${from + N - 1}`,
    prev: () => set((t) => ({ from: Math.max(1, t.from - 1) })), next: () => set((t) => ({ from: Math.min(MAX + 1 - t.count, t.from + 1) })),
    prevPI: () => set((t) => ({ curPI: Math.max(1, t.curPI - 1) })), nextPI: () => set((t) => ({ curPI: Math.min(MAX - 2, t.curPI + 1) })),
    mileClick: (e: React.MouseEvent) => { const r = e.currentTarget.getBoundingClientRect(); const at = Math.floor((e.clientX - r.left) / (r.width / N)) + from; const id = nid("m"); set((t) => ({ miles: [...t.miles, { id, title: "New milestone", at, release: false }], sel: { k: "m", id } })); },
    newText: s.newText, setNew: (e: React.ChangeEvent<HTMLInputElement>) => set(() => ({ newText: e.target.value })),
    newKey: (e: React.KeyboardEvent) => { if (e.key === "Enter") { addCardRaw(s.newText.trim() || "New card"); set(() => ({ newText: "" })); } },
    addCard: () => { addCardRaw(s.newText.trim() || "New card"); set(() => ({ newText: "" })); },
    allChecked: s.items.length > 0 && s.items.every((i) => s.checked[i.id]), cardCount: s.items.length,
    toggleAll: () => set((t) => { const all = t.items.every((i) => t.checked[i.id]); const c: Record<string, boolean> = {}; t.items.forEach((i) => (c[i.id] = !all)); return { checked: c }; }),
    delChecked: () => set((t) => ({ items: t.items.filter((i) => !t.checked[i.id]), checked: {}, sel: null })),
    addToBoard: () => set((t) => ({ items: t.items.map((i) => (t.checked[i.id] && !i.placed ? { ...i, placed: true, start: t.from, lane: i.lane || t.lanes[0]?.id || "" } : i)), checked: {} })),
    addBg: unplacedChecked ? "#ffe14d" : "#e9e4d6", addCount: unplacedChecked ? ` (${unplacedChecked})` : "",
    ghost: !!s.ghost, ghostX: s.ghost?.x ?? 0, ghostY: s.ghost?.y ?? 0, ghostTitle: s.ghost ? s.items.find((i) => i.id === s.ghost!.id)?.title ?? "" : "", ghostColor: s.ghost ? COL[s.items.find((i) => i.id === s.ghost!.id)?.type ?? "feature"] : "#14123a",
    hasSel: !!sel, noSel: !sel, sel: sel ?? {},
    setTitle: (e: React.ChangeEvent<HTMLInputElement>) => { const val = e.target.value; if (selI) mapI(() => ({ title: val })); else mapM(() => ({ title: val })); },
    typeOpts: (["epic", "enabler", "feature"] as const).map((k) => ({ n: TN[k], bg: selI?.type === k ? COL[k] : "#fff", fg: selI?.type === k ? "#fff" : "#14123a", go: () => mapI(() => ({ type: k })) })),
    laneOpts: s.lanes.map((l) => ({ id: l.id, name: `${l.name} · ${l.info}`, sel: selI?.lane === l.id })), laneVal: selI?.lane ?? "",
    setLane: (e: React.ChangeEvent<HTMLSelectElement>) => { const val = e.target.value; mapI(() => ({ lane: val })); },
    lenDown: () => mapI((i) => ({ len: Math.max(1, i.len - 1) })), lenUp: () => mapI((i) => ({ len: Math.min(MAX + 1 - i.start, i.len + 1) })),
    toggleCommit: () => mapI((i) => ({ committed: !i.committed })), toCollection: () => mapI(() => ({ placed: false })),
    mileLeft: () => mapM((m) => ({ at: Math.max(1, m.at - 1) })), mileRight: () => mapM((m) => ({ at: Math.min(MAX, m.at + 1) })), toggleRelease: () => mapM((m) => ({ release: !m.release })),
    delSel: () => set((t) => (t.sel?.k === "i" ? { items: t.items.filter((i) => i.id !== t.sel!.id), sel: null } : { miles: t.miles.filter((m) => m.id !== t.sel!.id), sel: null })),
    loadSample: () => set(() => ({ ...structuredClone(ROADMAP_SAMPLE), sel: null, checked: {}, from: 1 })),
    loadBlank: () => set(() => ({ ...structuredClone(BLANK_ROADMAP), sel: null, checked: {}, from: 1 })),
  };
  return (
    <div style={page("#f4f1ea")}>
      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 0 #ff3d8f}50%{box-shadow:0 0 0 8px transparent}}@keyframes rise{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}`}</style>
      <Note text={error} />
      <RoadmapView v={v} />
    </div>
  );
}

// ---- OKR board -----------------------------------------------------------------------------
type Kr = { t: string; a: number; b: number; n: number; c: number; u: string };
export type OkrDoc = { objs: { id: string; title: string; krs: Kr[] }[]; links: Record<string, string[]> };
const ACC = ["#ff8a3d", "#d94fb5", "#ef4b4b", "#7bd34f"];
export const OKR_SAMPLE: OkrDoc = {
  objs: [
    { id: "o1", title: "Increase customer satisfaction", krs: [{ t: "NPS from 32 to 50", a: 32, b: 50, n: 44, c: 2, u: "" }, { t: "Support first reply under 2 h", a: 8, b: 2, n: 4, c: 1, u: "h" }, { t: "Churn below 3 %", a: 6, b: 3, n: 5.2, c: 0, u: "%" }] },
    { id: "o2", title: "Optimize operational processes", krs: [{ t: "Lead time from 90 to 45 days", a: 90, b: 45, n: 58, c: 1, u: "d" }, { t: "Release every PI without hotfix", a: 0, b: 4, n: 3, c: 2, u: "" }, { t: "Cut manual hand-offs by 40 %", a: 0, b: 40, n: 18, c: 1, u: "%" }] },
    { id: "o3", title: "Drive higher conversion rates", krs: [{ t: "Trial to paid from 8 to 14 %", a: 8, b: 14, n: 9, c: 0, u: "%" }, { t: "Checkout drop-off under 20 %", a: 38, b: 20, n: 33, c: 0, u: "%" }] },
    { id: "o4", title: "Integrate advanced analytics", krs: [{ t: "5 teams on shared metrics", a: 0, b: 5, n: 4, c: 2, u: "" }, { t: "Forecast accuracy to 85 %", a: 60, b: 85, n: 71, c: 1, u: "%" }, { t: "Dashboards live for all ARTs", a: 0, b: 3, n: 2, c: 1, u: "" }] },
  ],
  links: { o1: ["Follow route"], o2: ["Mapping software", "Delivery spike"], o3: ["Obey traffic laws"], o4: ["GPS"] },
};
const FALLBACK_EPICS = [{ title: "GPS", start: 1, len: 1 }, { title: "Follow route", start: 2, len: 2 }, { title: "Stay in lane", start: 3, len: 2 }, { title: "Obey traffic laws", start: 5, len: 3 }, { title: "Mapping software", start: 6, len: 3 }, { title: "Delivery spike", start: 6, len: 3 }];
const CONF = ["Low", "Med", "High"];
const prog = (k: Kr) => Math.max(0, Math.min(1, (k.n - k.a) / (k.b - k.a)));
const hue = (p: number) => (p >= 0.7 ? "#5fb83a" : p >= 0.4 ? "#ffb020" : "#ef4b4b");

export function OkrBoardPage() {
  const { doc, loaded, save, error } = useDoc<OkrDoc>("okr-board");
  const road = useDocOnce<RoadmapDoc>("roadmap");
  const [s, setS] = useState<(OkrDoc & { sel: string; hov: string | null }) | null>(null);
  useEffect(() => {
    if (loaded && !s) setS({ ...structuredClone(doc ?? OKR_SAMPLE), sel: (doc ?? OKR_SAMPLE).objs[0]?.id ?? "o1", hov: null });
  }, [loaded, doc, s]);
  useEffect(() => {
    if (s) save({ objs: s.objs, links: s.links });
  }, [s, save]);
  if (!s || road === undefined) return <Loading error={error ? new ApiFailure(0, "ERROR", error) : null} />;
  const set = (fn: (t: NonNullable<typeof s>) => Partial<NonNullable<typeof s>>) => setS((t) => (t ? { ...t, ...fn(t) } : t));
  const fromRoad = (road?.items ?? []).filter((i) => i.placed && i.type === "epic").map((i) => ({ title: i.title, start: i.start, len: i.len }));
  const epics = fromRoad.length ? fromRoad : FALLBACK_EPICS;
  const byTitle: Record<string, { title: string; start: number; len: number }> = {};
  epics.forEach((e) => (byTitle[e.title] = e));
  const setKr = (oid: string, i: number, patch: Partial<Kr>) => set((t) => ({ objs: t.objs.map((o) => (o.id === oid ? { ...o, krs: o.krs.map((k, j) => (j === i ? { ...k, ...patch } : k)) } : o)) }));
  const score = (o: OkrDoc["objs"][number]) => o.krs.reduce((a, k) => a + prog(k), 0) / (o.krs.length || 1);
  const cards = s.objs.map((o, oi) => {
    const sc = score(o), ep = (s.links[o.id] ?? []).map((t) => byTitle[t]).filter(Boolean) as { start: number; len: number }[];
    const cover = Array.from({ length: 12 }, (_, k) => ({ bg: ep.some((e) => k + 1 >= e.start && k + 1 < e.start + e.len) ? ACC[oi % 4] : "#d9d4c7" }));
    return { title: o.title, accent: ACC[oi % 4], ink: "#14123a", krCount: o.krs.length, score: sc.toFixed(2), scoreColor: hue(sc), epicCount: ep.length, cover, outline: s.sel === o.id ? "3px solid #ffe14d" : "none", pick: () => set(() => ({ sel: o.id })), stop: (e: React.SyntheticEvent) => e.stopPropagation(),
      rename: (e: React.ChangeEvent<HTMLInputElement>) => { const val = e.target.value; set((t) => ({ objs: t.objs.map((x) => (x.id === o.id ? { ...x, title: val } : x)) })); },
      rings: o.krs.map((k, i) => { const r = 98 - i * 20, c = 2 * Math.PI * r, p = prog(k), on = s.hov === o.id + i; return { r, w: on ? 17 : 13, color: hue(p), dash: `${p * c} ${c}` }; }) };
  });
  const so = s.objs.find((o) => o.id === s.sel) ?? s.objs[0]!, si = s.objs.indexOf(so);
  const krs = so.krs.map((k, i) => { const p = prog(k), lo = Math.min(k.a, k.b), hi = Math.max(k.a, k.b), step = hi - lo > 20 ? 1 : 0.1; return { title: k.t, now: k.n, target: k.b, unit: k.u, min: lo, max: hi, step, color: hue(p), bg: s.hov === so.id + i ? "#fff" : "transparent", enter: () => set(() => ({ hov: so.id + i })), leave: () => set(() => ({ hov: null })), rename: (e: React.ChangeEvent<HTMLInputElement>) => setKr(so.id, i, { t: e.target.value }), set: (e: React.ChangeEvent<HTMLInputElement>) => setKr(so.id, i, { n: +e.target.value }), conf: CONF.map((n, ci) => ({ n, bg: k.c === ci ? ["#ff9fc6", "#ffe14d", "#5ff0e0"][ci] : "#fff", go: () => setKr(so.id, i, { c: ci }) })) }; });
  const linked = new Set<string>();
  Object.values(s.links).forEach((a) => a.forEach((t) => linked.add(t)));
  const mapRows = epics.map((e) => ({ title: e.title, ink: linked.has(e.title) ? "#14123a" : "#c8372d", warn: linked.has(e.title) ? "" : " · unfunded", cells: s.objs.map((o, oi) => { const on = (s.links[o.id] ?? []).includes(e.title); return { bg: on ? ACC[oi % 4] : "#fff", mark: on ? "✓" : "", go: () => set((t) => { const cur = t.links[o.id] ?? []; return { links: { ...t.links, [o.id]: on ? cur.filter((x) => x !== e.title) : [...cur, e.title] } }; }) }; }) }));
  const un = epics.filter((e) => !linked.has(e.title)).length;
  const v = { cards, krs, selTitle: so.title.toUpperCase(), selAccent: ACC[si % 4], objCount: s.objs.length, mapHead: s.objs.map((o, i) => ({ title: o.title, accent: ACC[i % 4] })), mapRows, unfundedMsg: un ? `${un} epic${un > 1 ? "s" : ""} not tied to any objective` : "Every epic supports an objective", unfundedColor: un ? "#c8372d" : "#2f7d1f" };
  return (
    <div style={page("#0b0a2e")}>
      <style>{`@keyframes rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}`}</style>
      <Note text={error} />
      <OkrBoardView v={v} />
    </div>
  );
}

// ---- Planning room (the multi-team train yard) --------------------------------------------
type Ticket = { id: string; type: "feature" | "story" | "risk" | "pio"; title: string; text?: string; team: number; iter: number | null; pts: number; est?: string; parent?: string; roam?: string | null; bv?: number; commit?: boolean };
/** The PI calendar: start date, weeks per iteration, iterations in the PI (the last one is IP). */
export type Cal = { start: string; weeks: 1 | 2 | 3; n: number };
/** A team's capacity the SAFe way: eight points per full-time member per two-week iteration, less vacation days (Leading SAFe). */
export type TeamCap = { rows: { r: string; n: number; a: number; on: boolean }[]; vac: number };
export const SAMPLE_TEAM: TeamCap = { rows: [{ r: "Developers", n: 3, a: 100, on: true }, { r: "Testers", n: 2, a: 100, on: true }, { r: "Product Owner", n: 1, a: 100, on: false }, { r: "Scrum Master / Team Coach", n: 1, a: 100, on: false }], vac: 0 };
export type WorkDoc = { scn?: string; cal?: Cal; backlog?: BacklogFeature[]; teamCap?: Record<string, TeamCap>; teams: number; caps: Record<string, number>; kn: number; tickets: Ticket[] };
const TC = ["#4a5fe8", "#ff3d8f", "#1fb89a", "#ff8a3d", "#8a5cf5", "#c99a10", "#2aa4d8", "#ef4b4b"];
const KC = { epic: "#4a5fe8", feature: "#14123a", enabler: "#c8372d" };
const POKER: (string | number)[] = ["?", 1, 2, 3, 5, 8, 13, 21, 40, 100, "∞"];
const ROAM: [string, string, string][] = [["R", "Resolved", "#5ff0e0"], ["O", "Owned", "#ffe14d"], ["A", "Accepted", "#b8e07a"], ["M", "Mitigated", "#ff9fc6"]];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dAdd = (st: string, d: number) => { const x = new Date(`${st}T00:00:00Z`); x.setUTCDate(x.getUTCDate() + d); return x; };
const dFmt = (x: Date) => `${MO[x.getUTCMonth()]} ${x.getUTCDate()}`;
const dSpan = (a: Date, b: Date) => `${dFmt(a)} – ${a.getUTCMonth() === b.getUTCMonth() ? b.getUTCDate() : dFmt(b)}`;
const CAL0: Cal = { start: "2026-03-09", weeks: 2, n: 5 };
const EPICS0 = ["GPS", "Follow route", "Stay in lane", "Obey traffic laws", "Mapping software", "Delivery spike"];
const OBJ0: Record<string, string> = { o1: "Increase customer satisfaction", o2: "Optimize operational processes", o3: "Drive higher conversion rates", o4: "Integrate advanced analytics" };
const LINKS0: Record<string, string[]> = { o1: ["Follow route"], o2: ["Mapping software", "Delivery spike"], o3: ["Obey traffic laws"], o4: ["GPS"] };
const CAP0 = [12, 16, 14, 16];
/** The simulations a trainer can seed the teams with (design: `SCN`): the two class handouts, a blank board, or the trainer's own backlog. */
type Scenario = { name: string; blurb: string; feats: string[]; features?: BacklogFeature[]; pios: [string, number, boolean][]; risks: string[]; own?: boolean };
export const SCN: Record<string, Scenario> = {
  alice: { name: "ALICE", blurb: "The autonomous delivery vehicle from the Leading SAFe handout: seven features, their stories and enabler spikes, sized as in the handout.",
    feats: ALICE_FEATURES.map((f) => f.title), features: ALICE_FEATURES, pios: [],
    risks: ["GPS expertise to calculate arrival and travel times", "Test track configured with lines, mock vehicles and heavy loads", "Bandwidth to stream the vehicle position to the mobile app"] },
  geek: { name: "GeekBooks", blurb: "The online bookstore from the Leading SAFe handout: ten features, their stories and enablers, sized as in the handout.",
    feats: GEEKBOOKS_FEATURES.map((f) => f.title), features: GEEKBOOKS_FEATURES,
    pios: [["95% system uptime", 8, true], ["Allow users to choose their preferred shipping method", 7, true], ["Implement a fully functional shipping method", 5, true], ["Updated shopping cart feature", 3, false]], risks: ["Call center training", "UX interface not ready", "Payment vendor rate limit"] },
  av: { name: "Autonomous delivery", blurb: "The SAFe solution roadmap example. Parent epics come from your Roadmap.",
    feats: ["GPS integration", "Route following", "Lane keeping", "Obstacle detection", "Surround cameras", "Self-park", "Traffic law rules", "Delivery tests"],
    pios: [["Selection of mapping software", 8, true], ["Front camera", 6, true], ["Radar components", 5, true], ["Install communications on mule", 4, true], ["Send real-time status", 3, false]], risks: ["Sensor supplier delay", "Test track availability", "Map licence cost"] },
  own: { name: "Your own backlog", blurb: "Upload the feature spreadsheets or a CSV, or pull features and stories from Jira or Azure DevOps.", feats: [], pios: [], risks: [], own: true },
  empty: { name: "Empty trains", blurb: "Blank board for each team. Create your own tickets.", feats: [], pios: [], risks: [] },
};
// Story titles are built from the feature until the handouts bring real stories.
const STORY_T: [string, number][] = [["Model the data for ", 3], ["Build the screen for ", 5], ["Expose the API for ", 5], ["Test end to end: ", 8]];
type Room = Required<Pick<WorkDoc, "scn" | "cal">> & WorkDoc & { calOpen: boolean; capOpen: boolean; busy: string; note: string; draft: number; view: string; sel: string | null; kind: "story" | "feature" | "risk"; newText: string; parentSel: string; q: string; ghost: { x: number; y: number; id: string } | null; flash: string | null };

function seedRoom(n: number, scn: string, epics: string[], kn: { n: number }, own?: BacklogFeature[]): Ticket[] {
  const S = SCN[scn], t: Ticket[] = [];
  if (!S) return t;
  const features = S.own ? (own ?? []) : S.features;
  const titles = features ? features.map((f) => f.title) : S.feats;
  if (!titles.length) return t;
  const key = () => `TY-${++kn.n}`;
  for (let k = 1; k <= n; k++) {
    const fids: string[] = [], fs: string[] = [];
    // Three features per team, each team starting three further along the list, so teams get different work.
    for (let j = 0; j < Math.min(3, titles.length); j++) { const id = key(), title = titles[((k - 1) * 3 + j) % titles.length]!; fids.push(id); fs.push(title); t.push({ id, type: "feature", title, parent: epics[(k + j * 2) % epics.length], team: k, iter: features ? null : j < 2 ? j + 1 : null, pts: 0 }); }
    if (features) {
      // The handout's stories, as written and sized (0 = the team sizes it), all in the freight yard to plan.
      fs.forEach((title, j) => { const f = features.find((x) => x.title === title); f?.stories.forEach((st) => t.push({ id: key(), type: "story", title: st.enabler ? `Enabler: ${st.title}` : st.title, text: [st.text, st.note ? `Note: ${st.note}` : ""].filter(Boolean).join(" "), parent: fids[j], team: k, iter: null, pts: st.pts })); });
    } else {
      for (let j = 0; j < 4; j++) { const [pre, pts] = STORY_T[j]!; t.push({ id: key(), type: "story", title: pre + fs[j % 3]!, parent: fids[j % 3], team: k, iter: j < 2 ? 1 + (j % 2) : j === 2 ? 3 : null, pts: j === 3 ? 0 : pts }); }
    }
    if (S.risks.length) t.push({ id: key(), type: "risk", title: S.risks[k % S.risks.length]!, parent: fids[1], team: k, iter: null, pts: 0, roam: null });
    S.pios.forEach(([title, bv, c]) => t.push({ id: key(), type: "pio", title, team: k, bv: k % 2 && c ? bv : 0, commit: c, pts: 0, iter: null }));
  }
  return t;
}

export function PlanningRoomPage({ docKey = "planning-room" }: { docKey?: DocKey } = {}) {
  const { doc, loaded, save, error } = useDoc<WorkDoc>(docKey);
  const road = useDocOnce<RoadmapDoc>("roadmap");
  const okr = useDocOnce<OkrDoc>("okr-board");
  const [s, setS] = useState<Room | null>(null);
  useEffect(() => {
    if (loaded && road !== undefined && okr !== undefined && !s) setS({ scn: doc?.scn && SCN[doc.scn] ? doc.scn : "geek", cal: doc?.cal ?? CAL0, backlog: doc?.backlog, teamCap: doc?.teamCap, calOpen: false, capOpen: false, busy: "", note: "", teams: doc?.teams ?? 0, tickets: doc?.tickets ?? [], caps: doc?.caps ?? {}, kn: doc?.kn ?? 100, draft: doc?.teams || 4, view: "yard", sel: null, kind: "story", newText: "", parentSel: "", q: "", ghost: null, flash: null });
  }, [loaded, doc, road, okr, s]);
  useEffect(() => {
    if (s && s.teams) save({ scn: s.scn, cal: s.cal, ...(s.backlog ? { backlog: s.backlog } : {}), ...(s.teamCap ? { teamCap: s.teamCap } : {}), teams: s.teams, tickets: s.tickets, caps: s.caps, kn: s.kn });
  }, [s, save]);
  if (!s) return <Loading error={error ? new ApiFailure(0, "ERROR", error) : null} />;
  const set = (fn: (t: Room) => Partial<Room>) => setS((t) => (t ? { ...t, ...fn(t) } : t));
  const fromRoad = (road?.items ?? []).filter((i) => i.placed && i.type === "epic").map((i) => i.title);
  const epics = fromRoad.length ? fromRoad : EPICS0;
  const objs: Record<string, string> = okr?.objs ? Object.fromEntries(okr.objs.map((o) => [o.id, o.title])) : OBJ0;
  const links = okr?.links ?? LINKS0;
  const N = s.teams || 0, cur = s.view === "yard" || s.view === "setup" ? null : +s.view, ct = cur || 1;
  const by: Record<string, Ticket> = {};
  s.tickets.forEach((x) => (by[x.id] = x));
  const selT = s.sel ? by[s.sel] : undefined;
  const upd = (id: string, patch: Partial<Ticket>) => set((t) => ({ tickets: t.tickets.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const flashIt = (id: string) => { set(() => ({ flash: id })); setTimeout(() => set(() => ({ flash: null })), 2200); };
  const start = () => { const n = s.draft; const kn = { n: s.kn }; const tickets = s.teams ? s.tickets.filter((t) => t.team <= n) : seedRoom(n, s.scn, epics, kn, s.backlog); if (!tickets.length && SCN[s.scn]?.own) { set(() => ({ note: "Upload a backlog or pull one from a tracker first." })); return; } set(() => ({ teams: n, tickets, kn: kn.n, view: "yard", sel: null, note: "" })); };
  // The trainer's own backlog: spreadsheets or CSV parsed by the API, or a tracker's features and stories.
  const storyCount = (fs: BacklogFeature[]) => fs.reduce((a, f) => a + f.stories.length, 0);
  const upload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const list = Array.from(files), n = list.length;
    set(() => ({ busy: "Reading…", note: "" }));
    try {
      const body = { files: await Promise.all(list.map(async (f) => ({ fileName: f.name, contentBase64: toB64(await f.arrayBuffer()) }))) };
      const r = await api<{ features: BacklogFeature[] }>("POST", "/v1/planning/backlog", body);
      set(() => ({ backlog: r.features, scn: "own", busy: "", note: `${r.features.length} features · ${storyCount(r.features)} stories from ${n} file${n > 1 ? "s" : ""}.` }));
    } catch (e) {
      set(() => ({ busy: "", note: (e as ApiFailure).message }));
    }
  };
  const pull = async (system: "jira" | "ado") => {
    set(() => ({ busy: `Pulling from ${system === "jira" ? "Jira" : "Azure DevOps"}…`, note: "" }));
    try {
      const r = await api<{ features: BacklogFeature[]; items: number }>("GET", `/v1/planning/backlog/${system}`);
      set(() => ({ backlog: r.features, scn: "own", busy: "", note: `${r.features.length} features · ${storyCount(r.features)} stories from ${r.items} work items.` }));
    } catch (e) {
      set(() => ({ busy: "", note: (e as ApiFailure).message }));
    }
  };
  // The PI calendar: iteration i runs from start + (i-1) weeks to the Friday of its last week; the last iteration is IP.
  const cal = s.cal, iters = Array.from({ length: cal.n }, (_, k) => k + 1);
  const iName = (i: number) => (i === cal.n ? "IP iteration" : `Iteration ${i}`);
  const iDates = (i: number) => dSpan(dAdd(cal.start, (i - 1) * cal.weeks * 7), dAdd(cal.start, i * cal.weeks * 7 - 3));
  const defCap = (i: number) => (i === cal.n ? 16 : (CAP0[i - 1] ?? 16));
  const setCal = (p: Partial<Cal>) => set((t) => { const c = { ...t.cal, ...p }; c.n = Math.max(3, Math.min(7, c.n)); return { cal: c, tickets: t.tickets.map((x) => (x.iter && x.iter > c.n ? { ...x, iter: null } : x)) }; });
  const drag = (e: React.PointerEvent, id: string) => {
    if (e.button) return;
    const x0 = e.clientX, y0 = e.clientY;
    let moved = false;
    const mv = (ev: PointerEvent) => { if (!moved && Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) < 5) return; moved = true; set(() => ({ ghost: { x: ev.clientX + 10, y: ev.clientY + 10, id } })); };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
      set(() => ({ ghost: null, sel: id }));
      if (!moved) return;
      const z = document.elementsFromPoint(ev.clientX, ev.clientY).map((n) => n.closest && n.closest("[data-drop]")).find(Boolean) as Element | undefined;
      if (!z) return;
      const d = z.getAttribute("data-drop")!;
      upd(id, { iter: d === "yard" ? null : +d.split(":")[1]! });
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
  };
  const key = () => `TY-${s.kn + 1}`;
  const addT = (parent: string) => {
    const title = s.newText.trim();
    if (!title) return;
    const team = cur ?? 1, id = key();
    const t: Ticket = { id, type: s.kind, title, parent: parent || "", team, iter: null, pts: 0 };
    if (s.kind === "risk") t.roam = null;
    set((x) => ({ tickets: [...x.tickets, t], kn: x.kn + 1, newText: "", view: String(team), sel: id }));
    flashIt(id);
  };
  const epicObj = (title: string) => { const id = Object.keys(links).find((k) => (links[k] ?? []).includes(title)); return id ? { id, title: objs[id] ?? id } : null; };
  const teamOf = (n: number) => ({ name: `Team ${n}`, color: TC[(n - 1) % 8]! });
  const where = (t: Ticket) => (t.type === "pio" ? `Team ${t.team} · PI objective` : `Team ${t.team} · ${t.iter ? iName(t.iter) : "Freight yard"}`);
  // Points per full-time member per iteration: 8 for two weeks (ten days less two for meetings), scaled to the iteration length.
  const perPerson = Math.max(1, cal.weeks * 5 - 2);
  const capPts = (tc: TeamCap) => Math.max(0, Math.round((tc.rows.reduce((a, r) => a + (r.on ? (+r.n || 0) * perPerson * ((+r.a || 0) / 100) : 0), 0) - (+tc.vac || 0)) * 10) / 10);
  const teamCapOf = (n: number) => { const tc = s.teamCap?.[String(n)]; return tc ? Math.round(capPts(tc)) : undefined; };
  const capOf = (n: number, i: number) => s.caps[`${n}:${i}`] ?? teamCapOf(n) ?? defCap(i);
  const loadOf = (n: number, i: number) => s.tickets.filter((t) => t.team === n && t.type === "story" && t.iter === i).reduce((a, t) => a + t.pts, 0);
  const checks = (n: number): [string, boolean][] => {
    const T = s.tickets.filter((t) => t.team === n), pio = T.filter((t) => t.type === "pio"), rk = T.filter((t) => t.type === "risk");
    return [["Every feature is on a wagon", T.some((t) => t.type === "feature") && T.filter((t) => t.type === "feature").every((t) => t.iter)], ["No wagon over capacity", iters.every((i) => loadOf(n, i) <= capOf(n, i))], ["Every story is sized", T.some((t) => t.type === "story") && T.filter((t) => t.type === "story").every((t) => t.pts > 0)], ["Every objective has business value", pio.length > 0 && pio.every((t) => (t.bv ?? 0) > 0)], ["Every risk is ROAMed", rk.length > 0 && rk.every((t) => t.roam)]];
  };
  const lineage = (t: Ticket) => {
    const out: { kind: string; key: string; title: string; meta: string; color: string; id: string | null }[] = [];
    let c: Ticket | undefined = t;
    while (c) {
      out.unshift({ kind: ({ story: "STORY", feature: "FEATURE", risk: "RISK", pio: "PI OBJECTIVE" } as Record<string, string>)[c.type]!, key: c.id, title: c.title, meta: where(c), color: c.type === "story" ? "#e9c98a" : c.type === "risk" ? "#f8a08a" : KC.feature, id: c.id });
      if (c.type === "feature") {
        const ob = epicObj(c.parent ?? "");
        out.unshift({ kind: "EPIC", key: "", title: c.parent || "No epic", meta: "On the Roadmap · shared by every team", color: KC.epic, id: null });
        out.unshift(ob ? { kind: "OBJECTIVE", key: "", title: ob.title, meta: "On the OKR board", color: "#7bd34f", id: null } : { kind: "OBJECTIVE", key: "", title: "Not linked to an objective", meta: "Link it on the OKR board", color: "#fff", id: null });
        break;
      }
      c = c.parent ? by[c.parent] : undefined;
    }
    return out;
  };
  const out = (n: Ticket) => ({ outline: s.sel === n.id ? "3px solid #ff3d8f" : "none", anim: s.flash === n.id ? "glow .7s 3" : "none" });
  const T = s.tickets.filter((t) => t.team === ct);
  const goTicket = (t: Ticket) => () => { set(() => ({ view: String(t.team), sel: t.id })); flashIt(t.id); };
  const parentOpts = s.kind === "feature" ? epics.map((e) => ({ id: e, t: e })) : s.kind === "story" ? T.filter((t) => t.type === "feature").map((t) => ({ id: t.id, t: t.title })) : [{ id: "", t: "Nothing" }, ...T.filter((t) => t.type === "feature" || t.type === "story").map((t) => ({ id: t.id, t: t.title }))];
  const ps = parentOpts.some((o) => o.id === s.parentSel) ? s.parentSel : (parentOpts[0]?.id ?? "");
  const rail = Array.from({ length: N }, (_, k) => k + 1).map((n) => { const tm = teamOf(n), c = checks(n).filter((x) => x[1]).length; return { name: tm.name, color: tm.color, checks: `${c}/5`, bg: cur === n ? "#14123a" : "#fff", fg: cur === n ? "#fff" : "#14123a", go: () => set(() => ({ view: String(n), sel: null })) }; });
  const q = s.q.trim().toLowerCase();
  const results = q ? s.tickets.filter((t) => `${t.id} ${t.title}`.toLowerCase().includes(q)).slice(0, 7).map((t) => ({ key: t.id, title: t.title, color: t.type === "story" ? "#e9c98a" : t.type === "risk" ? "#f8a08a" : "#14123a", where: `T${t.team}${t.iter ? ` · It ${t.iter}` : ""}`, go: () => { set(() => ({ q: "", view: String(t.team), sel: t.id })); flashIt(t.id); } })) : [];
  const yard = Array.from({ length: N }, (_, k) => k + 1).map((n) => {
    const tm = teamOf(n), TT = s.tickets.filter((t) => t.team === n), ch = checks(n).filter((x) => x[1]).length, rk = TT.filter((t) => t.type === "risk"), open = rk.filter((r) => !r.roam).length;
    let lt = 0, cp = 0;
    const cars = iters.map((i) => { const l = loadOf(n, i), c = capOf(n, i); lt += l; cp += c; return { h: Math.min(100, c ? (l / c) * 100 : 0), bg: l > c ? "#ef4b4b" : tm.color }; });
    return { name: tm.name, color: tm.color, checks: `${ch}/5`, chkBg: ch === 5 ? "#5ff0e0" : "#eef2f7", cars, load: lt, cap: cp, features: TT.filter((t) => t.type === "feature").length, stories: TT.filter((t) => t.type === "story").length, risks: open ? `${open} open risk${open > 1 ? "s" : ""}` : rk.length ? "risks ROAMed" : "no risks yet", riskColor: open ? "#c8372d" : "#2f7d1f", prog: ch * 20, go: () => set(() => ({ view: String(n), sel: null })) };
  });
  const shared = epics.map((e) => {
    const fs = s.tickets.filter((t) => t.type === "feature" && t.parent === e), tms = [...new Set(fs.map((f) => f.team))].sort((a, b) => a - b), ob = epicObj(e);
    const pts = s.tickets.filter((t) => t.type === "story" && fs.some((f) => f.id === t.parent)).reduce((a, t) => a + t.pts, 0);
    return { title: e, obj: ob ? `→ ${ob.title}` : "No objective linked", pts, none: !tms.length, teams: tms.map((n) => ({ label: `Team ${n} · ${fs.filter((f) => f.team === n).length}`, color: teamOf(n).color, go: () => set(() => ({ view: String(n) })) })) };
  });
  const tm = teamOf(ct);
  const sz = (t: Ticket) => t.est || (t.pts ? t.pts : "?");
  const fcOf = (st: Ticket) => { const f = st.parent ? by[st.parent] : undefined; return f && f.type === "feature" ? KC.epic : "#14123a"; };
  const mkStory = (t: Ticket) => ({ key: t.id, t: t.title, pts: sz(t), w: t.pts >= 8 ? 100 : t.pts >= 3 ? 66 : 50, fc: fcOf(t), down: (e: React.PointerEvent) => drag(e, t.id), ...out(t) });
  const wagons = iters.map((i) => {
    const l = loadOf(ct, i), c = capOf(ct, i), over = l > c, here = T.filter((t) => t.iter === i);
    return { key: `w:${i}`, name: iName(i), dates: iDates(i), load: l, cap: c, fill: Math.min(100, (l / (c || 1)) * 100), gauge: over ? "#ef4b4b" : l / (c || 1) > 0.85 ? "#ffb020" : "#5fb83a", numColor: over ? "#c8372d" : "#14123a", bg: over ? "#fde0dc" : "#fbf9f4",
      capUp: () => set((t) => ({ caps: { ...t.caps, [`${ct}:${i}`]: c + 1 } })), capDown: () => set((t) => ({ caps: { ...t.caps, [`${ct}:${i}`]: Math.max(0, c - 1) } })),
      flags: here.filter((t) => t.type === "feature").map((t) => ({ key: t.id, t: t.title, color: KC.epic, down: (e: React.PointerEvent) => drag(e, t.id), ...out(t) })), crates: here.filter((t) => t.type === "story").map(mkStory),
      hazards: here.filter((t) => t.type === "risk").map((t) => ({ t: t.title, roam: t.roam || "?", bg: t.roam ? "#fff" : "#f8a08a", down: (e: React.PointerEvent) => drag(e, t.id), outline: out(t).outline })) };
  });
  const yt = T.filter((t) => !t.iter && t.type !== "pio" && t.type !== "risk").map((t) => ({ key: t.id, t: t.title, pts: t.type === "story" ? ` · ${sz(t)}` : "", bg: t.type === "story" ? "#e9c98a" : KC.epic, fg: t.type === "story" ? "#14123a" : "#fff", down: (e: React.PointerEvent) => drag(e, t.id), ...out(t) }));
  const rks = T.filter((t) => t.type === "risk").map((t) => ({ key: t.id, t: t.title, bg: t.roam ? "#f4f1ea" : "#f8a08a", outline: out(t).outline, stop: (e: React.SyntheticEvent) => e.stopPropagation(), down: (e: React.PointerEvent) => drag(e, t.id), where: t.roam ? ROAM.find((o) => o[0] === t.roam)![1] + (t.iter ? ` · ${iName(t.iter)}` : "") : t.iter ? `On ${iName(t.iter)}` : "Drag onto a wagon", roam: ROAM.map(([k, name, c]) => ({ k, name, bg: t.roam === k ? c : "#fff", go: () => upd(t.id, { roam: t.roam === k ? null : k }) })) }));
  const pios = T.filter((t) => t.type === "pio").sort((a, b) => Number(b.commit) - Number(a.commit)).map((t) => ({ t: t.title, bg: t.commit ? "#fff" : "#f4f1ea", border: t.commit ? "solid" : "dashed", tag: t.commit ? "C" : "U", rename: (e: React.ChangeEvent<HTMLInputElement>) => upd(t.id, { title: e.target.value }), flip: () => upd(t.id, { commit: !t.commit }), del: () => set((x) => ({ tickets: x.tickets.filter((y) => y.id !== t.id) })), pips: Array.from({ length: 10 }, (_, k) => ({ bg: k < (t.bv ?? 0) ? (t.commit ? tm.color : "#8a8a99") : "#fff", go: () => upd(t.id, { bv: t.bv === k + 1 ? 0 : k + 1 }) })) }));
  const cBV = T.filter((t) => t.type === "pio" && t.commit).reduce((a, t) => a + (t.bv ?? 0), 0), aBV = T.filter((t) => t.type === "pio").reduce((a, t) => a + (t.bv ?? 0), 0);
  const ck = checks(ct);
  let chain: any[] = [], down: any[] = [], sel: any = {};
  if (selT) {
    const lin = lineage(selT);
    chain = lin.map((n, i) => ({ ...n, key: n.key ? ` · ${n.key}` : "", ring: n.id === selT.id ? "3px solid #ff3d8f" : "none", line: i === lin.length - 1 ? 0 : 0.35, fw: n.id === selT.id ? 800 : 600, cursor: n.id && by[n.id] ? "pointer" : "default", go: () => n.id && by[n.id] && goTicket(by[n.id]!)() }));
    down = s.tickets.filter((t) => t.parent === selT.id).map((t) => ({ t: t.title, color: t.type === "story" ? "#e9c98a" : "#f8a08a", where: t.type === "story" ? `${t.iter ? `It ${t.iter}` : "yard"} · ${sz(t)} pts` : "risk", go: goTicket(t) }));
    sel = { key: selT.id, title: selT.title, where: where(selT) + (selT.type === "story" ? ` · ${sz(selT)} pts` : "") };
  }
  const g = s.ghost, pk = selT?.type === "story" ? selT : null;
  const hint: Record<string, string> = { "?": "Not enough information", "∞": "Too big, split it", 100: "Huge", 40: "Very large" };
  const v = {
    needSetup: !s.teams || s.view === "setup", inRoom: !!s.teams && s.view !== "setup", draft: s.draft, draftChips: Array.from({ length: s.draft }, (_, k) => teamOf(k + 1)),
    draftUp: () => set((t) => ({ draft: Math.min(8, t.draft + 1) })), draftDown: () => set((t) => ({ draft: Math.max(2, t.draft - 1) })),
    startRoom: start, resize: () => set(() => ({ view: "setup" })), teamCount: N, showNav: false,
    nIter: cal.n, calN: cal.n, calStart: cal.start, calOpen: s.calOpen, toggleCal: () => set((t) => ({ calOpen: !t.calOpen })), calBtnBg: s.calOpen ? "#ffe14d" : "#fff",
    setStart: (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.value) setCal({ start: e.target.value }); }, nUp: () => setCal({ n: cal.n + 1 }), nDown: () => setCal({ n: cal.n - 1 }),
    calWeeks: ([1, 2, 3] as const).map((w) => ({ n: `${w} ${w === 1 ? "week" : "weeks"}`, bg: cal.weeks === w ? "#14123a" : "transparent", fg: cal.weeks === w ? "#fff" : "#14123a", go: () => setCal({ weeks: w }) })),
    calPreview: iters.map((i) => ({ name: iName(i), dates: iDates(i), bg: i === cal.n ? "#ffe14d" : "#fbf9f4" })),
    piRange: dSpan(dAdd(cal.start, 0), dAdd(cal.start, cal.n * cal.weeks * 7 - 3)), scnName: SCN[s.scn]!.name,
    scenarios: Object.keys(SCN).map((k) => { const S = SCN[k]!; const fs = S.own ? (s.backlog ?? []) : S.features; return { name: S.name, blurb: S.blurb, meta: fs ? (fs.length ? `${fs.length} FEATURES · ${storyCount(fs)} STORIES${S.pios.length ? ` · ${S.pios.length} OBJECTIVES` : ""}` : "UPLOAD OR CONNECT") : S.feats.length ? `${S.feats.length} FEATURES · ${S.pios.length} OBJECTIVES` : "NO SEED DATA", bg: s.scn === k ? "#ffe14d" : "#fff", sh: s.scn === k ? "5px 5px 0 #14123a" : "none", go: () => set(() => ({ scn: k })) }; }),
    capacityPanel: (() => {
      const tc = s.teamCap?.[String(ct)];
      const setTc = (next: TeamCap | undefined) => set((t) => { const all = { ...(t.teamCap ?? {}) }; if (next) all[String(ct)] = next; else delete all[String(ct)]; return { teamCap: all }; });
      const pts = tc ? capPts(tc) : null;
      const btn = { border: "2px solid #14123a", borderRadius: 99, padding: "6px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer", background: "#fff" } as const;
      return (
        <div style={{ margin: "0 0 12px", background: "#fff", border: "2px solid #14123a", borderRadius: 18, boxShadow: "4px 4px 0 #14123a", padding: "10px 16px" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ font: "700 11px ui-monospace, Menlo, monospace", letterSpacing: ".1em", color: "#5b5b6e" }}>TEAM CAPACITY</span>
            <b style={{ fontSize: 15 }}>{pts !== null ? `${Math.round(pts)} points per iteration` : "Not calculated: the default gauges apply"}</b>
            <span style={{ flex: 1 }} />
            <button onClick={() => set((t) => ({ capOpen: !t.capOpen }))} style={{ ...btn, background: s.capOpen ? "#ffe14d" : "#fff" }}>{s.capOpen ? "Close calculator" : "Calculate capacity"}</button>
          </div>
          {s.capOpen ? (
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <div style={{ fontSize: 13, lineHeight: 1.45, color: "#14123a" }}>
                For every full-time Agile Team member contributing to solution development, give the team {perPerson} points per {cal.weeks}-week iteration; adjust for part-time members. Subtract one point for every vacation day and holiday. Assign one point to a story that takes about half a day to develop and half a day to test and validate, and estimate every other story relative to it.
              </div>
              {tc ? (
                <>
                  <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
                    <thead>
                      <tr style={{ font: "700 11px ui-monospace, Menlo, monospace", letterSpacing: ".08em", color: "#5b5b6e", textAlign: "left" }}>
                        <th style={{ padding: "4px 6px" }}>ROLE</th><th style={{ padding: "4px 6px" }}>PEOPLE</th><th style={{ padding: "4px 6px" }}>AVAILABILITY</th><th style={{ padding: "4px 6px" }}>COUNTS</th><th style={{ padding: "4px 6px", textAlign: "right" }}>POINTS</th><th />
                      </tr>
                    </thead>
                    <tbody>
                      {tc.rows.map((r, i) => {
                        const up = (patch: Partial<TeamCap["rows"][number]>) => setTc({ ...tc, rows: tc.rows.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                        return (
                          <tr key={i} style={{ borderTop: "1px solid #eee8da" }}>
                            <td style={{ padding: "4px 6px" }}><input value={r.r} onChange={(e) => up({ r: e.target.value })} style={{ width: "100%", border: "1px solid #c9c5d6", borderRadius: 8, padding: "4px 8px", font: "inherit" }} /></td>
                            <td style={{ padding: "4px 6px" }}><input type="number" min={0} value={r.n} onChange={(e) => up({ n: Math.max(0, +e.target.value || 0) })} style={{ width: 64, border: "1px solid #c9c5d6", borderRadius: 8, padding: "4px 8px", font: "inherit" }} /></td>
                            <td style={{ padding: "4px 6px" }}>
                              <select value={String(r.a)} onChange={(e) => up({ a: +e.target.value })} style={{ border: "1px solid #c9c5d6", borderRadius: 8, padding: "4px 8px", font: "inherit", background: "#fff" }}>
                                {[100, 75, 50, 25].map((a) => <option key={a} value={a}>{a}%</option>)}
                              </select>
                            </td>
                            <td style={{ padding: "4px 6px" }}><label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={r.on} onChange={(e) => up({ on: e.target.checked })} /> {r.on ? "yes" : "no"}</label></td>
                            <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>{r.on ? Math.round((+r.n || 0) * perPerson * ((+r.a || 0) / 100) * 10) / 10 : 0}</td>
                            <td style={{ padding: "4px 6px" }}><button onClick={() => setTc({ ...tc, rows: tc.rows.filter((_, j) => j !== i) })} aria-label={`Remove ${r.r}`} style={{ ...btn, padding: "2px 8px" }}>×</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <button onClick={() => setTc({ ...tc, rows: [...tc.rows, { r: "Team member", n: 1, a: 100, on: true }] })} style={btn}>+ Role</button>
                    <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 14 }}>
                      Vacation and holiday days this iteration
                      <input type="number" min={0} value={tc.vac} onChange={(e) => setTc({ ...tc, vac: Math.max(0, +e.target.value || 0) })} style={{ width: 64, border: "1px solid #c9c5d6", borderRadius: 8, padding: "4px 8px", font: "inherit" }} />
                    </label>
                    <span style={{ flex: 1 }} />
                    <b style={{ fontSize: 16 }}>{Math.round(pts!)} points per iteration</b>
                    <button onClick={() => setTc(undefined)} style={btn}>Back to defaults</button>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#5b5b6e" }}>Applies to every wagon of {tm.name}, including the IP iteration. The gauge's − and + still adjust a single iteration on top of this.</div>
                </>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={() => setTc(structuredClone(SAMPLE_TEAM))} style={{ ...btn, background: "#ffe14d" }}>Start from the example team (3 developers, 2 testers, PO, SM)</button>
                  <button onClick={() => setTc({ rows: [{ r: "Team member", n: 1, a: 100, on: true }], vac: 0 })} style={btn}>Start empty</button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      );
    })(),
    ownBacklog: SCN[s.scn]?.own ? (
      <div style={{ marginTop: 14, background: "#fff", border: "2px solid #14123a", borderRadius: 20, boxShadow: "5px 5px 0 #14123a", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ font: "700 11px ui-monospace, Menlo, monospace", color: "#5b5b6e", letterSpacing: ".1em" }}>YOUR OWN BACKLOG</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ border: "2px solid #14123a", borderRadius: 99, padding: "8px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", background: "#ffe14d" }}>
            Upload spreadsheets or CSV
            <input type="file" multiple accept=".xlsx,.csv,.tsv,.txt" style={{ display: "none" }} onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
          </label>
          <button onClick={() => void pull("jira")} style={{ border: "2px solid #14123a", borderRadius: 99, padding: "8px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", background: "#fff" }}>Pull from Jira</button>
          <button onClick={() => void pull("ado")} style={{ border: "2px solid #14123a", borderRadius: 99, padding: "8px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", background: "#fff" }}>Pull from Azure DevOps</button>
          {s.backlog?.length ? <button onClick={() => set(() => ({ backlog: undefined, note: "" }))} style={{ border: "2px solid #14123a", borderRadius: 99, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", background: "#f4f1ea" }}>Clear</button> : null}
          <span style={{ fontSize: 13, color: s.busy ? "#5b5b6e" : "#14123a" }}>{s.busy || s.note}</span>
        </div>
        <div style={{ fontSize: 13, color: "#5b5b6e", lineHeight: 1.4 }}>One file per feature in the handout layout (Item Name, Item Description, Item Type with SIZE and Feature lines), or one sheet with Feature, Title, Description, Type and Points columns. Jira and Azure DevOps use the server's connection: features with the stories under them.</div>
        {s.backlog?.length ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {s.backlog.map((f) => (
              <span key={`${f.n}-${f.title}`} style={{ border: "2px solid #14123a", borderRadius: 12, padding: "4px 10px", fontSize: 13, background: "#fbf9f4" }}>
                <b>{f.title}</b> · {f.stories.length} {f.stories.length === 1 ? "story" : "stories"}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    ) : null,
    goYard: () => set(() => ({ view: "yard", sel: null })), yardBg: cur ? "#fff" : "#14123a", yardFg: cur ? "#14123a" : "#fff", rail, q: s.q, setQ: (e: React.ChangeEvent<HTMLInputElement>) => set(() => ({ q: e.target.value })), results, hasResults: results.length > 0,
    kinds: ([["story", "Story"], ["feature", "Feature"], ["risk", "Risk"]] as const).map(([k, n]) => ({ n, bg: s.kind === k ? "#ffe14d" : "transparent", fg: s.kind === k ? "#14123a" : "#fff", go: () => set(() => ({ kind: k, parentSel: "" })) })),
    newText: s.newText, setNew: (e: React.ChangeEvent<HTMLInputElement>) => set(() => ({ newText: e.target.value })), newKey: (e: React.KeyboardEvent) => { if (e.key === "Enter") addT(ps); }, addTicket: () => addT(ps),
    newHint: `${tm.name}: new ${s.kind}…`, hasParents: true, parentOpts: parentOpts.map((o) => ({ ...o, sel: o.id === ps })), parentVal: ps, setParent: (e: React.ChangeEvent<HTMLSelectElement>) => set(() => ({ parentSel: e.target.value })), parentLabel: s.kind === "feature" ? "Epic" : s.kind === "story" ? "Feature" : "Relates to",
    isYard: !cur, isTeam: !!cur, yard, shared, team: tm, wagons, yardTickets: yt, yardEmpty: !yt.length, risks: rks, noRisks: !rks.length, pios, cBV, reliab: aBV ? `${Math.round((cBV / aBV) * 100)}% reliability` : "no BV yet",
    addPio: () => set((x) => ({ tickets: [...x.tickets, { id: `TY-${x.kn + 1}`, type: "pio", title: "New objective", team: ct, bv: 0, commit: true, pts: 0, iter: null }], kn: x.kn + 1 })),
    poker: POKER.map((val, k) => ({ v: val, rot: (k - 5) * 4, dy: Math.abs(k - 5) * 2, bg: pk && (pk.est === val || (!pk.est && pk.pts === val)) ? "#ffe14d" : "#fff", go: () => pk && upd(pk.id, typeof val === "number" ? { pts: val, est: "" } : { pts: 0, est: val }) })),
    pokerFor: pk ? `Sizing: ${pk.title}${pk.est ? ` · ${hint[pk.est]}` : pk.pts >= 40 ? ` · ${hint[pk.pts]}` : ""}` : "Click a story, then a card.",
    checks: ck.map(([t, ok]) => ({ t, fg: ok ? "#fff" : "#a9a7d6", bg: ok ? "#5ff0e0" : "transparent", mark: ok ? "✓" : "" })), doneCount: ck.filter((x) => x[1]).length,
    hasSel: !!selT, sel, chain, down, noDown: !down.length, closeSel: () => set(() => ({ sel: null })),
    delSel: () => set((t) => ({ tickets: t.tickets.filter((x) => x.id !== t.sel && x.parent !== t.sel), sel: null })),
    ghost: !!g, gx: g?.x ?? 0, gy: g?.y ?? 0, gt: g && by[g.id] ? by[g.id]!.title : "",
  };
  return (
    <div style={page("#f4f1ea")}>
      <style>{`@keyframes glow{0%,100%{box-shadow:0 0 0 0 #ff3d8f}50%{box-shadow:0 0 0 7px transparent}}@keyframes rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}`}</style>
      <Note text={error} />
      <PlanningRoomView v={v} />
    </div>
  );
}
