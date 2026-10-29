"use client";
// Generated from the Class Studio design (Trainyard Class Studio.dc.html) by dc2jsx.py: each board's
// layout exactly as designed, reading what it shows and does from `v` (studio-model.ts). Do not edit by hand;
// change the design and regenerate.
/* eslint-disable */
import { Fragment } from "react";

export function QuadView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" } as any}>
<span style={{ font: "700 clamp(18px,2vw,24px) 'Helvetica Neue',Helvetica,Arial" } as any}>More pre-planning</span>
<div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" } as any}>
<span style={{ flex: "none", width: "70px", textAlign: "center", font: "700 clamp(16px,1.8vw,22px) 'Helvetica Neue',Helvetica,Arial" } as any}>Positive</span>
<div style={{ flex: "1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "8px", borderRadius: "16px", background: "#0d1815" } as any}>
{(v.quads || []).map((q: any, q_n: number) => (<Fragment key={q_n}>
<div style={{ background: "#efe8d8", borderRadius: "10px", minHeight: "150px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" } as any}>
<div style={{ display: "flex", flexWrap: "wrap", gap: "6px", flex: "1", alignContent: "flex-start" } as any}>{(q.list || []).map((s: any, s_n: number) => (<Fragment key={s_n}><span style={{ background: `${s.c}`, padding: "7px 10px", border: "2px solid #0d1815", borderRadius: "6px", font: "600 13px/1.25 'Helvetica Neue',Helvetica,Arial", boxShadow: "2px 2px 0 #0d1815", transform: `rotate(${s.rot})` } as any}>{s.t}</span></Fragment>))}</div>
<input onKeyDown={q.onKey} placeholder="+ sticky, press Enter" style={{ all: "unset", boxSizing: "border-box", borderBottom: "1.5px dashed #0d181888", padding: "4px 2px", font: "500 13px 'Helvetica Neue',Helvetica,Arial", width: "100%" } as any} />
</div></Fragment>))}
</div>
<span style={{ flex: "none", width: "70px", textAlign: "center", font: "700 clamp(16px,1.8vw,22px) 'Helvetica Neue',Helvetica,Arial" } as any}>Negative</span>
</div>
<span style={{ font: "700 clamp(18px,2vw,24px) 'Helvetica Neue',Helvetica,Arial" } as any}>Less pre-planning</span></div>

    </>
  );
}

export function CheckView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", gap: "16px" } as any}>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" } as any}>
<div style={{ display: "flex", alignItems: "flex-end", gap: "5px" } as any}><div style={{ flex: "none", width: "30px", height: "24px", background: "#ffb627", border: "2px solid #0d1815", borderRadius: "6px 10px 2px 2px" } as any}></div>
{(v.ck.cars || []).map((k: any, k_n: number) => (<Fragment key={k_n}><div style={{ flex: "1", height: "24px", background: `${k.bg}`, border: "2px solid #0d1815", borderRadius: "4px 4px 2px 2px", transition: "background .2s" } as any}></div></Fragment>))}</div>
<div style={{ height: "7px", borderTop: "3px solid #0d1815", background: "repeating-linear-gradient(90deg,#0d1815 0 8px,transparent 8px 20px)" } as any}></div>
</div>
<div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" } as any}>
{(v.ck.tally || []).map((p: any, p_n: number) => (<Fragment key={p_n}><span style={{ padding: "5px 12px", borderRadius: "99px", border: "2px solid #0d1815", background: `${p.bg}`, font: "700 13px 'Helvetica Neue',Helvetica,Arial,sans-serif" } as any}>{p.label}</span></Fragment>))}
<span style={{ font: "500 14px 'Helvetica Neue',Helvetica,Arial,sans-serif", color: "#35433b" } as any}>(Y) Yes, must be in place · (N) No, doesn’t need to be · (D) Depends on context</span>
</div>
<div style={{ border: "2px solid #0d1815", borderRadius: "8px", overflow: "hidden", background: "#fffaf0", boxShadow: "3px 3px 0 #0d1815" } as any}>
<div style={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) 180px", gap: "12px", padding: "9px 14px", background: "#0d1815", color: "#f3ead3", font: "700 12px 'JetBrains Mono'", letterSpacing: ".08em" } as any}><span>#</span><span>QUESTION</span><span>MUST BE IN PLACE?</span></div>
{(v.ck.rows || []).map((r: any, r_n: number) => (<Fragment key={r_n}>
<div style={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) 180px", gap: "12px", padding: "11px 14px", alignItems: "center", borderTop: "1.5px solid #0d181833", background: `${r.bg}`, transition: "background .2s" } as any}>
<span style={{ font: "700 13px 'JetBrains Mono'", color: "#4d5a52" } as any}>{r.n}</span>
<div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "0" } as any}><b style={{ font: "700 15px/1.25 'Helvetica Neue',Helvetica,Arial,sans-serif" } as any}>{r.t}</b><span style={{ font: "400 14px/1.4 'Helvetica Neue',Helvetica,Arial,sans-serif" } as any}>{r.d}</span></div>
<select value={r.val} onChange={r.set} aria-label={r.t} style={{ cursor: "pointer", width: "100%", padding: "8px 10px", borderRadius: "8px", border: `2px solid ${r.col}`, background: "#fff", color: `${r.fg}`, font: "700 14px 'Helvetica Neue',Helvetica,Arial,sans-serif" } as any}><option value="">Choose…</option><option value="Y">Yes, must be in place</option><option value="N">No, not needed</option><option value="D">Depends on context</option></select>
</div></Fragment>))}</div>
<div style={{ border: "2px dashed #0d1815", borderRadius: "8px", padding: "12px 16px", background: "#fff3d0", font: "500 15px/1.4 'Helvetica Neue',Helvetica,Arial,sans-serif" } as any}>{v.ck.summary}</div>
</div>

    </>
  );
}

export function ConnectView({ v }: { v: any }) {
  // A short sample of a connection type's line, as drawn on the picture.
  const sample = (t: any, w = 34) => (
    <svg width={w} height="12" viewBox={`0 0 ${w} 12`} style={{ flex: "none" } as any}><line x1="2" y1="6" x2={w - 2} y2="6" stroke={t.col} strokeWidth="4" strokeDasharray={t.dash === "none" ? undefined : t.dash.split(" ").map((n: string) => +n / 2.5).join(" ")} strokeLinecap={t.cap} /></svg>
  );
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", gap: "14px" } as any}>
<div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" } as any}><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>1 · PICK A TYPE</span>{(v.ctypes || []).map((t: any, t_n: number) => (<Fragment key={t_n}><button onClick={t.go} style={{ cursor: "pointer", display: "flex", gap: "8px", alignItems: "center", padding: "7px 12px", borderRadius: "10px", border: "2px solid #0d1815", background: `${t.bg}`, font: "700 13px 'Helvetica Neue',Helvetica,Arial", boxShadow: `${t.sh}` } as any}><span style={{ width: "12px", height: "12px", borderRadius: "99px", background: `${t.col}`, border: "1.5px solid #0d1815" } as any}></span>{t.label}{sample(t, 28)}</button></Fragment>))}</div>
{v.conn.desc ? (<><div style={{ display: "flex", gap: "10px", alignItems: "center", border: "2px solid #0d1815", borderRadius: "8px", background: "#fffaf0", padding: "8px 12px", font: "500 14px/1.4 'Helvetica Neue',Helvetica,Arial" } as any}>{sample(v.conn.sel, 40)}<span>The RTE {v.conn.desc.charAt(0).toLowerCase() + v.conn.desc.slice(1)}</span></div></>) : null}
<span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>2 · CLICK ANYTHING ON THE BIG PICTURE TO ROUTE A LINE FROM THE RTE</span>
<div onClick={v.conn.click} onMouseMove={v.conn.move} onMouseLeave={v.conn.leave} style={{ position: "relative", border: "2px solid #0d1815", borderRadius: "8px", overflow: "hidden", cursor: "crosshair", background: "#fff", lineHeight: "0" } as any}>
<img src="/courses/rte/big-picture-rte.png" alt="SAFe Big Picture" draggable={false} style={{ width: "100%", display: "block", userSelect: "none", WebkitUserDrag: "none" } as any} />
<svg viewBox="0 0 1600 900" style={{ position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none" } as any}><rect width="1600" height="900" fill="#fffaf0" opacity=".35" />
<defs><marker id="conn-io" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#e29a00" stroke="#0d1815" strokeWidth="1" /></marker></defs>
{(v.conn.lines || []).map((c: any, c_n: number) => (<Fragment key={c_n}><g><path d={c.d} fill="none" stroke="#fff" strokeWidth="12" strokeLinejoin="round" /><path d={c.d} fill="none" stroke={c.col} strokeWidth="6" strokeLinejoin="round" strokeDasharray={c.dash} strokeLinecap={c.cap} markerStart={c.io} /><circle cx={c.x} cy={c.y} r="22" fill={c.col} stroke="#0d1815" strokeWidth="4" /><text x={c.x} y={c.ty} textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff" fontFamily="Syne">{c.n}</text></g></Fragment>))}
{(v.conn.ghost || []).map((c: any, c_n: number) => (<Fragment key={c_n}><g opacity=".55"><path d={c.d} fill="none" stroke={c.col} strokeWidth="6" strokeLinejoin="round" strokeDasharray={c.dash} strokeLinecap={c.cap} markerStart={c.io} /><circle cx={c.x} cy={c.y} r="16" fill="none" stroke={c.col} strokeWidth="4" /></g></Fragment>))}
<circle cx="786" cy="392" r="34" fill="none" stroke="#0d1815" strokeWidth="5" strokeDasharray="8 7" /></svg>
</div>
<div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" } as any}>{(v.conn.legend || []).map((t: any, t_n: number) => (<Fragment key={t_n}><span style={{ display: "flex", gap: "6px", alignItems: "center", font: "600 12px 'Helvetica Neue',Helvetica,Arial", color: "#4d5a52" } as any}>{sample(t, 40)}{t.label}</span></Fragment>))}</div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" } as any}>
<div style={{ display: "flex", alignItems: "center", gap: "10px" } as any}><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>3 · SAY WHY IT MATTERS ({v.conn.count} CONNECTIONS)</span><button onClick={v.conn.clear} style={{ cursor: "pointer", marginLeft: "auto", padding: "4px 12px", borderRadius: "8px", border: "1.5px solid #0d1815", background: "#fff", font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>Undo last</button></div>
{(v.conn.items || []).map((c: any, c_n: number) => (<Fragment key={c_n}><div style={{ display: "flex", gap: "10px", alignItems: "center", border: "2px solid #0d1815", borderRadius: "8px", background: "#fffaf0", padding: "8px 10px" } as any}><span style={{ flex: "none", width: "26px", height: "26px", borderRadius: "99px", background: `${c.col}`, border: "2px solid #0d1815", color: "#fff", font: "800 13px Syne", display: "flex", alignItems: "center", justifyContent: "center" } as any}>{c.n}</span><button onClick={c.cycle} title="Change the type" style={{ all: "unset", cursor: "pointer", flex: "none", display: "flex", gap: "8px", alignItems: "center", font: "700 13px 'Helvetica Neue',Helvetica,Arial", minWidth: "170px" } as any}>{sample(c)}{c.type} <span style={{ color: "#4d5a52", fontSize: "11px" } as any}>▾</span></button><input onBlur={c.save} defaultValue={c.note} placeholder="What flows between the RTE and this?" style={{ all: "unset", flex: "1", minWidth: "0", borderBottom: "1.5px dashed #0d181888", padding: "3px 2px", font: "500 14px 'Helvetica Neue',Helvetica,Arial" } as any} /><button onClick={c.del} aria-label="Remove this connection" style={{ cursor: "pointer", flex: "none", width: "26px", height: "26px", borderRadius: "99px", border: "1.5px solid #0d1815", background: "#fff", font: "700 14px 'Helvetica Neue',Helvetica,Arial" } as any}>×</button></div></Fragment>))}
</div>
</div>

    </>
  );
}

export function TrustView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", gap: "14px" } as any}>
<span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>1 · WHICH SAFe EVENTS AND ACTIVITIES HELP ESTABLISH TRUST? 2 · CLICK THEM ON THE BIG PICTURE AND SAY WHY</span>
<div onClick={v.trust.click} style={{ position: "relative", border: "2px solid #0d1815", borderRadius: "8px", overflow: "hidden", cursor: "crosshair", background: "#fff", lineHeight: "0", boxShadow: "3px 3px 0 #0d1815" } as any}><img src="/courses/rte/big-picture-rte.png" alt="SAFe Big Picture" style={{ width: "100%", display: "block", userSelect: "none", WebkitUserDrag: "none" } as any} />
{(v.trust.pins || []).map((p: any, p_n: number) => (<Fragment key={p_n}><span style={{ position: "absolute", left: `${p.x}`, top: `${p.y}`, transform: "translate(-50%,-50%)", width: "30px", height: "30px", borderRadius: "99px", background: `${p.bg}`, border: "3px solid #0d1815", color: "#0d1815", font: "800 14px/24px Syne", textAlign: "center", boxShadow: "0 0 0 4px #ffffffcc", pointerEvents: "none" } as any}>{p.n}</span></Fragment>))}</div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" } as any}><div style={{ display: "flex", alignItems: "center", gap: "10px" } as any}><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>TRUST-BUILDING ACTIVITIES ({v.trust.count}) · TAP ★ TO CHOOSE ONE FOR STEP 3</span><button onClick={v.trust.undo} style={{ cursor: "pointer", marginLeft: "auto", padding: "4px 12px", borderRadius: "8px", border: "1.5px solid #0d1815", background: "#fff", font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>Undo last</button></div>
{(v.trust.items || []).map((p: any, p_n: number) => (<Fragment key={p_n}><div style={{ display: "flex", gap: "10px", alignItems: "center", border: "2px solid #0d1815", borderRadius: "8px", background: `${p.rowBg}`, padding: "8px 10px", flexWrap: "wrap" } as any}><span style={{ flex: "none", width: "26px", height: "26px", borderRadius: "99px", background: `${p.bg}`, border: "2px solid #0d1815", font: "800 13px Syne", display: "flex", alignItems: "center", justifyContent: "center" } as any}>{p.n}</span>
<input key={p.lk} defaultValue={p.label} onBlur={p.saveLabel} placeholder="Event or activity (e.g. PI Planning)" style={{ all: "unset", flex: "0 1 220px", minWidth: "140px", font: "700 14px 'Helvetica Neue',Helvetica,Arial", borderBottom: "1.5px dashed #0d181888", padding: "3px 2px" } as any} />
<input key={p.wk} defaultValue={p.why} onBlur={p.saveWhy} placeholder="Why would it help establish trust?" style={{ all: "unset", flex: "1", minWidth: "180px", font: "500 14px 'Helvetica Neue',Helvetica,Arial", borderBottom: "1.5px dashed #0d181888", padding: "3px 2px" } as any} />
<button onClick={p.pick} aria-label="Choose for step 3" style={{ cursor: "pointer", width: "32px", height: "32px", borderRadius: "99px", border: "2px solid #0d1815", background: `${p.starBg}`, font: "800 15px 'Helvetica Neue',Helvetica,Arial" } as any}>★</button></div></Fragment>))}</div>
{v.trust.hasPick ? (<><div style={{ border: "2px solid #0d1815", borderRadius: "10px", background: "#fffaf0", boxShadow: "4px 4px 0 #0d1815", overflow: "hidden" } as any}><div style={{ background: "#ffd37a", borderBottom: "2px solid #0d1815", padding: "10px 16px", font: "800 16px Syne" } as any}>3 · How can the RTE act to further increase trust in “{v.trust.pickName}”?</div>
<div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" } as any}><div style={{ display: "flex", flexWrap: "wrap", gap: "8px" } as any}>{(v.trust.acts || []).map((s: any, s_n: number) => (<Fragment key={s_n}><span style={{ background: `${s.c}`, padding: "9px 13px", border: "2px solid #0d1815", borderRadius: "6px", font: "600 14px/1.3 'Helvetica Neue',Helvetica,Arial", boxShadow: "2px 2px 0 #0d1815", transform: `rotate(${s.rot})` } as any}>{s.t}</span></Fragment>))}</div>
<input onKeyDown={v.trust.addAct} placeholder="+ RTE action, press Enter" style={{ all: "unset", boxSizing: "border-box", borderBottom: "1.5px dashed #0d181888", padding: "5px 2px", font: "500 14px 'Helvetica Neue',Helvetica,Arial" } as any} /></div></div></>) : null}
</div>

    </>
  );
}

export function BoundView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", gap: "14px" } as any}>
<div style={{ background: "#ffd37a", border: "2px solid #0d1815", borderRadius: "8px", padding: "14px 18px", font: "700 clamp(15px,1.6vw,18px)/1.4 'Helvetica Neue',Helvetica,Arial", boxShadow: "3px 3px 0 #0d1815" } as any}>Emerging AI capabilities can augment how ARTs plan, build, test, and learn, but must be managed carefully. ARTs must develop and socialize boundaries for these tools to ensure responsible usage.</div>
<div style={{ border: "2px solid #0d1815", boxShadow: "3px 3px 0 #0d1815", background: "#fff" } as any}>
{(v.bound.lanes || []).map((L: any, L_n: number) => (<Fragment key={L_n}>
<div style={{ display: "grid", gridTemplateColumns: "minmax(150px,32%) minmax(0,1fr)", borderTop: `${L.bt}` } as any}>
<div style={{ background: "#427d82", color: "#fff", padding: "18px", font: "800 clamp(16px,1.8vw,22px)/1.2 'Helvetica Neue',Helvetica,Arial", display: "flex", alignItems: "center" } as any}>{L.title}</div>
<div style={{ background: `${L.bg}`, padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px", minWidth: "0" } as any}><div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "flex-start" } as any}><span style={{ background: "#fff", border: "2px dashed #427d82", borderRadius: "6px", padding: "8px 12px", font: "500 14px/1.3 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}><b style={{ font: "700 10px 'JetBrains Mono'", letterSpacing: ".06em", display: "block", color: "#427d82" } as any}>EXAMPLE</b>{L.ex}</span>
{(L.list || []).map((s: any, s_n: number) => (<Fragment key={s_n}><span style={{ background: `${s.c}`, padding: "9px 13px", border: "2px solid #0d1815", borderRadius: "6px", font: "600 14px/1.3 'Helvetica Neue',Helvetica,Arial", boxShadow: "2px 2px 0 #0d1815", transform: `rotate(${s.rot})`, maxWidth: "100%" } as any}>{s.t}</span></Fragment>))}</div>
<input onKeyDown={L.add} placeholder="+ scenario, press Enter" style={{ all: "unset", boxSizing: "border-box", borderBottom: "1.5px dashed #0d181888", padding: "5px 2px", font: "500 14px 'Helvetica Neue',Helvetica,Arial" } as any} /></div></div></Fragment>))}</div>
</div>

    </>
  );
}

export function NextView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", gap: "14px" } as any}>
<div style={{ background: "#ffd37a", border: "2px solid #0d1815", borderRadius: "8px", padding: "14px 18px", font: "800 clamp(16px,1.7vw,20px)/1.35 Syne", boxShadow: "3px 3px 0 #0d1815" } as any}>Throughout this course, you’ve learned about various ways to integrate AI into your daily work as an RTE. What do you want to implement when you return to your role?</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "14px", alignItems: "start" } as any}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" } as any}>
<div style={{ display: "flex", flexDirection: "column", gap: "6px" } as any}><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>1 · ONE IMPROVEMENT TO HOW YOUR ART DELIVERS VALUE</span><textarea defaultValue={v.nx.t1} onBlur={v.nx.s1} placeholder="I want to improve…" rows={3} style={{ all: "unset", boxSizing: "border-box", width: "100%", border: "1.5px solid #0d181866", borderRadius: "6px", background: "#fff", padding: "8px 10px", minHeight: "70px", font: "500 14px/1.45 'Helvetica Neue',Helvetica,Arial", whiteSpace: "pre-wrap", cursor: "text" } as any}></textarea></div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" } as any}><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>2 · WHICH SAFe VALUE(S), PRINCIPLE(S) OR PRACTICE(S) WILL GUIDE YOU?</span>
<span style={{ font: "700 12px 'Helvetica Neue',Helvetica,Arial", color: "#4d5a52" } as any}>Core values</span><div style={{ display: "flex", gap: "6px", flexWrap: "wrap" } as any}>{(v.nx.values || []).map((c: any, c_n: number) => (<Fragment key={c_n}><button onClick={c.go} aria-pressed={c.on} style={{ cursor: "pointer", padding: "6px 12px", borderRadius: "99px", border: "2px solid #0d1815", background: `${c.bg}`, font: "700 12.5px 'Helvetica Neue',Helvetica,Arial" } as any}>{c.label}</button></Fragment>))}</div>
<span style={{ font: "700 12px 'Helvetica Neue',Helvetica,Arial", color: "#4d5a52" } as any}>Principles</span><div style={{ display: "flex", gap: "6px", flexWrap: "wrap" } as any}>{(v.nx.principles || []).map((c: any, c_n: number) => (<Fragment key={c_n}><button onClick={c.go} aria-pressed={c.on} style={{ cursor: "pointer", padding: "6px 12px", borderRadius: "99px", border: "2px solid #0d1815", background: `${c.bg}`, font: "700 12.5px 'Helvetica Neue',Helvetica,Arial", textAlign: "left" } as any}>{c.label}</button></Fragment>))}</div>
<textarea defaultValue={v.nx.t2} onBlur={v.nx.s2} placeholder="Practices that will guide you (for example, ART sync, PI Planning readiness, flow metrics)" rows={2} style={{ all: "unset", boxSizing: "border-box", width: "100%", border: "1.5px solid #0d181866", borderRadius: "6px", background: "#fff", padding: "8px 10px", minHeight: "70px", font: "500 14px/1.45 'Helvetica Neue',Helvetica,Arial", whiteSpace: "pre-wrap", cursor: "text" } as any}></textarea></div>
<div style={{ display: "flex", flexDirection: "column", gap: "6px" } as any}><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>3 · YOUR FIRST STEP IN THE NEXT 30 DAYS</span><textarea defaultValue={v.nx.t3} onBlur={v.nx.s3} placeholder="In the next 30 days I will…" rows={3} style={{ all: "unset", boxSizing: "border-box", width: "100%", border: "1.5px solid #0d181866", borderRadius: "6px", background: "#fff", padding: "8px 10px", minHeight: "70px", font: "500 14px/1.45 'Helvetica Neue',Helvetica,Arial", whiteSpace: "pre-wrap", cursor: "text" } as any}></textarea></div></div>
<div style={{ border: "2px solid #0d1815", borderRadius: "10px", background: "#fffaf0", boxShadow: "4px 4px 0 #0d1815", overflow: "hidden" } as any}><div style={{ background: "#0d1815", color: "#f3ead3", padding: "10px 16px", font: "800 15px Syne" } as any}>My commitment · check back {v.nx.date}</div>
<div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" } as any}><div><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>IMPROVEMENT</span><div style={{ font: "600 15px/1.4 'Helvetica Neue',Helvetica,Arial" } as any}>{v.nx.p1}</div></div><div><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>GUIDED BY</span><div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" } as any}>{(v.nx.chosen || []).map((c: any, c_n: number) => (<Fragment key={c_n}><span style={{ padding: "3px 10px", borderRadius: "99px", border: "1.5px solid #0d1815", background: "#ffd37a", font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>{c}</span></Fragment>))}</div><div style={{ font: "500 13px/1.4 'Helvetica Neue',Helvetica,Arial", marginTop: "4px" } as any}>{v.nx.t2}</div></div><div><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>FIRST STEP (NEXT 30 DAYS)</span><div style={{ font: "600 15px/1.4 'Helvetica Neue',Helvetica,Arial" } as any}>{v.nx.p3}</div></div></div></div>
</div></div>

    </>
  );
}

