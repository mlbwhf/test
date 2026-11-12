"use client";

// The Mini Lab: Risk Reduction board, in the Class Studio look: the course text in a card with a
// copy button for Flowise, a place to paste the agent's assessment, and the group's risk register.

import { Fragment } from "react";
import { LENSES, SEVERITY } from "./studio-model-lab";

/* eslint-disable @typescript-eslint/no-explicit-any */
const INK = "#0d1815";
const card: React.CSSProperties = { background: "#fffaf0", border: `2px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 ${INK}`, padding: "14px 18px" };
const btn: React.CSSProperties = { cursor: "pointer", padding: "7px 14px", borderRadius: 9, border: `2px solid ${INK}`, background: "#fff", font: "700 13px 'Helvetica Neue', Helvetica, Arial, sans-serif", boxShadow: `2px 2px 0 ${INK}` };
const mono: React.CSSProperties = { font: "700 11px 'JetBrains Mono', ui-monospace, monospace", letterSpacing: ".1em", color: "#4d5a52" };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: `2px solid ${INK}`, borderRadius: 10, padding: "8px 10px", font: "500 14px/1.45 'Helvetica Neue', Helvetica, Arial, sans-serif", background: "#fff" };

export function LabView({ v }: { v: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, color: INK }}>
      {v.step === "setup" ? (
        <div style={card}>
          <div style={mono}>BEFORE THE LAB</div>
          <p style={{ margin: "6px 0 12px", font: "500 16px/1.5 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>Ensure that you have an active Flowise AI and Groq accounts. We will be creating a multi-agent flow together that will help evaluate risk for the HR Chatbot from the earlier activity.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {v.links.map(([name, href]: [string, string]) => (
              <a key={href} href={href} target="_blank" rel="noreferrer" style={{ ...btn, textDecoration: "none", color: INK, background: "#ffd37a" }}>
                {name} ↗
              </a>
            ))}
          </div>
        </div>
      ) : null}
      {v.step === "prompt" || v.step === "agent" ? (
        <div style={card}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={mono}>{v.step === "prompt" ? "INITIAL PROMPT · GIVE THIS TO YOUR FLOW" : "SYSTEM PROMPT · PASTE INTO THE AGENT"}</div>
            <span style={{ flex: 1 }} />
            <button onClick={v.copy} style={{ ...btn, background: v.copied ? "#cfe8d4" : "#ffd37a" }}>{v.copyLabel}</button>
          </div>
          <b style={{ display: "block", margin: "8px 0 6px", font: "800 18px Syne, 'Helvetica Neue', sans-serif" }}>{v.title}</b>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", font: "500 14.5px/1.5 'Helvetica Neue', Helvetica, Arial, sans-serif", background: "#fff", border: `2px solid ${INK}`, borderRadius: 10, padding: "12px 14px", maxHeight: 420, overflow: "auto" }}>{v.text}</pre>
        </div>
      ) : null}
      {v.step === "agent" ? (
        <div style={card}>
          <div style={mono}>THE AGENT&apos;S ASSESSMENT · PASTE IT HERE (SHARED WITH YOUR GROUP)</div>
          <textarea key={"v.answer|" + String(v.answer ?? "")} defaultValue={v.answer} onBlur={v.saveAnswer} disabled={v.readOnly} rows={10} placeholder="Run the agent on the proposal in Flowise, then paste its brutally honest assessment here." style={{ ...field, marginTop: 8, resize: "vertical" }} />
        </div>
      ) : null}
      {v.step === "register" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {v.answers.map((a: any) => (
              <div key={a.k} style={{ ...card, boxShadow: "none" }}>
                <div style={mono}>{a.title.toUpperCase()}</div>
                <div style={{ marginTop: 6, font: "500 13px/1.45 'Helvetica Neue', Helvetica, Arial, sans-serif", whiteSpace: "pre-wrap", maxHeight: 220, overflow: "auto", color: a.text ? INK : "#8a8a99" }}>{a.text || "Nothing pasted yet."}</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={mono}>RISK REGISTER · ONE LINE PER RISK WORTH ACTING ON</div>
              <span style={{ flex: 1 }} />
              {!v.readOnly ? LENSES.map((l) => <button key={l} onClick={() => v.add(l)} style={btn}>+ {l} risk</button>) : null}
            </div>
            {v.rows.length ? (
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10, fontSize: 14 }}>
                <thead>
                  <tr style={{ ...mono, textAlign: "left" }}>
                    <th style={{ padding: "4px 6px" }}>RISK</th><th style={{ padding: "4px 6px" }}>LENS</th><th style={{ padding: "4px 6px" }}>SEVERITY</th><th style={{ padding: "4px 6px" }}>WHAT WOULD REDUCE IT</th><th />
                  </tr>
                </thead>
                <tbody>
                  {v.rows.map((r: any) => (
                    <Fragment key={r.id}>
                      <tr style={{ borderTop: "1px solid #0d181822", verticalAlign: "top" }}>
                        <td style={{ padding: "6px" }}><textarea key={"r.risk|" + String(r.risk ?? "")} defaultValue={r.risk} onBlur={(e) => r.save({ risk: e.target.value })} disabled={v.readOnly} rows={2} style={{ ...field, resize: "vertical" }} placeholder="The risk, in one line" /></td>
                        <td style={{ padding: "6px" }}><select value={r.lens} onChange={(e) => r.save({ lens: e.target.value })} disabled={v.readOnly} style={field}>{LENSES.map((l) => <option key={l}>{l}</option>)}</select></td>
                        <td style={{ padding: "6px" }}><select value={r.sev} onChange={(e) => r.save({ sev: e.target.value })} disabled={v.readOnly} style={{ ...field, background: r.sev === "High" ? "#f8a08a" : r.sev === "Medium" ? "#ffe14d" : "#cfe8d4" }}>{SEVERITY.map((l) => <option key={l}>{l}</option>)}</select></td>
                        <td style={{ padding: "6px" }}><textarea key={"r.fix|" + String(r.fix ?? "")} defaultValue={r.fix} onBlur={(e) => r.save({ fix: e.target.value })} disabled={v.readOnly} rows={2} style={{ ...field, resize: "vertical" }} placeholder="Mitigation, owner, decision" /></td>
                        <td style={{ padding: "6px" }}>{!v.readOnly ? <button onClick={r.del} aria-label="Remove risk" style={{ ...btn, padding: "4px 9px" }}>×</button> : null}</td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ margin: "10px 0 0", color: "#5b5b6e" }}>Add the first risk from any of the three lenses.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
