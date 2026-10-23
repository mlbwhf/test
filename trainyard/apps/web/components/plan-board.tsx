"use client";

// The board mechanics the planning boards share: cards you drag between cells, strings
// between any two cards, and a popover that edits whatever card was clicked.

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export interface DragPayload {
  kind: string;
  id: string;
}

let dragging: DragPayload | null = null;

/** A card: draggable, clickable, and a link target when a string is being drawn. */
export function PlanCard({
  id,
  kind,
  className,
  style,
  title,
  linkFrom,
  onClick,
  onLinkTo,
  children,
}: {
  id: string;
  kind: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
  linkFrom: string | null;
  onClick: (anchor: DOMRect) => void;
  onLinkTo: (toId: string) => void;
  children: ReactNode;
}) {
  const arming = linkFrom !== null && linkFrom !== id;
  return (
    <div
      data-card-id={id}
      className={`${className ?? ""} plan-card${linkFrom === id ? " plan-card-linking" : ""}${arming ? " plan-card-target" : ""}`}
      style={style}
      title={arming ? "Click to string these two together" : (title ?? "Drag to move · click to edit")}
      draggable
      onDragStart={(e) => {
        dragging = { kind, id };
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
      }}
      onDragEnd={() => {
        dragging = null;
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (arming) onLinkTo(id);
        else onClick((e.currentTarget as HTMLElement).getBoundingClientRect());
      }}
    >
      {children}
    </div>
  );
}

/** A grid cell that accepts dropped cards and offers a "+" to add one in place. */
export function DropCell({ className, style, onDrop, onAdd, children }: { className?: string; style?: CSSProperties; onDrop: (p: DragPayload) => void; onAdd?: () => void; children: ReactNode }) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={`${className ?? ""} plan-cell${over ? " plan-cell-over" : ""}`}
      style={style}
      onDragOver={(e) => {
        if (!dragging) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!over) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (dragging) onDrop(dragging);
        dragging = null;
      }}
    >
      {children}
      {onAdd ? (
        <button type="button" className="plan-add" aria-label="Add here" title="Add a card here" onClick={onAdd}>
          +
        </button>
      ) : null}
    </div>
  );
}

export interface StringSpec {
  id: string;
  fromId: string;
  toId: string;
  kind: "depends" | "relates";
}

/** Draws the strings between cards present in the children, and lets a string be removed. */
export function PlanStrings({ links, depsKey, onRemove, children }: { links: StringSpec[]; depsKey: string; onRemove?: (id: string) => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{ id: string; d: string; mx: number; my: number; kind: StringSpec["kind"]; back: boolean }[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const measure = () => {
    const root = ref.current;
    if (!root) return;
    const box = root.getBoundingClientRect();
    const at = (id: string) => root.querySelector<HTMLElement>(`[data-card-id="${CSS.escape(id)}"]`)?.getBoundingClientRect();
    const next: typeof lines = [];
    for (const l of links) {
      const from = at(l.fromId);
      const to = at(l.toId);
      if (!from || !to) continue;
      const x1 = from.left - box.left + from.width / 2;
      const y1 = from.top - box.top + from.height / 2;
      const x2 = to.left - box.left + to.width / 2;
      const y2 = to.top - box.top + to.height / 2;
      const dx = Math.max(40, Math.abs(x2 - x1) / 2);
      next.push({ id: l.id, d: `M ${x1} ${y1} C ${x1 - dx} ${y1}, ${x2 + dx} ${y2}, ${x2} ${y2}`, mx: (x1 + x2) / 2, my: (y1 + y2) / 2, kind: l.kind, back: l.kind === "depends" && x2 > x1 });
    }
    setLines(next);
    setSize({ w: root.scrollWidth, h: root.scrollHeight });
  };
  useLayoutEffect(measure, [links, depsKey]);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      {children}
      <svg width={size.w} height={size.h} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", overflow: "visible" }} aria-hidden="true">
        {lines.map((l) => {
          const color = l.kind === "depends" ? "#c2412d" : "#1a73c8";
          return (
            <g key={l.id}>
              <path d={l.d} fill="none" stroke={color} strokeWidth={2} strokeDasharray={l.back ? "6 5" : l.kind === "relates" ? "2 4" : undefined} opacity={0.85} />
              {onRemove ? (
                <g style={{ pointerEvents: "auto", cursor: "pointer" }} onClick={() => onRemove(l.id)}>
                  <title>{l.kind === "depends" ? "Depends on · click to remove the string" : "Related · click to remove the string"}</title>
                  <circle cx={l.mx} cy={l.my} r={7} fill="#fff" stroke={color} strokeWidth={1.5} />
                  <text x={l.mx} y={l.my + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill={color}>
                    ×
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** A small editor floating under the card that was clicked; closes on Escape or outside click. */
export function Popover({ anchor, title, onClose, children, width = 340 }: { anchor: DOMRect; title: string; onClose: () => void; children: ReactNode; width?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", key);
    // Deferred so the click that opened it does not close it.
    const t = setTimeout(() => window.addEventListener("mousedown", down), 0);
    return () => {
      window.removeEventListener("keydown", key);
      clearTimeout(t);
      window.removeEventListener("mousedown", down);
    };
  }, [onClose]);
  const left = Math.max(8, Math.min(anchor.left, (typeof window !== "undefined" ? window.innerWidth : 1200) - width - 8));
  const below = anchor.bottom + 6;
  const top = typeof window !== "undefined" && below + 320 > window.innerHeight ? Math.max(8, anchor.top - 326) : below;
  return (
    <div ref={ref} className="plan-pop" role="dialog" aria-label={title} style={{ position: "fixed", left, top, width }} onClick={(e) => e.stopPropagation()}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <b style={{ fontSize: "0.85rem" }}>{title}</b>
        <button type="button" className="btn small ghost" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
      {children}
    </div>
  );
}
