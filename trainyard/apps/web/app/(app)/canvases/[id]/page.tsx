"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import {
  launchReadiness,
  towsSuggestions,
  wsjfOf,
  type Canvas,
  type CanvasTypeDef,
  type CheckItem,
  type Pair,
  type SectionDef,
  type SectionValue,
  type TableRow,
  type Timeline,
} from "@trainyard/core";
import { ErrorList, Loading } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

type Doc = Canvas & { derived?: { chevrons: Record<string, string[]> } };
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
const TONE: Record<string, { bg: string; fg: string }> = {
  dark: { bg: "#0b3d4c", fg: "#ffffff" },
  teal: { bg: "#3d7a80", fg: "#ffffff" },
  green: { bg: "#9cbf3c", fg: "#17212b" },
  light: { bg: "rgba(195,206,212,0.6)", fg: "#17212b" },
};

export default function CanvasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const res = useApi<{ canvas: Doc; type: CanvasTypeDef }>(`/v1/canvases/${encodeURIComponent(id)}`);
  const all = useApi<{ canvases: { id: string; type: string; title: string; state?: string }[] }>("/v1/canvases");
  const [doc, setDoc] = useState<Doc | null>(null);
  const [dirty, setDirty] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (res.data && !dirty) setDoc(res.data.canvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res.data]);

  if (!res.data || !doc) return <Loading error={res.error} />;
  const def = res.data.type;
  const set = (key: string, v: SectionValue) => {
    setDoc({ ...doc, fields: { ...doc.fields, [key]: v } });
    setDirty(true);
  };
  const save = async () => {
    setErr(null);
    try {
      const r = await api<{ canvas: Doc }>("PUT", `/v1/canvases/${encodeURIComponent(doc.id)}`, { type: doc.type, title: doc.title, ...(doc.state ? { state: doc.state } : {}), ...(doc.asOf ? { asOf: doc.asOf } : {}), ...(doc.links ? { links: doc.links } : {}), fields: doc.fields });
      setDoc(r.canvas);
      setDirty(false);
      setNote("Saved.");
      setTimeout(() => setNote(null), 2500);
      void all.reload();
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };

  // Group sections so "For Solution Trains" and similar headings sit above their row.
  let lastGroup: string | undefined;
  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <Link href="/canvases" className="faint" style={{ fontSize: "0.85rem" }}>
          ← Canvases
        </Link>
        <span className="faint" style={{ fontSize: "0.82rem" }}>
          {def.where}
        </span>
      </div>
      <header className="page-head" style={{ background: TONE.dark!.bg, color: "#fff" }}>
        <div className="stack" style={{ gap: 6, flex: "1 1 420px" }}>
          <span className="eyebrow row" style={{ color: "rgba(255,255,255,0.75)", gap: 8, alignItems: "center" }}>
            {def.name}
            {doc.type === "portfolio-canvas" ? (
              <select
                aria-label="Canvas state"
                className="input"
                value={doc.state ?? "current"}
                onChange={(e) => {
                  setDoc({ ...doc, state: e.target.value as "current" | "future" });
                  setDirty(true);
                }}
                style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", padding: "2px 6px", fontSize: "0.8rem", width: "auto" }}
              >
                <option value="current" style={{ color: "#17212b" }}>current state</option>
                <option value="future" style={{ color: "#17212b" }}>future state</option>
              </select>
            ) : null}
            <label className="row" style={{ gap: 4, alignItems: "center", textTransform: "none", letterSpacing: 0 }}>
              <span>{doc.state === "future" ? "target date" : "as of"}</span>
              <input
                type="date"
                aria-label="Canvas date"
                className="input"
                value={doc.asOf ?? ""}
                onChange={(e) => {
                  setDoc({ ...doc, asOf: e.target.value });
                  setDirty(true);
                }}
                style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", padding: "2px 6px", fontSize: "0.8rem", width: "auto", colorScheme: "dark" }}
              />
            </label>
          </span>
          <input
            className="input"
            aria-label="Canvas title"
            value={doc.title}
            onChange={(e) => {
              setDoc({ ...doc, title: e.target.value });
              setDirty(true);
            }}
            style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}
          />
        </div>
        <div className="row">
          {dirty ? (
            <button className="btn primary" onClick={() => void save()} style={{ background: "#d99400", color: "#17212b" }}>
              Save
            </button>
          ) : (
            <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>All changes saved</span>
          )}
          <button
            className="btn ghost"
            style={{ color: "#fff" }}
            onClick={async () => {
              if (!confirm(`Delete "${doc.title}"?`)) return;
              await api("DELETE", `/v1/canvases/${encodeURIComponent(doc.id)}`);
              router.push("/canvases");
            }}
          >
            Delete
          </button>
        </div>
      </header>
      {err ? <ErrorList title="Not saved" items={[{ message: err }]} /> : null}
      {note ? <div className="notice ok" role="status">{note}</div> : null}

      {doc.type === "swot" ? <SwotActions doc={doc} canvases={all.data?.canvases ?? []} onError={setErr} /> : null}
      {doc.type === "tows" ? <TowsActions doc={doc} dirty={dirty} canvases={all.data?.canvases ?? []} onError={setErr} /> : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 10, gridAutoFlow: "row dense" }}>
        {def.sections.flatMap((s) => {
          const out = [];
          if (s.group && s.group !== lastGroup) {
            out.push(
              <div key={`g-${s.group}`} style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 12, color: "#0b3d4c", fontWeight: 600, marginTop: 6 }}>
                <span style={{ flex: 1, borderTop: "2px dashed var(--line-strong)" }} />
                {s.group}
                <span style={{ flex: 1, borderTop: "2px dashed var(--line-strong)" }} />
              </div>,
            );
          }
          lastGroup = s.group;
          out.push(<Section key={s.key} s={s} doc={doc} value={doc.fields[s.key]} onChange={(v) => set(s.key, v)} />);
          return out;
        })}
      </section>
    </>
  );
}

