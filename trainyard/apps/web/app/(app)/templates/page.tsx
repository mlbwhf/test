"use client";

import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { TEMPLATE_METHODS, type Board, type BoardOrigin, type TemplateInfo, type TemplateMethod } from "@trainyard/core";
import { CanvasEditor } from "@/components/canvas-editor";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, useMe, type ApiFailure } from "@/lib/api";

interface Summary {
  id: string;
  name: string;
  origin: BoardOrigin;
  shape: string;
  counts: { frames: number; nodes: number; edges: number; columns: number; rows: number };
  info?: TemplateInfo;
}

const FILTERS = [
  ["all", "All"],
  ["safe", "SAFe"],
  ["class", "Classes"],
  ["team", "Team"],
  ["portfolio", "Portfolio"],
  ["risk", "Risk"],
  ["flow", "Flow / Kanban"],
  ["lean", "Lean / Obeya"],
  ["saved", "Saved from imports"],
] as const;

export default function TemplatesPage() {
  const router = useRouter();
  const data = useApi<{ builtin: Summary[]; saved: Summary[] }>("/v1/templates/boards");
  const me = useMe();
  const [filter, setFilter] = useState<string>("all");
  const [method, setMethod] = useState<TemplateMethod | "all">("all");
  const params = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(params.get("tpl"));
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const selId = selectedId ?? data.data?.builtin[0]?.id ?? null;
  const preview = useApi<{ board: Board }>(selId ? `/v1/templates/boards/${encodeURIComponent(selId)}` : null);
  if (!data.data) return <Loading error={data.error} />;

  const all: Summary[] = [...data.data.builtin, ...data.data.saved.map((s) => ({ ...s, info: undefined }))];
  const shown = all.filter((t) => (filter === "all" || (filter === "saved" ? !t.info : t.info?.tags.includes(filter as never))) && (method === "all" || t.info?.method === method));
  const methodBlurb = TEMPLATE_METHODS.find((m) => m.id === method)?.blurb;
  const sel = all.find((t) => t.id === selId);
  const isClass = (t: Summary | undefined) => !!t?.info?.tags.includes("class" as never);
  const gated = isClass(sel) && !!me.data?.principal.anonymous;

  const create = async () => {
    if (!sel) return;
    const boardName = name.trim() || `${sel.name} ${new Date().toISOString().slice(0, 10)}`;
    try {
      const r = await api<{ board: { id: string } }>("POST", `/v1/templates/boards/${encodeURIComponent(sel.id)}/create`, { name: boardName });
      router.push(`/boards/${encodeURIComponent(r.board.id)}`);
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };

  return (
    <>
      <PageHead
        title="Start from a template"
        sub="Built in, sized to your teams and iterations, and yours to fork. Boards you imported and saved as templates appear here too."
        actions={
          <div className="tabs" role="group" aria-label="Filter templates">
            {FILTERS.map(([k, label]) => (
              <button key={k} aria-selected={filter === k} onClick={() => setFilter(k)}>
                {label}
              </button>
            ))}
          </div>
        }
      />
      <div className="row" style={{ gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span className="eyebrow">Method</span>
        <div className="tabs" role="group" aria-label="Filter by method">
          <button aria-selected={method === "all"} onClick={() => setMethod("all")}>
            All methods
          </button>
          {TEMPLATE_METHODS.map((m) => (
            <button key={m.id} aria-selected={method === m.id} onClick={() => setMethod(m.id)} title={m.blurb}>
              {m.label}
            </button>
          ))}
        </div>
        {methodBlurb ? (
          <span className="faint" style={{ fontSize: "0.82rem" }}>
            {methodBlurb}
          </span>
        ) : (
          <span className="faint" style={{ fontSize: "0.82rem" }}>Each method keeps its own vocabulary: SAFe boards say what SAFe says, Scrum boards what the Scrum Guide says, and so on.</span>
        )}
      </div>
      {err ? <ErrorList title="Could not create the board" items={[{ message: err }]} /> : null}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 380px)", gap: 16, alignItems: "start" }}>
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }} aria-label="Templates">
          {shown.map((t) => (
            <button key={t.id} className="card" onClick={() => setSelectedId(t.id)} aria-pressed={t.id === selId} style={{ textAlign: "left", padding: 14, display: "flex", flexDirection: "column", gap: 8, cursor: "pointer", borderColor: t.id === selId ? "var(--signal)" : undefined, boxShadow: t.id === selId ? "0 0 0 2px var(--signal) inset" : undefined }}>
              <Thumb summary={t} />
              <strong style={{ lineHeight: 1.3 }}>{t.name}</strong>
              <span className="faint" style={{ fontSize: "0.8rem", lineHeight: 1.45 }}>{t.info?.blurb ?? `Saved from ${t.origin.system} on ${t.origin.importedAt.slice(0, 10)}`}</span>
              <span className="mono faint" style={{ fontSize: "0.7rem", marginTop: "auto" }}>
                {t.info ? `${TEMPLATE_METHODS.find((m) => m.id === t.info!.method)?.label ?? ""} · ` : ""}
                {t.shape} · {t.info?.event ?? "your template"}
              </span>
            </button>
          ))}
          {shown.length === 0 ? <p className="faint">Nothing here yet. Import a board and choose “Save as template”.</p> : null}
        </section>

        {sel ? (
          <aside className="panel panel-body stack" aria-live="polite">
            <span className="eyebrow">Selected template</span>
            <h2>{sel.name}</h2>
            {sel.info ? (
              <>
                <p className="muted">{sel.info.blurb}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
                  {sel.info.zones.map((z) => (
                    <span key={z} className="chip" style={{ justifyContent: "center", textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-body)", padding: "6px 8px", whiteSpace: "normal" }}>
                      {z}
                    </span>
                  ))}
                </div>
                <div className="stack" style={{ gap: 4, fontSize: "0.85rem" }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="muted">Used in</span>
                    <strong>{sel.info.event}</strong>
                  </div>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="muted">Card types</span>
                    <strong>{sel.info.cardTypes.join(", ")}</strong>
                  </div>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="muted">Maps onto the plan as</span>
                    <strong>{sel.info.mapsTo}</strong>
                  </div>
                </div>
              </>
            ) : (
              <p className="muted">Saved from an import. Structure kept, content cleared.</p>
            )}
            <label className="field">
              Board name
              <input id="tpl-name" className="input" placeholder={`${sel.name} ${new Date().toISOString().slice(0, 10)}`} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            {gated ? (
              <div className="notice warn">
                <strong>Classes need a free account.</strong>
                <p style={{ margin: "4px 0 0" }}>
                  Class boards (Leading SAFe, SPC, Advanced SPC, POPM, RTE) and Miro imports are for signed-up trainers; the account is free. <a href="/#join">Sign up</a>, then <Link href="/login">sign in</Link> with the key you receive.
                </p>
              </div>
            ) : null}
            <button className="btn primary" onClick={create} disabled={gated}>
              Create board
            </button>
          </aside>
        ) : null}
      </div>

      {preview.data ? (
        <section className="stack">
          <span className="eyebrow">Preview</span>
          <CanvasEditor board={preview.data.board} readOnly onChanged={() => undefined} onError={setErr} />
        </section>
      ) : null}
    </>
  );
}

function Thumb({ summary: t }: { summary: Summary }) {
  const tones = t.shape === "table" ? ["var(--sunken)", "var(--glass-strong)", "var(--sunken)", "var(--glass-strong)", "var(--sunken)", "var(--glass-strong)"] : ["#fff6c2", "#fff6c2", "#cfe3fb", "#dcf3e4", "#dcf3e4", "#fbd9d2"];
  return (
    <div aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 4, height: 64 }}>
      {tones.map((c, i) => (
        <div key={i} style={{ borderRadius: 8, background: c, border: "1px solid var(--line)" }} />
      ))}
    </div>
  );
}
