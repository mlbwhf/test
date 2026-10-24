"use client";

// Touch helpers shared by the boards: panning and pinch-zoom for a scrolling canvas, a
// pointer-based card drag that replaces HTML5 drag and drop (which touch browsers ignore),
// and a coarse-pointer query. Everything is keyed by pointerId so several people can work
// on one wall display at the same time.

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent, type RefObject } from "react";

/** True on a touch-first screen (finger or stylus as the main pointer). */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(pointer: coarse)");
    setCoarse(q.matches);
    const on = () => setCoarse(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return coarse;
}

type Pt = { x: number; y: number };

/** How far a finger may wander and still count as a tap. */
export const TAP_SLOP = 8;

/**
 * Touch and pen panning for a board inside a scroller: one finger drags the view (and the
 * page once the board runs out), two fingers pan and pinch around their midpoint. Mouse
 * pointers are left alone; they have the wheel and the scrollbars. The surface needs
 * `touch-action: none` so the browser hands over the gesture.
 *
 * `down` returns false for pointers it does not take; `up` returns "tap" for a short touch
 * that never moved, so the caller can treat it as a click.
 */
export function usePanZoom(scroller: RefObject<HTMLElement | null>, content: RefObject<Element | null>, zoom: number, setZoom: (z: number) => void, min: number, max: number) {
  const pts = useRef(new Map<number, Pt & { moved: boolean }>());
  const pinch = useRef<{ dist: number; zoom: number; fx: number; fy: number } | null>(null);
  const anchor = useRef<Pt & { fx: number; fy: number } | null>(null);

  // Keep the point under the fingers' midpoint where it was, after the zoom has rendered.
  const place = () => {
    const a = anchor.current;
    const s = scroller.current;
    const c = content.current;
    if (!a || !s || !c) return;
    const r = c.getBoundingClientRect();
    s.scrollLeft += r.left + a.fx * r.width - a.x;
    s.scrollTop += r.top + a.fy * r.height - a.y;
  };
  useLayoutEffect(place, [zoom]);

  const scrollBy = (dx: number, dy: number) => {
    const s = scroller.current;
    if (!s) return;
    const l = s.scrollLeft;
    const t = s.scrollTop;
    s.scrollLeft += dx;
    s.scrollTop += dy;
    // Whatever the board could not absorb scrolls the page, as a native pan would.
    const rx = dx - (s.scrollLeft - l);
    const ry = dy - (s.scrollTop - t);
    if (Math.abs(rx) > 0.5 || Math.abs(ry) > 0.5) window.scrollBy(rx, ry);
  };

  const startPinch = () => {
    const [a, b] = [...pts.current.values()];
    const c = content.current;
    if (!a || !b || !c) return;
    const r = c.getBoundingClientRect();
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const fx = (mid.x - r.left) / Math.max(1, r.width);
    const fy = (mid.y - r.top) / Math.max(1, r.height);
    pinch.current = { dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), zoom, fx, fy };
    anchor.current = { ...mid, fx, fy };
  };

  /** Hand a pointer to the pan; also used to adopt a finger that was doing something else. */
  const add = (pointerId: number, x: number, y: number) => {
    pts.current.set(pointerId, { x, y, moved: false });
    if (pts.current.size === 2) startPinch();
    else if (pts.current.size > 2) pinch.current = null;
  };

  const down = (e: RPointerEvent): boolean => {
    if (e.pointerType === "mouse") return false;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    add(e.pointerId, e.clientX, e.clientY);
    return true;
  };

  const move = (e: RPointerEvent): boolean => {
    const p = pts.current.get(e.pointerId);
    if (!p) return false;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!p.moved && Math.hypot(dx, dy) < TAP_SLOP) return true;
    p.moved = true;
    if (pts.current.size === 1) {
      scrollBy(-dx, -dy);
      p.x = e.clientX;
      p.y = e.clientY;
      return true;
    }
    p.x = e.clientX;
    p.y = e.clientY;
    const pc = pinch.current;
    if (!pc) return true;
    const [a, b] = [...pts.current.values()];
    if (!a || !b) return true;
    anchor.current = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, fx: pc.fx, fy: pc.fy };
    const z = Math.min(max, Math.max(min, Math.round(pc.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / pc.dist) * 100) / 100));
    if (z !== zoom) setZoom(z);
    else place();
    return true;
  };

  const up = (e: RPointerEvent): "tap" | "pan" | null => {
    const p = pts.current.get(e.pointerId);
    if (!p) return null;
    const wasPinch = pts.current.size > 1 || pinch.current !== null;
    pts.current.delete(e.pointerId);
    if (pts.current.size < 2) {
      pinch.current = null;
      anchor.current = null;
    }
    if (pts.current.size === 2) startPinch();
    return !p.moved && !wasPinch && e.type === "pointerup" ? "tap" : "pan";
  };

  /** Let go of a pointer without treating it as a tap (a long-press took it over). */
  const release = (pointerId: number) => {
    pts.current.delete(pointerId);
    if (pts.current.size < 2) (pinch.current = null), (anchor.current = null);
  };

  const has = (pointerId: number) => pts.current.has(pointerId);
  const still = (pointerId: number) => pts.current.size === 1 && pts.current.get(pointerId)?.moved === false;

  return { down, move, up, add, release, has, still };
}

