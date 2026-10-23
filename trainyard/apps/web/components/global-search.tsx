"use client";

// Find any ticket, card, canvas or board from anywhere: the search box in the rail.

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { KIND_LABEL, type RefSummary } from "./link-picker";

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<RefSummary[]>([]);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => api<{ results: RefSummary[] }>("GET", `/v1/search?q=${encodeURIComponent(q)}&limit=12`).then((r) => (setResults(r.results), setOpen(true))).catch(() => setResults([])), 150);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={box} className="gs">
      <input className="gs-input" placeholder="Find a ticket, card, board…" value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => results.length && setOpen(true)} aria-label="Search the workspace" />
      {open && results.length ? (
        <div className="gs-pop">
          {results.map((r) => (
            <a key={`${r.ref.kind}:${r.ref.boardId ?? ""}:${r.ref.id}`} className="gs-row" href={r.href} onClick={() => setOpen(false)}>
              <span className="lp-swatch" style={{ background: r.color }} />
              <span className="lp-main">
                <span className="lp-title">{r.title}</span>
                <span className="lp-sub">
                  <b>{KIND_LABEL[r.kind]}</b>
                  {r.subtitle ? ` · ${r.subtitle}` : ""}
                </span>
              </span>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
