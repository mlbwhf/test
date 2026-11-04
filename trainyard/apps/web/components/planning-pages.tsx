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
import { api, ApiFailure, useMe } from "@/lib/api";

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
/** The work hierarchy (epic → capability → feature → story) plus risks and PI objectives; `en` marks an enabler. */
type TType = "epic" | "capability" | "feature" | "story" | "risk" | "pio";
type Ticket = { id: string; type: TType; title: string; text?: string; en?: boolean; note?: string; f?: Record<string, string>; team: number; iter: number | null; pts: number; est?: string; parent?: string; roam?: string | null; bv?: number; commit?: boolean };
/** The PI calendar: start date, weeks per iteration, iterations in the PI (the last one is IP). */
export type Cal = { start: string; weeks: 1 | 2 | 3; n: number };
/** A team's capacity the SAFe way: eight points per full-time member per two-week iteration, less vacation days (Leading SAFe). */
export type TeamCap = { rows: { r: string; n: number; a: number; on: boolean }[]; vac: number };
export const SAMPLE_TEAM: TeamCap = { rows: [{ r: "Developers", n: 3, a: 100, on: true }, { r: "Testers", n: 2, a: 100, on: true }, { r: "Product Owner", n: 1, a: 100, on: false }, { r: "Scrum Master / Team Coach", n: 1, a: 100, on: false }], vac: 0 };
export type WorkDoc = { scn?: string; cal?: Cal; backlog?: BacklogFeature[]; teamCap?: Record<string, TeamCap>; colors?: Record<string, string>; teams: number; caps: Record<string, number>; kn: number; tickets: Ticket[] };
const TC = ["#4a5fe8", "#ff3d8f", "#1fb89a", "#ff8a3d", "#8a5cf5", "#c99a10", "#2aa4d8", "#ef4b4b"];
const KC = { epic: "#4a5fe8", feature: "#14123a", enabler: "#c8372d" };
const TYPES: [TType, string][] = [["epic", "Epic"], ["capability", "Capability"], ["feature", "Feature"], ["story", "Story"]];
const CHILD: Partial<Record<TType, TType>> = { epic: "capability", capability: "feature", feature: "story" };
/** Default colours by type, enablers with an E (design: DEFC); the room's `colors` overrides them. */
const DEFC: Record<string, string> = { epic: "#4a5fe8", capability: "#8a5cf5", feature: "#14123a", story: "#e9c98a", epicE: "#c8372d", capabilityE: "#ff8a3d", featureE: "#0f8f7a", storyE: "#f4a340" };
const HATCH = "repeating-linear-gradient(135deg,rgba(255,255,255,.38) 0 5px,transparent 5px 10px)";
const CRATE = "linear-gradient(90deg,transparent 46%,rgba(20,18,58,.18) 46%,rgba(20,18,58,.18) 54%,transparent 54%)";
/** Dark or white text on a colour, by luminance. */
const ink = (c: string) => { const h = String(c).replace("#", ""), v = [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16) || 0); return (v[0]! * 299 + v[1]! * 587 + v[2]! * 114) / 1000 > 150 ? "#14123a" : "#fff"; };
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
type Room = Required<Pick<WorkDoc, "scn" | "cal">> & WorkDoc & { calOpen: boolean; capOpen: boolean; busy: string; note: string; full: boolean; coll: string | null; collText: string; collEn: boolean; en: boolean; draft: number; view: string; sel: string | null; kind: TType; newText: string; parentSel: string; q: string; ghost: { x: number; y: number; id: string } | null; flash: string | null };

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
    for (let j = 0; j < Math.min(3, titles.length); j++) { const id = key(), title = titles[((k - 1) * 3 + j) % titles.length]!; fids.push(id); fs.push(title); t.push({ id, type: "feature", title, parent: epics[(k + j * 2) % epics.length], team: k, iter: features ? null : j < 2 ? j + 1 : null, pts: 0, ...(!features && j === 2 ? { en: true } : {}) }); }
    if (features) {
      // The handout's stories, as written and sized (0 = the team sizes it), all in the freight yard to plan.
      fs.forEach((title, j) => { const f = features.find((x) => x.title === title); f?.stories.forEach((st) => t.push({ id: key(), type: "story", title: st.title, ...(st.enabler ? { en: true } : {}), text: [st.text, st.note ? `Note: ${st.note}` : ""].filter(Boolean).join(" "), parent: fids[j], team: k, iter: null, pts: st.pts })); });
    } else {
      for (let j = 0; j < 4; j++) { const [pre, pts] = STORY_T[j]!; t.push({ id: key(), type: "story", title: pre + fs[j % 3]!, parent: fids[j % 3], team: k, iter: j < 2 ? 1 + (j % 2) : j === 2 ? 3 : null, pts: j === 3 ? 0 : pts, ...(j === 2 ? { en: true } : {}) }); }
    }
    if (S.risks.length) t.push({ id: key(), type: "risk", title: S.risks[k % S.risks.length]!, parent: fids[1], team: k, iter: null, pts: 0, roam: null });
    S.pios.forEach(([title, bv, c]) => t.push({ id: key(), type: "pio", title, team: k, bv: k % 2 && c ? bv : 0, commit: c, pts: 0, iter: null }));
  }
  return t;
}