// ---- pointer drag for DOM cards ------------------------------------------------------------

export interface DragPayload {
  kind: string;
  id: string;
}

interface Zone {
  accepts: (p: DragPayload) => boolean;
  drop: (p: DragPayload) => void;
  hover: (delta: number) => void;
}

const zones = new Map<string, Zone>();
let zoneSeq = 0;

/**
 * A place cards can be dropped. Spread the returned props on the element; `over` is true
 * while any pointer holds an acceptable card above it.
 */
export function useDropZone(accepts: (p: DragPayload) => boolean, drop: (p: DragPayload) => void) {
  const [id] = useState(() => `z${++zoneSeq}`);
  const [hovering, setHovering] = useState(0);
  const latest = useRef({ accepts, drop });
  latest.current = { accepts, drop };
  useEffect(() => {
    zones.set(id, { accepts: (p) => latest.current.accepts(p), drop: (p) => latest.current.drop(p), hover: (d) => setHovering((n) => Math.max(0, n + d)) });
    return () => void zones.delete(id);
  }, [id]);
  return { over: hovering > 0, zoneProps: { "data-drop-zone": id } };
}

function zoneAt(x: number, y: number, p: DragPayload): string | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-drop-zone]");
  const id = el?.dataset.dropZone;
  return id && zones.get(id)?.accepts(p) ? id : null;
}

function scrollParents(el: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (let p = el.parentElement; p; p = p.parentElement) {
    const s = getComputedStyle(p);
    if ((/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth) || (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight)) out.push(p);
  }
  return out;
}

const EDGE = 48;
const edgeSpeed = (pos: number, lo: number, hi: number) => (pos < lo + EDGE ? -Math.ceil((lo + EDGE - pos) / 4) : pos > hi - EDGE ? Math.ceil((pos - (hi - EDGE)) / 4) : 0);

/**
 * Start a pointer drag from a card's onPointerDown. Mouse, pen and touch all take this path;
 * the card follows the pointer as a floating copy and drops on the zone under it. A press
 * that never moves stays a click. Controls inside the card keep working.
 */
