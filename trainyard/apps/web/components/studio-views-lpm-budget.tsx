"use client";

// Participatory Budgeting (LPM lesson 4, 4-28) laid out as the handout's workbook. Each table (a
// team) has its own sheet: the number of people and their names across the top, their share of the
// portfolio budget, what each has bid and their balance; then a row per Solution or Epic with its
// value stream, horizon, description and estimated cost, a cell per participant to type what they
// fund, the total and "Full or Partial?". The Consolidated Results sheet lists the same rows with
// what every table funded, and the budget summary (portfolio budget, project costs, need).

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

const INK = "#14123a", HEAD = "#1f3f8f";
const cell: React.CSSProperties = { padding: "5px 8px", borderBottom: "1px solid #fff", verticalAlign: "top", fontSize: 13, lineHeight: 1.3 };
const num: React.CSSProperties = { ...cell, textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" };
const th: React.CSSProperties = { padding: 8, color: "#fff", background: HEAD, font: "700 13px 'Instrument Sans',sans-serif", textAlign: "left" };
// Row and input-cell tints per value stream, as in the handout (yellow, blue, green).
const TINT: Record<string, [string, string]> = { "#2f6fd0": ["#fdf1cf", "#fbe08f"], "#1fb89a": ["#d5e1f7", "#a9c4f0"], "#7b44f5": ["#dcebd6", "#b9d7a8"] };
const tint = (c: string) => TINT[c] ?? ["#f1f0ee", "#e2e0da"];
const top: React.CSSProperties = { ...num, borderBottom: "1px solid #e3e3e3", background: "#fff" };

function BudgetBox({ s }: { s: any }) {
  return (
    <table style={{ borderCollapse: "collapse", maxWidth: 560, border: `2px solid ${INK}`, background: "#fff" }}>
      <thead><tr><th style={th}>Budget</th><th style={{ ...th, textAlign: "right" }}>Amount</th></tr></thead>
      <tbody>
        <tr style={{ background: "#eee" }}><td style={cell}>Portfolio Budget</td><td style={num}>{s.budget}</td></tr>
        <tr style={{ background: "#eee" }}><td style={cell}>Project Costs of Epics and Solution operations</td><td style={num}>{s.totalCost}</td></tr>
        <tr style={{ background: "#eee", fontWeight: 800 }}><td style={cell}>Need</td><td style={num}>{s.need}</td></tr>
      </tbody>
    </table>
  );
}

/** One table's sheet: every participant types what they fund. */
export function LpmBudgetTable({ pb }: { pb: any }) {
  const s = pb?.sheet;
  if (!s) return null;
  const step: React.CSSProperties = { width: 24, height: 24, borderRadius: "50%", border: `2px solid ${INK}`, background: "#fff", fontWeight: 800, cursor: "pointer", lineHeight: 1 };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ overflowX: "auto", border: `2px solid ${INK}`, background: "#fff" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 860 + s.ppl * 104 }}>
          <tbody>
            <tr>
              <td colSpan={3} rowSpan={4} style={{ ...cell, borderBottom: 0, font: "800 30px 'Familjen Grotesk',sans-serif", color: HEAD, verticalAlign: "middle" }}>{s.table}</td>
              <td style={{ ...top, fontStyle: "italic", whiteSpace: "normal" }}>Number of people in group<br />(Replace ‘Person’ with the name of a Person)</td>
              <td style={{ ...top, fontWeight: 800 }}>
                {s.canEdit ? <button onClick={s.removePerson} aria-label="One person fewer" style={step}>−</button> : null} <span style={{ display: "inline-block", minWidth: 22, textAlign: "center" }}>{s.ppl}</span> {s.canEdit ? <button onClick={s.addPerson} aria-label="One person more" style={step}>+</button> : null}
              </td>
              {s.people.map((p: any, i: number) => (
                <td key={i} style={{ ...top, padding: 3 }}>
                  <input key={`n${i}|${p.raw}`} defaultValue={p.raw} placeholder="Person" onBlur={p.setName} disabled={!s.canEdit} aria-label={`Name of participant ${i + 1}`} style={{ boxSizing: "border-box", width: "100%", border: 0, borderBottom: "1px dashed #14123a66", background: "transparent", font: "700 13px 'Instrument Sans',sans-serif", textAlign: "center" }} />
                </td>
              ))}
              <td style={top} colSpan={2} />
            </tr>
            <tr><td style={top}>Portfolio Budget</td><td style={top}>{s.budget}</td>{s.people.map((_: any, i: number) => <td key={i} style={top}>{s.per}</td>)}<td style={top} colSpan={2} /></tr>
            <tr><td style={top}>Bid</td><td style={top}>{s.tableTotal}</td>{s.people.map((p: any, i: number) => <td key={i} style={top}>{p.spent}</td>)}<td style={top} colSpan={2} /></tr>
            <tr><td style={{ ...top, fontWeight: 800 }}>Balance</td><td style={{ ...top, fontWeight: 800, color: s.tableOver ? "#c8372d" : INK }}>{s.tableLeft}</td>{s.people.map((p: any, i: number) => <td key={i} style={{ ...top, fontWeight: 700, color: p.over ? "#c8372d" : INK }}>{p.left}</td>)}<td style={top} colSpan={2} /></tr>
            <tr>
              <th style={{ ...th, width: 96 }}>Value Stream</th>
              <th style={{ ...th, minWidth: 200 }}>Epic</th>
              <th style={{ ...th, width: 62 }}>Horizon</th>
              <th style={{ ...th, minWidth: 260 }}>Epic Description</th>
              <th style={{ ...th, textAlign: "right", width: 104 }}>Est. Cost</th>
              {s.people.map((p: any, i: number) => <th key={i} style={{ ...th, textAlign: "center", width: 104 }}>{p.name}</th>)}
              <th style={{ ...th, textAlign: "right", width: 104 }}>Total</th>
              <th style={{ ...th, width: 96 }}>Full or Partial?</th>
            </tr>
            {s.groups.map((g: any) =>
              g.rows.map((r: any, ri: number) => {
                const [bg, inBg] = tint(g.color);
                return (
                  <tr key={r.id} style={{ background: bg }}>
                    <td style={cell}>{ri === 0 ? g.name : ""}</td>
                    <td style={{ ...cell, color: r.sol ? "#2f6fd0" : INK }}>{r.name}</td>
                    <td style={{ ...cell, textAlign: "center", color: "#2f6fd0" }}>{r.hz}</td>
                    <td style={cell}>{r.desc}</td>
                    <td style={{ ...num, fontWeight: r.sol ? 800 : 500, color: r.sol ? "#2f6fd0" : INK }}>{r.cost}</td>
                    {r.cells.map((c: any, i: number) => (
                      <td key={i} style={{ ...num, padding: 2, background: inBg }}>
                        <input key={`${r.id}:${i}|${c.v}`} defaultValue={c.v} onBlur={c.set} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} disabled={!s.canEdit} inputMode="numeric" aria-label={`${s.people[i].name} funds ${r.name}`} style={{ boxSizing: "border-box", width: "100%", border: "1px solid #14123a33", borderRadius: 3, padding: "4px 6px", textAlign: "right", font: "600 13px 'Instrument Sans',sans-serif", background: "#ffffffcc" }} />
                      </td>
                    ))}
                    <td style={{ ...num, fontWeight: 700 }}>{r.total || "$ -"}</td>
                    <td style={{ ...cell, fontWeight: 800, textAlign: "center", color: r.funded ? "#1f6b3a" : "#a66b00", background: r.funded ? "#cfe8d4" : r.partial ? "#fff4c2" : "#fff" }}>{r.status}</td>
                  </tr>
                );
              }),
            )}
            <tr style={{ fontWeight: 800 }}>
              <td style={cell} colSpan={3} />
              <td style={cell}>Projected cost of Solutions and Epics</td>
              <td style={num}>{s.totalCost}</td>
              {s.people.map((p: any, i: number) => <td key={i} style={num}>{p.spent}</td>)}
              <td style={num}>{s.tableTotal}</td>
              <td style={cell} />
            </tr>
            <tr>
              <td style={{ ...cell, borderBottom: 0 }} colSpan={5 + s.ppl} />
              <td style={{ ...num, borderBottom: 0, fontWeight: 800, color: "#fff", background: "#3f9b4b" }} title="Portfolio budget">{s.budget}</td>
              <td style={{ ...cell, borderBottom: 0 }} />
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 12.5, color: "#5b5b6e" }}>Type an amount in your own column (for example 250000, 250k or 1.5m) and press Enter. Fund Solutions before Epics.</div>
      {pb.hasWarn ? (
        <div style={{ background: "#fff4c2", border: `2px solid ${INK}`, borderRadius: 10, padding: "8px 12px", fontSize: 13.5 }}>
          <b>Check the rules ({pb.nWarn})</b>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{(pb.warn || []).map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>
        </div>
      ) : null}
      {s.canEdit ? <div><button onClick={pb.clearG} style={{ border: `2px solid ${INK}`, background: "#fff", borderRadius: 99, padding: "6px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Clear this table&apos;s amounts</button></div> : null}
    </div>
  );
}

/** The Consolidated Results sheet: every table's funding side by side, and the budget summary. */
export function LpmBudgetResults({ pb }: { pb: any }) {
  const s = pb?.sheet;
  if (!s) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <b style={{ font: "800 20px 'Familjen Grotesk',sans-serif" }}>Consolidated Results</b>
      <div style={{ overflowX: "auto", border: `2px solid ${INK}`, background: "#fff" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 820 + s.tables.length * 120 }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 96 }}>Value Stream</th>
              <th style={{ ...th, minWidth: 200 }}>Epic</th>
              <th style={{ ...th, width: 62 }}>Horizon</th>
              <th style={{ ...th, minWidth: 260 }}>Epic Description</th>
              <th style={{ ...th, textAlign: "right", width: 104 }}>Est. Cost</th>
              {s.tables.map((t: any, i: number) => <th key={i} style={{ ...th, textAlign: "center", width: 120, background: "#0e3b47" }}>{t.name}</th>)}
              <th style={{ ...th, textAlign: "center", width: 96 }}>Tables funding</th>
            </tr>
          </thead>
          <tbody>
            {s.results.map((g: any) =>
              g.rows.map((r: any, ri: number) => (
                <tr key={r.id} style={{ background: tint(g.color)[0] }}>
                  <td style={cell}>{ri === 0 ? g.name : ""}</td>
                  <td style={{ ...cell, color: r.sol ? "#2f6fd0" : INK }}>{r.name}</td>
                  <td style={{ ...cell, textAlign: "center", color: "#2f6fd0" }}>{r.hz}</td>
                  <td style={cell}>{r.desc}</td>
                  <td style={{ ...num, fontWeight: r.sol ? 800 : 500, color: r.sol ? "#2f6fd0" : INK }}>{r.cost}</td>
                  {r.cells.map((c: any, i: number) => (
                    <td key={i} style={{ ...num, textAlign: "center", background: c.state === "Full" ? "#cfe8d4" : c.state === "Partial" ? "#fff4c2" : "#ffffffaa" }}>
                      {c.state ? <><b>{c.state}</b><div style={{ fontSize: 11.5 }}>{c.amount}</div></> : ""}
                    </td>
                  ))}
                  <td style={{ ...cell, textAlign: "center", fontWeight: 700 }}>{r.full || r.partial ? `${r.full} full${r.partial ? ` · ${r.partial} partial` : ""}` : ""}</td>
                </tr>
              )),
            )}
            <tr style={{ fontWeight: 800 }}>
              <td style={cell} colSpan={4} />
              <td style={num}>{s.totalCost}</td>
              {s.tables.map((t: any, i: number) => <td key={i} style={{ ...num, textAlign: "center" }}>{t.total}</td>)}
              <td style={cell} />
            </tr>
            <tr>
              <td style={{ ...cell, borderBottom: 0 }} colSpan={4} />
              <td style={{ ...num, borderBottom: 0 }}>Balance</td>
              {s.tables.map((t: any, i: number) => <td key={i} style={{ ...num, borderBottom: 0, textAlign: "center", fontWeight: 700, color: t.over ? "#c8372d" : "#1f6b3a" }}>{t.balance}{t.warn ? <div style={{ fontSize: 11, color: "#a66b00" }}>⚠ {t.warn} rule{t.warn === 1 ? "" : "s"} to check</div> : null}</td>)}
              <td style={{ ...cell, borderBottom: 0 }} />
            </tr>
          </tbody>
        </table>
      </div>
      <BudgetBox s={s} />
      <div style={{ fontSize: 12.5, color: "#5b5b6e" }}>Live across all tables. Debrief: what got funded, what did not, and what caused debate?</div>
    </div>
  );
}

