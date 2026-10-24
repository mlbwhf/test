"use client";

// The full breakdown of a value stream identification, all five levels at once:
//   1 operational steps → 2 solutions → 3 people → 4 development value streams → 5 ARTs.
// A Sankey carries people from left to right (band width = people), so you see where the
// effort behind each step sits and which trains it lands in; click any box to trace its path
// in both directions. Under it: coverage per level and a step × train matrix that shows which
// steps one train owns and which need several to coordinate.

import { useMemo, useState } from "react";
import { breakdownTrace, identificationBreakdown, type BreakdownLevel, type BreakdownNode, type ValueStreamIdentification } from "@trainyard/core";

const LEVELS: { key: BreakdownLevel; label: string; color: string }[] = [
  { key: "step", label: "1 · Operational steps", color: "#9cbf3c" },
  { key: "system", label: "2 · Solutions", color: "#2c6670" },
  { key: "group", label: "3 · People", color: "#5b86c4" },
  { key: "dvs", label: "4 · Development value streams", color: "#d99400" },
  { key: "art", label: "5 · ARTs", color: "#8a4fbf" },
];

const W = 1200;
const NODE_W = 14;
const GAP = 10;
const TOP = 34;
const MIN_H = 22;

export function VsBreakdown({ vsi, onPickStep }: { vsi: ValueStreamIdentification; onPickStep?: (stepId: string) => void }) {
  const b = useMemo(() => identificationBreakdown(vsi), [vsi]);
  const [sel, setSel] = useState<string | null>(null);

  const layout = useMemo(() => {
    const cols = LEVELS.map((l) => b.nodes.filter((n) => n.level === l.key));
    const tallest = Math.max(...cols.map((c) => c.length));
    const maxPeople = Math.max(1, ...cols.map((c) => c.reduce((n, x) => n + x.people, 0)));
    const scale = Math.max(0.15, (520 - tallest * GAP) / maxPeople);
    const colX = (i: number) => 10 + i * ((W - 230) / (LEVELS.length - 1));
    const pos = new Map<string, { x: number; y: number; h: number; node: BreakdownNode }>();
    cols.forEach((col, i) => {
      let y = TOP;
      for (const n of col) {
        const h = Math.max(MIN_H, n.people * scale);
        pos.set(n.id, { x: colX(i), y, h, node: n });
        y += h + GAP;
      }
    });
    // Ribbons stack inside each box in the order of their partner, so they do not cross needlessly.
    const outOff = new Map<string, number>();
    const inOff = new Map<string, number>();
    const sorted = [...b.links].sort((p, q) => (pos.get(p.to)?.y ?? 0) - (pos.get(q.to)?.y ?? 0));
    const ribbons = sorted.map((l) => {
      const a = pos.get(l.from)!;
      const c = pos.get(l.to)!;
      const t = Math.max(1.5, l.people * scale);
      const y1 = a.y + (outOff.get(l.from) ?? 0);
      const y2 = c.y + (inOff.get(l.to) ?? 0);
      outOff.set(l.from, (outOff.get(l.from) ?? 0) + t);
      inOff.set(l.to, (inOff.get(l.to) ?? 0) + t);
      const x1 = a.x + NODE_W;
      const x2 = c.x;
      const mx = (x1 + x2) / 2;
      const d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2} L${x2},${y2 + t} C${mx},${y2 + t} ${mx},${y1 + t} ${x1},${y1 + t} Z`;
      return { ...l, d, color: LEVELS.find((x) => x.key === a.node.level)!.color };
    });
    const H = Math.max(360, ...[...pos.values()].map((p) => p.y + p.h)) + 16;
    return { pos, ribbons, H, colX };
  }, [b]);

  // Everything the selected box touches, traced through the solutions themselves.
  const lit = useMemo(() => (sel ? breakdownTrace(vsi, sel) : null), [sel, vsi]);

  const selNode = sel ? b.nodes.find((n) => n.id === sel) : null;
  const arts = vsi.arts;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <section className="panel panel-body stack" aria-label="Full breakdown">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="muted" style={{ maxWidth: 780 }}>
            People flow left to right: each band is the people behind a link, so a thick band is where the effort sits. A group that builds several solutions is shared evenly between them. Click any box to trace it through all five levels.
          </span>
          <span className="chip">{b.totalPeople} people</span>
        </div>
        <div className="scroll-x">
          <svg viewBox={`0 0 ${W} ${layout.H}`} width="100%" style={{ minWidth: 900, display: "block" }} role="img" aria-label={`Breakdown of ${vsi.name}: ${LEVELS.map((l) => `${b.nodes.filter((n) => n.level === l.key).length} ${l.label.slice(4).toLowerCase()}`).join(", ")}`}>
            {LEVELS.map((l, i) => (
              <text key={l.key} x={layout.colX(i)} y={16} fontSize="12" fontWeight="700" fill="currentColor" opacity={0.75}>
                {l.label}
              </text>
            ))}
            {layout.ribbons.map((r, i) => (
              <path key={i} d={r.d} fill={r.color} opacity={lit ? (lit.has(r.from) && lit.has(r.to) ? 0.55 : 0.06) : 0.28} style={{ transition: "opacity .25s", pointerEvents: "none" }}>
                <title>{`${b.nodes.find((n) => n.id === r.from)?.label} → ${b.nodes.find((n) => n.id === r.to)?.label}: ${r.people} people`}</title>
              </path>
            ))}
            {[...layout.pos.values()].map(({ x, y, h, node }) => {
              const lv = LEVELS.findIndex((l) => l.key === node.level);
              const color = LEVELS[lv]!.color;
              const dim = lit && !lit.has(node.id);
              return (
                <g key={node.id} style={{ cursor: "pointer", opacity: dim ? 0.25 : 1, transition: "opacity .25s" }} onClick={() => setSel(sel === node.id ? null : node.id)} role="button" tabIndex={0} aria-label={`${node.label}, ${node.people} people`} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel(sel === node.id ? null : node.id)}>
                  <rect x={x} y={y} width={NODE_W} height={h} rx={3} fill={node.people ? color : "none"} stroke={color} strokeWidth={node.people ? 0 : 1.5} strokeDasharray={node.people ? undefined : "3 3"} />
                  <text x={x + NODE_W + 6} y={y + Math.min(h / 2, 14) + 4} fontSize="12" fontWeight={sel === node.id ? 800 : 600} fill="currentColor">
                    {trim(node.label, 30)}
                    <tspan fontWeight="400" opacity={0.65}>
                      {` · ${node.people}`}
                    </tspan>
                  </text>
                  {node.sub && h > 30 ? (
                    <text x={x + NODE_W + 6} y={y + 30} fontSize="10.5" fill="currentColor" opacity={0.6}>
                      {trim(node.sub, 34)}
                    </text>
                  ) : null}
                  <title>{`${node.label}${node.sub ? ` (${node.sub})` : ""}: ${node.people} people`}</title>
                </g>
              );
            })}
          </svg>
        </div>
        {selNode ? (
          <div className="notice" role="status">
            <b>{selNode.label}</b> · {selNode.people} people.{" "}
            {LEVELS.filter((l) => l.key !== selNode.level)
              .map((l) => {
                const names = b.nodes.filter((n) => n.level === l.key && lit?.has(n.id)).map((n) => n.label);
                return names.length ? `${l.label.slice(4)}: ${names.join(", ")}` : null;
              })
              .filter(Boolean)
              .join(" · ")}
            {selNode.level === "step" && onPickStep ? (
              <>
                {" "}
                <button className="btn small" onClick={() => onPickStep(selNode.id.slice(5))}>
                  Open this step in the layers
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="vsb-coverage" aria-label="Coverage per level">
        {b.coverage.map((c, i) => {
          const ok = c.total > 0 && c.covered === c.total;
          return (
            <div key={c.level} className={`card vsb-cov ${ok ? "ok" : c.total ? "warn" : ""}`} style={{ borderTopColor: LEVELS[i]!.color }}>
              <span className="eyebrow">{LEVELS[i]!.label}</span>
              <b>
                {c.covered} / {c.total}
              </b>
              <span className="faint">{c.level === "group" ? `people who ${c.rule}` : c.rule}</span>
              {c.gaps.length ? <span className="vsb-gaps">Gaps: {c.gaps.slice(0, 4).join(", ")}{c.gaps.length > 4 ? ` +${c.gaps.length - 4}` : ""}</span> : c.total ? <span className="vsb-gaps ok">Complete</span> : <span className="vsb-gaps">Nothing here yet</span>}
            </div>
          );
        })}
      </section>

      <section className="panel panel-body stack" aria-label="Steps by train">
        <h3>Which trains each step depends on</h3>
        <p className="faint" style={{ margin: 0 }}>
          A step backed by one train can change on its own. A step that needs several trains is where they plan together, or where the trains should be re-cut. A step with none is not yet owned.
        </p>
        {arts.length ? (
          <div className="scroll-x">
            <table className="table">
              <thead>
                <tr>
                  <th>Operational step</th>
                  {arts.map((a) => (
                    <th key={a.id}>{a.name}</th>
                  ))}
                  <th>Reading</th>
                </tr>
              </thead>
              <tbody>
                {b.matrix.map((r) => {
                  const n = r.cells.filter((c) => c.systems.length).length;
                  return (
                    <tr key={r.stepId}>
                      <td>
                        <b>{r.step}</b>
                      </td>
                      {r.cells.map((c) => (
                        <td key={c.artId} className={c.systems.length ? "vsb-hit" : ""}>
                          {c.systems.join(", ")}
                        </td>
                      ))}
                      <td>
                        <span className={`chip ${n === 1 ? "ok" : n > 1 ? "warn" : "crit"}`}>{n === 1 ? "one train" : n > 1 ? `${n} trains coordinate` : "no train"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="faint">No trains yet: design them in step 5, and this matrix shows which steps each one owns.</p>
        )}
      </section>
    </div>
  );
}

const trim = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