export function beginCardDrag(e: RPointerEvent<HTMLElement>, payload: DragPayload) {
  if (e.button !== 0 || (e.target as Element).closest("button, input, select, textarea, label")) return;
  const el = e.currentTarget;
  if (el.dataset.dragging) return; // someone else already holds this card
  const pointerId = e.pointerId;
  const touch = e.pointerType === "touch";
  const start = { x: e.clientX, y: e.clientY };
  let at = start;
  let ghost: HTMLElement | null = null;
  let off = { x: 0, y: 0 };
  let zone: string | null = null;
  let frame = 0;
  let parents: HTMLElement[] = [];
  el.dataset.dragging = "1";
  // A link inside the card would start the browser's own link drag; this one replaces it.
  const noNativeDrag = (d: DragEvent) => d.preventDefault();

  const setZone = (next: string | null) => {
    if (next === zone) return;
    if (zone) zones.get(zone)?.hover(-1);
    if (next) zones.get(next)?.hover(1);
    zone = next;
  };
  const place = () => {
    if (!ghost) return;
    ghost.style.left = `${at.x - off.x}px`;
    ghost.style.top = `${at.y - off.y}px`;
    setZone(zoneAt(at.x, at.y, payload));
  };
  // Near an edge, scroll the board (and the page) so a card can travel past what is visible.
  const autoScroll = () => {
    frame = 0;
    if (!ghost) return;
    let moved = false;
    for (const p of parents) {
      const r = p.getBoundingClientRect();
      const dx = edgeSpeed(at.x, r.left, r.right);
      const dy = edgeSpeed(at.y, r.top, r.bottom);
      if (dx || dy) {
        const l = p.scrollLeft;
        const t = p.scrollTop;
        p.scrollBy(dx, dy);
        moved ||= p.scrollLeft !== l || p.scrollTop !== t;
      }
    }
    const wx = edgeSpeed(at.x, 0, window.innerWidth);
    const wy = edgeSpeed(at.y, 0, window.innerHeight);
    if (wx || wy) {
      const l = window.scrollX;
      const t = window.scrollY;
      window.scrollBy(wx, wy);
      moved ||= window.scrollX !== l || window.scrollY !== t;
    }
    if (moved) {
      place();
      frame = requestAnimationFrame(autoScroll);
    }
  };

  const onMove = (ev: PointerEvent) => {
    if (ev.pointerId !== pointerId) return;
    at = { x: ev.clientX, y: ev.clientY };
    if (!ghost) {
      if (Math.hypot(at.x - start.x, at.y - start.y) < (touch ? TAP_SLOP : 5)) return;
      const r = el.getBoundingClientRect();
      off = { x: start.x - r.left, y: start.y - r.top };
      ghost = el.cloneNode(true) as HTMLElement;
      ghost.removeAttribute("data-card-id");
      ghost.removeAttribute("data-item-id");
      ghost.removeAttribute("data-dragging");
      ghost.setAttribute("aria-hidden", "true");
      ghost.classList.add("drag-ghost");
      Object.assign(ghost.style, { position: "fixed", width: `${r.width}px`, height: `${r.height}px`, margin: "0", zIndex: "1000", pointerEvents: "none" });
      document.body.appendChild(ghost);
      el.classList.add("drag-source");
      parents = scrollParents(el);
      // Captured only once it is a drag, so a plain press on a link inside still follows it.
      if (el.isConnected) el.setPointerCapture(pointerId);
    }
    place();
    if (!frame) frame = requestAnimationFrame(autoScroll);
  };
  const finish = (ev: PointerEvent) => {
    if (ev.pointerId !== pointerId) return;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", finish);
    window.removeEventListener("pointercancel", finish);
    el.removeEventListener("dragstart", noNativeDrag);
    delete el.dataset.dragging;
    if (frame) cancelAnimationFrame(frame);
    if (!ghost) return;
    ghost.remove();
    el.classList.remove("drag-source");
    const target = ev.type === "pointerup" ? zone : null;
    setZone(null);
    // A mouse or pen still fires a click on the card after a drag; swallow it.
    if (!touch) {
      const swallow = (c: MouseEvent) => (c.stopPropagation(), c.preventDefault());
      window.addEventListener("click", swallow, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
    }
    if (target) zones.get(target)?.drop(payload);
  };
  // On the window, so the gesture is followed even if the card re-renders away under it.
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", finish);
  window.addEventListener("pointercancel", finish);
  el.addEventListener("dragstart", noNativeDrag);
}

/** Two taps on the same thing within a moment: the touch stand-in for a double-click. */
export function useDoubleTap(ms = 400) {
  const last = useRef<{ key: string; t: number; x: number; y: number } | null>(null);
  return (key: string, x: number, y: number): boolean => {
    const now = Date.now();
    const l = last.current;
    if (l && l.key === key && now - l.t < ms && Math.hypot(l.x - x, l.y - y) < 32) {
      last.current = null;
      return true;
    }
    last.current = { key, t: now, x, y };
    return false;
  };
}