/** For the trainer, on the setup tab: the tables of this exercise, and loading a list of Solutions and Epics. */
export function LpmBudgetSetup({ pb }: { pb: any }) {
  const a = pb?.tableAdmin;
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  if (!a?.can) return null;
  const load = (t: string) => setMsg(pb.importList(t));
  const box: React.CSSProperties = { background: "#fff", border: `2px solid ${INK}`, borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 };
  const btn: React.CSSProperties = { border: `2px solid ${INK}`, background: "#ffe14d", borderRadius: 99, padding: "6px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={box}>
        <b style={{ font: "800 16px 'Familjen Grotesk',sans-serif" }}>Tables</b>
        <span style={{ fontSize: 13, color: "#5b5b6e" }}>Each table gets its own sheet. {a.teams.length ? `The class's teams are tables already (${a.teams.join(", ")}); add more here if you need them.` : "Add one per group in the room, and name them."}</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {a.own.map((t: any) => (
            <span key={t.id} style={{ display: "inline-flex", gap: 4, alignItems: "center", border: `2px solid ${INK}`, borderRadius: 99, padding: "3px 6px 3px 12px", background: "#fbf9f4" }}>
              <input key={`${t.id}|${t.name}`} defaultValue={t.name} onBlur={t.rename} aria-label={`Name of ${t.name}`} style={{ border: 0, background: "transparent", font: "700 13px 'Instrument Sans',sans-serif", width: 110 }} />
              <button onClick={() => window.confirm(`Remove ${t.name} and what it funded?`) && t.remove()} aria-label={`Remove ${t.name}`} style={{ border: 0, background: "none", cursor: "pointer", fontWeight: 800 }}>×</button>
            </span>
          ))}
          <button onClick={a.add} style={btn}>+ Add a table</button>
        </div>
      </div>
      <div style={box}>
        <b style={{ font: "800 16px 'Familjen Grotesk',sans-serif" }}>Load your own list of Solutions and Epics</b>
        <span style={{ fontSize: 13, color: "#5b5b6e" }}>Copy the rows from your spreadsheet and paste them here, or upload a CSV file. Columns, in this order: Value Stream, Epic, Horizon, Epic Description, Est. Cost. A row whose name contains “Solution” is a Solution; the others are Epics. This replaces the current list; you can still edit every row below.</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder={"Commercial\tC Solution 1: Autonomous Commercial Delivery via vans\tH2\t\t$2,000,000\n\tC1: Extend to more languages\t\tExtend the delivery services to other languages\t$100,000"} aria-label="Paste the list of Solutions and Epics" style={{ border: `2px solid ${INK}`, borderRadius: 8, padding: 8, font: "500 12.5px ui-monospace,Menlo,monospace", background: "#fbf9f4", whiteSpace: "pre" }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => load(text)} disabled={!text.trim()} style={{ ...btn, opacity: text.trim() ? 1 : 0.5 }}>Load the pasted list</button>
          <label style={{ ...btn, background: "#fff" }}>
            Upload a CSV file
            <input type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) void f.text().then(load); e.target.value = ""; }} />
          </label>
          {msg ? <span style={{ fontSize: 13, fontWeight: 600 }}>{msg}</span> : null}
        </div>
      </div>
    </div>
  );
}
