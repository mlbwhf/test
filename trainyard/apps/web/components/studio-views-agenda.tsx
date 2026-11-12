"use client";

// The agenda kanban, in the design's class mode (Trainyard Kanban, mode "class"): a column per
// status with its count, a ticket per lesson, the legal column lit with a "Drop here" slot while
// a ticket is in the air and the others dimmed, a shaking message on an illegal drop.

/* eslint-disable @typescript-eslint/no-explicit-any */
const INK = "#0d1815";
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const mono = (px: number): React.CSSProperties => ({ font: `700 ${px}px 'JetBrains Mono', ui-monospace, monospace`, letterSpacing: ".1em", color: "#4d5a52" });

export function AgendaView({ v }: { v: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, color: INK, minWidth: 0 }}>
      <style>{`@keyframes ty-shake{0%,100%{transform:none}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}@keyframes ty-pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 240, flex: 1 }}>
          <span style={mono(11)}>{v.modeLabel}</span>
          <span style={{ font: "800 24px/1.1 Syne, 'Helvetica Neue', sans-serif" }}>{v.title}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ ...mono(12), color: INK, background: "#fff", border: `2px solid ${INK}`, borderRadius: 99, padding: "4px 12px", boxShadow: `2px 2px 0 ${INK}` }}>{v.total} ITEMS</span>
          <span style={{ ...mono(12), color: INK, background: "#cfe8d4", border: `2px solid ${INK}`, borderRadius: 99, padding: "4px 12px", boxShadow: `2px 2px 0 ${INK}` }}>{v.done} DONE</span>
          <span style={{ ...mono(12), color: INK, background: "#fffaf0", border: `2px solid ${INK}`, borderRadius: 99, padding: "4px 12px", boxShadow: `2px 2px 0 ${INK}` }}>{v.left} TO GO</span>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, font: `600 12px ${FONT}` }}>
        <span style={mono(10)}>FLOW</span>
        {v.pills.map((p: any) => (
          <span key={p.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ background: p.final ? "#cfe8d4" : "#fff", border: `1.5px solid ${INK}`, borderRadius: 99, padding: "2px 10px" }}>{p.name}</span>
            {p.arrow ? <span>→</span> : null}
          </span>
        ))}
      </div>
      <div style={{ minHeight: 34, display: "flex", alignItems: "center" }}>
        {v.msg ? (
          <div role="alert" style={{ animation: "ty-shake .3s", background: "#ffd0c8", border: `2px solid ${INK}`, borderRadius: 8, padding: "6px 12px", font: `700 13px ${FONT}`, boxShadow: `2px 2px 0 ${INK}` }}>{v.msg}</div>
        ) : v.liftText ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: "#ffe9a8", border: `2px solid ${INK}`, borderRadius: 8, padding: "6px 12px", font: `700 13px ${FONT}`, boxShadow: `2px 2px 0 ${INK}` }}>
            <span>{v.liftText}</span>
            <button onClick={v.cancel} style={{ cursor: "pointer", border: `1.5px solid ${INK}`, borderRadius: 6, background: "#fff", padding: "2px 8px", font: `700 11px ${FONT}` }}>Cancel</button>
          </div>
        ) : null}
      </div>
      <div style={{ overflowX: "auto", paddingBottom: 6 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: "max-content" }}>
          {v.cols.map((c: any) => (
            <div key={c.id} onDragOver={c.over} onDrop={c.drop} data-col={c.name} style={{ width: 300, flex: "none", display: "flex", flexDirection: "column", border: `2px solid ${INK}`, borderRadius: 10, background: c.final ? "#e4f3e6" : "#fffaf0", opacity: c.blocked ? 0.45 : 1, boxShadow: `3px 3px 0 ${INK}`, transition: "opacity .15s" }}>
              <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 6, borderBottom: `2px solid ${INK}`, background: c.isLegal ? "#ffe9a8" : c.final ? "#cfe8d4" : "#efe8d8", borderRadius: "8px 8px 0 0" }}>
                <span style={{ flex: 1, font: `800 15px/1.2 ${FONT}` }}>{c.name}</span>
                <span data-count style={{ font: "700 12px 'JetBrains Mono', ui-monospace, monospace", background: "#fff", border: `1.5px solid ${INK}`, borderRadius: 99, padding: "1px 8px" }}>{c.count}</span>
              </div>
              {c.isLegal ? (
                <button onClick={c.place} style={{ margin: "8px 8px 0", border: `2px dashed ${INK}`, borderRadius: 8, background: "#fff6cf", padding: 10, textAlign: "center", font: `800 13px ${FONT}`, animation: "ty-pop .2s", cursor: "pointer" }}>
                  Drop here ↓
                </button>
              ) : null}
              {c.blocked ? <div style={{ margin: "8px 8px 0", border: `1.5px dashed ${INK}55`, borderRadius: 8, padding: 8, textAlign: "center", ...mono(11) }}>🔒 Not a next step</div> : null}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 8, minHeight: 140 }}>
                {c.cards.map((k: any) => (
                  <div key={k.id} draggable={k.canMove} onDragStart={k.drag} onDragEnd={k.dragEnd} onClick={k.tap} data-ticket={k.id} style={{ background: k.done ? "#cfe8d4" : "#a9c4ec", border: `2px solid ${INK}`, borderRadius: 8, padding: "8px 10px", boxShadow: k.mine ? `4px 4px 0 ${INK}` : `2px 2px 0 ${INK}`, transform: k.mine ? "rotate(-1.5deg)" : "none", cursor: k.canMove ? "grab" : "default", userSelect: "none" }}>
                    <span style={{ font: `600 13px/1.3 ${FONT}`, ...(k.done ? { textDecoration: "line-through", color: "#4d5a52" } : {}) }}>{k.t}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
