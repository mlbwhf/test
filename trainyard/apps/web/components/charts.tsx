"use client";

import type { MetricPoint, MetricResult, WidgetOutput } from "@trainyard/core";

export function formatValue(v: number | null, unit: MetricResult["unit"]): string {
  if (v === null) return "–";
  switch (unit) {
    case "percent":
      return `${v}%`;
    case "days":
      return `${v} d`;
    case "currency":
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
    default:
      return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }
}

const SERIES = ["var(--chart)", "var(--signal)", "var(--ai)", "var(--ado)", "var(--crit)", "var(--ok)", "var(--ink-3)"];
const SEMANTIC: Record<string, string> = {
  "On track": "var(--ok)",
  Warning: "var(--warn)",
  Critical: "var(--crit)",
  unroamed: "var(--crit)",
  owned: "var(--warn)",
  accepted: "var(--ink-3)",
  mitigated: "var(--chart)",
  resolved: "var(--ok)",
  high: "var(--crit)",
  limited: "var(--warn)",
  minimal: "var(--ok)",
  prohibited: "var(--ink)",
  Met: "var(--ok)",
  Missed: "var(--crit)",
};
const colorFor = (label: string, i: number) => SEMANTIC[label] ?? SERIES[i % SERIES.length]!;

/** Vertical columns: good for a short time series such as iterations. */
export function Columns({ points, unit }: { points: MetricPoint[]; unit: MetricResult["unit"] }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const w = 320;
  const h = 150;
  const pad = { top: 16, bottom: 28, left: 4, right: 4 };
  const slot = (w - pad.left - pad.right) / Math.max(1, points.length);
  const bw = Math.min(34, slot * 0.62);
  const y = (v: number) => pad.top + (h - pad.top - pad.bottom) * (1 - v / max);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Column chart">
      {[0.5, 1].map((f) => (
        <line key={f} x1={pad.left} x2={w - pad.right} y1={y(max * f)} y2={y(max * f)} stroke="var(--line)" strokeDasharray="2 3" />
      ))}
      <line x1={pad.left} x2={w - pad.right} y1={y(0)} y2={y(0)} stroke="var(--line-strong)" />
      {points.map((p, i) => {
        const x = pad.left + slot * i + (slot - bw) / 2;
        const top = y(p.value);
        return (
          <g key={p.label}>
            <rect x={x} y={top} width={bw} height={Math.max(0, y(0) - top)} rx={2} fill="var(--chart)" />
            <text x={x + bw / 2} y={top - 4} textAnchor="middle" fontSize="9.5" fill="var(--ink-2)" className="mono">
              {formatValue(p.value, unit)}
            </text>
            <text x={x + bw / 2} y={h - 10} textAnchor="middle" fontSize="9" fill="var(--ink-3)">
              {p.label.replace(/^PI \d+\.\d+\./, "")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Horizontal bars: good for named categories with long labels. */
export function Bars({ points, unit }: { points: MetricPoint[]; unit: MetricResult["unit"] }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className="stack" style={{ gap: 8 }}>
      {points.map((p, i) => (
        <div key={p.label} style={{ display: "grid", gridTemplateColumns: "minmax(0, 9rem) minmax(0, 1fr) 4.5rem", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.label}>
            {p.label}
          </span>
          <span style={{ background: "var(--sunken)", borderRadius: 3, height: 12, overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", width: `${(p.value / max) * 100}%`, background: colorFor(p.label, SEMANTIC[p.label] ? i : 0), borderRadius: 3 }} />
          </span>
          <span className="mono" style={{ fontSize: "0.8rem", textAlign: "right" }}>
            {formatValue(p.value, unit)}
          </span>
        </div>
      ))}
      {points.length === 0 ? <p className="faint">No data yet.</p> : null}
    </div>
  );
}

export function Donut({ points, unit }: { points: MetricPoint[]; unit: MetricResult["unit"] }) {
  const total = points.reduce((s, p) => s + p.value, 0);
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="row" style={{ gap: 18, alignItems: "center", flexWrap: "nowrap" }}>
      <svg viewBox="0 0 110 110" width="110" height="110" role="img" aria-label="Donut chart" style={{ flex: "none" }}>
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--sunken)" strokeWidth="14" />
        {total > 0
          ? points.map((p, i) => {
              const len = (p.value / total) * c;
              const el = <circle key={p.label} cx="55" cy="55" r={r} fill="none" stroke={colorFor(p.label, i)} strokeWidth="14" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} transform="rotate(-90 55 55)" />;
              offset += len;
              return el;
            })
          : null}
      </svg>
      <div className="stack" style={{ gap: 4, minWidth: 0 }}>
        {points.map((p, i) => (
          <span key={p.label} className="row" style={{ gap: 6, fontSize: "0.8rem", flexWrap: "nowrap" }}>
            <span className="dot" style={{ background: colorFor(p.label, i) }} />
            <span style={{ textTransform: "capitalize" }}>{p.label}</span>
            <span className="mono faint">{formatValue(p.value, unit)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function WidgetCard({ output, onRemove }: { output: WidgetOutput; onRemove?: () => void }) {
  const { widget } = output;
  const kpi = widget.viz === "kpi";
  return (
    <section className="panel" style={{ gridColumn: kpi ? "span 1" : "span 2", display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div className="panel-head" style={{ borderBottom: kpi ? 0 : undefined, paddingBottom: kpi ? 0 : undefined }}>
        <span className="eyebrow">{widget.title}</span>
        {onRemove ? (
          <button className="btn ghost small" onClick={onRemove} aria-label={`Remove ${widget.title}`}>
            Remove
          </button>
        ) : null}
      </div>
      <div className="panel-body" style={{ flex: 1 }}>
        {"error" in output ? (
          <p className="faint">{output.error}</p>
        ) : kpi ? (
          <div className="stack" style={{ gap: 4 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700 }} className="mono">
              {formatValue(output.result.value, output.result.unit)}
            </span>
            {output.result.note ? <span className="faint" style={{ fontSize: "0.78rem" }}>{output.result.note}</span> : null}
          </div>
        ) : (
          <div className="stack">
            {widget.viz === "donut" ? (
              <Donut points={output.result.points} unit={output.result.unit} />
            ) : widget.viz === "line" || (widget.viz === "bar" && widget.groupBy === "iteration") ? (
              <Columns points={output.result.points} unit={output.result.unit} />
            ) : widget.viz === "table" ? (
              <table className="table">
                <tbody>
                  {output.result.points.map((p) => (
                    <tr key={p.label}>
                      <td>{p.label}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{formatValue(p.value, output.result.unit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Bars points={output.result.points} unit={output.result.unit} />
            )}
            {output.result.note && widget.viz !== "kpi" ? <span className="faint" style={{ fontSize: "0.78rem" }}>{output.result.note}</span> : null}
          </div>
        )}
      </div>
    </section>
  );
}