function Section({ s, doc, value, onChange }: { s: SectionDef; doc: Doc; value: SectionValue | undefined; onChange: (v: SectionValue) => void }) {
  const tone = TONE[s.tone ?? "light"]!;
  const sticky = doc.type === "swot" || doc.type === "tows";
  return (
    <article className="panel" style={{ gridColumn: `span ${s.span}`, gridRow: s.rows ? `span ${s.rows}` : undefined, overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
      <div style={{ background: tone.bg, color: tone.fg, padding: "8px 14px", fontWeight: 600, fontSize: "0.95rem", textAlign: "center" }}>{s.title}</div>
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {s.prompt && s.kind !== "statement" ? (
          <span className="faint" style={{ fontSize: "0.78rem", lineHeight: 1.4 }}>
            {s.prompt}
          </span>
        ) : null}
        {s.kind === "statement" ? <Statement s={s} value={(value as Record<string, string>) ?? {}} onChange={onChange} /> : null}
        {s.kind === "text" ? <textarea className="textarea" aria-label={s.title} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} style={{ minHeight: 90, flex: 1 }} /> : null}
        {s.kind === "list" ? <ListEdit title={s.title} items={(value as string[]) ?? []} sticky={sticky} onChange={onChange} /> : null}
        {s.kind === "pairs" ? <Pairs s={s} value={(value as Pair[]) ?? []} onChange={onChange} /> : null}
        {s.kind === "table" ? <Table s={s} rows={(value as TableRow[]) ?? []} onChange={onChange} /> : null}
        {s.kind === "chevrons" ? <Chevrons items={doc.derived?.chevrons[s.key] ?? []} green={s.chevrons !== "development"} /> : null}
        {s.kind === "wsjf" ? <Wsjf s={s} value={(value as Record<string, string>) ?? {}} onChange={onChange} /> : null}
        {s.kind === "timeline" ? <TimelineEdit value={value as Timeline} onChange={onChange} /> : null}
        {s.kind === "checklist" ? <Checklist doc={doc} items={(value as CheckItem[]) ?? []} onChange={onChange} /> : null}
      </div>
    </article>
  );
}

function Statement({ s, value, onChange }: { s: SectionDef; value: Record<string, string>; onChange: (v: SectionValue) => void }) {
  return (
    <div className="stack" style={{ gap: 6 }}>
      {(s.labels ?? []).map((l) => (
        <label key={l} style={{ display: "grid", gridTemplateColumns: "92px minmax(0, 1fr)", gap: 8, alignItems: "start" }}>
          <b style={{ textTransform: "uppercase", fontSize: "0.78rem", paddingTop: 8 }}>{l}</b>
          <textarea className="textarea" rows={1} aria-label={l} value={value[l] ?? ""} onChange={(e) => onChange({ ...value, [l]: e.target.value })} style={{ minHeight: 38 }} />
        </label>
      ))}
    </div>
  );
}

function ListEdit({ title, items, sticky, onChange }: { title: string; items: string[]; sticky: boolean; onChange: (v: SectionValue) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    if (!draft.trim()) return;
    onChange([...items, draft.trim()]);
    setDraft("");
  };
  return (
    <>
      <div style={sticky ? { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 } : { display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={sticky ? { background: "#d9e88d", borderRadius: 6, padding: 8, boxShadow: "0 4px 10px rgba(23,33,43,0.12)", display: "flex", flexDirection: "column", gap: 4, animation: "vs-rise .4s both" } : { display: "flex", gap: 6, alignItems: "flex-start" }}>
            <textarea className="textarea" rows={sticky ? 3 : 1} aria-label={`${title} item ${i + 1}`} value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} style={{ minHeight: sticky ? 64 : 36, flex: 1, background: sticky ? "transparent" : undefined, border: sticky ? 0 : undefined, color: sticky ? "#17212b" : undefined }} />
            <button className="btn small ghost" aria-label={`Remove ${title} item ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))} style={{ alignSelf: sticky ? "flex-end" : "center", color: sticky ? "#17212b" : undefined }}>
              ×
            </button>
          </div>
        ))}
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input className="input" aria-label={`Add to ${title}`} placeholder="Add…" value={draft} onChange={(e) => setDraft(e.target.value)} style={{ flex: 1 }} />
        <button className="btn small" type="submit" disabled={!draft.trim()}>
          Add
        </button>
      </form>
    </>
  );
}

function Pairs({ s, value, onChange }: { s: SectionDef; value: Pair[]; onChange: (v: SectionValue) => void }) {
  const labels = s.labels ?? value.map((p) => p.label);
  const get = (l: string) => value.find((p) => p.label === l)?.text ?? "";
  const put = (l: string, text: string) => onChange(labels.map((x) => ({ label: x, text: x === l ? text : get(x) })));
  const wide = s.span >= 12 && labels.length > 1;
  return (
    <div style={{ display: "grid", gridTemplateColumns: wide ? `repeat(${Math.min(labels.length, 3)}, minmax(0, 1fr))` : "1fr", gap: 8 }}>
      {labels.map((l) => (
        <label key={l} className="field">
          <span style={{ fontWeight: 600 }}>{l}</span>
          <textarea className="textarea" rows={2} value={get(l)} onChange={(e) => put(l, e.target.value)} style={{ minHeight: 44 }} />
        </label>
      ))}
    </div>
  );
}

function Table({ s, rows, onChange }: { s: SectionDef; rows: TableRow[]; onChange: (v: SectionValue) => void }) {
  const cols = s.labels ?? [];
  return (
    <div className="scroll-x" tabIndex={0}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: cols.length * 140, fontSize: "0.86rem" }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c} style={{ textAlign: "left", padding: 6, borderBottom: "1px solid var(--line-strong)" }}>
                {c}
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {cols.map((c) => (
                <td key={c} style={{ padding: 4, verticalAlign: "top" }}>
                  <textarea className="textarea" rows={2} aria-label={c} value={r.cells[c] ?? ""} onChange={(e) => onChange(rows.map((x) => (x.id === r.id ? { ...x, cells: { ...x.cells, [c]: e.target.value } } : x)))} style={{ minHeight: 44 }} />
                </td>
              ))}
              <td>
                <button className="btn small ghost" aria-label="Remove row" onClick={() => onChange(rows.filter((x) => x.id !== r.id))}>
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn small" onClick={() => onChange([...rows, { id: uid("row"), cells: {} }])} style={{ marginTop: 8 }}>
        Add a value stream
      </button>
    </div>
  );
}

function Chevrons({ items, green }: { items: string[]; green: boolean }) {
  if (!items.length) return <span className="faint">Link this canvas to a value stream identification to draw its steps.</span>;
  return (
    <div style={{ display: "flex", gap: 4, overflowX: "auto", padding: "4px 0" }}>
      {items.map((t, i) => (
        <span key={i} className="vs-chev" style={{ minHeight: 64, minWidth: 130, flex: "1 0 130px", background: green ? "#cfe39a" : "#d5e3e6", cursor: "default", animation: `vs-rise .45s ${i * 70}ms both` }}>
          {t}
        </span>
      ))}
    </div>
  );
}

function Wsjf({ s, value, onChange }: { s: SectionDef; value: Record<string, string>; onChange: (v: SectionValue) => void }) {
  const w = wsjfOf(value);
  const circle = (content: React.ReactNode, label: string, accent = false) => (
    <div className="stack" style={{ alignItems: "center", gap: 4 }}>
      <span style={{ width: 70, height: 70, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${accent ? "#d99400" : "#3d7a80"}`, background: accent ? "rgba(217,148,0,0.14)" : "rgba(61,122,128,0.1)", fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, transition: "background .3s" }}>{content}</span>
      <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{label}</span>
    </div>
  );
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" style={{ justifyContent: "space-around" }}>
        {circle(w.cod || "–", "Cost of delay")}
        <span style={{ fontSize: "1.6rem" }} aria-hidden="true">÷</span>
        {circle(w.size || "–", "Size")}
        <span style={{ fontSize: "1.6rem" }} aria-hidden="true">=</span>
        {circle(w.wsjf ?? "–", "WSJF", true)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        {(s.labels ?? []).map((l) => (
          <label key={l} className="field" style={{ fontSize: "0.78rem" }}>
            {l}
            <input className="input mono" inputMode="numeric" value={value[l] ?? ""} onChange={(e) => onChange({ ...value, [l]: e.target.value.replace(/[^0-9.]/g, "") })} placeholder="1, 2, 3, 5, 8, 13, 20" />
          </label>
        ))}
      </div>
    </div>
  );
}

function TimelineEdit({ value, onChange }: { value: Timeline; onChange: (v: SectionValue) => void }) {
  const t = value;
  const [add, setAdd] = useState<{ lane: string; week: number; label: string; kind: "bar" | "milestone" }>({ lane: t.lanes[0]?.id ?? "", week: 1, label: "", kind: "bar" });
  const weeks = Array.from({ length: t.weeks + 1 }, (_, i) => i);
  const dateOf = (w: number) => new Date(new Date(`${t.start}T00:00:00Z`).getTime() + w * 7 * 86_400_000).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const cols = `200px repeat(${weeks.length}, minmax(64px, 1fr))`;
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="row">
        <label className="field">
          First week
          <input className="input" type="date" value={t.start} onChange={(e) => onChange({ ...t, start: e.target.value })} />
        </label>
        <label className="field">
          Weeks
          <input className="input" type="number" min={2} max={52} value={t.weeks} onChange={(e) => onChange({ ...t, weeks: Math.max(2, Math.min(52, Number(e.target.value) || 2)) })} style={{ width: 90 }} />
        </label>
        <label className="field">
          Date-certain week
          <input className="input" type="number" min={0} max={t.weeks} value={t.dateCertainWeek} onChange={(e) => onChange({ ...t, dateCertainWeek: Math.max(0, Math.min(t.weeks, Number(e.target.value) || 0)) })} style={{ width: 90 }} />
        </label>
        <label className="field">
          Event
          <input className="input" value={t.dateCertainLabel} onChange={(e) => onChange({ ...t, dateCertainLabel: e.target.value })} />
        </label>
      </div>
      <div className="scroll-x" tabIndex={0}>
        <div style={{ minWidth: 200 + weeks.length * 70 }}>
          {t.lanes.map((lane) => (
            <div key={lane.id} style={{ display: "grid", gridTemplateColumns: cols, alignItems: "end", minHeight: 74, borderBottom: "3px solid #3d7a80", position: "relative" }}>
              <textarea className="input" aria-label="Lane name" rows={3} value={lane.name} onChange={(e) => onChange({ ...t, lanes: t.lanes.map((l) => (l.id === lane.id ? { ...l, name: e.target.value } : l)) })} style={{ alignSelf: "center", fontWeight: 600, border: 0, background: "transparent", resize: "none", lineHeight: 1.3, padding: "4px 8px", overflow: "hidden" }} />
              {weeks.map((w) => {
                const items = lane.items.filter((i) => i.week === w);
                const certain = w === t.dateCertainWeek;
                return (
                  <div key={w} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 2, height: "100%", borderLeft: certain ? "3px solid #0b3d4c" : undefined }}>
                    {items.map((i) => (
                      <button
                        key={i.id}
                        title={`${i.label} (click to remove)`}
                        onClick={() => onChange({ ...t, lanes: t.lanes.map((l) => (l.id === lane.id ? { ...l, items: l.items.filter((x) => x.id !== i.id) } : l)) })}
                        style={
                          i.kind === "bar"
                            ? { font: "inherit", fontSize: "0.68rem", lineHeight: 1.15, width: "80%", minHeight: 40, background: "#3d7a80", color: "#fff", border: 0, borderRadius: "4px 4px 0 0", padding: 3, cursor: "pointer", animation: "vs-rise .45s both" }
                            : { font: "inherit", fontSize: "0.68rem", lineHeight: 1.15, background: "transparent", border: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: "var(--ink)" }
                        }
                      >
                        {i.kind === "milestone" ? <span aria-hidden="true" style={{ width: 16, height: 16, background: "#0b3d4c", transform: "rotate(45deg)", marginBottom: 4 }} /> : null}
                        {i.label}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: cols, marginTop: 8 }}>
            <span />
            {weeks.map((w) => (
              <span key={w} className="stack" style={{ alignItems: "center", gap: 4, fontSize: "0.74rem" }}>
                <span aria-hidden="true" style={{ width: 14, height: 14, background: w === t.dateCertainWeek ? "#0b3d4c" : "#c3cbd3", transform: "rotate(45deg)" }} />
                {w === t.dateCertainWeek ? <b>{t.dateCertainLabel}</b> : null}
                {dateOf(w)}
              </span>
            ))}
          </div>
        </div>
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!add.label.trim() || !add.lane) return;
          onChange({ ...t, lanes: t.lanes.map((l) => (l.id === add.lane ? { ...l, items: [...l.items, { id: uid("it"), week: add.week, label: add.label.trim(), kind: add.kind }] } : l)) });
          setAdd({ ...add, label: "" });
        }}
      >
        <select className="select" aria-label="Lane" value={add.lane} onChange={(e) => setAdd({ ...add, lane: e.target.value })}>
          {t.lanes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select className="select" aria-label="Week" value={add.week} onChange={(e) => setAdd({ ...add, week: Number(e.target.value) })}>
          {weeks.map((w) => (
            <option key={w} value={w}>
              {dateOf(w)}
            </option>
          ))}
        </select>
        <select className="select" aria-label="Kind" value={add.kind} onChange={(e) => setAdd({ ...add, kind: e.target.value as "bar" | "milestone" })}>
          <option value="bar">Workshop or activity</option>
          <option value="milestone">Milestone</option>
        </select>
        <input className="input" aria-label="Label" placeholder="e.g. Backlog workshop" value={add.label} onChange={(e) => setAdd({ ...add, label: e.target.value })} style={{ flex: 1 }} />
        <button className="btn small" type="submit" disabled={!add.label.trim()}>
          Add to timeline
        </button>
        <button className="btn small ghost" type="button" onClick={() => onChange({ ...t, lanes: [...t.lanes, { id: uid("lane"), name: "New lane", items: [] }] })}>
          Add a lane
        </button>
      </form>
    </div>
  );
}

function Checklist({ doc, items, onChange }: { doc: Doc; items: CheckItem[]; onChange: (v: SectionValue) => void }) {
  const [draft, setDraft] = useState("");
  const [draftTier, setDraftTier] = useState<"needed" | "desirable">("needed");
  const r = useMemo(() => launchReadiness({ ...doc, fields: { ...doc.fields, readiness: items } }, new Date().toISOString()), [doc, items]);
  const lanes = ((doc.fields.timeline as Timeline | undefined)?.lanes ?? []).map((l) => ({ id: l.id, name: l.name }));
  const C = 2 * Math.PI * 52;
  const color = r.verdict === "ready" ? "#32b58c" : r.verdict === "on-track" ? "#3d7a80" : "#d99400";
  const patch = (id: string, p: Partial<CheckItem>) => onChange(items.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const setLane = (id: string, laneId: string) =>
    onChange(
      items.map((x) => {
        if (x.id !== id) return x;
        const { laneId: _old, ...rest } = x;
        return laneId ? { ...rest, laneId } : rest;
      }),
    );
  // SAFe's two tables: needed items, then desirable ones. Untiered items (older canvases) count as needed.
  const groups: ["needed" | "desirable", string, string, CheckItem[]][] = [
    ["needed", "Needed items", "Without these, PI planning does not happen on the date.", items.filter((i) => i.tier !== "desirable")],
    ["desirable", "Desirable items", "Make the event better; they do not block it.", items.filter((i) => i.tier === "desirable")],
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 240px", gap: 16 }}>
      <div className="stack" style={{ gap: 18 }}>
        {groups.map(([tier, title, hint, list]) =>
          list.length || tier === "needed" ? (
            <div key={tier} className="rc-table">
              <div className="rc-head">
                <span>{title}</span>
                <span className="rc-hint">{hint}</span>
                <span>{list.filter((i) => i.done).length} / {list.length}</span>
              </div>
              <div className="rc-cols">
                <span />
                <span>Item</span>
                <span>Considerations</span>
                <span>Lane</span>
                <span />
              </div>
              {list.map((i) => (
                <div key={i.id} className={`rc-row${i.done ? " done" : ""}`}>
                  <input type="checkbox" aria-label={i.text} checked={i.done} onChange={() => patch(i.id, { done: !i.done })} />
                  <textarea className="rc-item" aria-label="Item" rows={3} value={i.text} onChange={(e) => patch(i.id, { text: e.target.value })} />
                  <textarea className="rc-q" aria-label={`Considerations for ${i.text}`} rows={3} value={i.question ?? ""} placeholder="The question to answer before ticking this…" onChange={(e) => patch(i.id, { question: e.target.value })} />
                  <select className="select" aria-label="Lane" value={i.laneId ?? ""} onChange={(e) => setLane(i.id, e.target.value)}>
                    <option value="">General</option>
                    {lanes.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <div className="stack" style={{ gap: 2 }}>
                    <button className="btn small ghost" title={tier === "needed" ? "Move to desirable" : "Move to needed"} aria-label={`Move ${i.text} to ${tier === "needed" ? "desirable" : "needed"}`} onClick={() => patch(i.id, { tier: tier === "needed" ? "desirable" : "needed" })}>
                      {tier === "needed" ? "↓" : "↑"}
                    </button>
                    <button className="btn small ghost" aria-label={`Remove ${i.text}`} onClick={() => onChange(items.filter((x) => x.id !== i.id))}>
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null,
        )}
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            onChange([...items, { id: uid("chk"), text: draft.trim(), done: false, tier: draftTier }]);
            setDraft("");
          }}
        >
          <input className="input" aria-label="New readiness item" placeholder="Add a readiness item…" value={draft} onChange={(e) => setDraft(e.target.value)} style={{ flex: 1 }} />
          <select className="select" aria-label="Needed or desirable" value={draftTier} onChange={(e) => setDraftTier(e.target.value as "needed" | "desirable")}>
            <option value="needed">Needed</option>
            <option value="desirable">Desirable</option>
          </select>
          <button className="btn small" type="submit" disabled={!draft.trim()}>
            Add
          </button>
        </form>
      </div>
      <div className="stack" style={{ alignItems: "center", gap: 8 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={`${Math.round(r.share * 100)}% of needed items ready`}>
          <circle cx="70" cy="70" r="52" fill="none" stroke="var(--sunken)" strokeWidth="14" />
          <circle cx="70" cy="70" r="52" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - r.share)} transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.7,.2,1), stroke .4s" }} />
          {r.desirable.total ? <circle cx="70" cy="70" r="38" fill="none" stroke="#b9c6ff" strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 38} strokeDashoffset={2 * Math.PI * 38 * (1 - r.desirable.done / r.desirable.total)} transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.7,.2,1)" }} /> : null}
          <text x="70" y="78" textAnchor="middle" fontSize="26" fontWeight="700" fill="currentColor" fontFamily="var(--font-display)">
            {Math.round(r.share * 100)}%
          </text>
        </svg>
        <span className="chip" style={{ background: r.verdict === "at-risk" ? "var(--signal-soft)" : "var(--ok-soft)", textTransform: "none", letterSpacing: 0 }}>
          {r.verdict === "ready" ? "Ready for PI planning" : r.verdict === "on-track" ? "On track" : "At risk for the date"}
        </span>
        <span className="faint" style={{ fontSize: "0.8rem", textAlign: "center" }}>
          Needed {r.needed.done} of {r.needed.total}
          {r.desirable.total ? ` · desirable ${r.desirable.done} of ${r.desirable.total}` : ""}
          {r.weeksLeft !== null ? ` · ${r.weeksLeft >= 0 ? `${r.weeksLeft} weeks to go` : "date passed"}` : ""}
        </span>
        {r.openByLane.slice(0, 3).map((l) => (
          <span key={l.name} style={{ fontSize: "0.78rem" }}>
            {l.open} open · {l.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function SwotActions({ doc, canvases, onError }: { doc: Doc; canvases: { id: string; type: string; title: string }[]; onError: (m: string) => void }) {
  const router = useRouter();
  const sug = towsSuggestions(doc, 6);
  const [pick, setPick] = useState<Set<number>>(new Set());
  const [target, setTarget] = useState<string>("new");
  const towsList = canvases.filter((c) => c.type === "tows");
  if (!sug.length) return <div className="notice">Add strengths, weaknesses, opportunities and threats; TOWS suggestions appear here as soon as both an internal and an external factor exist.</div>;
  const LABEL = { so: "SO", st: "ST", wo: "WO", wt: "WT" } as const;
  return (
    <section className="panel panel-body stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <b>TOWS: strategies from pairing internal and external factors</b>
        <span className="faint" style={{ fontSize: "0.82rem" }}>Pick the ones worth pursuing; rewrite them on the TOWS canvas.</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 6 }}>
        {sug.map((s, i) => (
          <label key={i} className="row" style={{ gap: 8, padding: 8, borderRadius: 10, background: pick.has(i) ? "var(--signal-soft)" : "var(--sunken)", cursor: "pointer", transition: "background .25s" }}>
            <input type="checkbox" checked={pick.has(i)} onChange={() => setPick((p) => { const n = new Set(p); if (n.has(i)) n.delete(i); else n.add(i); return n; })} />
            <span className="chip">{LABEL[s.quadrant]}</span>
            <span style={{ fontSize: "0.86rem", flex: 1 }}>{s.text}</span>
          </label>
        ))}
      </div>
      <div className="row">
        <select className="select" aria-label="TOWS canvas" value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="new">A new TOWS canvas</option>
          {towsList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <button
          className="btn primary"
          disabled={!pick.size}
          onClick={async () => {
            try {
              let id = target;
              if (id === "new") id = (await api<{ canvas: { id: string } }>("POST", "/v1/canvases", { type: "tows", title: `TOWS from ${doc.title}` })).canvas.id;
              const cur = (await api<{ canvas: Canvas }>("GET", `/v1/canvases/${encodeURIComponent(id)}`)).canvas;
              const fields = { ...cur.fields };
              for (const i of pick) {
                const s = sug[i]!;
                fields[s.quadrant] = [...((fields[s.quadrant] as string[]) ?? []), s.text];
              }
              await api("PUT", `/v1/canvases/${encodeURIComponent(id)}`, { type: "tows", title: cur.title, fields });
              router.push(`/canvases/${encodeURIComponent(id)}`);
            } catch (e) {
              onError((e as ApiFailure).message);
            }
          }}
        >
          Add {pick.size || ""} to TOWS
        </button>
      </div>
    </section>
  );
}

function TowsActions({ doc, dirty, canvases, onError }: { doc: Doc; dirty: boolean; canvases: { id: string; type: string; title: string; state?: string }[]; onError: (m: string) => void }) {
  const router = useRouter();
  const current = canvases.filter((c) => c.type === "portfolio-canvas" && c.state !== "future");
  const [pick, setPick] = useState(current[0]?.id ?? "");
  return (
    <section className="panel panel-body row" style={{ justifyContent: "space-between" }}>
      <span>
        <b>Generate the future state.</b> <span className="muted">Copies the current portfolio canvas with these strategies as planned changes, and drafts a portfolio vision from them.</span>
      </span>
      <div className="row">
        <select className="select" aria-label="Current portfolio canvas" value={pick} onChange={(e) => setPick(e.target.value)}>
          {current.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <button
          className="btn primary"
          disabled={!pick || dirty}
          title={dirty ? "Save the TOWS canvas first" : undefined}
          onClick={async () => {
            try {
              const r = await api<{ canvas: { id: string }; vision: { id: string } }>("POST", "/v1/canvases/future-state", { currentId: pick, towsId: doc.id });
              router.push(`/canvases/${encodeURIComponent(r.canvas.id)}`);
            } catch (e) {
              onError((e as ApiFailure).message);
            }
          }}
        >
          Generate future state and vision
        </button>
      </div>
    </section>
  );
}
