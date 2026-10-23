"use client";

// Find any record in the workspace and link it: features, epics, risks, milestones, outcomes,
// canvases, boards, cards on other boards. One search box, kind filters, pick a row.

import { useEffect, useState } from "react";
import { api, type ApiFailure } from "@/lib/api";

export type RefKind = "item" | "epic" | "risk" | "dependency" | "milestone" | "objective" | "outcome" | "output" | "initiative" | "canvas" | "board" | "card" | "team" | "person";
export interface Ref { kind: RefKind; id: string; boardId?: string }
export interface RefSummary { ref: Ref; kind: RefKind; title: string; subtitle?: string; status?: string; color: string; href: string; facts: Record<string, string | number>; preview?: { label: string; count: number }[] }

export const KIND_LABEL: Record<RefKind, string> = { item: "Work item", epic: "Epic", risk: "Risk", dependency: "Dependency", milestone: "Milestone", objective: "PI objective", outcome: "Outcome", output: "Output", initiative: "AI initiative", canvas: "Canvas", board: "Board", card: "Card", team: "Team", person: "Person" };

export function LinkPicker({ title, kinds, onPick, onClose, exclude }: { title: string; kinds?: RefKind[]; onPick: (r: RefSummary) => void; onClose: () => void; exclude?: Ref }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<RefKind | "">("");
  const [results, setResults] = useState<RefSummary[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setBusy(true);
      const ks = kind ? [kind] : kinds;
      api<{ results: RefSummary[] }>("GET", `/v1/search?q=${encodeURIComponent(q)}${ks?.length ? `&kinds=${ks.join(",")}` : ""}&limit=40`)
        .then((r) => setResults(r.results.filter((x) => !exclude || x.ref.kind !== exclude.kind || x.ref.id !== exclude.id || x.ref.boardId !== exclude.boardId)))
        .catch((e: ApiFailure) => setErr(e.message))
        .finally(() => setBusy(false));
    }, 150);
    return () => clearTimeout(t);
  }, [q, kind, kinds, exclude]);
  const filterKinds = kinds ?? (Object.keys(KIND_LABEL) as RefKind[]);
  return (
    <div className="lp-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="lp panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h2>{title}</h2>
          <button className="btn small ghost" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="panel-body stack">
          <input className="input" autoFocus placeholder="Search by title, id, team, status…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          <div className="row" style={{ gap: 4 }}>
            <button className={`chip ${kind === "" ? "ok" : ""}`} onClick={() => setKind("")}>
              all
            </button>
            {filterKinds.map((k) => (
              <button key={k} className={`chip ${kind === k ? "ok" : ""}`} onClick={() => setKind(kind === k ? "" : k)}>
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
          {err ? <p className="error">{err}</p> : null}
          <div className="lp-results">
            {results.map((r) => (
              <button key={`${r.ref.kind}:${r.ref.boardId ?? ""}:${r.ref.id}`} className="lp-row" onClick={() => onPick(r)}>
                <span className="lp-swatch" style={{ background: r.color }} />
                <span className="lp-main">
                  <span className="lp-title">{r.title || <i className="faint">untitled</i>}</span>
                  <span className="lp-sub">
                    <b>{KIND_LABEL[r.kind]}</b>
                    {r.subtitle ? ` · ${r.subtitle}` : ""}
                    {r.status ? ` · ${r.status}` : ""}
                  </span>
                </span>
              </button>
            ))}
            {!busy && results.length === 0 ? <p className="faint">Nothing matches.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