export function PlanningRoomPage({ docKey = "planning-room" }: { docKey?: DocKey } = {}) {
  const { doc, loaded, save, saveSlice, error, remote } = useDoc<WorkDoc>(docKey);
  const me = useMe();
  // A student (by link) saves their team's part of the room; the trainer may save the room whole.
  const guest = !!me.data?.principal.guestBoardId;
  const road = useDocOnce<RoadmapDoc>("roadmap");
  const okr = useDocOnce<OkrDoc>("okr-board");
  const [s, setS] = useState<Room | null>(null);
  // Esc folds the stack, then the waybill; Enter unfolds the selected ticket; ← → step through the team.
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const tag = ((e.target as HTMLElement)?.tagName || "").toLowerCase(), typing = tag === "input" || tag === "textarea" || tag === "select";
      setS((t) => {
        if (!t) return t;
        if (e.key === "Escape" && t.coll) return { ...t, coll: null };
        if (e.key === "Escape" && t.full) return { ...t, full: false };
        if (typing) return t;
        if (e.key === "Enter" && t.sel && !t.full) return { ...t, full: true };
        if (t.full && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
          const cur = t.tickets.find((x) => x.id === t.sel);
          if (!cur) return t;
          const peers = t.tickets.filter((x) => x.team === cur.team && x.type !== "pio"), i = peers.findIndex((x) => x.id === cur.id);
          const n = peers[(i + (e.key === "ArrowRight" ? 1 : -1) + peers.length) % peers.length];
          return n ? { ...t, sel: n.id } : t;
        }
        return t;
      });
    };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, []);
  useEffect(() => {
    if (loaded && road !== undefined && okr !== undefined && !s) setS({ scn: doc?.scn && SCN[doc.scn] ? doc.scn : "geek", cal: doc?.cal ?? CAL0, backlog: doc?.backlog, teamCap: doc?.teamCap, colors: doc?.colors ?? {}, calOpen: false, capOpen: false, busy: "", note: "", full: false, coll: null, collText: "", collEn: false, en: false, teams: doc?.teams ?? 0, tickets: doc?.tickets ?? [], caps: doc?.caps ?? {}, kn: doc?.kn ?? 100, draft: doc?.teams || 4, view: "yard", sel: null, kind: "story", newText: "", parentSel: "", q: "", ghost: null, flash: null });
  }, [loaded, doc, road, okr, s]);
  // Saving, light and safe for many people at once: inside a team, only that team's tickets, capacity
  // cells and capacity sheet go out (a few kilobytes, merged on the server); the whole room goes out
  // only for a change to the room itself (scenario, calendar, backlog, colours, team count), and
  // only from the trainer.
  const lastGlobal = useRef<string>("");
  useEffect(() => {
    if (!s || !s.teams) return;
    const team = s.view === "yard" || s.view === "setup" ? null : +s.view;
    const global = JSON.stringify([s.scn, s.cal, s.backlog, s.colors, s.teams]);
    const globalChanged = lastGlobal.current !== "" && lastGlobal.current !== global;
    lastGlobal.current = global;
    if (team && !globalChanged) {
      saveSlice(team, { tickets: s.tickets.filter((t) => t.team === team), caps: Object.fromEntries(Object.entries(s.caps).filter(([k]) => k.startsWith(`${team}:`))), ...(s.teamCap?.[String(team)] ? { teamCap: s.teamCap[String(team)] } : {}), kn: s.kn });
      return;
    }
    if (guest) return;
    save({ scn: s.scn, cal: s.cal, ...(s.backlog ? { backlog: s.backlog } : {}), ...(s.teamCap ? { teamCap: s.teamCap } : {}), ...(s.colors && Object.keys(s.colors).length ? { colors: s.colors } : {}), teams: s.teams, tickets: s.tickets, caps: s.caps, kn: s.kn });
  }, [s, save, saveSlice, guest]);
  // Someone else's change arrived (another team, the trainer): take the room as the server has it,
  // keeping what is only on this screen (the view, the selection, open panels).
  useEffect(() => {
    if (!remote || !doc) return;
    lastGlobal.current = JSON.stringify([doc.scn && SCN[doc.scn] ? doc.scn : "geek", doc.cal ?? CAL0, doc.backlog, doc.colors ?? {}, doc.teams ?? 0]);
    setS((t) => (t ? { ...t, scn: doc.scn && SCN[doc.scn] ? doc.scn : t.scn, cal: doc.cal ?? t.cal, backlog: doc.backlog, teamCap: doc.teamCap, colors: doc.colors ?? {}, teams: doc.teams ?? 0, tickets: doc.tickets ?? [], caps: doc.caps ?? {}, kn: Math.max(t.kn, doc.kn ?? 0), sel: t.sel && !(doc.tickets ?? []).some((x) => x.id === t.sel) ? null : t.sel } : t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote]);
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
  // Colour by type and enabler flag, the room's own colours first (design: col()).
  const col = (t: { type: TType; en?: boolean }) => { const k = t.type + (t.en ? "E" : ""); return s.colors?.[k] ?? DEFC[k] ?? "#14123a"; };
  const setF = (id: string, k: string, v: string) => set((t) => ({ tickets: t.tickets.map((x) => (x.id !== id ? x : k === "note" ? { ...x, note: v } : { ...x, f: { ...(x.f ?? {}), [k]: v } })) }));
  type FDef = { k: string; label: string; ph: string; area: boolean; rows: number };
  // The waybill's form per type: the story's As a / I want / So that, the feature's benefit hypothesis, the epic hypothesis statement, the capability; enablers add what they enable.
  const formDefs = (t: Ticket): FDef[] => {
    const A = (k: string, label: string, ph: string, rows = 3): FDef => ({ k, label, ph, area: true, rows }), L = (k: string, label: string, ph: string): FDef => ({ k, label, ph, area: false, rows: 1 });
    let d: FDef[] = ({
      story: [L("role", "AS A", "who is the user or role?"), L("want", "I WANT", "what do they need to do?"), L("why", "SO THAT", "what value do they get?"), A("ac", "ACCEPTANCE", "Given … When … Then …", 3)],
      feature: [A("hyp", "BENEFIT HYPOTHESIS", "We believe that [this feature] will deliver [benefit]. We will know we are right when [measurable signal].", 3), A("obj", "OBJECTIVES", "Which PI objective or business outcome does this serve?", 2), A("ac", "ACCEPTANCE", "Given … When … Then …", 3)],
      epic: [L("for", "FOR", "target customer"), L("who", "WHO", "need or problem"), L("the", "THE", "name of the solution"), L("isa", "IS A", "product category"), L("that", "THAT", "key benefit"), L("unlike", "UNLIKE", "current alternative"), L("sol", "OUR SOLUTION", "what makes it different"), A("mvp", "MVP", "Smallest thing that tests the hypothesis", 2), A("ind", "LEADING INDICATORS", "What will tell us early that the hypothesis holds", 2)],
      capability: [A("desc", "WHAT IT ENABLES", "The solution-level behavior this unlocks", 2), A("hyp", "BENEFIT HYPOTHESIS", "We believe … will deliver … We will know when …", 2), A("ac", "ACCEPTANCE", "Given … When … Then …", 2)],
    } as Record<string, FDef[]>)[t.type] ?? [];
    if (t.en) d = [A("enwhy", "WHAT IT ENABLES", "The architecture, infrastructure or learning the team needs before delivering value", 2), ...d];
    return [...d, A("note", "NOTES", "Anything else the team should know", 3)];
  };
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
    // Keep the pointer even when the chip re-renders under it (live updates) or the finger leaves it.
    try { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); } catch { /* not capturable */ }
    const mv = (ev: PointerEvent) => { if (!moved && Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) < 5) return; moved = true; set(() => ({ ghost: { x: ev.clientX + 10, y: ev.clientY + 10, id } })); };
    const cancel = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", cancel); set(() => ({ ghost: null })); };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      set(() => ({ ghost: null, sel: id }));
      if (!moved) return;
      const z = document.elementsFromPoint(ev.clientX, ev.clientY).map((n) => n.closest && n.closest("[data-drop]")).find(Boolean) as Element | undefined;
      if (!z) return;
      const d = z.getAttribute("data-drop")!;
      upd(id, { iter: d === "yard" ? null : +d.split(":")[1]! });
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
  };
  const key = () => `TY-${s.kn + 1}`;
  const addT = (parent: string) => {
    const title = s.newText.trim();
    if (!title) return;
    const team = cur ?? 1, id = key();
    const t: Ticket = { id, type: s.kind, title, parent: parent || "", team, iter: null, pts: 0 };
    if (s.kind === "risk") t.roam = null;
    else if (s.kind === "pio") (t.bv = 0), (t.commit = true), (t.parent = "");
    else if (s.en) t.en = true;
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
      out.unshift({ kind: (c.en ? "ENABLER " : "") + ({ story: "STORY", feature: "FEATURE", capability: "CAPABILITY", epic: "EPIC", risk: "RISK", pio: "PI OBJECTIVE" } as Record<string, string>)[c.type]!, key: c.id, title: c.title, meta: where(c), color: c.type === "risk" ? "#f8a08a" : col(c), id: c.id });
      // A feature (or capability, or epic) whose parent is a Roadmap epic by title rather than a ticket.
      if ((c.type === "feature" || c.type === "capability" || c.type === "epic") && !(c.parent && by[c.parent]) && (c.type === "feature" || c.parent)) {
        const ob = epicObj(c.parent ?? "");
        out.unshift({ kind: "EPIC", key: "", title: c.parent || "No epic", meta: "On the Roadmap · shared by every team", color: col({ type: "epic" }), id: null });
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
  // Valid parents by type: capabilities under epics (Roadmap or ticket), features under epics or capabilities, stories under this team's features, risks on this team's features or stories.
  const epicS = epics.map((e) => ({ id: e, t: e })), epicT = s.tickets.filter((t) => t.type === "epic").map((t) => ({ id: t.id, t: `Epic · ${t.title}` })), capT = s.tickets.filter((t) => t.type === "capability").map((t) => ({ id: t.id, t: `Capability · ${t.title}` }));
  const parentList = (t: Ticket) => { const b = t.type === "capability" ? [...epicS, ...epicT] : t.type === "feature" ? [...epicS, ...epicT, ...capT] : t.type === "story" ? s.tickets.filter((x) => x.type === "feature" && x.team === t.team).map((x) => ({ id: x.id, t: `Feature · ${x.title}` })) : t.type === "risk" ? s.tickets.filter((x) => (x.type === "feature" || x.type === "story") && x.team === t.team).map((x) => ({ id: x.id, t: `${x.type} · ${x.title}` })) : []; return [{ id: "", t: "— Unlinked —" }, ...b]; };
  const parentOpts = s.kind === "capability" ? [...epicS, ...epicT] : s.kind === "feature" ? [...epicS, ...epicT, ...capT] : s.kind === "story" ? T.filter((t) => t.type === "feature").map((t) => ({ id: t.id, t: t.title })) : s.kind === "epic" ? [] : [{ id: "", t: "Nothing" }, ...T.filter((t) => t.type === "feature" || t.type === "story").map((t) => ({ id: t.id, t: t.title }))];
  const ps = parentOpts.some((o) => o.id === s.parentSel) ? s.parentSel : (parentOpts[0]?.id ?? "");
  const rail = Array.from({ length: N }, (_, k) => k + 1).map((n) => { const tm = teamOf(n), c = checks(n).filter((x) => x[1]).length; return { name: tm.name, color: tm.color, checks: `${c}/5`, bg: cur === n ? "#14123a" : "#fff", fg: cur === n ? "#fff" : "#14123a", go: () => set(() => ({ view: String(n), sel: null })) }; });
  const q = s.q.trim().toLowerCase();
  const results = q ? s.tickets.filter((t) => `${t.id} ${t.title}`.toLowerCase().includes(q)).slice(0, 7).map((t) => ({ key: t.id, title: t.title, color: t.type === "risk" ? "#f8a08a" : col(t), where: `T${t.team}${t.iter ? ` · It ${t.iter}` : ""}`, go: () => { set(() => ({ q: "", view: String(t.team), sel: t.id })); flashIt(t.id); } })) : [];
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
  const fcOf = (st: Ticket) => { const f = st.parent ? by[st.parent] : undefined; return f ? col(f) : "#14123a"; };
  const kidsN = (id: string) => s.tickets.filter((x) => x.parent === id).length;
  const isCard = (t: Ticket) => t.type === "epic" || t.type === "capability" || t.type === "feature";
  // A flag or yard card: type colour, hatch and ⚙ for enablers, a ▤ n badge that opens the stack of its children.
  // What a chip says without opening it: a story's sentence, a feature's or epic's hypothesis, an enabler's purpose.
  const preview = (t: Ticket) => {
    const f = t.f ?? {};
    if (t.type === "story") return t.en ? (f.enwhy || f.why || "") : f.role || f.want || f.why ? `As a ${f.role || "…"}, I can ${f.want || "…"} so that ${f.why || "…"}` : "";
    if (t.type === "pio") return t.commit === false ? "Uncommitted objective" : "Committed objective";
    if (t.type === "risk") return t.roam ? `ROAM: ${ROAM.find((r) => r[0] === t.roam)?.[1] ?? t.roam}` : "Not ROAMed yet";
    return f.hyp || f.desc || f.enwhy || (t.type === "epic" && f.for ? `For ${f.for} who ${f.who || "…"}: ${f.that || ""}` : "");
  };
  const short = (x: string, n = 90) => (x.length > n ? `${x.slice(0, n - 1).trimEnd()}…` : x);
  // Hands a ticket to another team with everything under it; it lands in that team's freight yard.
  const moveTeam = (id: string, to: number) => {
    const root = by[id];
    if (!root || !to || to === root.team) return;
    const under = new Set<string>([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const x of s.tickets) if (x.parent && under.has(x.parent) && !under.has(x.id)) (under.add(x.id), (grew = true));
    }
    set((t) => ({ tickets: t.tickets.map((x) => (under.has(x.id) ? { ...x, team: to, iter: null } : x)), view: String(to), sel: id, flash: id }));
  };
  const teamPick = (t: Ticket) => ({ teamOpts: Array.from({ length: N }, (_, k) => ({ id: String(k + 1), t: teamOf(k + 1).name })), teamVal: String(t.team), setTeam: (e: React.ChangeEvent<HTMLSelectElement>) => moveTeam(t.id, Number(e.target.value)), canTeam: N > 1 && t.type !== "story" });
  const mkCard = (t: Ticket) => { const c = col(t), n = kidsN(t.id), pv = preview(t); return { key: t.id, t: t.title, color: c, bg: c, fg: ink(c), img: t.en ? HATCH : "none", en: t.en ? "⚙ " : "", hasKids: n > 0, n, sub: short(pv), hint: `${t.id} · ${t.title}${pv ? `\n${pv}` : ""}`, ...teamPick(t), open: () => set(() => ({ coll: t.id })), stop: (e: React.SyntheticEvent) => e.stopPropagation(), down: (e: React.PointerEvent) => drag(e, t.id), ...out(t) }; };
  const mkStory = (t: Ticket) => { const pv = preview(t); return { key: t.id, t: t.title, pts: sz(t), w: t.pts >= 8 ? 100 : t.pts >= 3 ? 66 : 50, fc: fcOf(t), bg: col(t), fg: ink(col(t)), img: t.en ? HATCH : CRATE, sub: short(pv, 70), hint: `${t.id} · ${t.title}${pv ? `\n${pv}` : ""}`, down: (e: React.PointerEvent) => drag(e, t.id), ...out(t) }; };
  const wagons = iters.map((i) => {
    const l = loadOf(ct, i), c = capOf(ct, i), over = l > c, here = T.filter((t) => t.iter === i);
    return { key: `w:${i}`, name: iName(i), dates: iDates(i), load: l, cap: c, fill: Math.min(100, (l / (c || 1)) * 100), gauge: over ? "#ef4b4b" : l / (c || 1) > 0.85 ? "#ffb020" : "#5fb83a", numColor: over ? "#c8372d" : "#14123a", bg: over ? "#fde0dc" : "#fbf9f4",
      capUp: () => set((t) => ({ caps: { ...t.caps, [`${ct}:${i}`]: c + 1 } })), capDown: () => set((t) => ({ caps: { ...t.caps, [`${ct}:${i}`]: Math.max(0, c - 1) } })),
      flags: here.filter(isCard).map(mkCard), crates: here.filter((t) => t.type === "story").map(mkStory),
      hazards: here.filter((t) => t.type === "risk").map((t) => ({ t: t.title, roam: t.roam || "?", bg: t.roam ? "#fff" : "#f8a08a", down: (e: React.PointerEvent) => drag(e, t.id), outline: out(t).outline })) };
  });
  const yt = T.filter((t) => !t.iter && t.type !== "pio" && t.type !== "risk").map((t) => ({ ...mkCard(t), pts: t.type === "story" ? ` · ${sz(t)}` : "" }));
  const rks = T.filter((t) => t.type === "risk").map((t) => ({ key: t.id, t: t.title, bg: t.roam ? "#f4f1ea" : "#f8a08a", outline: out(t).outline, stop: (e: React.SyntheticEvent) => e.stopPropagation(), down: (e: React.PointerEvent) => drag(e, t.id), where: t.roam ? ROAM.find((o) => o[0] === t.roam)![1] + (t.iter ? ` · ${iName(t.iter)}` : "") : t.iter ? `On ${iName(t.iter)}` : "Drag onto a wagon", roam: ROAM.map(([k, name, c]) => ({ k, name, bg: t.roam === k ? c : "#fff", go: () => upd(t.id, { roam: t.roam === k ? null : k }) })) }));
  const pios = T.filter((t) => t.type === "pio").sort((a, b) => Number(b.commit) - Number(a.commit)).map((t) => ({ t: t.title, bg: t.commit ? "#fff" : "#f4f1ea", border: t.commit ? "solid" : "dashed", tag: t.commit ? "C" : "U", rename: (e: React.ChangeEvent<HTMLInputElement>) => upd(t.id, { title: e.target.value }), flip: () => upd(t.id, { commit: !t.commit }), del: () => set((x) => ({ tickets: x.tickets.filter((y) => y.id !== t.id) })), pips: Array.from({ length: 10 }, (_, k) => ({ bg: k < (t.bv ?? 0) ? (t.commit ? tm.color : "#8a8a99") : "#fff", go: () => upd(t.id, { bv: t.bv === k + 1 ? 0 : k + 1 }) })) }));
  const cBV = T.filter((t) => t.type === "pio" && t.commit).reduce((a, t) => a + (t.bv ?? 0), 0), aBV = T.filter((t) => t.type === "pio").reduce((a, t) => a + (t.bv ?? 0), 0);
  const ck = checks(ct);
  let chain: any[] = [], down: any[] = [], sel: any = {}, facts: any[] = [], form: any[] = [], etypes: any[] = [], parentOptsW: any[] = [];
  if (selT) {
    const lin = lineage(selT);
    chain = lin.map((n, i) => ({ ...n, key: n.key ? ` · ${n.key}` : "", ring: n.id === selT.id ? "3px solid #ff3d8f" : "none", line: i === lin.length - 1 ? 0 : 0.35, fw: n.id === selT.id ? 800 : 600, cursor: n.id && by[n.id] ? "pointer" : "default", go: () => n.id && by[n.id] && goTicket(by[n.id]!)() }));
    down = s.tickets.filter((t) => t.parent === selT.id).map((t) => ({ t: t.title, color: t.type === "risk" ? "#f8a08a" : col(t), where: t.type === "story" ? `${t.iter ? `It ${t.iter}` : "yard"} · ${sz(t)} pts` : t.type === "risk" ? "risk" : `${kidsN(t.id)} inside`, go: goTicket(t) }));
    const peers = s.tickets.filter((t) => t.team === selT.team && t.type !== "pio"), pi = peers.findIndex((t) => t.id === selT.id), tc = selT.type === "risk" ? "#f8a08a" : col(selT), ink2 = ink(tc);
    sel = {
      key: selT.id, title: selT.title, where: where(selT) + (selT.type === "story" ? ` · ${sz(selT)} pts` : ""), type: (selT.en ? "ENABLER " : "") + selT.type.toUpperCase(), color: tc, fg: ink2,
      enOn: !!selT.en, enBg: selT.en ? "#ffe14d" : "transparent", canEn: selT.type !== "risk" && selT.type !== "pio", canKids: !!CHILD[selT.type], kidType: CHILD[selT.type] ?? "",
      toggleEn: () => upd(selT.id, { en: !selT.en }), openColl: () => set(() => ({ coll: selT.id })), note: selT.note ?? "", pos: `${pi + 1} / ${peers.length}`,
      formTitle: ({ story: "USER STORY · AS A / I WANT / SO THAT", feature: "FEATURE · HYPOTHESIS, OBJECTIVES, EPIC LINK", epic: "EPIC · HYPOTHESIS STATEMENT", capability: "CAPABILITY · BENEFIT HYPOTHESIS", risk: "RISK", pio: "OBJECTIVE" } as Record<string, string>)[selT.type] + (selT.en ? " · ENABLER" : ""),
      canParent: selT.type !== "epic" && selT.type !== "pio", parentLbl: ({ capability: "EPIC", feature: "EPIC / CAPABILITY", story: "FEATURE", risk: "RELATES TO" } as Record<string, string>)[selT.type] ?? "",
      parentValW: selT.parent ?? "", setParentW: (e: React.ChangeEvent<HTMLSelectElement>) => upd(selT.id, { parent: e.target.value }),
      // The ticket as its SAFe card, the way the course handouts draw them: a user story on a green
      // sticky (As a … I can … so that …), an enabler story on a pink one, a feature as a card with its
      // benefit hypothesis and numbered acceptance criteria, an objective with its business value.
      card: (() => {
        const f = selT.f ?? {};
        const lines = (x: string) => x.split(/\n+/).map((l) => l.replace(/^\s*(\d+[.)]|[-•*])\s*/, "").trim()).filter(Boolean);
        if (selT.type === "story" && selT.en) return { kind: "enabler", bg: "#f3c6cd", title: selT.title, text: f.enwhy || f.why || "", pts: sz(selT) };
        if (selT.type === "story") return { kind: "story", bg: "#cfe36b", role: f.role || "", want: f.want || "", why: f.why || "", title: selT.title, pts: sz(selT), ac: lines(f.ac || "") };
        if (selT.type === "feature" || selT.type === "capability") return { kind: selT.type, bg: "#fff", head: selT.en ? "#0f8f7a" : "#2b6f8f", title: selT.title, hyp: f.hyp || "", ac: lines(f.ac || ""), en: !!selT.en };
        if (selT.type === "pio") return { kind: "pio", bg: "#e6fbf7", title: selT.title, bv: selT.bv ?? 0, commit: selT.commit !== false };
        if (selT.type === "risk") return { kind: "risk", bg: "#f8a08a", title: selT.title, roam: selT.roam ? ROAM.find((r) => r[0] === selT.roam)?.[1] ?? selT.roam : "Not ROAMed yet" };
        return { kind: "epic", bg: "#dfe4fb", title: selT.title, text: [f.for ? `For ${f.for}` : "", f.who ? `who ${f.who}` : "", f.the ? `the ${f.the}` : "", f.isa ? `is a ${f.isa}` : "", f.that ? `that ${f.that}` : "", f.unlike ? `Unlike ${f.unlike}` : "", f.sol ? `our solution ${f.sol}` : ""].filter(Boolean).join(" ") };
      })(),
      // Assigning work to a team: a feature (or capability, epic, risk, objective) moves with everything under it.
      teamOpts: Array.from({ length: N }, (_, k) => ({ id: String(k + 1), t: teamOf(k + 1).name, sel: k + 1 === selT.team })),
      teamValW: String(selT.team),
      setTeamW: (e: React.ChangeEvent<HTMLSelectElement>) => moveTeam(selT.id, Number(e.target.value)),
    };
    facts = [{ k: "TEAM", v: teamOf(selT.team).name }, { k: "LOCATION", v: where(selT) }, { k: selT.type === "story" ? "SIZE" : "CHILDREN", v: selT.type === "story" ? `${sz(selT)} pts` : String(down.length) }, { k: selT.type === "risk" ? "ROAM" : "STATUS", v: selT.type === "risk" ? (selT.roam || "Not yet ROAMed") : selT.iter ? "Loaded" : "In the yard" }];
    const fv = selT.f ?? {};
    form = formDefs(selT).map((d) => ({ label: d.label, ph: d.ph, area: d.area, line: !d.area, rows: d.rows, val: d.k === "note" ? (selT.note ?? "") : (fv[d.k] ?? ""), set: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(selT.id, d.k, e.target.value), chipBg: tc, chipFg: ink2 }));
    etypes = ["Architecture", "Infrastructure", "Exploration", "Compliance"].map((n) => ({ n, bg: fv.etype === n ? tc : "#fff", fg: fv.etype === n ? ink2 : "#14123a", go: () => setF(selT.id, "etype", fv.etype === n ? "" : n) }));
    parentOptsW = parentList(selT).map((o) => ({ ...o, sel: o.id === (selT.parent ?? "") }));
  }
  // The colour key: per type, standard and enabler, with counts for the view in front of you.
  const base = cur ? T : s.tickets;
  const legend = (en: boolean) => TYPES.map(([k, n]) => { const kk = k + (en ? "E" : ""), c = s.colors?.[kk] ?? DEFC[kk]!; return { name: n, color: c, fg: ink(c), img: en ? HATCH : "none", n: base.filter((t) => t.type === k && !!t.en === en).length, set: (e: React.ChangeEvent<HTMLInputElement>) => { const val = e.target.value; set((x) => ({ colors: { ...(x.colors ?? {}), [kk]: val } })); }, tag: s.colors?.[kk] ? "custom" : "default" }; });
  // The stack: a card's children dealt out, each with Locate, Open and a parent switch; the footer adds the next level down.
  const cp = s.coll ? by[s.coll] : undefined, kidT = cp ? CHILD[cp.type] : undefined, cpf = cp?.f ?? {}, collSummary = cp ? (cpf.hyp || cpf.sol || cpf.desc || cpf.enwhy || "") : "";
  const collRows = cp ? s.tickets.filter((x) => x.parent === cp.id).map((x, xi) => { const c = x.type === "risk" ? "#f8a08a" : col(x); return { delay: `${xi * 70}ms`, rot: [-2.2, 1.6, -1, 2.4][xi % 4], tag: (x.en ? "⚙ ENABLER " : "") + x.type.toUpperCase(), size: x.type === "story" ? String(sz(x)) : "", hasSize: x.type === "story", moveOpts: parentList(x).map((o) => ({ ...o, sel: o.id === x.parent })), moveVal: x.parent ?? "", move: (e: React.ChangeEvent<HTMLSelectElement>) => upd(x.id, { parent: e.target.value }), color: c, fg: ink(c), img: x.en ? HATCH : "none", t: x.title, meta: `${x.en ? "Enabler " : ""}${x.type}${x.type === "story" ? ` · ${sz(x)} pts` : ""} · ${where(x)}`, locate: () => { set(() => ({ coll: null, full: false, view: String(x.team), sel: x.id })); flashIt(x.id); }, open: () => set(() => ({ coll: null, sel: x.id, full: true, view: String(x.team) })) }; }) : [];
  const addKid = () => { const title = s.collText.trim(); if (!cp || !kidT || !title) return; const id = key(); const t: Ticket = { id, type: kidT, title, parent: cp.id, team: cp.team, iter: null, pts: 0, ...(s.collEn ? { en: true } : {}) }; set((x) => ({ tickets: [...x.tickets, t], kn: x.kn + 1, collText: "" })); flashIt(id); };
  const stepT = (d: number) => { if (!selT) return; const peers = s.tickets.filter((x) => x.team === selT.team && x.type !== "pio"), i = peers.findIndex((x) => x.id === selT.id), n = peers[(i + d + peers.length) % peers.length]; if (n) set(() => ({ sel: n.id })); };
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
    kinds: ([["epic", "Epic"], ["capability", "Capability"], ["feature", "Feature"], ["story", "Story"], ["risk", "Risk"], ["pio", "PI objective"]] as const).map(([k, n]) => ({ n, dot: k === "risk" ? "#f8a08a" : k === "pio" ? "#5ff0e0" : col({ type: k, en: s.en }), bg: s.kind === k ? "#ffe14d" : "transparent", fg: s.kind === k ? "#14123a" : "#fff", go: () => set(() => ({ kind: k, parentSel: "" })) })),
    toggleNewEn: () => set((t) => ({ en: !t.en })), enBg: s.en ? "#ffe14d" : "transparent", enFg: s.en ? "#14123a" : "#fff",
    newText: s.newText, setNew: (e: React.ChangeEvent<HTMLInputElement>) => set(() => ({ newText: e.target.value })), newKey: (e: React.KeyboardEvent) => { if (e.key === "Enter") addT(ps); }, addTicket: () => addT(ps),
    newHint: `${tm.name}: new ${s.en && s.kind !== "risk" ? "enabler " : ""}${s.kind}…`, hasParents: s.kind !== "epic", parentOpts: parentOpts.map((o) => ({ ...o, sel: o.id === ps })), parentVal: ps, setParent: (e: React.ChangeEvent<HTMLSelectElement>) => set(() => ({ parentSel: e.target.value })), parentLabel: ({ capability: "Epic", feature: "Epic / capability", story: "Feature" } as Record<string, string>)[s.kind] ?? "Relates to",
    legStd: legend(false), legEn: legend(true), hasCustom: Object.keys(s.colors ?? {}).length > 0, resetColors: () => set(() => ({ colors: {} })),
    showFull: !!selT && s.full, facts, form, etypes, parentOptsW, openFull: () => set(() => ({ full: true })), closeFull: () => set(() => ({ full: false })), stopClick: (e: React.SyntheticEvent) => e.stopPropagation(),
    fullTitle: (e: React.ChangeEvent<HTMLTextAreaElement>) => selT && upd(selT.id, { title: e.target.value }), fullNote: (e: React.ChangeEvent<HTMLTextAreaElement>) => selT && upd(selT.id, { note: e.target.value }), prevT: () => stepT(-1), nextT: () => stepT(1),
    showColl: !!cp, collSummary, hasSummary: !!collSummary, collTitle: cp?.title ?? "", collColor: cp ? col(cp) : "#fff", collFg: cp ? ink(col(cp)) : "#14123a", collKind: cp ? (cp.en ? "ENABLER " : "") + cp.type.toUpperCase() : "", collRows, collEmpty: !collRows.length, collN: collRows.length, collAdd: kidT ? `Add ${kidT}` : "", canAddKid: !!kidT, collText: s.collText, setCollText: (e: React.ChangeEvent<HTMLInputElement>) => set(() => ({ collText: e.target.value })), collKey: (e: React.KeyboardEvent) => { if (e.key === "Enter") addKid(); }, addKid, collEnBg: s.collEn ? "#ffe14d" : "#fff", toggleCollEn: () => set((t) => ({ collEn: !t.collEn })), closeColl: () => set(() => ({ coll: null })),
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
      <style>{`@keyframes glow{0%,100%{box-shadow:0 0 0 0 #ff3d8f}50%{box-shadow:0 0 0 7px transparent}}@keyframes rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}@keyframes unfold{from{opacity:0;transform:perspective(1200px) rotateX(-70deg) scale(.9);transform-origin:top center}to{opacity:1;transform:none}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes deal{from{opacity:0;transform:translate(-50px,-70px) rotate(-14deg)}to{opacity:1;transform:none}}`}</style>
      <Note text={error} />
      <PlanningRoomView v={v} />
    </div>
  );
}
