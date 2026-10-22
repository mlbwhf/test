"use client";

import { useEffect, useState } from "react";
import type { Dashboard, GroupBy, MetricDef, Viz, Widget, WidgetOutput } from "@trainyard/core";
import { AssistButton } from "@/components/assist";
import { WidgetCard } from "@/components/charts";
import { Loading, PageHead } from "@/components/ui";
import { api, useApi } from "@/lib/api";

type MetricInfo = Omit<MetricDef, "compute">;

const VIZ: { key: Viz; label: string }[] = [
  { key: "kpi", label: "Number" },
  { key: "bar", label: "Bars" },
  { key: "line", label: "Columns over time" },
  { key: "donut", label: "Donut" },
  { key: "table", label: "Table" },
];
const GROUP_LABEL: Record<GroupBy, string> = { none: "Nothing", team: "Team", flowType: "Work type", iteration: "Iteration" };

export default function DashboardsPage() {
  const list = useApi<{ dashboards: Dashboard[] }>("/v1/dashboards");
  const catalog = useApi<{ metrics: MetricInfo[] }>("/v1/metrics");
  const ws = useApi<{ workspace: { increments: { id: string; name: string }[] }; model: { workLevels: { key: string; label: string }[] } }>("/v1/workspace");
  const [activeId, setActiveId] = useState("art-overview");
  const [outputs, setOutputs] = useState<WidgetOutput[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = list.data?.dashboards.find((d) => d.id === activeId) ?? list.data?.dashboards[0];

  useEffect(() => {
    if (!active) return;
    setOutputs(null);
    api<{ outputs: WidgetOutput[] }>("GET", `/v1/dashboards/${active.id}`).then((r) => setOutputs(r.outputs), (e: Error) => setError(e.message));
  }, [active]);

  // While editing, preview the draft live.
  useEffect(() => {
    if (!editing || !draft) return;
    api<{ outputs: WidgetOutput[] }>("POST", "/v1/metrics/run", { widgets: draft.widgets }).then((r) => setOutputs(r.outputs), (e: Error) => setError(e.message));
  }, [editing, draft]);

  if (!list.data || !catalog.data || !ws.data) return <Loading error={list.error ?? catalog.error ?? ws.error} />;

  const startEdit = () => {
    if (!active) return;
    setDraft(structuredClone(active));
    setEditing(true);
  };
  const save = async () => {
    if (!draft) return;
    try {
      await api("PUT", `/v1/dashboards/${draft.id}`, { name: draft.name, widgets: draft.widgets });
      await list.reload();
      setActiveId(draft.id);
      setEditing(false);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const newDashboard = () => {
    const id = `dash-${Date.now().toString(36)}`;
    setDraft({ id, name: "New dashboard", widgets: [] });
    setEditing(true);
    setOutputs([]);
  };

  return (
    <>
      <PageHead
        title="Dashboards"
        sub="Build your own reports from the metric catalogue: flow, planning and AI metrics, filtered by team, PI or work level."
        actions={
          editing ? (
            <>
              <button className="btn" onClick={() => (setEditing(false), setDraft(null), active && setActiveId(active.id))}>
                Cancel
              </button>
              <button className="btn primary" onClick={save}>
                Save dashboard
              </button>
            </>
          ) : (
            <>
              <button className="btn" onClick={newDashboard}>
                New dashboard
              </button>
              <button className="btn primary" onClick={startEdit}>
                Edit
              </button>
            </>
          )
        }
      />
      {error ? <div className="notice crit">{error}</div> : null}
      {editing && draft ? (
        <div className="panel panel-body stack">
          <label className="field" style={{ maxWidth: 360 }}>
            Dashboard name
            <input id="dash-name" className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <WidgetForm
            metrics={catalog.data.metrics}
            increments={ws.data.workspace.increments}
            levels={ws.data.model.workLevels}
            onAdd={(w) => setDraft({ ...draft, widgets: [...draft.widgets, w] })}
          />
        </div>
      ) : (
        <div className="tabs" role="tablist">
          {list.data.dashboards.map((d) => (
            <button key={d.id} role="tab" aria-selected={d.id === active?.id} onClick={() => setActiveId(d.id)}>
              {d.name}
            </button>
          ))}
        </div>
      )}
      {!editing && active ? (
        <AssistButton<{ headline: string; paragraphs: string[]; watch: string[] }>
          label="Write the narrative"
          path="/v1/assist/narrative"
          body={{ dashboardId: active.id }}
          small
          render={(d) => (
            <>
              <strong>{d.headline}</strong>
              {d.paragraphs.map((t, n) => (
                <p key={n}>{t}</p>
              ))}
              {d.watch.length ? <p className="faint">Watch: {d.watch.join(" · ")}</p> : null}
            </>
          )}
        />
      ) : null}
      {outputs === null ? (
        <Loading error={null} />
      ) : outputs.length === 0 ? (
        <div className="panel panel-body faint">This dashboard has no widgets yet. Add one above.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16 }}>
          {outputs.map((o, i) => (
            <WidgetCard key={`${o.widget.id}-${i}`} output={o} {...(editing && draft ? { onRemove: () => setDraft({ ...draft, widgets: draft.widgets.filter((w) => w.id !== o.widget.id) }) } : {})} />
          ))}
        </div>
      )}
    </>
  );
}

function WidgetForm({
  metrics,
  increments,
  levels,
  onAdd,
}: {
  metrics: MetricInfo[];
  increments: { id: string; name: string }[];
  levels: { key: string; label: string }[];
  onAdd: (w: Widget) => void;
}) {
  const [metric, setMetric] = useState(metrics[0]!.key);
  const def = metrics.find((m) => m.key === metric)!;
  const [viz, setViz] = useState<Viz>("bar");
  const [groupBy, setGroupBy] = useState<GroupBy>(def.groupBys[0]!);
  const [incrementId, setIncrementId] = useState("");
  const [level, setLevel] = useState("");
  const [title, setTitle] = useState("");

  return (
    <div className="stack">
      <span className="eyebrow">Add a widget</span>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <label className="field">
          Metric
          <select
            id="w-metric"
            className="select"
            value={metric}
            onChange={(e) => {
              const next = metrics.find((m) => m.key === e.target.value)!;
              setMetric(next.key);
              setGroupBy(next.groupBys[0]!);
            }}
          >
            {(["flow", "planning", "ai"] as const).map((cat) => (
              <optgroup key={cat} label={cat === "ai" ? "AI" : cat[0]!.toUpperCase() + cat.slice(1)}>
                {metrics.filter((m) => m.category === cat).map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="field">
          Show as
          <select id="w-viz" className="select" value={viz} onChange={(e) => setViz(e.target.value as Viz)}>
            {VIZ.map((v) => (
              <option key={v.key} value={v.key}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Group by
          <select id="w-group" className="select" value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
            {def.groupBys.map((g) => (
              <option key={g} value={g}>
                {GROUP_LABEL[g]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          PI
          <select id="w-inc" className="select" value={incrementId} onChange={(e) => setIncrementId(e.target.value)}>
            <option value="">All</option>
            {increments.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Work level
          <select id="w-level" className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">All</option>
            {levels.map((l) => (
              <option key={l.key} value={l.key}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Title
          <input id="w-title" className="input" placeholder={def.label} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <button
          className="btn primary"
          onClick={() => {
            onAdd({
              id: `w-${Date.now().toString(36)}`,
              title: title.trim() || def.label,
              metric,
              viz,
              groupBy,
              filters: { ...(incrementId ? { incrementId } : {}), ...(level ? { level } : {}) },
            });
            setTitle("");
          }}
        >
          Add widget
        </button>
      </div>
      <p className="faint" style={{ fontSize: "0.8rem" }}>{def.description}</p>
    </div>
  );
}
