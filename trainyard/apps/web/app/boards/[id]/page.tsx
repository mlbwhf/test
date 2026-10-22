"use client";

import Link from "next/link";
import { use, useState } from "react";
import type { Board, BoardMapping, MappingResult } from "@trainyard/core";
import { CanvasEditor, cssColor } from "@/components/canvas-editor";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

const SOURCE_LABEL: Record<string, string> = { miro: "Miro", mural: "Mural", monday: "monday.com", trello: "Trello", csv: "CSV", json: "JSON", trainyard: "Trainyard" };

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const view = useApi<{ board: Board; shape: "canvas" | "table" | "mixed" | "empty" }>(`/v1/boards/${encodeURIComponent(id)}`);
  const model = useApi<{ model: { workLevels: { key: string; label: string; planned?: boolean }[] } }>("/v1/model");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [tab, setTab] = useState<"board" | "map">("board");
  if (!view.data || !model.data) return <Loading error={view.error ?? model.error} />;
  const { board, shape } = view.data;

  const run = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      setErr(null);
      setDone(label);
    } catch (e) {
      setDone(null);
      setErr((e as ApiFailure).message);
    }
  };

  return (
    <>
      <div>
        <Link href="/imports" className="faint" style={{ fontSize: "0.85rem" }}>
          ← Bring your own boards
        </Link>
      </div>
      <PageHead
        title={board.name}
        sub={
          <>
            <span className="chip">{board.isTemplate ? "Template" : SOURCE_LABEL[board.origin.system] ?? board.origin.system}</span> Imported {board.origin.importedAt.slice(0, 10)}
            {board.origin.url ? (
              <>
                {" "}
                ·{" "}
                <a href={board.origin.url} target="_blank" rel="noreferrer">
                  open in {SOURCE_LABEL[board.origin.system]}
                </a>
              </>
            ) : null}
            {board.templateId ? <> · from template {board.templateId}</> : null}
          </>
        }
        actions={
          board.isTemplate ? (
            <button
              className="btn primary"
              onClick={() => {
                const n = `${board.name.replace(/ template$/i, "")} ${new Date().toISOString().slice(0, 10)}`;
                void run(`Created "${n}" from this template.`, () => api("POST", `/v1/boards/${encodeURIComponent(board.id)}/instantiate`, { name: n }));
              }}
            >
              New board from template
            </button>
          ) : (
            <button className="btn" onClick={() => run("Saved as a template. Find it under Templates.", () => api("POST", `/v1/boards/${encodeURIComponent(board.id)}/template`, {}))}>
              Save as template
            </button>
          )
        }
      />
      {err ? <ErrorList title="That did not work" items={[{ message: err }]} /> : null}
      {done ? <div className="notice" role="status">{done}</div> : null}

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "board"} onClick={() => setTab("board")}>
          Board as imported
        </button>
        <button role="tab" aria-selected={tab === "map"} onClick={() => setTab("map")} disabled={board.isTemplate}>
          Map onto the plan
        </button>
      </div>

      {tab === "board" ? (
        <>
          {shape === "canvas" || shape === "mixed" ? <CanvasEditor board={board} readOnly={board.isTemplate} onChanged={() => void view.reload()} onError={setErr} /> : null}
          {shape === "table" || shape === "mixed" ? <Table board={board} /> : null}
          {shape === "empty" ? <div className="panel panel-body faint">This board is empty.</div> : null}
        </>
      ) : (
        <Mapper board={board} shape={shape} levels={model.data.model.workLevels} onApplied={(r) => setDone(`Added ${r.items.length} items, ${r.risks.length} risks, ${r.dependencies.length} dependencies${r.newTeams.length ? ` and ${r.newTeams.length} teams` : ""} to the plan.`)} onError={(e) => setErr(e)} />
      )}
    </>
  );
}

