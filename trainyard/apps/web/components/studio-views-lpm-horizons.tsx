"use client";

// Guardrail 1, "Guide investments by horizon", drawn like the course slide (LPM 2-18, "Understand
// the portfolio's investment mix by horizon"): the four horizons left to right with their stages,
// the funnel that narrows and widens across them, a pie per horizon for its share of the budget,
// the stop on Horizon 3 and the decommission exits. The share of each horizon is typed under it.

type Hor = { k: string; h: string; st: string; d: string; v: number; set: (e: React.FocusEvent<HTMLInputElement>) => void };

// Columns as on the slide: x from, x to, the stages inside.
const COLS: Record<string, { a: number; b: number; stages: string[] }> = {
  h3: { a: 60, b: 250, stages: ["Evaluating"] },
  h2: { a: 250, b: 470, stages: ["Emerging"] },
  h1: { a: 470, b: 790, stages: ["Investing", "Extracting"] },
  h0: { a: 790, b: 990, stages: ["Retiring"] },
};
const INK = "#14123a", LINE = "#77777f", BLUE = "#2f6fd0", PIE = "#b3c7e6";

function wedge(cx: number, cy: number, r: number, pct: number) {
  const p = Math.max(0, Math.min(100, pct));
  if (p >= 99.999) return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
  const a = (p / 100) * 2 * Math.PI, x = cx - r * Math.sin(a), y = cy - r * Math.cos(a);
  // From twelve o'clock, counter-clockwise, as the slide's pies open to the left.
  return `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${p > 50 ? 1 : 0} 0 ${x.toFixed(1)} ${y.toFixed(1)} Z`;
}

export function LpmHorizons({ hor }: { hor: Hor[] }) {
  const by = Object.fromEntries((hor ?? []).map((h) => [h.k, h]));
  const order = ["h3", "h2", "h1", "h0"].filter((k) => by[k]);
  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "2px solid #14123a", padding: "8px 8px 10px", position: "relative" }}>
      <svg viewBox="0 0 1050 430" style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="The portfolio's investment mix by horizon">
        {order.map((k) => {
          const c = COLS[k]!, h = by[k]!, cx = (c.a + c.b) / 2, r = 26 + Math.sqrt(Math.max(0, h.v)) * 5.2;
          return (
            <g key={k}>
              <text x={cx} y={34} style={{ textAnchor: "middle", font: "800 30px 'Instrument Sans',sans-serif", fill: BLUE }}>{h.h}</text>
              {c.stages.map((s, i) => (
                <text key={s} x={c.a + ((i + 0.5) * (c.b - c.a)) / c.stages.length} y={72} style={{ textAnchor: "middle", font: "700 17px 'Instrument Sans',sans-serif", fill: "#3a3a44" }}>{s}</text>
              ))}
              {c.stages.length > 1 ? <line x1={cx} y1={50} x2={cx} y2={420} style={{ stroke: INK, strokeWidth: 1, strokeDasharray: "5 5", opacity: 0.6 }} /> : null}
              {k !== "h3" ? <line x1={c.a} y1={44} x2={c.a} y2={420} style={{ stroke: INK, strokeWidth: 1.2, strokeDasharray: "5 5" }} /> : null}
              <path d={wedge(cx - 8, 235, r, h.v)} style={{ fill: PIE }} />
              <text x={cx + 26} y={250} style={{ textAnchor: "start", font: "700 30px 'Instrument Sans',sans-serif", fill: "#b9b9c0" }}>%</text>
            </g>
          );
        })}
        {/* The funnel: wide at evaluation, narrow while emerging, widest at the end of extraction, closing as solutions retire. */}
        <polyline points="60,118 250,160 470,160 790,78 990,160" style={{ fill: "none", stroke: LINE, strokeWidth: 6, strokeLinejoin: "round", strokeLinecap: "round" }} />
        <polyline points="60,330 120,312" style={{ fill: "none", stroke: LINE, strokeWidth: 6, strokeLinecap: "round" }} />
        <polyline points="216,298 250,290 372,290" style={{ fill: "none", stroke: LINE, strokeWidth: 6, strokeLinejoin: "round", strokeLinecap: "round" }} />
        <polyline points="436,290 470,290 790,376 990,300" style={{ fill: "none", stroke: LINE, strokeWidth: 6, strokeLinejoin: "round", strokeLinecap: "round" }} />
        {/* Exits: ideas that fail are stopped; solutions that do not prove out, or reach their end, are decommissioned. */}
        <path d="M 148 296 l 40 0 l -20 34 z" style={{ fill: "#b5b5b9" }} />
        <path d="M 154 352 l 10 -10 h 14 l 10 10 v 14 l -10 10 h -14 l -10 -10 z" style={{ fill: "#e3211c", stroke: "#fff", strokeWidth: 2 }} />
        <text x={171} y={364} style={{ textAnchor: "middle", font: "800 10.5px 'Instrument Sans',sans-serif", fill: "#fff" }}>STOP</text>
        <path d="M 384 282 l 40 0 l -20 34 z" style={{ fill: "#b5b5b9" }} />
        <rect x={300} y={326} width={150} height={30} style={{ fill: BLUE }} />
        <text x={375} y={347} style={{ textAnchor: "middle", font: "700 16px 'Instrument Sans',sans-serif", fill: "#fff" }}>Decommission</text>
        <rect x={880} y={222} width={150} height={30} style={{ fill: BLUE }} />
        <text x={955} y={243} style={{ textAnchor: "middle", font: "700 16px 'Instrument Sans',sans-serif", fill: "#fff" }}>Decommission</text>
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: `${order.map((k) => `${COLS[k]!.b - COLS[k]!.a}fr`).join(" ")}`, gap: 6, margin: "2px 5.7% 0 5.7%" }}>
        {order.map((k) => {
          const h = by[k]!;
          return (
            <label key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textAlign: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <input className="num" type="number" min={0} max={100} key={`${k}|${h.v}`} defaultValue={h.v} onBlur={h.set} aria-label={`${h.h} share of the budget, percent`} style={{ width: 52, border: "2px solid #14123a", borderRadius: 8, padding: 4, textAlign: "center", fontWeight: 800 }} />
                <b>%</b>
              </span>
              <span style={{ fontSize: 11, color: "#5b5b6e", lineHeight: 1.25 }}>{h.d}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