export function VsmView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", gap: "12px" } as any}>
<div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" } as any}>{(v.vsm.sum || []).map((c: any, c_n: number) => (<Fragment key={c_n}><span style={{ padding: "6px 12px", borderRadius: "99px", border: "2px solid #0d1815", background: `${c.bg}`, font: "700 13px 'Helvetica Neue',Helvetica,Arial" } as any}>{c.l}</span></Fragment>))}
<span style={{ flex: "1" } as any}></span>{v.vsm.future ? (<><button onClick={v.vsm.copy} style={{ cursor: "pointer", padding: "6px 12px", borderRadius: "8px", border: "2px solid #0d1815", background: "#fff", font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>Copy current-state map</button></>) : null}
<button onClick={v.vsm.addLane} style={{ cursor: "pointer", padding: "6px 12px", borderRadius: "8px", border: "2px solid #0d1815", background: "#ffb627", font: "700 12px 'Helvetica Neue',Helvetica,Arial", boxShadow: "2px 2px 0 #0d1815" } as any}>{v.vsm.addLabel}</button></div>
<span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>{v.vsm.hint}</span>
{(v.vsm.lanes || []).map((L: any, L_n: number) => (<Fragment key={L_n}>
<div style={{ border: `${L.bd}`, background: "#fff", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px", overflowX: "auto", boxShadow: "3px 3px 0 #0d1815" } as any}>
<div style={{ display: `${L.hd}`, alignItems: "center", gap: "8px" } as any}><input key={L.key} defaultValue={L.name} onBlur={L.saveName} placeholder="Group name" style={{ all: "unset", flex: "1", font: "800 22px Syne", color: "#4a4a4a", borderBottom: "1.5px dashed #0d181855" } as any} /><input key={L.nkey} defaultValue={L.note} onBlur={L.saveNote} placeholder="Callout, e.g. Delay: ~90 days" style={{ all: "unset", width: "200px", font: "700 12px 'Helvetica Neue',Helvetica,Arial", color: "#c0301d", borderBottom: "1.5px dashed #c0301d88" } as any} /><button onClick={L.del} aria-label="Remove group" style={{ all: "unset", cursor: "pointer", color: "#b4235f", font: "700 18px 'Helvetica Neue',Helvetica,Arial" } as any}>×</button></div>
<div style={{ display: "flex", minWidth: "max-content", alignItems: "flex-start" } as any}>
<div style={{ flex: "none", width: "92px", paddingTop: "70px", display: "flex", flexDirection: "column", gap: "0", font: "700 11.5px 'Helvetica Neue',Helvetica,Arial", color: "#2f6d9a" } as any}><span style={{ height: "30px", display: "flex", alignItems: "center", background: "#f0f0f0", paddingLeft: "4px" } as any}>Process time</span><span style={{ height: "30px", display: "flex", alignItems: "center", color: "#0d1815", paddingLeft: "4px" } as any}>Delay time</span><span style={{ height: "30px", display: "flex", alignItems: "center", color: "#0d1815", paddingLeft: "4px", fontWeight: "600" } as any}>%C&A</span></div>
{(L.steps || []).map((s: any, s_n: number) => (<Fragment key={s_n}>
<div key={s.id} style={{ flex: "none", width: `${s.w}` } as any}>
<div style={{ height: "64px", display: "flex", alignItems: "center", gap: "0" } as any}><div style={{ flex: "none", width: `${s.cw}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" } as any}><span style={{ width: "22px", height: "22px", borderRadius: "99px", border: "2px solid #4a4a4a", display: "block", position: "relative" } as any}><i style={{ position: "absolute", left: "8px", top: "3px", width: "2px", height: "8px", background: "#4a4a4a" } as any}></i></span><i style={{ position: "absolute", right: "5px", bottom: "10px", width: "10px", height: "10px", borderRadius: "99px", background: "#d9362b", border: "1.5px solid #fff" } as any}></i></div>
<div style={{ flex: "1", minWidth: "0", height: "56px", background: "#33678f", border: `${s.bd}`, display: "flex", alignItems: "center", padding: "0 4px", position: "relative" } as any}><input defaultValue={s.n} onBlur={s.saveN} placeholder="Step" style={{ all: "unset", boxSizing: "border-box", width: "100%", textAlign: "center", font: "600 13.5px/1.2 'Helvetica Neue',Helvetica,Arial", color: "#fff" } as any} /><button onClick={s.del} aria-label="Remove step" style={{ all: "unset", position: "absolute", right: "3px", top: "0", cursor: "pointer", color: "#ffffffaa", font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>×</button></div></div>
<div style={{ paddingLeft: `${s.cw}` } as any}><div style={{ height: "30px", background: "#f0f0f0", display: "flex", alignItems: "center" } as any}><input defaultValue={s.pt} onBlur={s.savePt} placeholder="hrs" style={{ all: "unset", boxSizing: "border-box", width: "100%", textAlign: "center", font: "600 12.5px 'Helvetica Neue',Helvetica,Arial", color: "#2f6d9a", fontWeight: "700" } as any} /></div>
<div style={{ height: "30px", display: "flex", alignItems: "center", marginLeft: `-${s.cw}`, border: `${s.dbd}` } as any}><input defaultValue={s.dt} onBlur={s.saveDt} placeholder="delay hrs" style={{ all: "unset", boxSizing: "border-box", width: "100%", textAlign: "center", font: "600 12.5px 'Helvetica Neue',Helvetica,Arial", color: "#0d1815", fontWeight: "700" } as any} /></div>
<div style={{ height: "30px", display: "flex", alignItems: "center", border: `${s.cbd}` } as any}><input defaultValue={s.ca} onBlur={s.saveCa} placeholder="%" style={{ all: "unset", boxSizing: "border-box", width: "100%", textAlign: "center", font: "600 12.5px 'Helvetica Neue',Helvetica,Arial", color: "#0d1815" } as any} /></div>
<div style={{ minHeight: "22px", display: "flex", flexDirection: "column", gap: "3px", paddingTop: "3px" } as any}>{s.slow ? (<><span style={{ alignSelf: "flex-start", background: "#ef5a43", color: "#fff", padding: "2px 8px", font: "700 11px 'Helvetica Neue',Helvetica,Arial", transform: "rotate(-3deg)" } as any}>Delay: ~{s.days} days</span></>) : null}{s.poor ? (<><span style={{ alignSelf: "flex-start", background: "#ef5a43", color: "#fff", padding: "2px 8px", font: "700 11px 'Helvetica Neue',Helvetica,Arial", transform: "rotate(2deg)" } as any}>Poor quality</span></>) : null}</div></div></div></Fragment>))}
<button onClick={L.addStep} style={{ flex: "none", margin: "16px 0 0 10px", cursor: "pointer", width: "34px", height: "34px", borderRadius: "99px", border: "2px solid #0d1815", background: "#ffb627", font: "800 16px 'Helvetica Neue',Helvetica,Arial" } as any} aria-label="Add a step">+</button>
</div></div></Fragment>))}
</div>

    </>
  );
}

export function BaView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "16px", alignItems: "start" } as any}>
<div style={{ display: "flex", flexDirection: "column", gap: "12px" } as any}>
<span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>1 · INDIVIDUALLY, SCORE EACH COMPETENCY (1–5) FROM YOUR WORKBOOK</span>
{(v.ba.dims || []).map((d: any, d_n: number) => (<Fragment key={d_n}><div style={{ border: "2px solid #0d1815", borderRadius: "8px", background: "#fffaf0", padding: "10px 14px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "2px 2px 0 #0d1815" } as any}><div style={{ display: "flex", alignItems: "center", gap: "10px" } as any}><span style={{ flex: "none", width: "14px", height: "14px", borderRadius: "99px", background: `${d.c}`, border: "1.5px solid #0d1815" } as any}></span><b style={{ flex: "1", font: "700 14px/1.25 'Helvetica Neue',Helvetica,Arial" } as any}>{d.name}</b><b style={{ font: "800 18px Syne" } as any}>{d.v}</b></div><input type="range" min={1} max={5} step={0.25} value={d.v} onChange={d.set} aria-label={d.name} style={{ width: "100%", accentColor: `${d.c}` } as any} /></div></Fragment>))}</div>
<div style={{ display: "flex", flexDirection: "column", gap: "12px" } as any}><div style={{ border: "2px solid #0d1815", borderRadius: "8px", background: "#fff", padding: "12px", boxShadow: "3px 3px 0 #0d1815" } as any}><b style={{ display: "block", textAlign: "center", font: "800 17px Syne", color: "#0e3a6b" } as any}>Business Agility Assessment</b>
<svg viewBox="-300 -230 600 470" style={{ width: "100%", display: "block" } as any} fontFamily="Helvetica Neue, Helvetica, Arial">
{(v.ba.rings || []).map((r: any, r_n: number) => (<Fragment key={r_n}><circle cx="0" cy="0" r={r.r} fill="none" stroke="#bbb" strokeWidth="1" /></Fragment>))}
{(v.ba.wedges || []).map((w: any, w_n: number) => (<Fragment key={w_n}><path d={w.d} fill={w.c} /></Fragment>))}
{(v.ba.spokes || []).map((p: any, p_n: number) => (<Fragment key={p_n}><line x1="0" y1="0" x2={p.x} y2={p.y} stroke="#333" strokeWidth="1" /></Fragment>))}
<polygon points={v.ba.poly} fill="none" stroke="#222" strokeWidth="2" />
{(v.ba.labels || []).map((t: any, t_n: number) => (<Fragment key={t_n}><g><text x={t.x} y={t.y} textAnchor={t.a} fontSize="12.5" fontWeight="700" fill="#0d1815">{t.n1}</text><text x={t.x} y={t.y2} textAnchor={t.a} fontSize="12.5" fontWeight="700" fill="#0d1815">{t.n2}</text><text x={t.x} y={t.y3} textAnchor={t.a} fontSize="12.5" fontWeight="800" fill="#0e3a6b">{t.v}</text></g></Fragment>))}</svg>
<div style={{ font: "600 13px/1.4 'Helvetica Neue',Helvetica,Arial", textAlign: "center", color: "#35433b" } as any}>{v.ba.insight}</div></div>
<span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>2 · SHARE OPPORTUNITIES FOR IMPROVEMENT YOU IDENTIFIED</span>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" } as any}>{(v.stk || []).map((s: any, s_n: number) => (<Fragment key={s_n}><span style={{ background: `${s.c}`, padding: "9px 12px", border: "2px solid #0d1815", borderRadius: "6px", font: "600 14px/1.3 'Helvetica Neue',Helvetica,Arial", boxShadow: "2px 2px 0 #0d1815", transform: `rotate(${s.rot})` } as any}>{s.t}</span></Fragment>))}</div>
<input onKeyDown={v.addStk} placeholder="+ opportunity, press Enter" style={{ all: "unset", boxSizing: "border-box", border: "1.5px dashed #0d181899", borderRadius: "8px", padding: "10px 12px", font: "500 14px 'Helvetica Neue',Helvetica,Arial", background: "#fffaf0" } as any} /></div>
</div>

    </>
  );
}

export function RcaView({ v }: { v: any }) {
  return (
    <>

<div style={{ background: "#06384a", borderRadius: "14px", padding: "14px", display: "flex", flexDirection: "column", gap: "12px" } as any}>
<div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } as any}><span style={{ flex: "1", minWidth: "240px", font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#9fc5cb" } as any}>{v.rca.stepHint}</span>{v.rca.showToggle ? (<><button onClick={v.rca.toggleAll} aria-pressed={v.rca.allOn} style={{ cursor: "pointer", padding: "6px 14px", borderRadius: "99px", border: "2px solid #9fc5cb", background: "transparent", color: "#d3e7ea", font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>{v.rca.allLabel}</button></>) : null}</div>
{v.rca.zoom.on ? (<><div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" } as any}><button onClick={v.rca.zoom.back} style={{ cursor: "pointer", padding: "7px 14px", borderRadius: "99px", border: "2px solid #ffb627", background: "#ffb627", color: "#0d1815", font: "800 13px 'Helvetica Neue',Helvetica,Arial" } as any}>⤡ Back to full board</button>{(v.rca.zoom.chips || []).map((c: any, c_n: number) => (<Fragment key={c_n}><button onClick={c.go} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: "5px 11px", borderRadius: "99px", border: `2px solid ${c.bd}`, background: `${c.bg}`, color: `${c.fg}`, font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}><b style={{ font: "800 12px Syne" } as any}>{c.n}</b>{c.label}<i style={{ font: "700 10px 'JetBrains Mono'", fontStyle: "normal", opacity: ".8" } as any}>{c.info}</i></button></Fragment>))}</div></>) : null}
{v.rca.show.bar ? (<><div style={{ background: "#d3e7ea", border: "3px solid #4a8a93", padding: "8px 14px", font: "700 14px/1.4 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}><span style={{ font: "700 10px 'JetBrains Mono'", letterSpacing: ".08em", color: "#2b5d61", display: "block" } as any}>PROBLEM TO SOLVE</span>{v.rca.probText}</div></>) : null}
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,620px),1fr))", gap: "14px", alignItems: "start" } as any}>

{v.rca.show.board ? (<><div style={{ gridColumn: "1 / -1", overflowX: "auto", background: "#fff" } as any}><div style={{ minWidth: "900px", containerType: "inline-size" } as any}><div style={{ position: "relative", width: "100%", aspectRatio: "1000/560", background: "#fff" } as any}>
<svg viewBox="0 0 1000 560" style={{ position: "absolute", inset: "0", width: "100%", height: "100%" } as any}>
<rect x="592" y="2" width="203" height="184" fill="#d3e7ea" /><rect x="797" y="2" width="201" height="184" fill="#d3e7ea" /><rect x="797" y="188" width="201" height="184" fill="#d3e7ea" /><rect x="592" y="374" width="203" height="184" fill="#d3e7ea" /><rect x="797" y="374" width="201" height="184" fill="#f8f1e4" />
<g stroke="#9a9a9a" strokeWidth="5" fill="none"><rect x="592" y="2" width="406" height="556" /><line x1="795" y1="2" x2="795" y2="558" /><line x1="592" y1="186.7" x2="998" y2="186.7" /><line x1="592" y1="372.7" x2="998" y2="372.7" /></g>
<line x1="0" y1="280" x2="566" y2="280" stroke="#cfcfcf" strokeWidth="14" /><polygon points="560,262 592,280 560,298" fill="#cfcfcf" />
{(v.rca.brd.bones || []).map((b: any, b_n: number) => (<Fragment key={b_n}><line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke={b.c} strokeOpacity="0.55" strokeWidth="12" strokeLinecap="round" /></Fragment>))}
{(v.rca.brd.dots || []).map((d: any, d_n: number) => (<Fragment key={d_n}><circle cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} stroke={d.c} strokeWidth="2.5" strokeDasharray={d.dash} /></Fragment>))}</svg>
{(v.rca.brd.labels || []).map((o: any, o_n: number) => (<Fragment key={o_n}><div style={{ position: "absolute", left: `${o.l}`, top: `${o.t}`, width: "14%", height: "6%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5cqw" } as any}><span style={{ font: "800 2.1cqw 'Helvetica Neue',Helvetica,Arial", color: `${o.c}` } as any}>{o.name}</span><button onClick={o.suggest} title="Suggest likely causes with AI" style={{ cursor: "pointer", padding: "0 0.5cqw", borderRadius: "99px", border: `1.5px solid ${o.c}`, background: "#fff", color: `${o.c}`, font: "700 1cqw 'Helvetica Neue',Helvetica,Arial" } as any}>{o.sug}</button></div></Fragment>))}
{(v.rca.brd.slots || []).map((s: any, s_n: number) => (<Fragment key={s_n}><div style={{ position: "absolute", left: `${s.l}`, top: `${s.tp}`, width: "13%", height: "6.2%", display: "flex", alignItems: "center", justifyContent: "flex-end" } as any}>
{s.filled ? (<><div style={{ display: "flex", alignItems: "center", gap: "0.3cqw", justifyContent: "flex-end", width: "100%" } as any}><span style={{ minWidth: "0", textAlign: "right", font: "600 1.05cqw/1.15 'Helvetica Neue',Helvetica,Arial", color: "#0d1815", display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden" } as any} title={s.tx}>{s.tx}</span><button onClick={s.up} aria-label="Vote up" style={{ cursor: "pointer", flex: "none", padding: "0 0.45cqw", borderRadius: "99px", border: `1.5px solid ${s.c}`, background: `${s.bg}`, font: "800 0.9cqw/1.5 'Helvetica Neue',Helvetica,Arial" } as any}>▲{s.v}</button><button onClick={s.del} aria-label="Delete" style={{ all: "unset", flex: "none", cursor: "pointer", color: "#b4235f", font: "700 1.2cqw/1 'Helvetica Neue',Helvetica,Arial" } as any}>×</button></div></>) : null}
{s.input ? (<><input onKeyDown={s.add} onBlur={s.blur} placeholder={s.ph} style={{ all: "unset", boxSizing: "border-box", width: "100%", textAlign: "right", padding: "0 0.3cqw", borderBottom: `1.5px dashed ${s.c}`, font: "500 1.05cqw 'Helvetica Neue',Helvetica,Arial", color: "#0d1815" } as any} /></>) : null}</div></Fragment>))}
<div style={{ position: "absolute", left: "59.2%", top: "0.4%", width: "20.5%", height: "33.33%", boxSizing: "border-box", padding: "0.9cqw 1cqw", overflow: "auto", display: "flex", flexDirection: "column", gap: "0.5cqw" } as any}><div style={{ display: "flex", alignItems: "flex-start", gap: "0.4cqw" } as any}><b style={{ flex: "1", font: "800 1.7cqw/1.12 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}>1. Original problem statement</b><button onClick={v.rca.z.b1} aria-label="Enlarge this box" title="Enlarge" style={{ all: "unset", cursor: "pointer", flex: "none", font: "800 1.4cqw/1.3 'Helvetica Neue',Helvetica,Arial", color: "#06384a", border: "1.5px solid #06384a", borderRadius: "0.6cqw", padding: "0 0.6cqw", background: "#fff" } as any}>⤢</button></div>{(v.rca.p1 || []).map((f: any, f_n: number) => (<Fragment key={f_n}><label style={{ display: "flex", gap: "0.4cqw", alignItems: "flex-start" } as any}><b style={{ flex: "none", width: "3.2cqw", font: "700 0.9cqw/1.5 'Helvetica Neue',Helvetica,Arial", color: "#fff", background: "#427d82", borderRadius: "0.6cqw", textAlign: "center", padding: "0.15cqw 0" } as any}>{f.label}</b><textarea key={f.key} defaultValue={f.v} onBlur={f.save} placeholder={f.ph} rows={1} style={{ all: "unset", boxSizing: "border-box", flex: "1", minWidth: "0", minHeight: "2.3cqw", border: "1px solid #06384a55", background: `${f.bg}`, padding: "0.3cqw 0.5cqw", font: "500 1cqw/1.3 'Helvetica Neue',Helvetica,Arial", whiteSpace: "pre-wrap", cursor: "text", color: "#0d1815" } as any}></textarea></label></Fragment>))}</div>
<div style={{ position: "absolute", left: "79.7%", top: "0.4%", width: "20.5%", height: "33.33%", boxSizing: "border-box", padding: "0.9cqw 1cqw", overflow: "auto", display: "flex", flexDirection: "column", gap: "0.5cqw" } as any}><div style={{ display: "flex", alignItems: "flex-start", gap: "0.4cqw" } as any}><b style={{ flex: "1", font: "800 1.7cqw/1.12 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}>4. Restate problem</b><button onClick={v.rca.z.b4} aria-label="Enlarge this box" title="Enlarge" style={{ all: "unset", cursor: "pointer", flex: "none", font: "800 1.4cqw/1.3 'Helvetica Neue',Helvetica,Arial", color: "#06384a", border: "1.5px solid #06384a", borderRadius: "0.6cqw", padding: "0 0.6cqw", background: "#fff" } as any}>⤢</button><button onClick={v.rca.draft} style={{ cursor: "pointer", padding: "0.1cqw 0.7cqw", borderRadius: "99px", border: "1.5px solid #06384a", background: "#fff", color: "#06384a", font: "700 0.95cqw 'Helvetica Neue',Helvetica,Arial" } as any}>↻ Re-import</button></div>{(v.rca.p4 || []).map((f: any, f_n: number) => (<Fragment key={f_n}><label style={{ display: "flex", gap: "0.4cqw", alignItems: "flex-start" } as any}><b style={{ flex: "none", width: "3.2cqw", font: "700 0.9cqw/1.5 'Helvetica Neue',Helvetica,Arial", color: "#fff", background: "#427d82", borderRadius: "0.6cqw", textAlign: "center", padding: "0.15cqw 0" } as any}>{f.label}</b><textarea key={f.key} defaultValue={f.v} onBlur={f.save} placeholder={f.ph} rows={1} style={{ all: "unset", boxSizing: "border-box", flex: "1", minWidth: "0", minHeight: "2.3cqw", border: "1px solid #06384a55", background: `${f.bg}`, padding: "0.3cqw 0.5cqw", font: "500 1cqw/1.3 'Helvetica Neue',Helvetica,Arial", whiteSpace: "pre-wrap", cursor: "text", color: "#0d1815" } as any}></textarea></label></Fragment>))}</div>
<div style={{ position: "absolute", left: "59.2%", top: "33.6%", width: "20.5%", height: "33.33%", boxSizing: "border-box", padding: "0.9cqw 1cqw", overflow: "auto", display: "flex", flexDirection: "column", gap: "0.5cqw" } as any}><div style={{ display: "flex", alignItems: "flex-start", gap: "0.4cqw" } as any}><b style={{ flex: "1", font: "800 1.7cqw/1.12 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}>2. Root cause analysis</b><button onClick={v.rca.z.fish} aria-label="Enlarge this box" title="Enlarge" style={{ all: "unset", cursor: "pointer", flex: "none", font: "800 1.4cqw/1.3 'Helvetica Neue',Helvetica,Arial", color: "#06384a", border: "1.5px solid #06384a", borderRadius: "0.6cqw", padding: "0 0.6cqw", background: "#fff" } as any}>⤢</button></div><div style={{ font: "600 1cqw/1.4 'Helvetica Neue',Helvetica,Arial", color: "#35534f", marginTop: "0.3cqw" } as any}><span style={{ display: "block" } as any}>{v.rca.z.fishInfo}</span><span style={{ display: "block", color: "#06384a" } as any}>Open any box with ⤢ to enlarge it. Edits show here live.</span></div></div>
<div style={{ position: "absolute", left: "79.7%", top: "33.6%", width: "20.5%", height: "33.33%", boxSizing: "border-box", padding: "0.9cqw 1cqw", overflow: "auto", display: "flex", flexDirection: "column", gap: "0.5cqw" } as any}><div style={{ display: "flex", alignItems: "flex-start", gap: "0.4cqw" } as any}><b style={{ flex: "1", font: "800 1.7cqw/1.12 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}>5. Brainstorm solutions</b><button onClick={v.rca.z.b5} aria-label="Enlarge this box" title="Enlarge" style={{ all: "unset", cursor: "pointer", flex: "none", font: "800 1.4cqw/1.3 'Helvetica Neue',Helvetica,Arial", color: "#06384a", border: "1.5px solid #06384a", borderRadius: "0.6cqw", padding: "0 0.6cqw", background: "#fff" } as any}>⤢</button><button onClick={v.rca.ideas.suggest} style={{ cursor: "pointer", padding: "0.1cqw 0.7cqw", borderRadius: "99px", border: "1.5px solid #06384a", background: "#fff", color: "#06384a", font: "700 0.95cqw 'Helvetica Neue',Helvetica,Arial" } as any}>{v.rca.ideas.sugLabel}</button></div><div style={{ display: "flex", flexWrap: "wrap", gap: "0.4cqw" } as any}>{(v.rca.ideas.list || []).map((i: any, i_n: number) => (<Fragment key={i_n}><div style={{ width: "calc(50% - 0.2cqw)", boxSizing: "border-box", background: "#a0e0f0", border: "1px solid #3b9db5", padding: "0.3cqw 0.4cqw", display: "flex", gap: "0.3cqw", font: "600 0.95cqw/1.2 'Helvetica Neue',Helvetica,Arial" } as any}><span style={{ flex: "1", minWidth: "0" } as any}>{i.t}</span><button onClick={i.star} aria-label="Pick for the backlog (max 3)" title="Pick for the backlog (max 3)" style={{ all: "unset", cursor: "pointer", font: "800 14px/1 'Helvetica Neue',Helvetica,Arial", color: `${i.starC}` } as any}>{i.starL}</button><button onClick={i.up} aria-label="Vote up" style={{ cursor: "pointer", alignSelf: "flex-start", padding: "0 0.4cqw", borderRadius: "99px", border: "1px solid #0d1815", background: `${i.bg}`, font: "800 0.85cqw/1.5 'Helvetica Neue',Helvetica,Arial" } as any}>▲{i.v}</button></div></Fragment>))}</div><input onKeyDown={v.rca.ideas.add} placeholder="+ idea, Enter" style={{ all: "unset", borderBottom: "1.5px dashed #06384a88", padding: "0.2cqw", font: "500 1cqw 'Helvetica Neue',Helvetica,Arial" } as any} /></div>
<div style={{ position: "absolute", left: "59.2%", top: "66.9%", width: "20.5%", height: "33.33%", boxSizing: "border-box", padding: "0.9cqw 1cqw", overflow: "auto", display: "flex", flexDirection: "column", gap: "0.5cqw" } as any}><div style={{ display: "flex", alignItems: "flex-start", gap: "0.4cqw" } as any}><b style={{ flex: "1", font: "800 1.7cqw/1.12 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}>3. Biggest root cause</b><button onClick={v.rca.z.b3} aria-label="Enlarge this box" title="Enlarge" style={{ all: "unset", cursor: "pointer", flex: "none", font: "800 1.4cqw/1.3 'Helvetica Neue',Helvetica,Arial", color: "#06384a", border: "1.5px solid #06384a", borderRadius: "0.6cqw", padding: "0 0.6cqw", background: "#fff" } as any}>⤢</button></div>{v.rca.par.none ? (<><span style={{ font: "500 1cqw/1.35 'Helvetica Neue',Helvetica,Arial", color: "#35534f" } as any}>Vote on the whys. The Pareto fills in here.</span></>) : null}{v.rca.par.has ? (<><div style={{ background: "#b6e05a", border: "1.5px solid #7ea62a", padding: "0.5cqw 0.7cqw", textAlign: "center", font: "600 1.1cqw/1.25 'Helvetica Neue',Helvetica,Arial" } as any}>{v.rca.par.top}</div><svg viewBox="0 0 640 270" style={{ width: "100%", display: "block", background: "#fff", border: "1px solid #06384a66" } as any}>{(v.rca.par.bars || []).map((b: any, b_n: number) => (<Fragment key={b_n}><rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} stroke="#0d1815" strokeWidth="1.5" /></Fragment>))}<polyline points={v.rca.par.line} fill="none" stroke="#e8553f" strokeWidth="3" /><line x1="44" y1={v.rca.par.y80} x2="620" y2={v.rca.par.y80} stroke="#e8553f" strokeDasharray="5 4" /></svg></>) : null}</div>
<div style={{ position: "absolute", left: "79.7%", top: "66.9%", width: "20.5%", height: "33.33%", boxSizing: "border-box", padding: "0.9cqw 1cqw", overflow: "auto", display: "flex", flexDirection: "column", gap: "0.5cqw" } as any}><div style={{ display: "flex", alignItems: "flex-start", gap: "0.4cqw" } as any}><b style={{ flex: "1", font: "800 1.7cqw/1.12 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}>6. Identify improvement backlog items</b><button onClick={v.rca.z.b6} aria-label="Enlarge this box" title="Enlarge" style={{ all: "unset", cursor: "pointer", flex: "none", font: "800 1.4cqw/1.3 'Helvetica Neue',Helvetica,Arial", color: "#06384a", border: "1.5px solid #06384a", borderRadius: "0.6cqw", padding: "0 0.6cqw", background: "#fff" } as any}>⤢</button><span style={{ flex: "none", alignSelf: "center", font: "700 10px 'JetBrains Mono'" } as any}>{v.rca.pickCount}</span><button onClick={v.rca.autoPick} style={{ cursor: "pointer", padding: "5px 10px", borderRadius: "8px", border: "2px solid #06384a", background: "#fff", color: "#06384a", font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>★ Top 3 by votes</button><button onClick={v.rca.copy} style={{ cursor: "pointer", padding: "0.1cqw 0.7cqw", borderRadius: "99px", border: "1.5px solid #06384a", background: "#fff", color: "#06384a", font: "700 0.95cqw 'Helvetica Neue',Helvetica,Arial" } as any}>{v.rca.copyLabel}</button></div>{v.rca.bl.none ? (<><span style={{ font: "500 1cqw/1.35 'Helvetica Neue',Helvetica,Arial", color: "#6b5a3a" } as any}>Pick 3 ideas with ☆ in box 5.</span></>) : null}{(v.rca.bl.items || []).map((b: any, b_n: number) => (<Fragment key={b_n}><div style={{ background: "#ffd7a0", border: "1px solid #c9954a", padding: "0.3cqw 0.5cqw", display: "flex", gap: "0.4cqw", alignItems: "center", font: "600 1cqw/1.2 'Helvetica Neue',Helvetica,Arial", opacity: `${b.op}` } as any}><b style={{ flex: "none" } as any}>{b.n}</b><span style={{ flex: "1", minWidth: "0" } as any}>{b.t}</span><select value={b.st} onChange={b.setSt} aria-label="Status" style={{ cursor: "pointer", flex: "none", border: "1px solid #0d1815", background: "#fff", font: "700 0.85cqw 'Helvetica Neue',Helvetica,Arial" } as any}><option value="To do">To do</option><option value="Doing">Doing</option><option value="Done">Done</option></select></div></Fragment>))}</div>
</div></div></div></>) : null}
{v.rca.show.fish ? (<><div style={{ minWidth: "0", display: "flex", flexDirection: "column", gap: "6px" } as any}><div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } as any}><b style={{ flex: "1", font: "800 clamp(17px,1.9vw,24px) 'Helvetica Neue',Helvetica,Arial", color: "#d3e7ea" } as any}>2. Root cause analysis</b><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".06em", color: "#9fc5cb" } as any}>CLICK A CATEGORY TO FOCUS · DOTS GROW WITH VOTES</span></div>
<div style={{ overflowX: "auto", borderRadius: "12px", background: "#1b2230" } as any}><div style={{ minWidth: "680px", containerType: "inline-size" } as any}><div style={{ position: "relative", width: "100%", aspectRatio: "1000/600" } as any}>
<svg viewBox="0 0 1000 600" style={{ position: "absolute", inset: "0", width: "100%", height: "100%" } as any}><defs><filter id="gl" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5" /></filter></defs>
<line x1="46" y1="300" x2="850" y2="300" stroke="#7d8696" strokeWidth="4" /><polygon points="6,278 52,300 6,322 20,300" fill="#7d8696" />
<path d="M846 226 Q 970 244 992 300 Q 970 356 846 374 Q 884 300 846 226 Z" fill="#8b919d" /><circle cx="946" cy="276" r="7" fill="#fff" />
{(v.rca.fish.bones || []).map((b: any, b_n: number) => (<Fragment key={b_n}><line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke={b.c} strokeWidth={b.sw} strokeLinecap="round" opacity={b.op} /></Fragment>))}
{(v.rca.fish.glows || []).map((g: any, g_n: number) => (<Fragment key={g_n}><circle cx={g.cx} cy={g.cy} r={g.r} fill={g.c} opacity="0.55" filter="url(#gl)" /></Fragment>))}
{(v.rca.fish.dots || []).map((d: any, d_n: number) => (<Fragment key={d_n}><circle cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} stroke={d.c} strokeWidth="3" strokeDasharray={d.dash} opacity={d.op} /></Fragment>))}
{(v.rca.fish.nodes || []).map((n: any, n_n: number) => (<Fragment key={n_n}><g opacity={n.op}><polygon points={n.pts} fill="#1b2230" stroke={n.c} strokeWidth="3" /><text x={n.tx} y={n.ty} textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff" fontFamily="Helvetica Neue, Helvetica, Arial">{n.n}</text></g></Fragment>))}</svg>
{(v.rca.fish.cats || []).map((o: any, o_n: number) => (<Fragment key={o_n}><div style={{ position: "absolute", left: `${o.l}`, top: `${o.t}`, width: "21%", height: "7.4%", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.9cqw", opacity: `${o.op}`, transition: "opacity .2s" } as any}><span style={{ font: "700 2.1cqw 'Helvetica Neue',Helvetica,Arial", color: `${o.c}` } as any}>{o.name}</span>
<button onClick={o.focus} aria-pressed={o.on} title="Focus this category" style={{ cursor: "pointer", flex: "none", position: "relative", width: "5.2cqw", height: "5.2cqw", borderRadius: "99px", border: `${o.bd}`, background: `${o.c}`, color: "#1b2230", font: "800 2.2cqw 'Helvetica Neue',Helvetica,Arial", display: "flex", alignItems: "center", justifyContent: "center", padding: "0", boxShadow: `${o.sh}` } as any}>{o.ini}<span style={{ position: "absolute", right: "-0.6cqw", top: "-0.6cqw", minWidth: "2.1cqw", height: "2.1cqw", borderRadius: "99px", background: "#fff", color: "#1b2230", font: "800 1.2cqw/2.1cqw 'Helvetica Neue',Helvetica,Arial", textAlign: "center" } as any}>{o.votes}</span></button>
<button onClick={o.suggest} title="Suggest likely causes with AI" style={{ cursor: "pointer", flex: "none", padding: "0 0.8cqw", borderRadius: "99px", border: `1.5px solid ${o.c}`, background: "transparent", color: `${o.c}`, font: "700 1.3cqw 'Helvetica Neue',Helvetica,Arial" } as any}>{o.sug}</button></div></Fragment>))}
{(v.rca.fish.slots || []).map((s: any, s_n: number) => (<Fragment key={s_n}><div style={{ position: "absolute", left: `${s.l}`, top: `${s.t}`, width: "17%", height: "6.4%", display: "flex", alignItems: "center", justifyContent: "flex-end", opacity: `${s.op}`, transition: "opacity .2s" } as any}>
{s.filled ? (<><div style={{ display: "flex", alignItems: "center", gap: "0.5cqw", justifyContent: "flex-end", width: "100%" } as any}><div style={{ minWidth: "0", textAlign: "right" } as any}><div style={{ font: "700 1cqw/1 'JetBrains Mono'", color: `${s.c}`, letterSpacing: ".04em" } as any}>{s.num}</div><div style={{ font: "600 1.3cqw/1.15 'Helvetica Neue',Helvetica,Arial", color: "#f1f4f8", display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden" } as any} title={s.tx}>{s.tx}</div></div>
<div style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2cqw" } as any}><button onClick={s.up} aria-label="Vote up" style={{ cursor: "pointer", padding: "0 0.6cqw", borderRadius: "99px", border: `1.5px solid ${s.c}`, background: `${s.bg}`, color: `${s.fg}`, font: "800 1.1cqw/1.5 'Helvetica Neue',Helvetica,Arial" } as any}>▲{s.v}</button><button onClick={s.del} aria-label="Delete" style={{ all: "unset", cursor: "pointer", color: "#ff8a7a", font: "700 1.3cqw/1 'Helvetica Neue',Helvetica,Arial" } as any}>×</button></div></div></>) : null}
{s.input ? (<><input onKeyDown={s.add} onBlur={s.blur} placeholder={s.ph} style={{ all: "unset", boxSizing: "border-box", width: "100%", textAlign: "right", padding: "0 0.4cqw", borderBottom: `1.5px dashed ${s.c}`, font: "500 1.3cqw 'Helvetica Neue',Helvetica,Arial", color: "#fff" } as any} /></>) : null}</div></Fragment>))}
<div style={{ position: "absolute", left: "86.4%", top: "42%", width: "10.6%", height: "16%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", font: "800 1.3cqw/1.15 'Helvetica Neue',Helvetica,Arial", color: "#1b2230", overflow: "hidden" } as any}>{v.rca.fish.headText}</div>
<div style={{ position: "absolute", left: "78%", top: "64%", width: "21%", display: "flex", flexDirection: "column", gap: "0.3cqw", alignItems: "flex-end", textAlign: "right" } as any}><span style={{ font: "700 1cqw 'JetBrains Mono'", letterSpacing: ".06em", color: "#9fb0c4" } as any}>{v.rca.fish.topLabel}</span><span style={{ font: "700 1.5cqw/1.2 'Helvetica Neue',Helvetica,Arial", color: "#fff" } as any}>{v.rca.fish.top}</span></div>
</div></div></div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" } as any}><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#9fc5cb" } as any}>CAUSE TICKETS · EACH ARROW IS A “WHY?” · VOTE ON EACH TICKET BY ITSELF</span>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,250px),1fr))", gap: "12px", alignItems: "start" } as any}>
{(v.rca.branches || []).map((p: any, p_n: number) => (<Fragment key={p_n}>
<div style={{ background: "#1b2230", border: `2px solid ${p.c}`, borderRadius: "12px", overflow: "hidden", opacity: `${p.op}` } as any}><div style={{ background: `${p.c}`, color: "#1b2230", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px" } as any}><b style={{ flex: "1", font: "800 17px 'Helvetica Neue',Helvetica,Arial" } as any}>{p.name}</b><span style={{ font: "700 12px 'JetBrains Mono'" } as any}>{p.count}/5</span><button onClick={p.suggest} title="Suggest likely causes with AI" style={{ cursor: "pointer", padding: "2px 9px", borderRadius: "99px", border: "2px solid #1b2230", background: "transparent", color: "#1b2230", font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>{p.sug}</button></div>
<div style={{ padding: "12px", display: "flex", flexDirection: "column", alignItems: "stretch" } as any}>
{(p.tickets || []).map((k: any, k_n: number) => (<Fragment key={k_n}><div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" } as any}>
{k.arrow ? (<><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "34px", color: `${p.c}`, font: "700 11px 'JetBrains Mono'", letterSpacing: ".08em" } as any}><span style={{ width: "2px", height: "100%", background: `${p.c}`, display: "block" } as any}></span><span>▼ WHY?</span></div></>) : null}
<div style={{ background: `${k.bg}`, border: `2px solid ${p.c}`, borderRadius: "8px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: `${k.sh}` } as any}><span style={{ font: "700 11px 'JetBrains Mono'", letterSpacing: ".08em", color: `${p.c}` } as any}>{k.label}</span>
<textarea key={k.key} defaultValue={k.t} onBlur={k.save} rows={2} aria-label={k.label} style={{ all: "unset", boxSizing: "border-box", width: "100%", font: "600 15px/1.35 'Helvetica Neue',Helvetica,Arial", color: "#f1f4f8", whiteSpace: "pre-wrap", cursor: "text", minHeight: "40px" } as any}></textarea>
<div style={{ display: "flex", alignItems: "center", gap: "8px" } as any}><button onClick={k.up} aria-label="Vote for this ticket" style={{ cursor: "pointer", flex: "1", padding: "8px 12px", borderRadius: "99px", border: `2px solid ${p.c}`, background: `${k.vbg}`, color: `${k.vfg}`, font: "800 15px 'Helvetica Neue',Helvetica,Arial" } as any}>▲ Vote · {k.v}</button><button onClick={k.down} aria-label="Remove a vote" style={{ cursor: "pointer", width: "36px", height: "36px", borderRadius: "99px", border: "2px solid #4b5568", background: "transparent", color: "#cdd5e2", font: "800 16px 'Helvetica Neue',Helvetica,Arial" } as any}>−</button><button onClick={k.del} aria-label="Delete ticket" style={{ cursor: "pointer", width: "36px", height: "36px", borderRadius: "99px", border: "2px solid #4b5568", background: "transparent", color: "#ff8a7a", font: "800 16px 'Helvetica Neue',Helvetica,Arial" } as any}>×</button></div></div></div></Fragment>))}
{p.canAdd ? (<><div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" } as any}>{p.hasAny ? (<><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "30px", color: `${p.c}`, font: "700 11px 'JetBrains Mono'", letterSpacing: ".08em" } as any}><span style={{ width: "2px", height: "100%", background: `${p.c}`, display: "block", opacity: ".5" } as any}></span><span>▼ WHY?</span></div></>) : null}
<input onKeyDown={p.add} onBlur={p.blur} placeholder={p.ph} style={{ all: "unset", boxSizing: "border-box", border: `2px dashed ${p.c}`, borderRadius: "8px", padding: "12px", font: "500 14px 'Helvetica Neue',Helvetica,Arial", color: "#fff" } as any} /></div></>) : null}
</div></div></Fragment>))}</div></div>
</div>

</>) : null}
{v.rca.show.right ? (<><div style={{ display: "grid", gridTemplateColumns: `${v.rca.rightCols}`, gap: "8px" } as any}>
{v.rca.show.b1 ? (<><div style={{ background: "#d3e7ea", border: "4px solid #4a8a93", minWidth: "0", display: "flex", flexDirection: "column" } as any}><div style={{ padding: "10px 14px 4px", display: "flex", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" } as any}><b style={{ flex: "1", minWidth: "140px", font: "800 clamp(17px,1.9vw,24px)/1.15 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}>1. Original problem statement</b></div><div style={{ padding: "6px 14px 14px", display: "flex", flexDirection: "column", gap: "8px" } as any}>{(v.rca.p1 || []).map((f: any, f_n: number) => (<Fragment key={f_n}><div style={{ display: "flex", flexDirection: "column", gap: "3px" } as any}><span style={{ position: "relative", flex: "none", alignSelf: "flex-start", background: "#427d82", border: "2px solid #2b565a", color: "#fff", borderRadius: "10px", padding: "2px 12px", font: "600 14px 'Helvetica Neue',Helvetica,Arial" } as any}>{f.label}</span><textarea key={f.key} defaultValue={f.v} onBlur={f.save} placeholder={f.ph} rows={2} style={{ all: "unset", boxSizing: "border-box", width: "100%", border: "1.5px solid #06384a55", borderRadius: "4px", background: `${f.bg}`, padding: "6px 8px", minHeight: "44px", font: "500 13px/1.35 'Helvetica Neue',Helvetica,Arial", whiteSpace: "pre-wrap", cursor: "text", color: "#0d1815" } as any}></textarea></div></Fragment>))}</div></div></>) : null}
{v.rca.show.b4 ? (<><div style={{ background: "#d3e7ea", border: "4px solid #4a8a93", minWidth: "0", display: "flex", flexDirection: "column" } as any}><div style={{ padding: "10px 14px 4px", display: "flex", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" } as any}><b style={{ flex: "1", minWidth: "140px", font: "800 clamp(17px,1.9vw,24px)/1.15 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}>4. Restate problem</b><button onClick={v.rca.draft} style={{ cursor: "pointer", padding: "5px 10px", borderRadius: "8px", border: "2px solid #06384a", background: "#fff", color: "#06384a", font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>↻ Re-import 1 + 3</button></div><div style={{ padding: "6px 14px 14px", display: "flex", flexDirection: "column", gap: "8px" } as any}>{(v.rca.p4 || []).map((f: any, f_n: number) => (<Fragment key={f_n}><div style={{ display: "flex", flexDirection: "column", gap: "3px" } as any}><span style={{ position: "relative", flex: "none", alignSelf: "flex-start", background: "#427d82", border: "2px solid #2b565a", color: "#fff", borderRadius: "10px", padding: "2px 12px", font: "600 14px 'Helvetica Neue',Helvetica,Arial" } as any}>{f.label}</span><textarea key={f.key} defaultValue={f.v} onBlur={f.save} placeholder={f.ph} rows={2} style={{ all: "unset", boxSizing: "border-box", width: "100%", border: "1.5px solid #06384a55", borderRadius: "4px", background: `${f.bg}`, padding: "6px 8px", minHeight: "44px", font: "500 13px/1.35 'Helvetica Neue',Helvetica,Arial", whiteSpace: "pre-wrap", cursor: "text", color: "#0d1815" } as any}></textarea></div></Fragment>))}</div></div></>) : null}
{v.rca.show.guide ? (<><div style={{ background: "#fff", border: "4px solid #4a8a93", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "8px", minWidth: "0" } as any}><b style={{ font: "700 13px 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}>Anatomy of a well-defined problem: think about the ‘what,’ ‘when,’ ‘where,’ and ‘impact’</b>
<div style={{ font: "500 12.5px/1.45 'Helvetica Neue',Helvetica,Arial", color: "#0d1815", textAlign: "center" } as any}>We discovered <u>three significant design problems</u> in the <u>October</u> deployment of the new EMV vehicles at the <u>Thrills Amusement Park</u>. The design flaws caused us to recall the vehicles and invest three months in materials, redesign, and testing. We delivered late, paid substantial penalties, and lost credibility with the customer.</div>
<div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" } as any}><span style={{ background: "#427d82", color: "#fff", borderRadius: "8px", padding: "2px 10px", font: "600 12px 'Helvetica Neue',Helvetica,Arial" } as any}>What</span><span style={{ background: "#427d82", color: "#fff", borderRadius: "8px", padding: "2px 10px", font: "600 12px 'Helvetica Neue',Helvetica,Arial" } as any}>When</span><span style={{ background: "#427d82", color: "#fff", borderRadius: "8px", padding: "2px 10px", font: "600 12px 'Helvetica Neue',Helvetica,Arial" } as any}>Where</span><span style={{ background: "#427d82", color: "#fff", borderRadius: "8px", padding: "2px 10px", font: "600 12px 'Helvetica Neue',Helvetica,Arial" } as any}>Impact</span></div></div></>) : null}
{v.rca.show.exm ? (<><div style={{ background: "#d3e7ea", border: "4px solid #427d82", borderRadius: "24px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "6px", minWidth: "0", font: "500 13px/1.45 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}><b>Example:</b><span>We did not have the ability to measure or test the full electrical load on vehicles in real operating conditions.</span><b>Impact:</b><span>We had to upgrade the deployed power distribution system beyond what was specified. Major cost and schedule overrun.</span></div></>) : null}
{v.rca.show.vote ? (<><div style={{ background: "#fff", border: "4px solid #4a8a93", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px", minWidth: "0" } as any}><b style={{ font: "700 13px 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}>Dot vote on the causes from your fishbone</b>{v.rca.noWhys ? (<><span style={{ font: "500 12.5px/1.4 'Helvetica Neue',Helvetica,Arial", color: "#35534f" } as any}>No causes yet. Add them in the root cause analysis step.</span></>) : null}{(v.rca.votes || []).map((v: any, v_n: number) => (<Fragment key={v_n}><div style={{ display: "flex", gap: "8px", alignItems: "center", borderLeft: `5px solid ${v.c}`, padding: "3px 0 3px 8px" } as any}><span style={{ flex: "1", minWidth: "0", font: "600 12.5px/1.3 'Helvetica Neue',Helvetica,Arial" } as any}>{v.t}<i style={{ display: "block", font: "700 9px 'JetBrains Mono'", fontStyle: "normal", color: "#4d5a52" } as any}>{v.b}</i></span><button onClick={v.up} style={{ cursor: "pointer", padding: "1px 9px", borderRadius: "99px", border: "1.5px solid #0d1815", background: `${v.bg}`, font: "800 11px 'Helvetica Neue',Helvetica,Arial" } as any}>▲{v.v}</button></div></Fragment>))}</div></>) : null}
{v.rca.show.b5 ? (<><div style={{ background: "#d3e7ea", border: "4px solid #4a8a93", minWidth: "0", display: "flex", flexDirection: "column" } as any}><div style={{ padding: "10px 14px 4px", display: "flex", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" } as any}><b style={{ flex: "1", minWidth: "140px", font: "800 clamp(17px,1.9vw,24px)/1.15 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}>5. Brainstorm solutions</b><button onClick={v.rca.ideas.suggest} style={{ cursor: "pointer", padding: "5px 10px", borderRadius: "8px", border: "2px solid #06384a", background: "#fff", color: "#06384a", font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>{v.rca.ideas.sugLabel}</button></div>
<div style={{ padding: "6px 14px 14px", display: "flex", flexDirection: "column", gap: "8px", flex: "1" } as any}>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" } as any}>{(v.rca.ideas.list || []).map((i: any, i_n: number) => (<Fragment key={i_n}><div style={{ width: "calc(50% - 4px)", boxSizing: "border-box", background: "#a0e0f0", border: "1.5px solid #3b9db5", borderRadius: "2px 2px 9px 2px", padding: "6px 8px", display: "flex", gap: "6px", boxShadow: "1px 2px 0 #0003" } as any}><span style={{ flex: "1", minWidth: "0", font: "600 12.5px/1.3 'Helvetica Neue',Helvetica,Arial" } as any}>{i.t}</span><span style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" } as any}><button onClick={i.star} aria-label="Pick for the backlog (max 3)" title="Pick for the backlog (max 3)" style={{ all: "unset", cursor: "pointer", font: "800 14px/1 'Helvetica Neue',Helvetica,Arial", color: `${i.starC}` } as any}>{i.starL}</button><button onClick={i.up} aria-label="Vote up" style={{ cursor: "pointer", padding: "0 6px", borderRadius: "99px", border: "1.5px solid #0d1815", background: `${i.bg}`, font: "800 11px 'Helvetica Neue',Helvetica,Arial" } as any}>▲{i.v}</button><span style={{ display: "flex", gap: "6px" } as any}><button onClick={i.down} aria-label="Remove a vote" style={{ all: "unset", cursor: "pointer", font: "700 12px 'Helvetica Neue',Helvetica,Arial", color: "#4d5a52" } as any}>−</button><button onClick={i.del} aria-label="Delete" style={{ all: "unset", cursor: "pointer", font: "700 12px 'Helvetica Neue',Helvetica,Arial", color: "#b4235f" } as any}>×</button></span></span></div></Fragment>))}</div>
<input onKeyDown={v.rca.ideas.add} placeholder="+ idea, press Enter" style={{ all: "unset", boxSizing: "border-box", borderBottom: "1.5px dashed #06384a88", padding: "4px 2px", font: "500 13px 'Helvetica Neue',Helvetica,Arial" } as any} /></div></div></>) : null}
{v.rca.show.b3 ? (<><div style={{ background: "#d3e7ea", border: "4px solid #4a8a93", minWidth: "0", display: "flex", flexDirection: "column" } as any}><div style={{ padding: "10px 14px 4px", display: "flex", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" } as any}><b style={{ flex: "1", minWidth: "140px", font: "800 clamp(17px,1.9vw,24px)/1.15 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}>3. Biggest root cause</b></div>
<div style={{ padding: "6px 14px 14px", display: "flex", flexDirection: "column", gap: "10px" } as any}>
{v.rca.par.none ? (<><div style={{ border: "2px dashed #06384a66", padding: "14px", font: "500 13px/1.4 'Helvetica Neue',Helvetica,Arial", color: "#35534f" } as any}>Vote on the whys in box 2. The Pareto ranks them here automatically.</div></>) : null}
{v.rca.par.has ? (<><div style={{ alignSelf: "center", maxWidth: "90%", background: "#b6e05a", border: "2px solid #7ea62a", padding: "12px 16px", textAlign: "center", font: "600 15px/1.35 'Helvetica Neue',Helvetica,Arial", boxShadow: "2px 3px 0 #0003" } as any}>{v.rca.par.top}</div>
<svg viewBox="0 0 640 270" style={{ width: "100%", display: "block", background: "#fff", border: "1.5px solid #06384a" } as any} fontFamily="Helvetica Neue, Helvetica, Arial">
{(v.rca.par.grid || []).map((g: any, g_n: number) => (<Fragment key={g_n}><g><line x1="44" y1={g.y} x2="620" y2={g.y} stroke="#0d181833" /><text x="36" y={g.ty} textAnchor="end" fontSize="12" fill="#4d5a52">{g.l}</text></g></Fragment>))}
{(v.rca.par.bars || []).map((b: any, b_n: number) => (<Fragment key={b_n}><g><rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} stroke="#0d1815" strokeWidth="1.5" /><text x={b.cx} y={b.ly} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0d1815">{b.rank}</text></g></Fragment>))}
<polyline points={v.rca.par.line} fill="none" stroke="#e8553f" strokeWidth="2.5" /><line x1="44" y1={v.rca.par.y80} x2="620" y2={v.rca.par.y80} stroke="#e8553f" strokeDasharray="5 4" /><text x="618" y={v.rca.par.y80t} textAnchor="end" fontSize="11" fill="#e8553f" fontWeight="700">80% of votes</text></svg>
<div style={{ display: "flex", flexDirection: "column", gap: "5px" } as any}>{(v.rca.par.rows || []).map((r: any, r_n: number) => (<Fragment key={r_n}><div style={{ display: "flex", gap: "8px", alignItems: "center", background: `${r.bg}`, padding: "5px 9px" } as any}><b style={{ flex: "none", font: "800 12px 'Helvetica Neue',Helvetica,Arial" } as any}>{r.rank}</b><div style={{ flex: "1", minWidth: "0", font: "600 12px/1.3 'Helvetica Neue',Helvetica,Arial" } as any}><span style={{ font: "700 9px 'JetBrains Mono'", color: "#2b5d61" } as any}>{r.b}</span><div>{r.t}</div></div><span style={{ flex: "none", font: "700 10px 'JetBrains Mono'", textAlign: "right" } as any}>{r.v} votes<br />{r.cum}%</span></div></Fragment>))}</div></>) : null}</div></div></>) : null}
{v.rca.show.b6 ? (<><div style={{ background: "#d3e7ea", border: "4px solid #4a8a93", minWidth: "0", display: "flex", flexDirection: "column" } as any}><div style={{ padding: "10px 14px 4px", display: "flex", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" } as any}><b style={{ flex: "1", minWidth: "140px", font: "800 clamp(17px,1.9vw,24px)/1.15 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}>6. Identify improvement backlog items</b><span style={{ flex: "none", alignSelf: "center", font: "700 10px 'JetBrains Mono'" } as any}>{v.rca.pickCount}</span><button onClick={v.rca.autoPick} style={{ cursor: "pointer", padding: "5px 10px", borderRadius: "8px", border: "2px solid #06384a", background: "#fff", color: "#06384a", font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>★ Top 3 by votes</button><button onClick={v.rca.copy} style={{ cursor: "pointer", padding: "5px 10px", borderRadius: "8px", border: "2px solid #06384a", background: "#fff", color: "#06384a", font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>{v.rca.copyLabel}</button></div>
<div style={{ padding: "6px 14px 14px", display: "flex", flexDirection: "column", gap: "8px" } as any}>
{v.rca.bl.none ? (<><div style={{ border: "2px dashed #06384a66", padding: "14px", font: "500 13px/1.4 'Helvetica Neue',Helvetica,Arial", color: "#35534f" } as any}>Pick the top 3 ideas with ☆ in box 5, or press “★ Top 3 by votes”.</div></>) : null}
{(v.rca.bl.items || []).map((b: any, b_n: number) => (<Fragment key={b_n}><div style={{ background: "#ffd7a0", border: "1.5px solid #c9954a", padding: "7px 9px", display: "flex", flexDirection: "column", gap: "5px", opacity: `${b.op}`, boxShadow: "1px 2px 0 #0003" } as any}><div style={{ display: "flex", gap: "8px", alignItems: "flex-start" } as any}><b style={{ flex: "none", font: "800 12px 'Helvetica Neue',Helvetica,Arial" } as any}>{b.n}</b><span style={{ flex: "1", font: "600 12.5px/1.3 'Helvetica Neue',Helvetica,Arial" } as any}>{b.t}</span><span style={{ font: "700 10px 'JetBrains Mono'" } as any}>{b.v}▲</span></div>
<div style={{ display: "flex", gap: "8px", flexWrap: "wrap" } as any}><select value={b.st} onChange={b.setSt} aria-label="Status" style={{ cursor: "pointer", padding: "3px 6px", borderRadius: "5px", border: "1.5px solid #0d1815", background: "#fff", font: "700 11px 'Helvetica Neue',Helvetica,Arial" } as any}><option value="To do">To do</option><option value="Doing">Doing</option><option value="Done">Done</option></select><input key={b.key} defaultValue={b.own} onBlur={b.setOwn} placeholder="Owner" style={{ all: "unset", flex: "1", minWidth: "70px", borderBottom: "1.5px dashed #0d181888", font: "500 12px 'Helvetica Neue',Helvetica,Arial" } as any} /></div></div></Fragment>))}</div></div></>) : null}
</div></>) : null}
</div></div>

    </>
  );
}

export function MetView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", gap: "14px" } as any}>
<span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>1 · SELECT THE FLOW METRICS THAT WOULD GIVE YOUR ART THE MOST VALUE</span>
<div style={{ display: "flex", gap: "8px", flexWrap: "wrap" } as any}>{(v.met.chips || []).map((c: any, c_n: number) => (<Fragment key={c_n}><button onClick={c.go} aria-pressed={c.on} style={{ cursor: "pointer", padding: "9px 16px", borderRadius: "10px", border: "2px solid #0d1815", background: `${c.bg}`, font: "700 14px 'Helvetica Neue',Helvetica,Arial", boxShadow: `${c.sh}` } as any}>{c.mark}{c.label}</button></Fragment>))}</div>
{v.met.none ? (<><div style={{ border: "2px dashed #0d181866", borderRadius: "8px", padding: "18px", font: "500 14px 'Helvetica Neue',Helvetica,Arial", color: "#4d5a52" } as any}>Pick at least one metric to capture its purpose, data source and action.</div></>) : null}
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "12px" } as any}>
{(v.met.cards || []).map((m: any, m_n: number) => (<Fragment key={m_n}>
<div style={{ border: "2px solid #0d1815", borderRadius: "8px", background: "#fffaf0", boxShadow: "3px 3px 0 #0d1815", overflow: "hidden" } as any}><div style={{ background: "#ffd37a", borderBottom: "2px solid #0d1815", padding: "9px 14px", font: "800 16px Syne" } as any}>{m.name}</div>
<div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px" } as any}>{(m.fields || []).map((f: any, f_n: number) => (<Fragment key={f_n}><div style={{ display: "flex", flexDirection: "column", gap: "4px" } as any}><b style={{ font: "700 13px 'Helvetica Neue',Helvetica,Arial" } as any}>{f.l}</b><span style={{ font: "500 12px/1.3 'Helvetica Neue',Helvetica,Arial", color: "#4d5a52" } as any}>{f.q}</span><textarea key={f.key} defaultValue={f.v} onBlur={f.save} placeholder="…" rows={2} style={{ all: "unset", boxSizing: "border-box", border: "1.5px solid #0d181866", borderRadius: "6px", background: "#fff", padding: "8px 10px", minHeight: "64px", font: "500 14px/1.45 'Helvetica Neue',Helvetica,Arial", whiteSpace: "pre-wrap", cursor: "text" } as any}></textarea></div></Fragment>))}</div></div></Fragment>))}</div>
<span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>2 · HOW DOES YOUR ART KANBAN SUPPORT VISUALIZING THESE METRICS? WHAT ADJUSTMENTS WOULD HELP YOU SEE OR TRACK FLOW MORE EFFECTIVELY?</span>
<textarea key={v.met.rk} defaultValue={v.met.rv} onBlur={v.met.rs} placeholder="…" rows={3} style={{ all: "unset", boxSizing: "border-box", border: "1.5px solid #0d181866", borderRadius: "6px", background: "#fff", padding: "8px 10px", minHeight: "64px", font: "500 14px/1.45 'Helvetica Neue',Helvetica,Arial", whiteSpace: "pre-wrap", cursor: "text" } as any}></textarea>
</div>

    </>
  );
}

export function CtxView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", gap: "14px" } as any}>
<div style={{ display: "flex", gap: "16px", alignItems: "flex-start", border: "2px solid #0d1815", borderRadius: "8px", background: "#fffaf0", padding: "16px 18px", boxShadow: "3px 3px 0 #0d1815" } as any}><div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "6px" } as any}><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>THE SCENARIO</span><span style={{ font: "italic 500 16px/1.55 'Helvetica Neue',Helvetica,Arial" } as any}>Your organization’s AI widget analyzed your PI 3 flow metric data and generated a summary report and recommended insights. However, the widget is missing a critical piece of operational context: Midway through PI 3, three teams were redirected for two iterations to address an emergency security vulnerability. Planned feature work stopped, and unplanned remediation work took its place. The risk was successfully resolved, but the metrics reflect an ART operating under highly abnormal conditions.</span></div><span style={{ flex: "none", width: "44px", height: "44px", background: "#4a7c7e", clipPath: "polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)" } as any}></span></div>
<span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>{v.ctx.label}</span>
<div style={{ display: "flex", gap: "8px", alignItems: "center" } as any}><input onKeyDown={v.ctx.add} placeholder={v.ctx.ph} style={{ all: "unset", boxSizing: "border-box", flex: "1", border: "1.5px dashed #0d181899", borderRadius: "8px", padding: "10px 12px", font: "500 14px 'Helvetica Neue',Helvetica,Arial", background: "#fffaf0", opacity: `${v.ctx.op}` } as any} /></div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "12px" } as any}>
{(v.ctx.items || []).map((i: any, i_n: number) => (<Fragment key={i_n}>
<div style={{ border: "2px solid #0d1815", borderRadius: "8px", background: "#fffaf0", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "3px 3px 0 #0d1815" } as any}>
<div style={{ display: "flex", gap: "10px", alignItems: "flex-start" } as any}><span style={{ flex: "none", width: "26px", height: "26px", borderRadius: "99px", background: "#ffb627", border: "2px solid #0d1815", font: "800 13px Syne", display: "flex", alignItems: "center", justifyContent: "center" } as any}>{i.n}</span><b style={{ flex: "1", font: "700 15px/1.35 'Helvetica Neue',Helvetica,Arial" } as any}>{i.t}</b><button onClick={i.del} aria-label="Remove" style={{ all: "unset", cursor: "pointer", color: "#b4235f", font: "700 16px 'Helvetica Neue',Helvetica,Arial" } as any}>×</button></div>
<div style={{ display: "flex", gap: "6px", flexWrap: "wrap" } as any}>{(i.opts || []).map((o: any, o_n: number) => (<Fragment key={o_n}><button onClick={o.go} style={{ cursor: "pointer", padding: "7px 12px", borderRadius: "99px", border: "2px solid #0d1815", background: `${o.bg}`, font: "700 12.5px 'Helvetica Neue',Helvetica,Arial" } as any}>{o.label}</button></Fragment>))}</div>
<textarea key={i.key} defaultValue={i.why} onBlur={i.save} placeholder="Why? What context is the widget missing?" rows={3} style={{ all: "unset", boxSizing: "border-box", border: "1.5px solid #0d181866", borderRadius: "6px", background: "#fff", padding: "8px 10px", minHeight: "64px", font: "500 14px/1.45 'Helvetica Neue',Helvetica,Arial", whiteSpace: "pre-wrap", cursor: "text" } as any}></textarea></div></Fragment>))}</div>
</div>

    </>
  );
}

export function AccView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", gap: "12px" } as any}>
<div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" } as any}><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>EXAMPLE PROBLEMS SURFACED · EACH ACCELERATOR CAN BE USED ONCE · METRICS CAN REPEAT</span><span style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: "99px", border: "2px solid #0d1815", background: "#cfe8d4", font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>{v.acc.tally}</span></div>
{(v.acc.rows || []).map((r: any, r_n: number) => (<Fragment key={r_n}>
<div style={{ border: "2px solid #0d1815", borderRadius: "8px", background: `${r.bg}`, padding: "14px 16px", display: "grid", gridTemplateColumns: "36px minmax(0,1.3fr) minmax(0,1fr)", gap: "8px 16px", boxShadow: "3px 3px 0 #0d1815" } as any}>
<span style={{ width: "30px", height: "30px", borderRadius: "99px", background: "#ffb627", border: "2px solid #0d1815", font: "800 14px Syne", display: "flex", alignItems: "center", justifyContent: "center" } as any}>{r.n}</span>
<span style={{ font: "500 14.5px/1.5 'Helvetica Neue',Helvetica,Arial" } as any}>{r.t}</span>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" } as any}><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>FLOW ACCELERATOR</span>
<select value={r.val} onChange={r.pick} aria-label={`Flow accelerator for problem ${r.n}`} style={{ cursor: "pointer", padding: "8px 10px", borderRadius: "8px", border: "2px solid #0d1815", background: "#fff", font: "700 14px 'Helvetica Neue',Helvetica,Arial" } as any}><option value="">Choose one…</option>{(r.opts || []).map((o: any, o_n: number) => (<Fragment key={o_n}><option value={o.v} disabled={o.dis}>{o.l}</option></Fragment>))}</select>
<span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>FLOW METRICS (ANY)</span>
<div style={{ display: "flex", gap: "6px", flexWrap: "wrap" } as any}>{(r.mets || []).map((m: any, m_n: number) => (<Fragment key={m_n}><button onClick={m.go} aria-pressed={m.on} style={{ cursor: "pointer", padding: "5px 10px", borderRadius: "99px", border: "2px solid #0d1815", background: `${m.bg}`, font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>{m.label}</button></Fragment>))}</div></div>
</div></Fragment>))}
</div>

    </>
  );
}

export function WheelView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", gap: "14px" } as any}>
<div style={{ background: "#ffd37a", border: "2px solid #0d1815", borderRadius: "8px", padding: "14px 18px", font: "800 clamp(17px,1.8vw,22px)/1.3 Syne", boxShadow: "3px 3px 0 #0d1815" } as any}>{v.ex.prompt}</div>
<div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" } as any}>
<div style={{ flex: "1 1 340px", maxWidth: "460px", margin: "0 auto" } as any}><svg viewBox="0 0 440 440" style={{ width: "100%", display: "block" } as any} fontFamily="Helvetica Neue, Helvetica, Arial">
{(v.wheel.segs || []).map((g: any, g_n: number) => (<Fragment key={g_n}><path onClick={g.go} d={g.d} fill={g.fill} stroke="#0d1815" strokeWidth={g.sw} style={{ cursor: "pointer" } as any} /></Fragment>))}
<circle cx="220" cy="220" r="62" fill="#0d1815" /><text x="220" y="230" textAnchor="middle" fontSize="28" fontWeight="800" fill="#f3ead3" fontFamily="Syne">RTE</text>
{(v.wheel.labels || []).map((t: any, t_n: number) => (<Fragment key={t_n}><text x={t.x} y={t.y} textAnchor="middle" fontSize="15" fontWeight="700" fill="#0d1815" style={{ pointerEvents: "none" } as any}>{t.t}</text></Fragment>))}
{(v.wheel.badges || []).map((b: any, b_n: number) => (<Fragment key={b_n}><g style={{ pointerEvents: "none" } as any}><circle cx={b.x} cy={b.y} r="13" fill="#ff3d8f" stroke="#0d1815" strokeWidth="2" /><text x={b.x} y={b.ty} textAnchor="middle" fontSize="13" fontWeight="800" fill="#0d1815">{b.n}</text></g></Fragment>))}
</svg></div>
<div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: "10px", border: "2px solid #0d1815", borderRadius: "8px", background: "#fffaf0", padding: "14px 16px", boxShadow: "3px 3px 0 #0d1815" } as any}>
<span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>{v.wheel.hint}</span>
<b style={{ font: "800 20px/1.15 Syne" } as any}>{v.wheel.title}</b>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px", minHeight: "40px" } as any}>{(v.wheel.list || []).map((s: any, s_n: number) => (<Fragment key={s_n}><span style={{ background: `${s.c}`, padding: "8px 12px", border: "2px solid #0d1815", borderRadius: "6px", font: "600 14px/1.3 'Helvetica Neue',Helvetica,Arial", boxShadow: "2px 2px 0 #0d1815", transform: `rotate(${s.rot})` } as any}>{s.t}</span></Fragment>))}</div>
<input onKeyDown={v.wheel.add} placeholder="Why would this be hard for you? Press Enter" style={{ all: "unset", boxSizing: "border-box", borderBottom: "1.5px dashed #0d181888", padding: "5px 2px", font: "500 14px 'Helvetica Neue',Helvetica,Arial" } as any} />
</div></div></div>

    </>
  );
}

export function EvtView({ v }: { v: any }) {
  return (
    <>

<div style={{ border: "2px solid #0d1815", borderRadius: "8px", overflow: "hidden", background: "#fff", boxShadow: "3px 3px 0 #0d1815" } as any}>
<div style={{ background: "#06384a", color: "#fff", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap" } as any}><b style={{ font: "800 20px Syne" } as any}>ART Event:</b>
<select value={v.evt.sel} onChange={v.evt.pick} aria-label="Choose an ART event" style={{ cursor: "pointer", padding: "8px 14px", borderRadius: "8px", border: "2px solid #ffb627", background: "#fff", color: "#0d1815", font: "700 16px 'Helvetica Neue',Helvetica,Arial", minWidth: "200px" } as any}><option value="">Choose an event…</option>{(v.evt.events || []).map((o: any, o_n: number) => (<Fragment key={o_n}><option value={o}>{o}</option></Fragment>))}</select></div>
{(v.evt.rows || []).map((r: any, r_n: number) => (<Fragment key={r_n}>
<div style={{ display: "grid", gridTemplateColumns: "minmax(120px,200px) minmax(0,1fr)", borderTop: "2px solid #06384a" } as any}>
<div style={{ background: "#dfeef0", padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "4px", borderRight: "2px solid #06384a" } as any}><b style={{ font: "800 17px/1.2 'Helvetica Neue',Helvetica,Arial", color: "#06384a" } as any}>{r.t}</b><span style={{ font: "500 12px/1.3 'Helvetica Neue',Helvetica,Arial", color: "#35534f" } as any}>{r.hint}</span></div>
<textarea defaultValue={r.v} key={r.key} onBlur={r.save} placeholder={v.evt.ph} rows={3} style={{ all: "unset", boxSizing: "border-box", padding: "12px 14px", minHeight: "78px", font: "500 15px/1.45 'Helvetica Neue',Helvetica,Arial", whiteSpace: "pre-wrap", cursor: "text" } as any}></textarea></div></Fragment>))}
</div>

    </>
  );
}

export function KanView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", gap: "10px" } as any}>
<div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } as any}><span style={{ flex: "1", minWidth: "240px", font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>STARTS FROM THE EXAMPLE BOARD · RENAME, SET WIP LIMITS, WRITE POLICIES, PRESS + BETWEEN COLUMNS TO ADD ONE THERE, DRAG CARDS</span>
<button onClick={v.kan.reset} style={{ cursor: "pointer", padding: "6px 12px", borderRadius: "8px", border: "2px solid #0d1815", background: "#fff", font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>Reset to example</button>
</div>
<div style={{ overflowX: "auto", paddingBottom: "6px" } as any}><div style={{ display: "flex", minWidth: "max-content", border: "2px solid #0d1815", borderRadius: "8px", background: "#fff", boxShadow: "3px 3px 0 #0d1815" } as any}>
{(v.kan.cols || []).map((c: any, c_n: number) => (<Fragment key={c_n}><div key={c.key} style={{ display: "flex" } as any}>
<div style={{ flex: "none", width: "26px", background: "#efe8d8", display: "flex", justifyContent: "center", paddingTop: "34px", borderLeft: `${c.gbl}` } as any}><button onClick={c.addBefore} aria-label="Add a column here" title="Add a column here" style={{ cursor: "pointer", width: "22px", height: "22px", padding: "0", borderRadius: "99px", border: "2px solid #0d1815", background: "#ffb627", font: "800 14px/1 'Helvetica Neue',Helvetica,Arial" } as any}>+</button></div>
<div style={{ width: `${c.w}`, display: "flex", flexDirection: "column", borderLeft: `${c.bl}` } as any}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 6px", background: "#efe8d8", borderBottom: "1.5px solid #0d181833" } as any}>
<span style={{ display: "flex", gap: "2px" } as any}><button onClick={c.left} aria-label="Move left" style={{ all: "unset", cursor: "pointer", padding: "0 6px", font: "700 14px 'Helvetica Neue',Helvetica,Arial", opacity: `${c.lo}` } as any}>‹</button><button onClick={c.right} aria-label="Move right" style={{ all: "unset", cursor: "pointer", padding: "0 6px", font: "700 14px 'Helvetica Neue',Helvetica,Arial", opacity: `${c.ro}` } as any}>›</button></span>
<span style={{ display: "flex", gap: "6px" } as any}><button onClick={c.split} style={{ all: "unset", cursor: "pointer", font: "600 10px 'JetBrains Mono'" } as any}>{c.splitLabel}</button><button onClick={c.remove} aria-label="Remove column" style={{ all: "unset", cursor: "pointer", font: "700 14px 'Helvetica Neue',Helvetica,Arial", color: "#b4235f" } as any}>×</button></span></div>
<div style={{ display: "flex" } as any}>
{(c.lanes || []).map((l: any, l_n: number) => (<Fragment key={l_n}><div style={{ flex: "1", textAlign: "center", padding: "8px 2px 0" } as any}><input onBlur={l.saveWip} defaultValue={l.wip} aria-label="WIP limit" placeholder="WIP" style={{ all: "unset", width: "44px", textAlign: "center", font: "800 18px Syne", borderBottom: "1.5px dashed #0d181855", minHeight: "24px" } as any} /></div></Fragment>))}</div>
<div style={{ padding: "2px 8px 8px", borderBottom: "3px solid #6b6b6b" } as any}><input onBlur={c.saveName} defaultValue={c.name} aria-label="Column name" style={{ all: "unset", boxSizing: "border-box", width: "100%", textAlign: "center", font: "800 15px/1.2 'Helvetica Neue',Helvetica,Arial", minHeight: "20px" } as any} /></div>
<div style={{ display: "flex", borderBottom: `${c.lb}` } as any}>{(c.lanes || []).map((l: any, l_n: number) => (<Fragment key={l_n}><span style={{ flex: "1", textAlign: "center", font: "700 11px 'Helvetica Neue',Helvetica,Arial", padding: "4px 0", display: `${l.ld}` } as any}>{l.label}</span></Fragment>))}</div>
<div style={{ display: "flex", minHeight: "250px", flex: "none" } as any}>
{(c.lanes || []).map((l: any, l_n: number) => (<Fragment key={l_n}>
<div onDragOver={l.over} onDrop={l.drop} style={{ flex: "1", minWidth: "0", padding: "8px", display: "flex", flexDirection: "column", gap: "8px", borderLeft: `${l.bl}` } as any}>
{(l.cards || []).map((k: any, k_n: number) => (<Fragment key={k_n}><div draggable="true" onDragStart={k.drag} title="Double-click to remove" onDoubleClick={k.del} style={{ cursor: "grab", background: "#a9c4ec", border: "1.5px solid #4a6fa8", borderRadius: "2px 2px 9px 2px", padding: "7px 9px", font: "600 12px/1.3 'Helvetica Neue',Helvetica,Arial", boxShadow: "1px 2px 0 #4a6fa855" } as any}>{k.t}</div></Fragment>))}
<input onKeyDown={l.add} placeholder="+ card" style={{ all: "unset", boxSizing: "border-box", borderBottom: "1.5px dashed #0d181866", padding: "3px 2px", font: "500 12px 'Helvetica Neue',Helvetica,Arial" } as any} />
</div></Fragment>))}</div>
<textarea defaultValue={c.pol} onBlur={c.savePol} placeholder="• Policies" rows={6} style={{ all: "unset", boxSizing: "border-box", borderTop: "3px solid #6b6b6b", padding: "10px", minHeight: "140px", font: "500 12.5px/1.45 'Helvetica Neue',Helvetica,Arial", whiteSpace: "pre-wrap", cursor: "text" } as any}></textarea>
</div></div></Fragment>))}
<div style={{ flex: "none", width: "26px", background: "#efe8d8", display: "flex", justifyContent: "center", paddingTop: "34px", borderLeft: "2px solid #6b6b6b" } as any}><button onClick={v.kan.addEnd} aria-label="Add a column at the end" title="Add a column at the end" style={{ cursor: "pointer", width: "22px", height: "22px", padding: "0", borderRadius: "99px", border: "2px solid #0d1815", background: "#ffb627", font: "800 14px/1 'Helvetica Neue',Helvetica,Arial" } as any}>+</button></div>
</div></div></div>

    </>
  );
}

export function PitchView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", border: "2px solid #06384a", background: "#fff", boxShadow: "3px 3px 0 #0d1815" } as any}>
{(v.pitch.cells || []).map((c: any, c_n: number) => (<Fragment key={c_n}>
<div style={{ gridColumn: `${c.gc}`, gridRow: `${c.gr}`, display: "flex", flexDirection: "column", border: "1px solid #06384a" } as any}>
<div style={{ background: "#06384a", color: "#fff", padding: "12px 16px", font: "700 16px/1.25 'Helvetica Neue',Helvetica,Arial", minHeight: "46px", display: "flex", alignItems: "center" } as any}>{c.t}</div>
<textarea defaultValue={c.v} onBlur={c.save} placeholder="…" style={{ all: "unset", boxSizing: "border-box", flex: "1", padding: "12px 16px", minHeight: `${c.mh}`, font: "500 15px/1.45 'Helvetica Neue',Helvetica,Arial", whiteSpace: "pre-wrap", cursor: "text" } as any}></textarea></div></Fragment>))}
</div>

    </>
  );
}

export function DiscView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", gap: "14px" } as any}>
<div style={{ background: "#ffd37a", border: "2px solid #0d1815", borderRadius: "8px", padding: "16px 20px", font: "800 clamp(17px,1.8vw,22px)/1.3 Syne", boxShadow: "3px 3px 0 #0d1815", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" } as any}><span style={{ flex: "1 1 300px" } as any}>{v.disc.intro}</span>{v.disc.hasTag ? (<><span style={{ background: "#735a87", color: "#fff", border: "2px solid #0d1815", borderRadius: "10px", padding: "10px 18px", font: "700 16px/1.2 'Helvetica Neue',Helvetica,Arial", textAlign: "center" } as any}>{v.disc.tag}</span></>) : null}</div>
<div style={{ display: "grid", gridTemplateColumns: `${v.disc.grid}`, gap: `${v.disc.gap}` } as any}>
{(v.disc.qs || []).map((q: any, q_n: number) => (<Fragment key={q_n}>
<div style={{ border: "2px solid #0d1815", borderRadius: "10px", background: "#fffaf0", display: "flex", flexDirection: "column", minWidth: "0", overflow: "hidden", boxShadow: `${v.disc.sh}` } as any}>
<div style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: `${v.disc.hp}`, background: `${q.hc}`, borderBottom: `${v.disc.hb}` } as any}><span style={{ flex: "none", width: `${v.disc.nb}`, height: `${v.disc.nb}`, borderRadius: "99px", background: "#ff3d8f", border: "2px solid #0d1815", font: `800 ${v.disc.nf} Syne`, display: "flex", alignItems: "center", justifyContent: "center" } as any}>{q.n}</span><b style={{ font: `700 ${v.disc.qf}/1.3 'Helvetica Neue',Helvetica,Arial` } as any}>{q.q}</b></div>
<div style={{ padding: `${v.disc.bp}`, display: "flex", flexDirection: "column", gap: "10px", flex: "1" } as any}>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignContent: "flex-start", flex: "1", minHeight: `${v.disc.mh}` } as any}>{(q.list || []).map((s: any, s_n: number) => (<Fragment key={s_n}><span style={{ background: `${s.c}`, padding: `${v.disc.sp}`, border: "2px solid #0d1815", borderRadius: "6px", font: `600 ${v.disc.sf}/1.3 'Helvetica Neue',Helvetica,Arial`, boxShadow: "2px 2px 0 #0d1815", transform: `rotate(${s.rot})`, maxWidth: "100%" } as any}>{s.t}</span></Fragment>))}</div>
<input onKeyDown={q.onKey} placeholder="+ sticky, press Enter" style={{ all: "unset", boxSizing: "border-box", borderBottom: "1.5px dashed #0d181888", padding: "5px 2px", font: "500 14px 'Helvetica Neue',Helvetica,Arial", width: "100%" } as any} />
</div></div></Fragment>))}</div>
{v.disc.hasEx ? (<><div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" } as any}><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>EXAMPLES TO SPARK IDEAS</span>{(v.disc.ex || []).map((e: any, e_n: number) => (<Fragment key={e_n}><span style={{ padding: "6px 12px", borderRadius: "99px", border: "1.5px solid #0d1815", background: "#fff", font: "600 13px 'Helvetica Neue',Helvetica,Arial" } as any}>{e}</span></Fragment>))}</div></>) : null}
</div>

    </>
  );
}

export function BvView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "18px", alignItems: "start" } as any}>
<div style={{ display: "flex", flexDirection: "column", gap: "12px" } as any}>
<span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>THE SCENARIO</span>
<div style={{ border: "2px solid #0d1815", borderRadius: "8px", background: "#fffaf0", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px", font: "500 16px/1.5 'Helvetica Neue',Helvetica,Arial", boxShadow: "3px 3px 0 #0d1815" } as any}>
<span>Business Owners have assigned a value of 2 to the PI Objective “<b>Reduce GPS signal loss by 25%</b>,” and they have requested that the team move the objective to uncommitted. The team believes this function provides a critical architectural enablement for the entire ART. The team is clearly disappointed and concerned that an important technical item is ranked so low.</span>
<span style={{ background: "#ffd37a", border: "2px solid #0d1815", borderRadius: "6px", padding: "10px 12px", font: "700 16px/1.4 Syne" } as any}>“We just don’t see much business value in it now,” said the Vice President of Product.</span></div>
<span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>YOUR GROUP’S STEPS TO SOLVE IT</span>
<div style={{ display: "flex", flexWrap: "wrap", gap: "10px" } as any}>{(v.stk || []).map((s: any, s_n: number) => (<Fragment key={s_n}><span style={{ background: `${s.c}`, padding: "10px 14px", border: "2px solid #0d1815", borderRadius: "6px", font: "600 14px/1.3 'Helvetica Neue',Helvetica,Arial", boxShadow: "2px 2px 0 #0d1815", maxWidth: "260px", transform: `rotate(${s.rot})` } as any}>{s.t}</span></Fragment>))}</div>
<input onKeyDown={v.addStk} placeholder="Add a step, press Enter" style={{ all: "unset", boxSizing: "border-box", border: "1.5px dashed #0d181899", borderRadius: "8px", padding: "10px 12px", font: "500 14px 'Helvetica Neue',Helvetica,Arial", background: "#fffaf0" } as any} />
</div>
<div style={{ border: "3px solid #4a7c7e", borderTopWidth: "26px", borderRadius: "6px 6px 14px 6px", background: "#f6f6f2", boxShadow: "3px 3px 0 #0d1815" } as any}>
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 54px 54px", borderBottom: "2px solid #b9bfbd", font: "700 18px Syne" } as any}><span style={{ padding: "10px 12px" } as any}>Objectives for PI 1</span><span style={{ padding: "10px 0", textAlign: "center", color: "#4d5a52", fontWeight: "500" } as any}>BV</span><span style={{ padding: "10px 0", textAlign: "center", color: "#4d5a52", fontWeight: "500" } as any}>ABV</span></div>
{(v.bv.rows || []).map((r: any, r_n: number) => (<Fragment key={r_n}><div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 54px 54px", alignItems: "center", background: `${r.bg}`, outline: `${r.ol}`, outlineOffset: "-2px" } as any}><span style={{ padding: "8px 12px", font: "500 13px/1.3 'Helvetica Neue',Helvetica,Arial" } as any}>{r.n}. {r.t}</span><b style={{ textAlign: "center", font: "700 15px 'Helvetica Neue',Helvetica,Arial" } as any}>{r.v}</b><span style={{ borderBottom: "2px solid #b9bfbd", margin: "0 8px" } as any}></span></div></Fragment>))}
<div style={{ padding: "8px 12px", font: "800 15px Syne", background: "#e3e6e4", borderTop: "2px solid #b9bfbd" } as any}>Uncommitted Objectives</div>
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 54px 54px", alignItems: "center" } as any}><span style={{ padding: "8px 12px", font: "500 13px/1.3 'Helvetica Neue',Helvetica,Arial" } as any}>Demonstrate real-time rerouting to avoid delays (e.g., accident, construction)</span><b style={{ textAlign: "center", font: "700 15px 'Helvetica Neue',Helvetica,Arial" } as any}>5</b><span style={{ borderBottom: "2px solid #b9bfbd", margin: "0 8px" } as any}></span></div>
</div></div>

    </>
  );
}

export function RoamView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", gap: "16px" } as any}>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" } as any}><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>1 · {v.roam.trayLabel}</span>
<div onDragOver={v.roam.trayOver} onDrop={v.roam.trayDrop} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "10px", minHeight: "56px", border: "2px dashed #0d181866", borderRadius: "8px", padding: "10px", background: "#fffaf0" } as any}>
{(v.roam.tray || []).map((c: any, c_n: number) => (<Fragment key={c_n}><div draggable="true" onDragStart={c.drag} style={{ cursor: "grab", background: "#ff9999", border: "3px solid #e84a4a", borderRadius: "4px 4px 12px 4px", padding: "10px 12px", font: "500 13px/1.35 'Helvetica Neue',Helvetica,Arial", color: "#0d1815" } as any}>{c.t}</div></Fragment>))}</div></div>
<span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>2 · DRAG EACH RISK ONTO THE RISKS BOARD</span>
<div style={{ border: "3px solid #4a7c7e", borderTopWidth: "26px", borderRadius: "6px 6px 14px 6px", background: "#f6f6f2", boxShadow: "3px 3px 0 #0d1815", padding: "12px" } as any}>
<div style={{ textAlign: "center", font: "800 22px Syne", marginBottom: "8px" } as any}>Risks</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" } as any}>
{(v.roam.quads || []).map((q: any, q_n: number) => (<Fragment key={q_n}>
<div onDragOver={q.over} onDrop={q.drop} style={{ minHeight: "170px", padding: "10px", borderLeft: `${q.bl}`, borderTop: `${q.bt}`, background: `${q.bg}`, display: "flex", flexDirection: "column", gap: "8px" } as any}>
<div style={{ display: "flex", alignItems: "center", gap: "8px" } as any}><span style={{ width: "30px", height: "30px", borderRadius: "99px", background: "#8fa8ad", color: "#fff", font: "800 16px 'Helvetica Neue',Helvetica,Arial", display: "flex", alignItems: "center", justifyContent: "center" } as any}>{q.l}</span><b style={{ font: "700 16px 'Helvetica Neue',Helvetica,Arial" } as any}>{q.name}</b></div>
<span style={{ font: "500 12px/1.3 'Helvetica Neue',Helvetica,Arial", color: "#4d5a52" } as any}>{q.desc}</span>
<div style={{ display: "flex", flexWrap: "wrap", gap: "6px" } as any}>{(q.items || []).map((c: any, c_n: number) => (<Fragment key={c_n}><button draggable="true" onDragStart={c.drag} onClick={c.back} title="Click to return to the tray" style={{ all: "unset", cursor: "grab", boxSizing: "border-box", background: "#ee5a45", color: "#fff", borderRadius: "2px 2px 8px 2px", padding: "6px 10px", font: "700 13px 'Helvetica Neue',Helvetica,Arial" } as any}>Risk {c.n}</button></Fragment>))}</div>
</div></Fragment>))}</div></div>
<span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>3 · HOW WOULD YOU FACILITATE IT? FOCUS ON HOW YOU FIND THE SOLUTION IN PI PLANNING, NOT WHAT THE SOLUTION IS</span>
<div style={{ border: "2px solid #0d1815", borderRadius: "8px", overflow: "hidden", background: "#fffaf0", boxShadow: "3px 3px 0 #0d1815" } as any}>
{(v.roam.rows || []).map((r: any, r_n: number) => (<Fragment key={r_n}>
<div style={{ display: "grid", gridTemplateColumns: "34px minmax(0,1fr) auto", gap: "12px", padding: "10px 14px", alignItems: "start", borderTop: "1.5px solid #0d181833", background: `${r.bg}` } as any}>
<span style={{ font: "800 15px Syne", paddingTop: "2px" } as any}>{r.n}</span>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "0" } as any}><span style={{ font: "600 14px/1.35 'Helvetica Neue',Helvetica,Arial" } as any}>{r.t}</span><input onBlur={r.save} defaultValue={r.note} placeholder="What ROAM, why, and how would you facilitate it?" style={{ all: "unset", borderBottom: "1.5px dashed #0d181888", padding: "3px 2px", font: "500 14px 'Helvetica Neue',Helvetica,Arial" } as any} /></div>
<div style={{ display: "flex", gap: "4px" } as any}>{(r.btns || []).map((b: any, b_n: number) => (<Fragment key={b_n}><button onClick={b.go} aria-label={b.aria} style={{ cursor: "pointer", width: "34px", height: "34px", borderRadius: "99px", border: "2px solid #0d1815", background: `${b.bg}`, color: `${b.fg}`, font: "800 14px 'Helvetica Neue',Helvetica,Arial" } as any}>{b.l}</button></Fragment>))}</div>
</div></Fragment>))}</div>
</div>

    </>
  );
}

export function ArtView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", gap: "14px" } as any}>
<div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" } as any}><span style={{ font: "600 11px 'JetBrains Mono'", letterSpacing: ".08em", color: "#4d5a52" } as any}>ONE BOARD AT A TIME</span>
{(v.art.tabs || []).map((t: any, t_n: number) => (<Fragment key={t_n}><button onClick={t.go} style={{ cursor: "pointer", display: "flex", gap: "8px", alignItems: "center", padding: "8px 14px", borderRadius: "10px", border: "2px solid #0d1815", background: `${t.bg}`, font: "700 14px 'Helvetica Neue',Helvetica,Arial", boxShadow: `${t.sh}` } as any}>{t.label}<span style={{ font: "700 11px 'JetBrains Mono'", background: "#fff", border: "1.5px solid #0d1815", borderRadius: "99px", padding: "1px 7px" } as any}>{t.n}</span></button></Fragment>))}
<div style={{ flex: "1" } as any}></div>
<button onClick={v.art.prev} style={{ cursor: "pointer", padding: "6px 12px", borderRadius: "8px", border: "2px solid #0d1815", background: "#fff", font: "700 13px 'Helvetica Neue',Helvetica,Arial", opacity: `${v.art.pop}` } as any}>‹ Board</button>
<button onClick={v.art.next} style={{ cursor: "pointer", padding: "6px 12px", borderRadius: "8px", border: "2px solid #0d1815", background: "#fff", font: "700 13px 'Helvetica Neue',Helvetica,Arial", opacity: `${v.art.nop}` } as any}>Board ›</button></div>
<div style={{ border: "2px solid #0d1815", borderRadius: "8px", background: "#fff", overflow: "hidden", boxShadow: "3px 3px 0 #0d1815" } as any}>
<div style={{ padding: "8px 14px", borderBottom: "2px solid #0d1815", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap", background: "#fffaf0" } as any}><b style={{ font: "800 16px Syne" } as any}>{v.art.title}</b><span style={{ font: "700 11px 'JetBrains Mono'", border: "1.5px solid #0d1815", borderRadius: "99px", padding: "2px 10px", background: `${v.art.modeBg}` } as any}>{v.art.mode}</span>{v.art.canReset ? (<><button onClick={v.art.reset} style={{ cursor: "pointer", padding: "3px 10px", borderRadius: "8px", border: "1.5px solid #0d1815", background: "#fff", font: "700 12px 'Helvetica Neue',Helvetica,Arial" } as any}>Reset board</button></>) : null}<span style={{ flex: "1" } as any}></span>
<span style={{ display: "flex", gap: "6px", alignItems: "center", font: "600 12px 'Helvetica Neue',Helvetica,Arial" } as any}><i style={{ width: "16px", height: "12px", background: "#c4271a", display: "inline-block" } as any}></i>Dependency</span>
<span style={{ display: "flex", gap: "6px", alignItems: "center", font: "600 12px 'Helvetica Neue',Helvetica,Arial" } as any}><i style={{ width: "16px", height: "12px", background: "#a9cdf2", display: "inline-block" } as any}></i>Feature</span>
<span style={{ display: "flex", gap: "6px", alignItems: "center", font: "600 12px 'Helvetica Neue',Helvetica,Arial" } as any}><i style={{ width: "16px", height: "12px", background: "#ffb627", display: "inline-block" } as any}></i>Milestone / event</span></div>
<svg onMouseMove={v.art.move} onMouseUp={v.art.up} onMouseLeave={v.art.up} viewBox="69 190 1419 562" style={{ width: "100%", display: "block", userSelect: "none" } as any} fontFamily="Helvetica Neue, Helvetica, Arial">
<rect x="69" y="190" width="1419" height="49" fill="#f1f1f1" /><rect x="69" y="239" width="203" height="513" fill="#f1f1f1" />
{(v.art.vl || []).map((v: any, v_n: number) => (<Fragment key={v_n}><line x1={v.x} y1="190" x2={v.x} y2="752" stroke="#7a7a7a" strokeWidth="1.5" /></Fragment>))}
{(v.art.hl || []).map((v: any, v_n: number) => (<Fragment key={v_n}><line x1="69" y1={v.y} x2="1488" y2={v.y} stroke="#7a7a7a" strokeWidth={v.w} /></Fragment>))}
{(v.art.cols || []).map((c: any, c_n: number) => (<Fragment key={c_n}><text x={c.tx} y="223" textAnchor="middle" fontSize="21" fontWeight="700" fill="#0d1815">{c.label}</text></Fragment>))}
{(v.art.rows || []).map((r: any, r_n: number) => (<Fragment key={r_n}><text x="170" y={r.ty} textAnchor="middle" fontSize="21" fontWeight="700" fill="#0d1815">{r.label}</text></Fragment>))}
{(v.art.links || []).map((l: any, l_n: number) => (<Fragment key={l_n}><path d={l.d} fill="none" stroke="#e8101a" strokeWidth="3.5" /></Fragment>))}
{(v.art.cards || []).map((k: any, k_n: number) => (<Fragment key={k_n}><g onMouseDown={k.down} style={{ cursor: `${v.art.cur}` } as any}><rect x={k.x} y={k.y} width="52" height="36" fill={k.bg} stroke={k.st} strokeWidth="3" /><text x={k.tx} y={k.ty} textAnchor="middle" fontSize="22" fontWeight="700" fill={k.fg}>{k.id}</text></g></Fragment>))}
</svg></div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "12px" } as any}>
{(v.art.qs || []).map((q: any, q_n: number) => (<Fragment key={q_n}>
<div style={{ border: "2px solid #0d1815", borderRadius: "8px", background: "#fffaf0", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" } as any}>
<b style={{ font: "800 15px/1.25 Syne" } as any}>{q.q}</b>
<div style={{ display: "flex", flexWrap: "wrap", gap: "6px", minHeight: "40px" } as any}>{(q.list || []).map((s: any, s_n: number) => (<Fragment key={s_n}><span style={{ background: `${s.c}`, padding: "7px 10px", border: "2px solid #0d1815", borderRadius: "6px", font: "600 13px/1.25 'Helvetica Neue',Helvetica,Arial", boxShadow: "2px 2px 0 #0d1815", transform: `rotate(${s.rot})` } as any}>{s.t}</span></Fragment>))}</div>
<input onKeyDown={q.onKey} placeholder="+ sticky, press Enter" style={{ all: "unset", boxSizing: "border-box", borderBottom: "1.5px dashed #0d181888", padding: "4px 2px", font: "500 13px 'Helvetica Neue',Helvetica,Arial", width: "100%" } as any} />
</div></Fragment>))}
</div></div>

    </>
  );
}

export function TalkView({ v }: { v: any }) {
  return (
    <>

<div style={{ display: "flex", flexDirection: "column", gap: "14px" } as any}>
<div style={{ background: "#ffd37a", border: "2px solid #0d1815", borderRadius: "8px", padding: "18px 20px", font: "800 clamp(18px,2vw,24px)/1.25 Syne", boxShadow: "3px 3px 0 #0d1815" } as any}>{v.ex.prompt}</div>
<div style={{ display: "flex", flexWrap: "wrap", gap: "10px", minHeight: "60px" } as any}>{(v.stk || []).map((s: any, s_n: number) => (<Fragment key={s_n}><span style={{ background: `${s.c}`, padding: "10px 14px", border: "2px solid #0d1815", borderRadius: "6px", font: "600 14px/1.3 'Helvetica Neue',Helvetica,Arial", boxShadow: "2px 2px 0 #0d1815", maxWidth: "260px", transform: `rotate(${s.rot})` } as any}>{s.t}</span></Fragment>))}</div>
<input onKeyDown={v.addStk} placeholder={v.addPh} style={{ all: "unset", boxSizing: "border-box", border: "1.5px dashed #0d181899", borderRadius: "8px", padding: "10px 12px", font: "500 14px 'Helvetica Neue',Helvetica,Arial", background: "#fffaf0" } as any} />
</div>

    </>
  );
}