function Table({ board }: { board: Board }) {
  const cols = board.columns.filter((c) => !c.id.endsWith(":raw"));
  const groups = board.groups.length ? board.groups : [{ id: "", title: "" }];
  return (
    <section className="panel scroll-x">
      <table className="table" style={{ minWidth: Math.max(600, cols.length * 160) }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.id}>
                {c.title}
                {c.type ? <span className="faint" style={{ textTransform: "none", letterSpacing: 0 }}> · {c.type}</span> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const rows = board.rows.filter((r) => (g.id ? r.groupId === g.id : !r.groupId || !board.groups.some((x) => x.id === r.groupId)));
            if (!rows.length) return null;
            return [
              g.title ? (
                <tr key={`g-${g.id}`}>
                  <td colSpan={cols.length} style={{ background: "var(--sunken)", fontWeight: 700 }}>
                    <span className="dot" style={{ background: g.color ?? "var(--chart)", marginRight: 8 }} />
                    {g.title} <span className="faint">({rows.length})</span>
                  </td>
                </tr>
              ) : null,
              ...rows.map((r) => (
                <tr key={r.id}>
                  {cols.map((c) => (
                    <td key={c.id} style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(r.cells[c.id] ?? "")}>
                      {formatCell(r.cells[c.id])}
                    </td>
                  ))}
                </tr>
              )),
            ];
          })}
        </tbody>
      </table>
    </section>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function Mapper({ board, shape, levels, onApplied, onError }: { board: Board; shape: string; levels: { key: string; label: string; planned?: boolean }[]; onApplied: (r: MappingResult) => void; onError: (m: string) => void }) {
  const tableLike = shape === "table" || (shape === "mixed" && board.rows.length >= board.nodes.length);
  const [m, setM] = useState<BoardMapping>({
    from: tableLike ? "rows" : "nodes",
    level: levels.find((l) => l.planned)?.key ?? levels[0]!.key,
    ...(tableLike ? { titleColumn: board.columns[0]?.id, team: board.groups.length ? { by: "group" as const } : undefined } : { team: board.frames.length ? { by: "frame" as const } : undefined, edgesAsDependencies: board.edges.length > 0 }),
    createMissingTeams: false,
  });
  const [preview, setPreview] = useState<(MappingResult & { replaced: number }) | null>(null);
  const [busy, setBusy] = useState(false);
  const cols = board.columns.filter((c) => !c.id.endsWith(":raw"));
  const colors = [...new Set(board.nodes.map((n) => n.color).filter(Boolean))] as string[];
  const set = (patch: Partial<BoardMapping>) => {
    setM({ ...m, ...patch });
    setPreview(null);
  };
  const call = async (dry: boolean) => {
    setBusy(true);
    try {
      const r = await api<MappingResult & { replaced: number }>("POST", `/v1/boards/${encodeURIComponent(board.id)}/map?dry_run=${dry}`, m);
      if (dry) setPreview(r);
      else onApplied(r);
    } catch (e) {
      onError((e as ApiFailure).message);
    } finally {
      setBusy(false);
    }
  };
  const colSelect = (id: string, label: string, value: string | undefined, onChange: (v: string | undefined) => void) => (
    <label className="field">
      {label}
      <select id={id} className="select" value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)}>
        <option value="">—</option>
        {cols.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="stack">
      <section className="panel panel-body stack">
        <p className="muted">Nothing changes until you press Apply. Preview first: it shows exactly which items, risks and dependencies would be created, and what would be skipped.</p>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <label className="field">
            Read
            <select id="map-from" className="select" value={m.from} onChange={(e) => set({ from: e.target.value as "nodes" | "rows" })}>
              <option value="nodes">cards on the canvas ({board.nodes.length})</option>
              <option value="rows">rows of the table ({board.rows.length})</option>
            </select>
          </label>
          <label className="field">
            Create as
            <select id="map-level" className="select" value={m.level} onChange={(e) => set({ level: e.target.value })}>
              {levels.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Team from
            <select
              id="map-team"
              className="select"
              value={m.team ? (m.team.by === "column" ? `column:${m.team.column}` : m.team.by) : ""}
              onChange={(e) => {
                const v = e.target.value;
                set({ team: !v ? undefined : v.startsWith("column:") ? { by: "column", column: v.slice(7) } : { by: v as "frame" | "group" } });
              }}
            >
              <option value="">nowhere</option>
              {m.from === "nodes" ? <option value="frame">the frame the card is in</option> : <option value="group">the group the row is in</option>}
              {m.from === "rows" ? cols.map((c) => <option key={c.id} value={`column:${c.id}`}>column “{c.title}”</option>) : null}
            </select>
          </label>
          <label className="field">
            Iteration from
            <select
              id="map-iter"
              className="select"
              value={m.iteration ? (m.iteration.by === "column" ? `column:${m.iteration.column}` : m.iteration.by) : ""}
              onChange={(e) => {
                const v = e.target.value;
                set({ iteration: !v ? undefined : v.startsWith("column:") ? { by: "column", column: v.slice(7) } : { by: v as "frame" | "group" } });
              }}
            >
              <option value="">nowhere</option>
              {m.from === "nodes" ? <option value="frame">the frame the card is in</option> : <option value="group">the group the row is in</option>}
              {m.from === "rows" ? cols.map((c) => <option key={c.id} value={`column:${c.id}`}>column “{c.title}”</option>) : null}
            </select>
          </label>
          <label className="row" style={{ gap: 6, marginBottom: 8 }}>
            <input id="map-create-teams" type="checkbox" checked={!!m.createMissingTeams} onChange={(e) => set({ createMissingTeams: e.target.checked })} /> create missing teams
          </label>
        </div>
        {m.from === "rows" ? (
          <div className="row" style={{ alignItems: "flex-end" }}>
            {colSelect("map-title", "Title column", m.titleColumn, (v) => set({ titleColumn: v }))}
            {colSelect("map-est", "Estimate column", m.estimateColumn, (v) => set({ estimateColumn: v }))}
            {colSelect("map-bv", "Business value column", m.businessValueColumn, (v) => set({ businessValueColumn: v }))}
            {colSelect("map-status", "Status column", m.statusColumn, (v) => set({ statusColumn: v }))}
          </div>
        ) : (
          <div className="stack" style={{ gap: 6 }}>
            <span className="eyebrow">Card colours</span>
            <div className="row">
              {colors.map((c) => {
                const rule = m.colorRules?.find((r) => r.color === c);
                return (
                  <label key={c} className="row" style={{ gap: 6, border: "1px solid var(--line)", borderRadius: 6, padding: "4px 8px" }}>
                    <span className="dot" style={{ background: cssColor(c), width: 14, height: 14, border: "1px solid rgba(0,0,0,0.15)" }} />
                    <span className="mono" style={{ fontSize: "0.75rem" }}>{c}</span>
                    <select
                      id={`map-color-${c}`}
                      className="select"
                      value={rule?.as ?? "feature"}
                      onChange={(e) => set({ colorRules: [...(m.colorRules ?? []).filter((r) => r.color !== c), ...(e.target.value === "feature" ? [] : [{ color: c, as: e.target.value as "risk" | "enabler" | "defect" | "debt" }])] })}
                    >
                      <option value="feature">feature</option>
                      <option value="enabler">enabler</option>
                      <option value="defect">defect</option>
                      <option value="debt">debt</option>
                      <option value="risk">risk</option>
                    </select>
                  </label>
                );
              })}
              {colors.length === 0 ? <span className="faint">No colours on this board.</span> : null}
            </div>
            <label className="row" style={{ gap: 6 }}>
              <input id="map-edges" type="checkbox" checked={!!m.edgesAsDependencies} onChange={(e) => set({ edgesAsDependencies: e.target.checked })} /> connectors become dependencies (arrow from provider to consumer)
            </label>
          </div>
        )}
        <div className="row">
          <button className="btn" onClick={() => call(true)} disabled={busy}>
            Preview
          </button>
          <button className="btn primary" onClick={() => call(false)} disabled={busy || !preview}>
            Apply to the plan
          </button>
        </div>
      </section>

      {preview ? (
        <section className="panel">
          <div className="panel-head">
            <h2>Preview</h2>
            <span className="faint">
              {preview.items.length} items · {preview.risks.length} risks · {preview.dependencies.length} dependencies · {preview.newTeams.length} new teams · {preview.skipped.length} skipped
              {preview.replaced ? ` · ${preview.replaced} would replace earlier imports of the same card` : ""}
            </span>
          </div>
          <div className="panel-body stack">
            {preview.warnings.length ? (
              <div className="notice warn">
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {preview.warnings.map((w, n) => (
                    <li key={n}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Team</th>
                  <th>Iteration</th>
                  <th>Estimate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.items.slice(0, 200).map((i) => (
                  <tr key={i.id}>
                    <td>{i.title}</td>
                    <td className="muted">{i.flowType}</td>
                    <td className="mono faint">{i.teamId ?? "–"}</td>
                    <td className="mono faint">{i.iterationId ?? "–"}</td>
                    <td className="mono">{i.estimate ?? "–"}</td>
                    <td className="muted">{i.status.replace("_", " ")}</td>
                  </tr>
                ))}
                {preview.risks.map((r) => (
                  <tr key={r.id}>
                    <td>{r.title}</td>
                    <td className="muted">risk</td>
                    <td colSpan={4} />
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.skipped.length ? (
              <p className="faint" style={{ fontSize: "0.8rem" }}>
                Skipped: {preview.skipped.map((x) => `${x.id} (${x.reason})`).join(", ")}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
