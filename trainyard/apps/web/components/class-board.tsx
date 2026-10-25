"use client";

// A class board, lesson by lesson: a tab for the Welcome area and each lesson (the board's
// top-level frames, top to bottom), the lesson alone on the canvas and fitted to it, and a full
// screen mode that leaves only the tabs, the zoom and the board. "Whole board" shows everything.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Board, CardType } from "@trainyard/core";
import { CanvasEditor } from "@/components/canvas-editor";
import type { RefSummary } from "@/components/link-picker";

export function ClassBoard({ board, refs, cardTypes, readOnly, onChanged, onError }: { board: Board; refs: Record<string, RefSummary | null>; cardTypes: CardType[]; readOnly: boolean; onChanged: () => void; onError: (m: string) => void }) {
  const tabs = useMemo(() => board.frames.filter((f) => !f.parentId).sort((a, b) => a.y - b.y || a.x - b.x), [board.frames]);
  const [tab, setTab] = useState<string | null>(() => {
    if (typeof window === "undefined") return tabs[0]?.id ?? null;
    const n = /^#lesson-(\d+)$/.exec(window.location.hash)?.[1];
    return (n !== undefined ? tabs[Number(n)]?.id : undefined) ?? tabs[0]?.id ?? null;
  });
  const wrap = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === wrap.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  const pick = (id: string | null) => {
    setTab(id);
    const i = tabs.findIndex((t) => t.id === id);
    history.replaceState(null, "", i >= 0 ? `#lesson-${i}` : " ");
  };
  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (wrap.current?.requestFullscreen) void wrap.current.requestFullscreen().catch(() => setFull((f) => !f));
    else setFull((f) => !f);
  };
  // "Lesson 3: Facilitating PI Planning" reads "3 · Facilitating PI Planning" on its tab.
  const label = (title: string) => title.replace(/^Lesson\s+(\d+)\s*[:·-]\s*/i, "$1 · ");
  return (
    <div ref={wrap} className={`class-board${full ? " full" : ""}`}>
      <div className="class-tabs" role="tablist" aria-label="Lessons">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => pick(t.id)} title={t.title}>
            {label(t.title)}
          </button>
        ))}
        <button role="tab" aria-selected={tab === null} onClick={() => pick(null)}>
          Whole board
        </button>
        <span className="class-tabs-grow" />
        <button className="btn small" onClick={toggleFull} aria-pressed={full}>
          {full ? "Exit full screen" : "Full screen"}
        </button>
      </div>
      <CanvasEditor board={board} refs={refs} cardTypes={cardTypes} readOnly={readOnly} onChanged={onChanged} onError={onError} focus={tab} fill={full} />
    </div>
  );
}
