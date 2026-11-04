"use client";
// Generated from the design handoff "Trainyard planning suite" by dc2jsx.py: the Roadmap, the OKR
// board, the planning room and the Launching AI-Native ARTs class board exactly as designed, reading
// what they show and do from `v`. Do not edit by hand; change the design and regenerate.
/* eslint-disable */
import { Fragment } from "react";

export function RoadmapView({ v }: { v: any }) {
  return (
    <>


<div style={{ fontFamily: "'Instrument Sans',sans-serif", color: "#14123a", background: "#f4f1ea", minHeight: "100vh", paddingBottom: "80px" } as any}>

<header style={{ padding: "6vh 5vw 0", display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between" } as any}>
<div style={{ flex: "1 1 520px" } as any}>
<div style={{ font: "700 14px ui-monospace,Menlo,monospace", color: "#4a5fe8" } as any}>ROADMAP · PORTFOLIO, SOLUTION AND PI</div>
<h1 style={{ font: "800 clamp(40px,5.6vw,88px)/.95 'Familjen Grotesk',sans-serif", letterSpacing: "-.045em", margin: "16px 0 16px", maxWidth: "15ch", animation: "rise .8s both" } as any}>Draw the <span style={{ background: "#5ff0e0", padding: "0 .15em", borderRadius: ".15em", display: "inline-block", transform: "rotate(-2deg)" } as any}>forecast.</span> Not a promise.</h1>
<p style={{ fontSize: "20px", lineHeight: "1.45", maxWidth: "60ch", margin: "0" } as any}>One board for every horizon. Drop cards from the collection onto an ART lane, stretch them across PIs, pin milestones, then zoom to the three-PI plan and commit what you can.</p>
</div>
<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" } as any}>
<button onClick={v.loadSample} style={{ background: "#14123a", color: "#fff", border: "0", padding: "14px 22px", borderRadius: "99px", fontWeight: "700", fontSize: "16px", cursor: "pointer" } as any}>Load SAFe sample</button>
<button onClick={v.loadBlank} style={{ background: "#fff", color: "#14123a", border: "2px solid #14123a", padding: "12px 22px", borderRadius: "99px", fontWeight: "700", fontSize: "16px", cursor: "pointer" } as any}>Start blank</button>
</div>
</header>

<section style={{ margin: "40px 5vw 0", display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" } as any}>
<div style={{ display: "flex", background: "#fff", border: "2px solid #14123a", borderRadius: "99px", padding: "4px", gap: "2px" } as any}>
{(v.tabs || []).map((t: any, t_n: number) => (<Fragment key={t_n}><button onClick={t.go} style={{ border: "0", borderRadius: "99px", padding: "9px 18px", fontWeight: "700", fontSize: "15px", cursor: "pointer", background: `${t.bg}`, color: `${t.fg}` } as any}>{t.n}</button></Fragment>))}
</div>
{v.isTimeline ? (<>
<div style={{ display: "flex", background: "#fff", border: "2px solid #14123a", borderRadius: "99px", padding: "4px", gap: "2px" } as any}>
{(v.zooms || []).map((z: any, z_n: number) => (<Fragment key={z_n}><button onClick={z.go} style={{ border: "0", borderRadius: "99px", padding: "9px 16px", fontWeight: "600", fontSize: "14px", cursor: "pointer", background: `${z.bg}`, color: `${z.fg}` } as any}>{z.n}</button></Fragment>))}
</div>
<div style={{ display: "flex", gap: "6px", alignItems: "center" } as any}><button onClick={v.prev} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #14123a", background: "#fff", fontSize: "18px", cursor: "pointer" } as any}>‹</button><span style={{ font: "600 13px ui-monospace,Menlo,monospace", minWidth: "92px", textAlign: "center" } as any}>{v.windowLabel}</span><button onClick={v.next} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #14123a", background: "#fff", fontSize: "18px", cursor: "pointer" } as any}>›</button></div>
</>) : null}
{v.isPlan ? (<>
<div style={{ display: "flex", gap: "6px", alignItems: "center" } as any}><button onClick={v.prevPI} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #14123a", background: "#fff", fontSize: "18px", cursor: "pointer" } as any}>‹</button><span style={{ font: "600 13px ui-monospace,Menlo,monospace", minWidth: "150px", textAlign: "center" } as any}>PLANNING FROM PI {v.curPI}</span><button onClick={v.nextPI} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #14123a", background: "#fff", fontSize: "18px", cursor: "pointer" } as any}>›</button></div>
</>) : null}
<div style={{ marginLeft: "auto", display: "flex", gap: "14px", font: "600 13px 'Instrument Sans',sans-serif", alignItems: "center", flexWrap: "wrap" } as any}>
{(v.legend || []).map((l: any, l_n: number) => (<Fragment key={l_n}><span style={{ display: "flex", gap: "6px", alignItems: "center" } as any}><i style={{ width: "14px", height: "14px", borderRadius: "4px", background: `${l.c}`, display: "block" } as any}></i>{l.n}</span></Fragment>))}
<span style={{ display: "flex", gap: "6px", alignItems: "center" } as any}><i style={{ width: "12px", height: "12px", background: "#6b6b78", transform: "rotate(45deg)", display: "block" } as any}></i>Milestone</span>
<span style={{ display: "flex", gap: "6px", alignItems: "center" } as any}><i style={{ width: "16px", height: "12px", border: "2px dashed #14123a", borderRadius: "4px", display: "block" } as any}></i>Uncommitted</span>
</div>
</section>

<section style={{ margin: "18px 5vw 0", display: "flex", gap: "22px", alignItems: "flex-start", flexWrap: "wrap" } as any}>

<aside style={{ flex: "0 0 330px", maxWidth: "100%", background: "#fff", border: "2px solid #14123a", borderRadius: "24px", boxShadow: "8px 8px 0 #14123a", overflow: "hidden" } as any}>
<div style={{ textAlign: "center", padding: "16px", font: "700 13px ui-monospace,Menlo,monospace", letterSpacing: ".12em", borderBottom: "2px solid #14123a" } as any}>COLLECTION</div>
<div style={{ padding: "12px 14px", display: "flex", gap: "8px", borderBottom: "1px solid #e3ddcf" } as any}>
<input value={v.newText} onChange={v.setNew} onKeyDown={v.newKey} placeholder="New card title" style={{ flex: "1", minWidth: "0", border: "2px solid #14123a", borderRadius: "12px", padding: "9px 12px", fontSize: "15px", background: "#fbf9f4" } as any} />
<button onClick={v.addCard} style={{ border: "2px solid #14123a", background: "#ffe14d", borderRadius: "12px", padding: "0 14px", fontWeight: "700", cursor: "pointer" } as any}>+ Add</button>
</div>
<label style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px 16px", fontWeight: "600", borderBottom: "1px solid #e3ddcf", cursor: "pointer" } as any}><input type="checkbox" checked={v.allChecked} onChange={v.toggleAll} style={{ width: "18px", height: "18px", accentColor: "#14123a" } as any} />Select all ({v.cardCount})</label>
<div style={{ maxHeight: "430px", overflow: "auto" } as any}>
{(v.cards || []).map((c: any, c_n: number) => (<Fragment key={c_n}>
<div onPointerDown={c.down} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #eee8da", cursor: `${c.cursor}`, background: `${c.bg}`, touchAction: "none" } as any}>
<input type="checkbox" checked={c.checked} onChange={c.toggle} onPointerDown={c.stop} style={{ width: "18px", height: "18px", accentColor: "#14123a", flex: "none" } as any} />
<div style={{ width: "38px", height: "30px", borderRadius: "6px", background: `${c.color}`, flex: "none", border: "1.5px solid #14123a", opacity: `${c.op}` } as any}></div>
<div style={{ flex: "1", minWidth: "0" } as any}><div style={{ fontWeight: "600", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } as any}>{c.title}</div><div style={{ fontSize: "12px", color: "#5b5b6e" } as any}>{c.sub}</div></div>
<button onClick={c.locate} onPointerDown={c.stop} style={{ border: "0", background: "none", fontWeight: "600", fontSize: "14px", color: "#4a5fe8", cursor: "pointer", padding: "6px" } as any}>{c.action}</button>
</div>
</Fragment>))}
</div>
<div style={{ display: "flex", gap: "10px", padding: "14px", borderTop: "2px solid #14123a", background: "#fbf9f4" } as any}>
<button onClick={v.delChecked} title="Delete checked" style={{ width: "46px", height: "46px", border: "2px solid #14123a", background: "#fff", borderRadius: "12px", cursor: "pointer", fontSize: "18px" } as any}>🗑</button>
<button onClick={v.addToBoard} style={{ flex: "1", height: "46px", border: "2px solid #14123a", background: `${v.addBg}`, color: "#14123a", borderRadius: "12px", fontWeight: "700", fontSize: "16px", cursor: "pointer" } as any}>Add to board{v.addCount}</button>
</div>
<div style={{ padding: "0 14px 14px", fontSize: "12.5px", color: "#5b5b6e", background: "#fbf9f4" } as any}>Tip: drag a card straight onto a lane. Double-click an empty lane cell to create one there.</div>
</aside>

<div style={{ flex: "1 1 640px", minWidth: "0", display: "flex", flexDirection: "column", gap: "22px" } as any}>

{v.isTimeline ? (<>
<div style={{ background: "#fff", border: "2px solid #14123a", borderRadius: "24px", boxShadow: "8px 8px 0 #14123a", overflow: "hidden" } as any}>
<div style={{ display: "flex", borderBottom: "2px solid #14123a", background: "#fbf9f4" } as any}>
<div style={{ width: "150px", flex: "none", padding: "12px 14px", font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", display: "flex", alignItems: "flex-end" } as any}>MILESTONES</div>
<div id="mileTrack" onClick={v.mileClick} style={{ flex: "1", position: "relative", height: "82px", cursor: "copy", backgroundImage: "linear-gradient(90deg,#e3ddcf 1px,transparent 1px)", backgroundSize: `${v.cellPct}% 100%` } as any}>
{(v.miles || []).map((m: any, m_n: number) => (<Fragment key={m_n}>
<div onClick={m.pick} style={{ position: "absolute", left: `${m.left}`, width: `${m.w}`, top: "6px", textAlign: "center", cursor: "pointer", zIndex: "2" } as any}>
<div style={{ font: "600 12px/1.2 'Instrument Sans',sans-serif", height: "30px", overflow: "hidden", padding: "0 4px" } as any}>{m.title}</div>
<div style={{ width: "20px", height: "20px", margin: "6px auto 0", background: `${m.fill}`, border: "2px solid #14123a", transform: "rotate(45deg)", outline: `${m.outline}`, outlineOffset: "3px", display: "grid", placeItems: "center", fontSize: "11px" } as any}></div>
</div>
</Fragment>))}
</div></div>
<div style={{ display: "flex", borderBottom: "2px solid #14123a" } as any}>
<div style={{ width: "150px", flex: "none", padding: "10px 14px", font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>PI</div>
<div style={{ flex: "1", display: "flex" } as any}>
{(v.pis || []).map((p: any, p_n: number) => (<Fragment key={p_n}><div style={{ flex: "1", minWidth: "0", textAlign: "center", padding: "10px 0", font: "700 13px 'Familjen Grotesk',sans-serif", borderLeft: "1px solid #e3ddcf", background: `${p.tint}` } as any}>{p.label}</div></Fragment>))}
</div></div>
{(v.lanes || []).map((l: any, l_n: number) => (<Fragment key={l_n}>
<div style={{ display: "flex", borderBottom: "1px solid #d9d4c7" } as any}>
<div style={{ width: "150px", flex: "none", padding: "14px", font: "700 15px 'Familjen Grotesk',sans-serif", color: "#4a5fe8", borderRight: "2px solid #14123a", background: "#fbf9f4" } as any}>{l.name}<div style={{ font: "500 12px 'Instrument Sans',sans-serif", color: "#5b5b6e", marginTop: "4px" } as any}>{l.info}</div></div>
<div data-lane={l.id} data-track="1" onDoubleClick={l.dbl} style={{ flex: "1", position: "relative", height: `${l.h}px`, backgroundImage: "linear-gradient(90deg,#e3ddcf 1px,transparent 1px)", backgroundSize: `${v.cellPct}% 100%` } as any}>
{(l.items || []).map((b: any, b_n: number) => (<Fragment key={b_n}>
<div onPointerDown={b.down} style={{ position: "absolute", left: `${b.left}`, width: `${b.w}`, top: `${b.top}px`, height: "38px", boxSizing: "border-box", background: `${b.color}`, color: "#fff", border: `2px ${b.border} #14123a`, borderRadius: "10px", padding: "0 14px 0 10px", display: "flex", alignItems: "center", font: "700 13.5px 'Instrument Sans',sans-serif", cursor: "grab", touchAction: "none", userSelect: "none", outline: `${b.outline}`, outlineOffset: "2px", animation: `${b.anim}`, zIndex: `${b.z}`, opacity: `${b.op}` } as any}><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", pointerEvents: "none" } as any}>{b.title}</span><div onPointerDown={b.resize} style={{ position: "absolute", right: "0", top: "0", bottom: "0", width: "12px", cursor: "ew-resize", borderRadius: "0 8px 8px 0", background: "rgba(255,255,255,.28)" } as any}></div></div>
</Fragment>))}
</div></div>
</Fragment>))}
{v.showBands ? (<>
<div style={{ display: "flex" } as any}>
<div style={{ width: "150px", flex: "none", padding: "12px 14px", font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>CERTAINTY</div>
<div style={{ flex: "1", display: "flex" } as any}>
{(v.bands || []).map((b: any, b_n: number) => (<Fragment key={b_n}><div style={{ flex: "1", minWidth: "0", background: `${b.tint}`, borderLeft: "1px solid #fff", padding: "10px 6px", font: "600 12px/1.25 'Instrument Sans',sans-serif", color: "#14123a", overflow: "visible", whiteSpace: "nowrap" } as any}>{b.label}</div></Fragment>))}
</div></div>
</>) : null}
</div>
</>) : null}

{v.isPlan ? (<>
<div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "16px" } as any}>
{(v.planCols || []).map((col: any, col_n: number) => (<Fragment key={col_n}>
<div style={{ background: "#fff", border: "2px solid #14123a", borderRadius: "24px", boxShadow: "8px 8px 0 #14123a", overflow: "hidden", display: "flex", flexDirection: "column" } as any}>
<div style={{ background: "#14123a", color: "#fff", padding: "14px 16px", font: "800 22px 'Familjen Grotesk',sans-serif", textAlign: "center" } as any}>{col.title}</div>
<div style={{ padding: "10px 14px", minHeight: "46px", borderBottom: "1px solid #e3ddcf", fontSize: "13px", display: "flex", flexDirection: "column", gap: "4px" } as any}>
{(col.miles || []).map((m: any, m_n: number) => (<Fragment key={m_n}><span style={{ display: "flex", gap: "8px", alignItems: "center", fontWeight: "600" } as any}><i style={{ width: "10px", height: "10px", background: `${m.fill}`, border: "1.5px solid #14123a", transform: "rotate(45deg)", display: "block", flex: "none" } as any}></i>{m.title}</span></Fragment>))}
{col.noMiles ? (<><span style={{ color: "#8a8a99" } as any}>No milestone</span></>) : null}
</div>
<div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "8px", flex: "1", minHeight: "280px" } as any}>
{(col.groups || []).map((g: any, g_n: number) => (<Fragment key={g_n}>
<div style={{ font: "700 12px ui-monospace,Menlo,monospace", letterSpacing: ".08em", color: "#5b5b6e", display: `${g.hd}`, alignItems: "center", gap: "8px", marginTop: "4px" } as any}><span style={{ flex: "1", height: "1px", background: "#14123a", opacity: ".3" } as any}></span>{g.name}<span style={{ flex: "1", height: "1px", background: "#14123a", opacity: ".3" } as any}></span></div>
{(g.cards || []).map((c: any, c_n: number) => (<Fragment key={c_n}>
<div onClick={c.pick} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 8px 8px 10px", borderRadius: "12px", background: "#f4f1ea", border: `2px solid ${c.bd}`, cursor: "pointer" } as any}>
<i style={{ width: "10px", alignSelf: "stretch", borderRadius: "4px", background: `${c.color}`, display: "block", flex: "none" } as any}></i>
<div style={{ flex: "1", minWidth: "0" } as any}><div style={{ fontWeight: "600", fontSize: "14.5px", lineHeight: "1.25" } as any}>{c.title}</div><div style={{ fontSize: "12px", color: "#5b5b6e" } as any}>{c.lane}</div></div>
<button onClick={c.left} title="Move a PI earlier" style={{ border: "0", background: "#fff", borderRadius: "8px", width: "28px", height: "28px", cursor: "pointer", fontWeight: "700" } as any}>‹</button>
<button onClick={c.right} title="Move a PI later" style={{ border: "0", background: "#fff", borderRadius: "8px", width: "28px", height: "28px", cursor: "pointer", fontWeight: "700" } as any}>›</button>
</div>
</Fragment>))}
</Fragment>))}
{col.empty ? (<><div style={{ color: "#8a8a99", fontSize: "14px", margin: "auto", textAlign: "center", padding: "20px 0" } as any}>Nothing planned for this PI.<br />Drag cards in the timeline or use › on a neighbour.</div></>) : null}
</div>
{col.isFirst ? (<><div style={{ padding: "10px 14px 14px", fontSize: "12.5px", color: "#5b5b6e", borderTop: "1px solid #e3ddcf" } as any}>Click a card to flip it between committed and uncommitted.</div></>) : null}
</div>
</Fragment>))}
</div>
<div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 10px" } as any}>
<div style={{ width: "calc(100%/3 - 16px)", flex: "none" } as any}></div>
<div style={{ flex: "1", display: "flex", alignItems: "center", gap: "12px", borderTop: "3px solid #8a8a99", position: "relative", paddingTop: "10px" } as any}><span style={{ position: "absolute", right: "-2px", top: "-9px", color: "#8a8a99", fontSize: "18px" } as any}>▸</span><span style={{ font: "italic 500 20px 'Familjen Grotesk',sans-serif", color: "#5b5b6e" } as any}>Forecast</span><span style={{ fontSize: "13px", color: "#5b5b6e" } as any}>PI +1 and PI +2 are directional. Only PI Plan holds commitments.</span></div>
</div>
</>) : null}

<div style={{ background: "#fff", border: "2px solid #14123a", borderRadius: "24px", boxShadow: "8px 8px 0 #14123a", padding: "18px 20px", display: "flex", gap: "18px", flexWrap: "wrap", alignItems: "flex-end", minHeight: "84px" } as any}>
{v.hasSel ? (<>
<label style={{ flex: "2 1 240px", display: "flex", flexDirection: "column", gap: "6px", font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>TITLE<input value={v.sel.title} onChange={v.setTitle} style={{ border: "2px solid #14123a", borderRadius: "12px", padding: "10px 12px", fontSize: "16px", background: "#fbf9f4", color: "#14123a" } as any} /></label>
{v.sel.isCard ? (<>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>TYPE<div style={{ display: "flex", gap: "6px" } as any}>{(v.typeOpts || []).map((t: any, t_n: number) => (<Fragment key={t_n}><button onClick={t.go} style={{ border: "2px solid #14123a", borderRadius: "10px", padding: "9px 12px", fontWeight: "700", fontSize: "14px", cursor: "pointer", background: `${t.bg}`, color: `${t.fg}` } as any}>{t.n}</button></Fragment>))}</div></div>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>LANE<select value={v.laneVal} onChange={v.setLane} style={{ border: "2px solid #14123a", borderRadius: "12px", padding: "10px", fontSize: "15px", background: "#fbf9f4", color: "#14123a" } as any}>{(v.laneOpts || []).map((o: any, o_n: number) => (<Fragment key={o_n}><option value={o.id}>{o.name}</option></Fragment>))}</select></label>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>SPAN<div style={{ display: "flex", alignItems: "center", gap: "8px" } as any}><button onClick={v.lenDown} style={{ width: "38px", height: "38px", borderRadius: "10px", border: "2px solid #14123a", background: "#fff", fontSize: "18px", cursor: "pointer" } as any}>−</button><span style={{ font: "700 15px 'Instrument Sans',sans-serif", color: "#14123a", minWidth: "92px", textAlign: "center" } as any}>PI {v.sel.startLabel}</span><button onClick={v.lenUp} style={{ width: "38px", height: "38px", borderRadius: "10px", border: "2px solid #14123a", background: "#fff", fontSize: "18px", cursor: "pointer" } as any}>+</button></div></div>
<button onClick={v.toggleCommit} style={{ height: "40px", border: "2px solid #14123a", borderRadius: "10px", padding: "0 14px", fontWeight: "700", cursor: "pointer", background: `${v.sel.commitBg}` } as any}>{v.sel.commitLabel}</button>
<button onClick={v.toCollection} style={{ height: "40px", border: "2px solid #14123a", borderRadius: "10px", padding: "0 14px", fontWeight: "700", cursor: "pointer", background: "#fff" } as any}>Back to collection</button>
</>) : null}
{v.sel.isMile ? (<>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>AT<div style={{ display: "flex", alignItems: "center", gap: "8px" } as any}><button onClick={v.mileLeft} style={{ width: "38px", height: "38px", borderRadius: "10px", border: "2px solid #14123a", background: "#fff", fontSize: "18px", cursor: "pointer" } as any}>‹</button><span style={{ font: "700 15px 'Instrument Sans',sans-serif", color: "#14123a", minWidth: "60px", textAlign: "center" } as any}>PI {v.sel.at}</span><button onClick={v.mileRight} style={{ width: "38px", height: "38px", borderRadius: "10px", border: "2px solid #14123a", background: "#fff", fontSize: "18px", cursor: "pointer" } as any}>›</button></div></div>
<button onClick={v.toggleRelease} style={{ height: "40px", border: "2px solid #14123a", borderRadius: "10px", padding: "0 14px", fontWeight: "700", cursor: "pointer", background: `${v.sel.relBg}` } as any}>{v.sel.relLabel}</button>
</>) : null}
<button onClick={v.delSel} style={{ height: "40px", border: "2px solid #14123a", borderRadius: "10px", padding: "0 14px", fontWeight: "700", cursor: "pointer", background: "#ff9fc6" } as any}>Delete</button>
</>) : null}
{v.noSel ? (<><div style={{ color: "#5b5b6e", fontSize: "15px", lineHeight: "1.5" } as any}>Select a card or milestone to edit it. Click the milestone strip to pin a new one. Drag a card edge to stretch it across PIs.</div></>) : null}
</div>
</div>
</section>

{v.ghost ? (<><div style={{ position: "fixed", left: `${v.ghostX}px`, top: `${v.ghostY}px`, pointerEvents: "none", zIndex: "99", background: `${v.ghostColor}`, color: "#fff", border: "2px solid #14123a", borderRadius: "10px", padding: "9px 14px", font: "700 14px 'Instrument Sans',sans-serif", boxShadow: "4px 4px 0 #14123a", maxWidth: "240px", transform: "rotate(-2deg)" } as any}>{v.ghostTitle}</div></>) : null}
</div>

    </>
  );
}

export function OkrBoardView({ v }: { v: any }) {
  return (
    <>


<div style={{ fontFamily: "'Instrument Sans',sans-serif", color: "#14123a", background: "#0b0a2e", minHeight: "100vh", paddingBottom: "70px" } as any}>

<header style={{ padding: "5vh 4vw 0", display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", color: "#fff" } as any}>
<div style={{ flex: "1 1 480px" } as any}><div style={{ font: "700 14px ui-monospace,Menlo,monospace", color: "#5ff0e0" } as any}>OKR BOARD · ONE SCREEN</div>
<h1 style={{ font: "800 clamp(38px,5vw,76px)/.95 'Familjen Grotesk',sans-serif", letterSpacing: "-.045em", margin: "14px 0 0", animation: "rise .8s both" } as any}>Every ring is a <span style={{ background: "#ffe14d", color: "#14123a", padding: "0 .15em", borderRadius: ".15em", display: "inline-block", transform: "rotate(-2deg)" } as any}>key result.</span></h1></div>
<div style={{ flex: "0 1 420px", fontSize: "16px", lineHeight: "1.5", color: "#c9c7ee" } as any}>Each dial is one objective. Each ring is a key result, filled clockwise by progress and coloured by health. The number in the middle is the objective score from 0 to 1. Link epics below to see what is funded to move it.</div>
</header>

<section style={{ padding: "34px 4vw 0", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,270px),1fr))", gap: "18px" } as any}>
{(v.cards || []).map((o: any, o_n: number) => (<Fragment key={o_n}>
<article onClick={o.pick} style={{ background: "#f4f1ea", borderRadius: "10px", borderTop: `6px solid ${o.accent}`, padding: "14px 14px 12px", cursor: "pointer", outline: `${o.outline}`, outlineOffset: "3px" } as any}>
<input value={o.title} onChange={o.rename} onClick={o.stop} style={{ width: "100%", boxSizing: "border-box", border: "0", background: "transparent", font: "700 17px 'Familjen Grotesk',sans-serif", color: `${o.ink}`, padding: "0" } as any} />
<div style={{ fontSize: "12px", color: "#5b5b6e", margin: "2px 0 4px" } as any}>2026 · {o.krCount} key results</div>
<div style={{ position: "relative", width: "100%", maxWidth: "236px", margin: "0 auto", aspectRatio: "1" } as any}>
<svg viewBox="0 0 220 220" style={{ width: "100%", height: "100%", display: "block" } as any}>
<line x1="110" y1="4" x2="110" y2="216" stroke="#14123a" strokeOpacity=".18" /><line x1="4" y1="110" x2="216" y2="110" stroke="#14123a" strokeOpacity=".18" />
{(o.rings || []).map((r: any, r_n: number) => (<Fragment key={r_n}>
<circle cx="110" cy="110" r={r.r} fill="none" stroke="#14123a" strokeOpacity=".09" strokeWidth={r.w} />
<circle cx="110" cy="110" r={r.r} fill="none" stroke={r.color} strokeWidth={r.w} strokeDasharray={r.dash} transform="rotate(-90 110 110)" style={{ transition: "stroke-dasharray .4s,stroke-width .15s" } as any} />
</Fragment>))}
<text x="114" y="12" fontSize="9" fill="#14123a" fillOpacity=".5">Q1</text><text x="198" y="124" fontSize="9" fill="#14123a" fillOpacity=".5">Q2</text><text x="114" y="214" fontSize="9" fill="#14123a" fillOpacity=".5">Q3</text><text x="6" y="124" fontSize="9" fill="#14123a" fillOpacity=".5">Q4</text>
</svg>
<div style={{ position: "absolute", inset: "0", display: "grid", placeItems: "center", pointerEvents: "none" } as any}><div style={{ textAlign: "center" } as any}><div style={{ font: "800 34px/1 'Familjen Grotesk',sans-serif", color: `${o.scoreColor}` } as any}>{o.score}</div><div style={{ font: "600 10px ui-monospace,Menlo,monospace", color: "#5b5b6e", marginTop: "2px" } as any}>SCORE</div></div></div>
</div>
<div style={{ display: "flex", gap: "3px", marginTop: "8px" } as any} title="Roadmap coverage, PI 1 to 12">{(o.cover || []).map((c: any, c_n: number) => (<Fragment key={c_n}><i style={{ flex: "1", height: "8px", borderRadius: "3px", background: `${c.bg}`, display: "block" } as any}></i></Fragment>))}</div>
<div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#5b5b6e", marginTop: "5px" } as any}><span>{o.epicCount} linked epics</span><span>roadmap PI 1–12</span></div>
</article>
</Fragment>))}
</section>

<section style={{ padding: "22px 4vw 0", display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)", gap: "18px" } as any}>
<div style={{ background: "#f4f1ea", borderRadius: "10px", borderTop: `6px solid ${v.selAccent}`, padding: "18px 20px", minWidth: "0", gridColumn: "span 1", minHeight: "260px" } as any}>
<div style={{ font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>KEY RESULTS · {v.selTitle}</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px" } as any}>
{(v.krs || []).map((k: any, k_n: number) => (<Fragment key={k_n}>
<div onPointerEnter={k.enter} onPointerLeave={k.leave} style={{ display: "grid", gridTemplateColumns: "14px minmax(0,1fr) auto", gap: "6px 12px", alignItems: "center", padding: "8px 10px", borderRadius: "12px", background: `${k.bg}` } as any}>
<i style={{ width: "14px", height: "14px", borderRadius: "50%", background: `${k.color}`, display: "block" } as any}></i>
<input value={k.title} onChange={k.rename} style={{ border: "0", background: "transparent", font: "600 15px 'Instrument Sans',sans-serif", color: "#14123a", minWidth: "0", padding: "0" } as any} />
<b style={{ font: "700 15px 'Familjen Grotesk',sans-serif" } as any}>{k.now} <span style={{ fontWeight: "500", color: "#5b5b6e" } as any}>/ {k.target} {k.unit}</span></b>
<span></span>
<input type="range" min={k.min} max={k.max} step={k.step} value={k.now} onChange={k.set} style={{ width: "100%" } as any} />
<div style={{ display: "flex", gap: "4px" } as any}>{(k.conf || []).map((c: any, c_n: number) => (<Fragment key={c_n}><button onClick={c.go} title="Confidence" style={{ border: "2px solid #14123a", borderRadius: "99px", font: "700 11px 'Instrument Sans',sans-serif", padding: "3px 8px", cursor: "pointer", background: `${c.bg}`, color: "#14123a" } as any}>{c.n}</button></Fragment>))}</div>
</div>
</Fragment>))}
</div>
<div style={{ marginTop: "14px", fontSize: "13px", color: "#5b5b6e" } as any}>Score = average progress across key results. 0.7 and above counts as green, 0.4 to 0.7 as amber.</div>
</div>

<div style={{ background: "#f4f1ea", borderRadius: "10px", borderTop: "6px solid #5ff0e0", padding: "18px 20px", minWidth: "0", overflow: "auto" } as any}>
<div style={{ font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>STRATEGIC OBJECTIVE → EPIC MAP</div>
<div style={{ fontSize: "13px", color: "#5b5b6e", margin: "4px 0 10px" } as any}>Epics come from the <a href="/roadmap" style={{ color: "#4a5fe8" } as any}>Roadmap</a>. Click a cell to link. An epic with no objective is unfunded work.</div>
<div style={{ display: "grid", gridTemplateColumns: `minmax(120px,1.6fr) repeat(${v.objCount},minmax(34px,1fr))`, gap: "4px", alignItems: "center", minWidth: "360px" } as any}>
<span></span>{(v.mapHead || []).map((h: any, h_n: number) => (<Fragment key={h_n}><span style={{ textAlign: "center", font: "700 11px 'Familjen Grotesk',sans-serif", color: "#14123a", height: "18px", overflow: "hidden" } as any} title={h.title}><i style={{ width: "10px", height: "10px", borderRadius: "50%", background: `${h.accent}`, display: "inline-block" } as any}></i></span></Fragment>))}
{(v.mapRows || []).map((r: any, r_n: number) => (<Fragment key={r_n}>
<span style={{ fontSize: "13.5px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: `${r.ink}` } as any}>{r.title}{r.warn}</span>
{(r.cells || []).map((c: any, c_n: number) => (<Fragment key={c_n}><button onClick={c.go} style={{ height: "30px", border: "2px solid #14123a", borderRadius: "8px", cursor: "pointer", background: `${c.bg}`, fontWeight: "800", color: "#14123a", padding: "0" } as any}>{c.mark}</button></Fragment>))}
</Fragment>))}
</div>
<div style={{ marginTop: "12px", font: "600 13px 'Instrument Sans',sans-serif", color: `${v.unfundedColor}` } as any}>{v.unfundedMsg}</div>
</div>
</section>
</div>

    </>
  );
}

export function PlanningRoomView({ v }: { v: any }) {
  return (
    <>


<div style={{ fontFamily: "'Instrument Sans',sans-serif", color: "#14123a", background: "#f4f1ea", minHeight: "100vh", paddingBottom: "50px" } as any}>
{v.showNav ? (<></>) : null}

{v.needSetup ? (<>
<section style={{ maxWidth: "880px", margin: "6vh auto 0", padding: "0 5vw", animation: "rise .7s both" } as any}>
<div style={{ font: "700 14px ui-monospace,Menlo,monospace", color: "#4a5fe8" } as any}>PLANNING ROOM · SET UP</div>
<h1 style={{ font: "800 clamp(40px,6vw,84px)/.95 'Familjen Grotesk',sans-serif", letterSpacing: "-.045em", margin: "14px 0 18px" } as any}>How many <span style={{ background: "#5ff0e0", padding: "0 .15em", borderRadius: ".15em", display: "inline-block", transform: "rotate(-2deg)" } as any}>teams</span> are in the room?</h1>
<p style={{ fontSize: "19px", lineHeight: "1.5", maxWidth: "56ch", margin: "0 0 26px" } as any}>Every team gets its own train. Every exercise runs on all of them at once, and you can hop between teams or watch the whole yard.</p>
<div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" } as any}>
<button onClick={v.draftDown} style={{ width: "56px", height: "56px", borderRadius: "50%", border: "2px solid #14123a", background: "#fff", fontSize: "26px", cursor: "pointer" } as any}>−</button>
<div style={{ font: "800 96px/1 'Familjen Grotesk',sans-serif", minWidth: "90px", textAlign: "center" } as any}>{v.draft}</div>
<button onClick={v.draftUp} style={{ width: "56px", height: "56px", borderRadius: "50%", border: "2px solid #14123a", background: "#fff", fontSize: "26px", cursor: "pointer" } as any}>+</button>
<div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flex: "1", minWidth: "200px" } as any}>{(v.draftChips || []).map((c: any, c_n: number) => (<Fragment key={c_n}><span style={{ background: `${c.color}`, color: "#fff", fontWeight: "700", borderRadius: "99px", padding: "8px 14px", border: "2px solid #14123a", fontSize: "14px" } as any}>{c.name}</span></Fragment>))}</div>
</div>
<div style={{ font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em", margin: "30px 0 10px" } as any}>PI CALENDAR</div>
<div style={{ background: "#fff", border: "2px solid #14123a", borderRadius: "20px", boxShadow: "5px 5px 0 #14123a", padding: "14px 18px", display: "flex", gap: "18px 26px", flexWrap: "wrap", alignItems: "flex-end" } as any}>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>PI START DATE<input type="date" value={v.calStart} onChange={v.setStart} style={{ border: "2px solid #14123a", borderRadius: "12px", padding: "9px 12px", font: "600 15px 'Instrument Sans',sans-serif", background: "#fbf9f4", color: "#14123a" } as any} /></label>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>ITERATION LENGTH<div style={{ display: "flex", gap: "2px", background: "#f4f1ea", border: "2px solid #14123a", borderRadius: "99px", padding: "3px" } as any}>{(v.calWeeks || []).map((w: any, w_n: number) => (<Fragment key={w_n}><button onClick={w.go} style={{ border: "0", borderRadius: "99px", padding: "7px 14px", font: "700 14px 'Instrument Sans',sans-serif", cursor: "pointer", background: `${w.bg}`, color: `${w.fg}` } as any}>{w.n}</button></Fragment>))}</div></div>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>ITERATIONS IN THE PI<div style={{ display: "flex", alignItems: "center", gap: "8px" } as any}><button onClick={v.nDown} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #14123a", background: "#fff", fontSize: "18px", cursor: "pointer" } as any}>−</button><b style={{ font: "800 22px 'Familjen Grotesk',sans-serif", minWidth: "30px", textAlign: "center", color: "#14123a" } as any}>{v.calN}</b><button onClick={v.nUp} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #14123a", background: "#fff", fontSize: "18px", cursor: "pointer" } as any}>+</button><span style={{ font: "500 13px 'Instrument Sans',sans-serif", color: "#5b5b6e", maxWidth: "200px", lineHeight: "1.3" } as any}>The last one is always the IP iteration.</span></div></div>
<div style={{ flexBasis: "100%", display: "flex", gap: "6px", flexWrap: "wrap" } as any}>{(v.calPreview || []).map((p: any, p_n: number) => (<Fragment key={p_n}><div style={{ border: "2px solid #14123a", borderRadius: "12px", padding: "6px 12px", background: `${p.bg}`, minWidth: "110px" } as any}><div style={{ font: "800 14px 'Familjen Grotesk',sans-serif", color: "#14123a" } as any}>{p.name}</div><div style={{ font: "500 12px 'Instrument Sans',sans-serif", color: "#14123a" } as any}>{p.dates}</div></div></Fragment>))}</div>
</div>
<div style={{ font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em", margin: "30px 0 10px" } as any}>CHOOSE THE SIMULATION</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: "12px" } as any}>
{(v.scenarios || []).map((s: any, s_n: number) => (<Fragment key={s_n}><button onClick={s.go} style={{ textAlign: "left", cursor: "pointer", border: "2px solid #14123a", borderRadius: "18px", padding: "14px 16px", background: `${s.bg}`, boxShadow: `${s.sh}`, display: "flex", flexDirection: "column", gap: "6px", fontFamily: "inherit", color: "#14123a" } as any}><span style={{ font: "800 22px 'Familjen Grotesk',sans-serif", letterSpacing: "-.02em" } as any}>{s.name}</span><span style={{ fontSize: "14px", lineHeight: "1.35" } as any}>{s.blurb}</span><span style={{ font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>{s.meta}</span></button></Fragment>))}
</div>
{v.ownBacklog}
<div style={{ display: "flex", gap: "12px", marginTop: "26px", flexWrap: "wrap", alignItems: "center" } as any}>
<button onClick={v.startRoom} style={{ background: "#14123a", color: "#fff", border: "0", padding: "16px 30px", borderRadius: "99px", fontWeight: "700", fontSize: "18px", cursor: "pointer" } as any}>Start planning</button>
<span style={{ fontSize: "14px", color: "#5b5b6e" } as any}>{v.draft} teams · {v.scnName}</span>
</div>
</section>
</>) : null}

{v.inRoom ? (<>
<header style={{ padding: "3vh 2.5vw 0", display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" } as any}>
<div style={{ font: "800 28px 'Familjen Grotesk',sans-serif", letterSpacing: "-.03em", marginRight: "6px" } as any}>Planning room<span style={{ font: "700 12px ui-monospace,Menlo,monospace", background: "#ffe14d", border: "2px solid #14123a", borderRadius: "99px", padding: "3px 10px", marginLeft: "10px", letterSpacing: "0", verticalAlign: "middle" } as any}>{v.scnName}</span></div>
<div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flex: "1" } as any}>
<button onClick={v.goYard} style={{ border: "2px solid #14123a", borderRadius: "99px", padding: "8px 16px", fontWeight: "700", fontSize: "14px", cursor: "pointer", background: `${v.yardBg}`, color: `${v.yardFg}` } as any}>Yard · all teams</button>
{(v.rail || []).map((t: any, t_n: number) => (<Fragment key={t_n}><button onClick={t.go} style={{ display: "flex", alignItems: "center", gap: "8px", border: "2px solid #14123a", borderRadius: "99px", padding: "6px 14px 6px 8px", fontWeight: "700", fontSize: "14px", cursor: "pointer", background: `${t.bg}`, color: `${t.fg}` } as any}><i style={{ width: "20px", height: "20px", borderRadius: "50%", background: `${t.color}`, border: "2px solid #14123a", display: "block" } as any}></i>{t.name}<span style={{ font: "700 11px ui-monospace,Menlo,monospace", opacity: ".75" } as any}>{t.checks}</span></button></Fragment>))}
</div>
<div style={{ position: "relative" } as any}>
<input value={v.q} onChange={v.setQ} placeholder="Find any ticket, any team" style={{ width: "230px", border: "2px solid #14123a", borderRadius: "99px", padding: "9px 16px", fontSize: "14px", background: "#fff" } as any} />
{v.hasResults ? (<><div style={{ position: "absolute", right: "0", top: "46px", width: "330px", background: "#fff", border: "2px solid #14123a", borderRadius: "16px", boxShadow: "6px 6px 0 #14123a", zIndex: "30", overflow: "hidden" } as any}>
{(v.results || []).map((r: any, r_n: number) => (<Fragment key={r_n}><div onClick={r.go} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #eee8da" } as any}><i style={{ width: "12px", height: "12px", borderRadius: "3px", background: `${r.color}`, display: "block", flex: "none" } as any}></i><span style={{ font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>{r.key}</span><span style={{ flex: "1", fontSize: "14px", fontWeight: "600", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as any}>{r.title}</span><span style={{ fontSize: "12px", color: "#5b5b6e" } as any}>{r.where}</span></div></Fragment>))}
</div></>) : null}
</div>
<button onClick={v.toggleCal} style={{ border: "2px solid #14123a", background: `${v.calBtnBg}`, borderRadius: "99px", padding: "8px 14px", fontWeight: "700", fontSize: "14px", cursor: "pointer" } as any}>PI calendar · {v.piRange}</button>
<button onClick={v.resize} style={{ border: "2px solid #14123a", background: "#fff", borderRadius: "99px", padding: "8px 14px", fontWeight: "700", fontSize: "14px", cursor: "pointer" } as any}>Teams: {v.teamCount}</button>
</header>

{v.calOpen ? (<><section style={{ margin: "12px 2.5vw 0" } as any}><div style={{ background: "#fff", border: "2px solid #14123a", borderRadius: "20px", boxShadow: "5px 5px 0 #14123a", padding: "14px 18px", display: "flex", gap: "18px 26px", flexWrap: "wrap", alignItems: "flex-end" } as any}>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>PI START DATE<input type="date" value={v.calStart} onChange={v.setStart} style={{ border: "2px solid #14123a", borderRadius: "12px", padding: "9px 12px", font: "600 15px 'Instrument Sans',sans-serif", background: "#fbf9f4", color: "#14123a" } as any} /></label>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>ITERATION LENGTH<div style={{ display: "flex", gap: "2px", background: "#f4f1ea", border: "2px solid #14123a", borderRadius: "99px", padding: "3px" } as any}>{(v.calWeeks || []).map((w: any, w_n: number) => (<Fragment key={w_n}><button onClick={w.go} style={{ border: "0", borderRadius: "99px", padding: "7px 14px", font: "700 14px 'Instrument Sans',sans-serif", cursor: "pointer", background: `${w.bg}`, color: `${w.fg}` } as any}>{w.n}</button></Fragment>))}</div></div>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>ITERATIONS IN THE PI<div style={{ display: "flex", alignItems: "center", gap: "8px" } as any}><button onClick={v.nDown} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #14123a", background: "#fff", fontSize: "18px", cursor: "pointer" } as any}>−</button><b style={{ font: "800 22px 'Familjen Grotesk',sans-serif", minWidth: "30px", textAlign: "center", color: "#14123a" } as any}>{v.calN}</b><button onClick={v.nUp} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #14123a", background: "#fff", fontSize: "18px", cursor: "pointer" } as any}>+</button><span style={{ font: "500 13px 'Instrument Sans',sans-serif", color: "#5b5b6e", maxWidth: "200px", lineHeight: "1.3" } as any}>The last one is always the IP iteration.</span></div></div>
<div style={{ flexBasis: "100%", display: "flex", gap: "6px", flexWrap: "wrap" } as any}>{(v.calPreview || []).map((p: any, p_n: number) => (<Fragment key={p_n}><div style={{ border: "2px solid #14123a", borderRadius: "12px", padding: "6px 12px", background: `${p.bg}`, minWidth: "110px" } as any}><div style={{ font: "800 14px 'Familjen Grotesk',sans-serif", color: "#14123a" } as any}>{p.name}</div><div style={{ font: "500 12px 'Instrument Sans',sans-serif", color: "#14123a" } as any}>{p.dates}</div></div></Fragment>))}</div>
</div></section></>) : null}
<section style={{ margin: "12px 2.5vw 0", background: "#14123a", borderRadius: "18px", padding: "10px 12px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" } as any}>
<div style={{ display: "flex", gap: "2px", background: "#2a2760", borderRadius: "99px", padding: "3px" } as any}>{(v.kinds || []).map((k: any, k_n: number) => (<Fragment key={k_n}><button onClick={k.go} style={{ border: "0", borderRadius: "99px", padding: "7px 14px", fontWeight: "700", fontSize: "13px", cursor: "pointer", display: "flex", gap: "6px", alignItems: "center", background: `${k.bg}`, color: `${k.fg}` } as any}><i style={{ width: "10px", height: "10px", borderRadius: "3px", background: `${k.dot}`, border: "1.5px solid #14123a", display: "block" } as any}></i>{k.n}</button></Fragment>))}</div>
<button onClick={v.toggleNewEn} title="Mark the new ticket as an enabler" style={{ border: "2px solid #ffe14d", borderRadius: "99px", padding: "6px 14px", fontWeight: "700", fontSize: "13px", cursor: "pointer", background: `${v.enBg}`, color: `${v.enFg}` } as any}>⚙ Enabler</button>
<input value={v.newText} onChange={v.setNew} onKeyDown={v.newKey} placeholder={v.newHint} style={{ flex: "1 1 220px", minWidth: "0", border: "0", borderRadius: "99px", padding: "10px 16px", fontSize: "15px", background: "#fff" } as any} />
{v.hasParents ? (<><label style={{ display: "flex", gap: "8px", alignItems: "center", color: "#c9c7ee", fontSize: "13px", fontWeight: "600" } as any}>{v.parentLabel}<select value={v.parentVal} onChange={v.setParent} style={{ border: "0", borderRadius: "99px", padding: "9px 12px", fontSize: "14px", maxWidth: "220px", background: "#fff" } as any}>{(v.parentOpts || []).map((o: any, o_n: number) => (<Fragment key={o_n}><option value={o.id}>{o.t}</option></Fragment>))}</select></label></>) : null}
<button onClick={v.addTicket} style={{ border: "0", background: "#ffe14d", color: "#14123a", borderRadius: "99px", padding: "10px 18px", fontWeight: "800", cursor: "pointer" } as any}>Create + trace</button>
</section>
<section style={{ margin: "12px 2.5vw 0", background: "#fff", border: "2px solid #14123a", borderRadius: "16px", padding: "8px 14px", display: "flex", gap: "8px 22px", flexWrap: "wrap", alignItems: "center" } as any}>
<b style={{ font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".12em" } as any}>KEY · CLICK A SWATCH TO RECOLOR</b>
<div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" } as any}>{(v.legStd || []).map((l: any, l_n: number) => (<Fragment key={l_n}><label title={l.tag} style={{ position: "relative", display: "flex", gap: "7px", alignItems: "center", cursor: "pointer", background: "#f4f1ea", borderRadius: "99px", padding: "3px 12px 3px 4px", fontSize: "13px", fontWeight: "700" } as any}><i style={{ width: "22px", height: "22px", borderRadius: "7px", border: "2px solid #14123a", backgroundColor: `${l.color}`, backgroundImage: `${l.img}`, display: "block" } as any}></i>{l.name}<span style={{ font: "600 11px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>{l.n}</span><input type="color" value={l.color} onChange={l.set} style={{ position: "absolute", inset: "0", width: "100%", height: "100%", opacity: "0", cursor: "pointer", padding: "0", border: "0" } as any} /></label></Fragment>))}</div>
<div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" } as any}><span style={{ font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>⚙ ENABLERS</span>{(v.legEn || []).map((l: any, l_n: number) => (<Fragment key={l_n}><label title={l.tag} style={{ position: "relative", display: "flex", gap: "7px", alignItems: "center", cursor: "pointer", background: "#f4f1ea", borderRadius: "99px", padding: "3px 12px 3px 4px", fontSize: "13px", fontWeight: "700" } as any}><i style={{ width: "22px", height: "22px", borderRadius: "7px", border: "2px solid #14123a", backgroundColor: `${l.color}`, backgroundImage: `${l.img}`, display: "block" } as any}></i>{l.name}<span style={{ font: "600 11px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>{l.n}</span><input type="color" value={l.color} onChange={l.set} style={{ position: "absolute", inset: "0", width: "100%", height: "100%", opacity: "0", cursor: "pointer", padding: "0", border: "0" } as any} /></label></Fragment>))}</div>
{v.hasCustom ? (<><button onClick={v.resetColors} style={{ marginLeft: "auto", border: "2px solid #14123a", background: "#fff", borderRadius: "99px", padding: "3px 12px", fontWeight: "700", fontSize: "12px", cursor: "pointer" } as any}>Reset to defaults</button></>) : null}
</section>

<div style={{ margin: "14px 2.5vw 0", display: "flex", gap: "16px", alignItems: "flex-start" } as any}>
<main style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "16px" } as any}>

{v.isYard ? (<>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: "16px" } as any}>
{(v.yard || []).map((y: any, y_n: number) => (<Fragment key={y_n}>
<article onClick={y.go} style={{ background: "#fff", border: "2px solid #14123a", borderRadius: "22px", boxShadow: "6px 6px 0 #14123a", padding: "14px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "10px" } as any}>
<div style={{ display: "flex", alignItems: "center", gap: "10px" } as any}><i style={{ width: "26px", height: "26px", borderRadius: "8px", background: `${y.color}`, border: "2px solid #14123a", display: "block" } as any}></i><b style={{ font: "800 20px 'Familjen Grotesk',sans-serif", flex: "1" } as any}>{y.name}</b><span style={{ font: "700 12px ui-monospace,Menlo,monospace", background: `${y.chkBg}`, borderRadius: "99px", padding: "4px 10px" } as any}>{y.checks} checks</span></div>
<div style={{ display: "flex", gap: "4px", alignItems: "flex-end" } as any}>{(y.cars || []).map((c: any, c_n: number) => (<Fragment key={c_n}><div style={{ flex: "1", height: "44px", border: "2px solid #14123a", borderRadius: "6px", background: "#eef2f7", position: "relative", overflow: "hidden" } as any}><i style={{ position: "absolute", left: "0", right: "0", bottom: "0", height: `${c.h}%`, background: `${c.bg}`, display: "block" } as any}></i></div></Fragment>))}</div>
<div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#5b5b6e" } as any}><span>Load {y.load} / {y.cap}</span><span>{y.features} features · {y.stories} stories</span><span style={{ color: `${y.riskColor}`, fontWeight: "700" } as any}>{y.risks}</span></div>
<div style={{ height: "8px", borderRadius: "8px", background: "#e3ddcf", overflow: "hidden" } as any}><i style={{ display: "block", height: "100%", width: `${y.prog}%`, background: `${y.color}` } as any}></i></div>
</article>
</Fragment>))}
</div>
<div style={{ background: "#fff", border: "2px solid #14123a", borderRadius: "22px", boxShadow: "6px 6px 0 #14123a", padding: "16px 18px" } as any}>
<div style={{ font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>PROGRAM VIEW · SHARED EPICS ACROSS TEAMS</div>
<div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" } as any}>
{(v.shared || []).map((e: any, e_n: number) => (<Fragment key={e_n}><div style={{ display: "grid", gridTemplateColumns: "minmax(120px,200px) minmax(0,1fr) 120px", gap: "12px", alignItems: "center" } as any}><div><div style={{ fontWeight: "700", fontSize: "15px" } as any}>{e.title}</div><div style={{ fontSize: "12px", color: "#5b5b6e" } as any}>{e.obj}</div></div><div style={{ display: "flex", gap: "6px", flexWrap: "wrap" } as any}>{(e.teams || []).map((t: any, t_n: number) => (<Fragment key={t_n}><button onClick={t.go} style={{ border: "2px solid #14123a", borderRadius: "99px", background: `${t.color}`, color: "#fff", fontWeight: "700", fontSize: "12.5px", padding: "4px 12px", cursor: "pointer" } as any}>{t.label}</button></Fragment>))}{e.none ? (<><span style={{ fontSize: "13px", color: "#c8372d", fontWeight: "600" } as any}>No team has a feature for this yet</span></>) : null}</div><div style={{ textAlign: "right", font: "700 13px ui-monospace,Menlo,monospace" } as any}>{e.pts} pts</div></div></Fragment>))}
</div></div>
</>) : null}

{v.isTeam ? (<>
<div style={{ background: "#fff", border: `2px solid ${v.team.color}`, borderRadius: "22px", boxShadow: `6px 6px 0 ${v.team.color}`, padding: "14px 16px", display: "flex", gap: "14px", alignItems: "stretch", flexWrap: "wrap" } as any}>
<div style={{ background: `${v.team.color}`, color: "#fff", borderRadius: "16px 40px 40px 16px", padding: "12px 26px 12px 18px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: "130px" } as any}><div style={{ font: "700 11px ui-monospace,Menlo,monospace", opacity: ".9" } as any}>LOCOMOTIVE</div><div style={{ font: "800 24px 'Familjen Grotesk',sans-serif" } as any}>{v.team.name}</div><div style={{ fontSize: "12px", fontWeight: "600" } as any}>BV committed {v.cBV} · {v.reliab}</div></div>
<div style={{ flex: "1", minWidth: "0", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "stretch" } as any}>
{(v.pios || []).map((o: any, o_n: number) => (<Fragment key={o_n}>
<div style={{ flex: "1 1 210px", maxWidth: "320px", background: `${o.bg}`, border: `2px ${o.border} #14123a`, borderRadius: "14px", padding: "8px 10px", display: "flex", flexDirection: "column", gap: "6px" } as any}>
<div style={{ display: "flex", gap: "6px", alignItems: "center" } as any}><button onClick={o.flip} title="Committed or uncommitted" style={{ border: "2px solid #14123a", background: "#fff", borderRadius: "8px", font: "800 11px ui-monospace,Menlo,monospace", padding: "2px 6px", cursor: "pointer" } as any}>{o.tag}</button><input value={o.t} onChange={o.rename} style={{ flex: "1", minWidth: "0", border: "0", background: "transparent", font: "700 14px 'Instrument Sans',sans-serif", color: "#14123a", padding: "0" } as any} /><button onClick={o.del} style={{ border: "0", background: "none", cursor: "pointer", opacity: ".5" } as any}>✕</button></div>
<div style={{ display: "flex", gap: "3px", alignItems: "center" } as any}><span style={{ font: "700 10px ui-monospace,Menlo,monospace", marginRight: "4px" } as any}>BV</span>{(o.pips || []).map((p: any, p_n: number) => (<Fragment key={p_n}><button onClick={p.go} style={{ flex: "1", height: "14px", border: "1.5px solid #14123a", borderRadius: "4px", padding: "0", cursor: "pointer", background: `${p.bg}` } as any}></button></Fragment>))}</div>
</div>
</Fragment>))}
<button onClick={v.addPio} style={{ flex: "0 0 52px", border: "2px dashed #14123a", borderRadius: "14px", background: "transparent", fontSize: "24px", cursor: "pointer" } as any}>+</button>
</div></div>

{v.capacityPanel}
<div style={{ display: "grid", gridTemplateColumns: `repeat(${v.nIter},minmax(0,1fr))`, gap: "12px", alignItems: "stretch" } as any}>
{(v.wagons || []).map((w: any, w_n: number) => (<Fragment key={w_n}>
<div data-drop={w.key} style={{ display: "flex", flexDirection: "column" } as any}>
<div style={{ flex: "1", background: `${w.bg}`, border: "2px solid #14123a", borderRadius: "16px 16px 6px 6px", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: "300px", boxShadow: "4px 4px 0 #14123a" } as any}>
<div style={{ padding: "10px 12px 8px", borderBottom: "2px solid #14123a", background: "#fff" } as any}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "6px" } as any}><b style={{ font: "800 17px 'Familjen Grotesk',sans-serif" } as any}>{w.name}</b><span style={{ fontSize: "11px", color: "#5b5b6e" } as any}>{w.dates}</span></div>
<div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" } as any}><div style={{ flex: "1", height: "12px", border: "2px solid #14123a", borderRadius: "8px", overflow: "hidden", background: "#eef2f7" } as any}><i style={{ display: "block", height: "100%", width: `${w.fill}%`, background: `${w.gauge}`, transition: "width .3s" } as any}></i></div><b style={{ font: "700 12px ui-monospace,Menlo,monospace", color: `${w.numColor}` } as any}>{w.load}/{w.cap}</b><button onClick={w.capDown} style={{ border: "0", background: "#eef2f7", borderRadius: "6px", width: "20px", height: "20px", cursor: "pointer", padding: "0" } as any}>−</button><button onClick={w.capUp} style={{ border: "0", background: "#eef2f7", borderRadius: "6px", width: "20px", height: "20px", cursor: "pointer", padding: "0" } as any}>+</button></div>
</div>
<div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "6px", flex: "1" } as any}>
{(w.flags || []).map((f: any, f_n: number) => (<Fragment key={f_n}><div onPointerDown={f.down} title={f.hint} style={{ display: "flex", gap: "6px", alignItems: "center", backgroundColor: `${f.color}`, backgroundImage: `${f.img}`, color: `${f.fg}`, border: "2px solid #14123a", borderRadius: "4px 14px 14px 4px", padding: "5px 10px", font: "700 12.5px/1.2 'Instrument Sans',sans-serif", cursor: "grab", touchAction: "none", userSelect: "none", outline: `${f.outline}`, outlineOffset: "2px", animation: `${f.anim}` } as any}><span style={{ minWidth: "0" } as any}><span style={{ opacity: ".8", font: "700 10px ui-monospace,Menlo,monospace" } as any}>{f.key}</span> {f.en}{f.t}</span>{f.hasKids ? (<><button onPointerDown={f.stop} onClick={f.open} title="Open the stack" style={{ marginLeft: "auto", flex: "none", border: "2px solid #14123a", background: "#fff", color: "#14123a", borderRadius: "6px", padding: "0 6px", font: "800 11px ui-monospace,Menlo,monospace", cursor: "pointer", boxShadow: "2px 2px 0 #fff,3px 3px 0 1px #14123a", marginRight: "3px" } as any}>▤ {f.n}</button></>) : null}</div></Fragment>))}
<div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignContent: "flex-start" } as any}>
{(w.crates || []).map((s: any, s_n: number) => (<Fragment key={s_n}><div onPointerDown={s.down} title={s.hint} style={{ width: `calc(${s.w}% - 3px)`, boxSizing: "border-box", minHeight: "46px", backgroundColor: `${s.bg}`, color: `${s.fg}`, border: "2px solid #14123a", borderRadius: "4px", padding: "4px 6px", fontSize: "12px", lineHeight: "1.2", cursor: "grab", touchAction: "none", userSelect: "none", position: "relative", outline: `${s.outline}`, outlineOffset: "2px", animation: `${s.anim}`, backgroundImage: `${s.img}` } as any}><span style={{ font: "700 9px ui-monospace,Menlo,monospace", opacity: ".7", display: "block" } as any}>{s.key}</span><span style={{ background: `${s.bg}`, color: `${s.fg}`, padding: "0 2px", pointerEvents: "none" } as any}>{s.t}</span><b style={{ position: "absolute", right: "-6px", top: "-8px", background: "#fff", border: "2px solid #14123a", borderRadius: "99px", minWidth: "20px", height: "20px", boxSizing: "border-box", display: "grid", placeItems: "center", fontSize: "11px", pointerEvents: "none" } as any}>{s.pts}</b><i style={{ position: "absolute", left: "0", bottom: "0", right: "0", height: "4px", background: `${s.fc}`, display: "block" } as any}></i></div></Fragment>))}
</div>
{(w.hazards || []).map((h: any, h_n: number) => (<Fragment key={h_n}><div onPointerDown={h.down} style={{ display: "flex", gap: "6px", alignItems: "center", background: `${h.bg}`, border: "2px dashed #14123a", borderRadius: "8px", padding: "4px 8px", fontSize: "12px", fontWeight: "600", cursor: "grab", touchAction: "none", userSelect: "none", outline: `${h.outline}` } as any}><span style={{ fontSize: "13px" } as any}>▲</span>{h.t}<b style={{ marginLeft: "auto", font: "800 11px ui-monospace,Menlo,monospace" } as any}>{h.roam}</b></div></Fragment>))}
</div></div>
<div style={{ display: "flex", justifyContent: "space-around", padding: "0 18px", marginTop: "-2px" } as any}><i style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#14123a", border: "4px solid #8a8a99", boxSizing: "border-box", display: "block" } as any}></i><i style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#14123a", border: "4px solid #8a8a99", boxSizing: "border-box", display: "block" } as any}></i></div>
</div>
</Fragment>))}
</div>
<div style={{ height: "8px", background: "repeating-linear-gradient(90deg,#14123a 0 14px,transparent 14px 22px)", marginTop: "-14px", opacity: ".55", borderRadius: "4px" } as any}></div>

<div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr) minmax(0,.9fr)", gap: "14px" } as any}>
<div data-drop="yard" style={{ background: "#fff", border: "2px solid #14123a", borderRadius: "20px", padding: "12px 14px", minHeight: "190px" } as any}>
<div style={{ font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em", marginBottom: "8px" } as any}>FREIGHT YARD · UNPLANNED</div>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" } as any}>
{(v.yardTickets || []).map((f: any, f_n: number) => (<Fragment key={f_n}><div onPointerDown={f.down} title={f.hint} style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", backgroundColor: `${f.bg}`, backgroundImage: `${f.img}`, color: `${f.fg}`, border: "2px solid #14123a", borderRadius: "8px", padding: "6px 10px", font: "600 13px 'Instrument Sans',sans-serif", cursor: "grab", touchAction: "none", userSelect: "none", outline: `${f.outline}`, outlineOffset: "2px", animation: `${f.anim}`, maxWidth: "100%" } as any}><span><span style={{ font: "700 10px ui-monospace,Menlo,monospace", opacity: ".75" } as any}>{f.key}</span> {f.en}{f.t}{f.pts}</span>{f.canTeam ? (<select value={f.teamVal} onChange={f.setTeam} onPointerDown={f.stop} onClick={f.stop} aria-label="Assign to team" title="Assign this and everything under it to a team" style={{ border: "1.5px solid #14123a", borderRadius: "6px", padding: "1px 4px", font: "700 10.5px ui-monospace,Menlo,monospace", background: "#fff", color: "#14123a", cursor: "pointer" } as any}>{(f.teamOpts || []).map((o: any) => (<option key={o.id} value={o.id}>{o.t}</option>))}</select>) : null}{f.sub ? (<span style={{ flexBasis: "100%", font: "500 11.5px/1.3 'Instrument Sans',sans-serif", opacity: ".85" } as any}>{f.sub}</span>) : null}{f.hasKids ? (<><button onPointerDown={f.stop} onClick={f.open} title="Open the stack" style={{ flex: "none", border: "2px solid #14123a", background: "#fff", color: "#14123a", borderRadius: "6px", padding: "0 6px", font: "800 11px ui-monospace,Menlo,monospace", cursor: "pointer", boxShadow: "2px 2px 0 #fff,3px 3px 0 1px #14123a", marginRight: "3px" } as any}>▤ {f.n}</button></>) : null}</div></Fragment>))}
</div>
{v.yardEmpty ? (<><div style={{ color: "#8a8a99", fontSize: "14px", padding: "18px 0", textAlign: "center" } as any}>Everything is loaded. Create a ticket above, or drag one back here to unplan it.</div></>) : null}
</div>
<div style={{ background: "#fff", border: "2px solid #14123a", borderRadius: "20px", padding: "12px 14px", minHeight: "190px" } as any}>
<div style={{ font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em", marginBottom: "8px" } as any}>TRACK AHEAD · RISKS · ROAM</div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" } as any}>
{(v.risks || []).map((r: any, r_n: number) => (<Fragment key={r_n}><div onPointerDown={r.down} style={{ background: `${r.bg}`, border: "2px solid #14123a", borderRadius: "10px", padding: "6px 10px", outline: `${r.outline}`, outlineOffset: "2px", cursor: "grab", touchAction: "none", userSelect: "none" } as any}><div style={{ fontSize: "13px", fontWeight: "600", pointerEvents: "none" } as any}><span style={{ font: "700 10px ui-monospace,Menlo,monospace", opacity: ".7" } as any}>{r.key}</span> {r.t}</div>
<div style={{ display: "flex", gap: "4px", marginTop: "5px", alignItems: "center" } as any}>{(r.roam || []).map((o: any, o_n: number) => (<Fragment key={o_n}><button onClick={o.go} onPointerDown={r.stop} title={o.name} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1.5px solid #14123a", fontWeight: "800", fontSize: "11px", cursor: "pointer", padding: "0", background: `${o.bg}` } as any}>{o.k}</button></Fragment>))}<span style={{ fontSize: "11.5px", fontWeight: "600", marginLeft: "4px", pointerEvents: "none" } as any}>{r.where}</span></div></div></Fragment>))}
</div>
{v.noRisks ? (<><div style={{ color: "#8a8a99", fontSize: "14px", padding: "18px 0", textAlign: "center" } as any}>Clear track. Suspicious. Add a risk.</div></>) : null}
</div>
<div style={{ background: "#fff", border: "2px solid #14123a", borderRadius: "20px", padding: "12px 14px", minHeight: "190px" } as any}>
<div style={{ font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>PLANNING POKER</div>
<div style={{ fontSize: "13px", color: "#5b5b6e", minHeight: "34px", margin: "6px 0 10px", lineHeight: "1.3" } as any}>{v.pokerFor}</div>
<div style={{ display: "flex", justifyContent: "center", paddingBottom: "6px" } as any}>{(v.poker || []).map((p: any, p_n: number) => (<Fragment key={p_n}><button onClick={p.go} style={{ width: "36px", height: "56px", margin: "0 -4px", border: "2px solid #14123a", borderRadius: "8px", background: `${p.bg}`, font: "800 17px 'Familjen Grotesk',sans-serif", cursor: "pointer", color: "#14123a", transform: `rotate(${p.rot}deg) translateY(${p.dy}px)`, transformOrigin: "50% 130%", transition: "transform .15s" } as any}>{p.v}</button></Fragment>))}</div>
</div>
</div>
<div style={{ background: "#14123a", color: "#fff", borderRadius: "16px", padding: "10px 16px", display: "flex", gap: "8px 20px", flexWrap: "wrap", alignItems: "center" } as any}>
<b style={{ font: "800 16px 'Familjen Grotesk',sans-serif" } as any}>Coach sync · {v.doneCount}/5</b>
{(v.checks || []).map((c: any, c_n: number) => (<Fragment key={c_n}><span style={{ display: "flex", gap: "7px", alignItems: "center", fontSize: "13.5px", color: `${c.fg}` } as any}><i style={{ width: "16px", height: "16px", borderRadius: "50%", background: `${c.bg}`, display: "grid", placeItems: "center", fontSize: "10px", fontStyle: "normal", color: "#14123a", fontWeight: "800" } as any}>{c.mark}</i>{c.t}</span></Fragment>))}
</div>
</>) : null}
</main>

{v.hasSel ? (<>
<aside style={{ flex: "0 0 330px", position: "sticky", top: "12px", background: "#fff", border: "2px solid #14123a", borderRadius: "22px", boxShadow: "6px 6px 0 #14123a", overflow: "hidden", maxHeight: "calc(100vh - 30px)", overflowY: "auto" } as any}>
<div style={{ background: "#14123a", color: "#fff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" } as any}><span style={{ font: "700 12px ui-monospace,Menlo,monospace", letterSpacing: ".12em" } as any}>TRACE · {v.sel.key}</span><span style={{ display: "flex", gap: "10px", alignItems: "center" } as any}><button onClick={v.openFull} title="Open the full waybill (Enter)" style={{ border: "2px solid #ffe14d", background: "#ffe14d", color: "#14123a", borderRadius: "99px", padding: "3px 12px", fontWeight: "800", fontSize: "12px", cursor: "pointer" } as any}>⤢ Unfold</button><button onClick={v.closeSel} style={{ border: "0", background: "none", color: "#fff", cursor: "pointer", fontSize: "16px" } as any}>✕</button></span></div>
<div style={{ padding: "14px 16px 6px", font: "800 21px/1.1 'Familjen Grotesk',sans-serif" } as any}>{v.sel.title}</div>
<div style={{ padding: "0 16px", fontSize: "13px", color: "#5b5b6e" } as any}>{v.sel.where}</div>
<div style={{ padding: "14px 16px 4px", font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>LINEAGE · WHY THIS EXISTS</div>
<div style={{ padding: "4px 16px 8px", display: "flex", flexDirection: "column" } as any}>
{(v.chain || []).map((n: any, n_n: number) => (<Fragment key={n_n}><div onClick={n.go} style={{ display: "flex", gap: "12px", cursor: `${n.cursor}` } as any}><div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "18px", flex: "none" } as any}><i style={{ width: "16px", height: "16px", borderRadius: "50%", background: `${n.color}`, border: "2px solid #14123a", display: "block", boxSizing: "border-box", outline: `${n.ring}`, outlineOffset: "2px" } as any}></i><i style={{ flex: "1", width: "2px", background: "#14123a", opacity: `${n.line}`, display: "block", minHeight: "14px" } as any}></i></div><div style={{ paddingBottom: "12px" } as any}><div style={{ font: "700 10.5px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>{n.kind}{n.key}</div><div style={{ fontWeight: `${n.fw}`, fontSize: "14.5px", lineHeight: "1.25" } as any}>{n.title}</div><div style={{ fontSize: "12px", color: "#5b5b6e" } as any}>{n.meta}</div></div></div></Fragment>))}
</div>
<div style={{ padding: "4px 16px 14px" } as any}><div style={{ font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em", marginBottom: "6px" } as any}>DOWNSTREAM</div>
<div style={{ display: "flex", flexDirection: "column", gap: "6px" } as any}>
{(v.down || []).map((d: any, d_n: number) => (<Fragment key={d_n}><div onClick={d.go} style={{ display: "flex", gap: "8px", alignItems: "center", background: "#f4f1ea", borderRadius: "10px", padding: "6px 10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" } as any}><i style={{ width: "10px", height: "10px", borderRadius: "3px", background: `${d.color}`, display: "block", flex: "none" } as any}></i><span style={{ flex: "1", minWidth: "0" } as any}>{d.t}</span><span style={{ fontSize: "11.5px", color: "#5b5b6e", fontWeight: "500" } as any}>{d.where}</span></div></Fragment>))}
{v.noDown ? (<><span style={{ fontSize: "13px", color: "#8a8a99" } as any}>Nothing hangs off this ticket yet.</span></>) : null}
</div></div>
<div style={{ padding: "12px 16px", borderTop: "1px solid #eee8da", background: "#fbf9f4", display: "flex", gap: "8px", flexWrap: "wrap" } as any}><a href="/okrs/board" style={{ fontWeight: "700", fontSize: "13px" } as any}>Open OKR board</a><a href="/roadmap" style={{ fontWeight: "700", fontSize: "13px" } as any}>Open Roadmap</a>{v.sel.canEn ? (<><button onClick={v.sel.toggleEn} style={{ border: "2px solid #14123a", background: `${v.sel.enBg}`, borderRadius: "99px", padding: "4px 12px", fontWeight: "700", fontSize: "12px", cursor: "pointer" } as any}>⚙ Enabler</button></>) : null}<button onClick={v.delSel} style={{ marginLeft: "auto", border: "2px solid #14123a", background: "#ff9fc6", borderRadius: "99px", padding: "4px 12px", fontWeight: "700", fontSize: "12px", cursor: "pointer" } as any}>Delete</button></div>
</aside>
</>) : null}
{v.showFull ? (<>
<div onClick={v.closeFull} style={{ position: "fixed", inset: "0", zIndex: "100", background: "rgba(20,18,58,.78)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "4vh 3vw", animation: "fadeIn .25s ease-out" } as any}>
<div onClick={v.stopClick} style={{ position: "relative", width: "min(980px,100%)", background: "#fffaf0", border: "3px solid #14123a", borderRadius: "26px", boxShadow: "12px 12px 0 #ffe14d,12px 12px 0 3px #14123a", animation: "unfold .45s cubic-bezier(.2,.8,.2,1)", overflow: "hidden" } as any}>
<div style={{ background: "#14123a", color: "#fff", padding: "14px 26px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" } as any}>
<span style={{ font: "700 12px ui-monospace,Menlo,monospace", letterSpacing: ".14em" } as any}>WAYBILL · {v.sel.key}</span>
<span style={{ background: `${v.sel.color}`, color: `${v.sel.fg}`, borderRadius: "99px", padding: "3px 14px", font: "800 12px ui-monospace,Menlo,monospace", letterSpacing: ".1em", transform: "rotate(-3deg)" } as any}>{v.sel.type}</span>
{v.sel.canEn ? (<><button onClick={v.sel.toggleEn} title="Toggle enabler" style={{ border: "2px solid #ffe14d", background: `${v.sel.enBg}`, borderRadius: "99px", padding: "3px 12px", fontWeight: "700", fontSize: "12px", cursor: "pointer", color: "#fff" } as any}>⚙ Enabler</button></>) : null}
<span style={{ flex: "1" } as any}></span>
<button onClick={v.prevT} style={{ border: "2px solid #fff", background: "none", color: "#fff", borderRadius: "99px", padding: "4px 14px", fontWeight: "700", cursor: "pointer" } as any}>← Prev</button>
<span style={{ font: "600 12px ui-monospace,Menlo,monospace", color: "#c9c7ee" } as any}>{v.sel.pos}</span>
<button onClick={v.nextT} style={{ border: "2px solid #fff", background: "none", color: "#fff", borderRadius: "99px", padding: "4px 14px", fontWeight: "700", cursor: "pointer" } as any}>Next →</button>
<button onClick={v.closeFull} title="Esc" style={{ border: "0", background: "#ffe14d", color: "#14123a", borderRadius: "99px", width: "34px", height: "34px", fontWeight: "800", cursor: "pointer" } as any}>✕</button>
</div>
<div style={{ height: "14px", background: "repeating-linear-gradient(90deg,#14123a 0 14px,#fffaf0 14px 28px)" } as any}></div>
<div style={{ padding: "26px 34px 8px" } as any}>
<div style={{ font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".12em" } as any}>TITLE · EDIT IN PLACE</div>
<textarea value={v.sel.title} onChange={v.fullTitle} rows={2} style={{ width: "100%", boxSizing: "border-box", border: "0", borderBottom: "2px dashed #14123a", background: "transparent", font: "800 clamp(26px,4vw,44px)/1.08 'Familjen Grotesk',sans-serif", letterSpacing: "-.03em", color: "#14123a", resize: "vertical", padding: "6px 0", outline: "none" } as any}></textarea>
</div>
<div style={{ padding: "12px 34px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "12px" } as any}>
{(v.facts || []).map((f: any, f_n: number) => (<Fragment key={f_n}><div style={{ background: "#fff", border: "2px solid #14123a", borderRadius: "14px", padding: "10px 14px" } as any}><div style={{ font: "700 10.5px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>{f.k}</div><div style={{ font: "800 20px 'Familjen Grotesk',sans-serif", marginTop: "2px" } as any}>{f.v}</div></div></Fragment>))}
</div>
{v.sel.card ? (<div style={{ padding: "0 34px 8px" } as any}>
{v.sel.card.kind === "story" || v.sel.card.kind === "enabler" ? (
<div style={{ width: "min(100%, 360px)", minHeight: 170, background: v.sel.card.bg, border: "1.5px solid #0d181533", boxShadow: "4px 5px 0 rgba(0,0,0,.12)", padding: "16px 18px", font: "600 17px/1.35 'Helvetica Neue', Helvetica, Arial, sans-serif", color: "#14123a", position: "relative" } as any}>
{v.sel.card.kind === "story" ? (<div><b>As a</b> {v.sel.card.role || <i style={{ opacity: .5 }}>…who…</i>} <b>I can</b> {v.sel.card.want || <i style={{ opacity: .5 }}>…what…</i>} <b>so that</b> {v.sel.card.why || <i style={{ opacity: .5 }}>…why…</i>}.</div>) : (<div><div style={{ font: "700 10.5px ui-monospace,Menlo,monospace", letterSpacing: ".1em", opacity: .7, marginBottom: 6 } as any}>⚙ ENABLER</div>{v.sel.card.text || v.sel.card.title}</div>)}
{v.sel.card.kind === "story" && !v.sel.card.role && !v.sel.card.want ? (<div style={{ marginTop: 10, font: "500 13px/1.35 'Helvetica Neue', Helvetica, Arial, sans-serif", opacity: .75 } as any}>{v.sel.card.title} · fill in As a / I want / So that below and the sticky writes itself.</div>) : null}
{v.sel.card.ac && v.sel.card.ac.length ? (<ol style={{ margin: "10px 0 0", paddingLeft: 20, font: "500 13px/1.35 'Helvetica Neue', Helvetica, Arial, sans-serif" } as any}>{v.sel.card.ac.map((l: string, i: number) => (<li key={i}>{l}</li>))}</ol>) : null}
<span style={{ position: "absolute", right: 10, bottom: 8, font: "800 13px ui-monospace,Menlo,monospace" } as any}>{v.sel.card.pts} pts</span>
</div>) : null}
{v.sel.card.kind === "feature" || v.sel.card.kind === "capability" ? (
<div style={{ width: "min(100%, 460px)", background: "#fff", border: "1.5px solid #c9c9d4", borderRadius: 10, boxShadow: "0 2px 0 #c9c9d4", padding: 10, color: "#14123a" } as any}>
<div style={{ background: v.sel.card.head, color: "#fff", textAlign: "center", padding: "12px 14px", font: "800 20px 'Helvetica Neue', Helvetica, Arial, sans-serif", marginBottom: 12 } as any}>{v.sel.card.en ? "⚙ " : ""}{v.sel.card.title}</div>
<div style={{ padding: "0 8px 6px", font: "500 15px/1.4 'Helvetica Neue', Helvetica, Arial, sans-serif" } as any}>
<div style={{ fontWeight: 800 } as any}>Benefit hypothesis</div>
<div style={{ marginBottom: 10, whiteSpace: "pre-wrap" } as any}>{v.sel.card.hyp || <i style={{ opacity: .5 }}>Write it below: We believe that … will deliver … We will know when …</i>}</div>
<div style={{ fontWeight: 800 } as any}>Acceptance criteria</div>
{v.sel.card.ac.length ? (<ol style={{ margin: "2px 0 0", paddingLeft: 22 } as any}>{v.sel.card.ac.map((l: string, i: number) => (<li key={i}>{l}</li>))}</ol>) : (<i style={{ opacity: .5 }}>One per line below; they are numbered here.</i>)}
</div></div>) : null}
{v.sel.card.kind === "pio" ? (
<div style={{ width: "min(100%, 420px)", background: "#e6fbf7", border: "2px solid #14123a", borderRadius: 14, padding: "14px 18px", color: "#14123a", display: "flex", gap: 14, alignItems: "center" } as any}>
<div style={{ flex: 1, font: "700 17px/1.3 'Helvetica Neue', Helvetica, Arial, sans-serif" } as any}>{v.sel.card.title}<div style={{ font: "600 11px ui-monospace,Menlo,monospace", letterSpacing: ".08em", opacity: .7, marginTop: 4 } as any}>PI OBJECTIVE · {v.sel.card.commit ? "COMMITTED" : "UNCOMMITTED"}</div></div>
<div style={{ textAlign: "center", border: "2px solid #14123a", borderRadius: 12, padding: "6px 12px", background: "#fff" } as any}><div style={{ font: "800 24px 'Helvetica Neue', Helvetica, Arial, sans-serif" } as any}>{v.sel.card.bv}</div><div style={{ font: "700 10px ui-monospace,Menlo,monospace", letterSpacing: ".1em" } as any}>BV</div></div>
</div>) : null}
{v.sel.card.kind === "risk" ? (<div style={{ width: "min(100%, 420px)", background: "#f8a08a", border: "2px solid #14123a", borderRadius: 14, padding: "14px 18px", color: "#14123a", font: "700 17px/1.3 'Helvetica Neue', Helvetica, Arial, sans-serif" } as any}>{v.sel.card.title}<div style={{ font: "600 11px ui-monospace,Menlo,monospace", letterSpacing: ".08em", opacity: .7, marginTop: 4 } as any}>RISK · {String(v.sel.card.roam).toUpperCase()}</div></div>) : null}
{v.sel.card.kind === "epic" ? (<div style={{ width: "min(100%, 460px)", background: "#dfe4fb", border: "2px solid #14123a", borderRadius: 14, padding: "14px 18px", color: "#14123a", font: "600 16px/1.4 'Helvetica Neue', Helvetica, Arial, sans-serif" } as any}><div style={{ font: "800 18px 'Helvetica Neue', Helvetica, Arial, sans-serif", marginBottom: 6 } as any}>{v.sel.card.title}</div>{v.sel.card.text || <i style={{ opacity: .5 }}>The epic hypothesis statement writes itself from the fields below.</i>}</div>) : null}
</div>) : null}
<div style={{ padding: "8px 34px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "24px", alignItems: "start" } as any}>
<div style={{ border: `3px solid ${v.sel.color}`, borderRadius: "18px", overflow: "hidden", background: "#fff", boxShadow: `5px 5px 0 ${v.sel.color}` } as any}>
<div style={{ background: `${v.sel.color}`, color: `${v.sel.fg}`, padding: "9px 16px", font: "800 12px ui-monospace,Menlo,monospace", letterSpacing: ".12em" } as any}>{v.sel.formTitle}</div>
{v.sel.enOn ? (<><div style={{ padding: "12px 16px 0", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" } as any}><span style={{ font: "700 10.5px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em", marginRight: "4px" } as any}>⚙ ENABLER TYPE</span>{(v.etypes || []).map((e: any, e_n: number) => (<Fragment key={e_n}><button onClick={e.go} style={{ border: "2px solid #14123a", borderRadius: "99px", padding: "3px 12px", fontWeight: "700", fontSize: "12.5px", cursor: "pointer", background: `${e.bg}`, color: `${e.fg}` } as any}>{e.n}</button></Fragment>))}</div></>) : null}
<div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "12px" } as any}>
{(v.form || []).map((x: any, x_n: number) => (<Fragment key={x_n}>
<div>
{x.line ? (<><div style={{ display: "flex", gap: "10px", alignItems: "center" } as any}><span style={{ flex: "none", minWidth: "104px", textAlign: "center", boxSizing: "border-box", background: `${x.chipBg}`, color: `${x.chipFg}`, border: "2px solid #14123a", borderRadius: "8px", padding: "5px 8px", font: "800 11px ui-monospace,Menlo,monospace", letterSpacing: ".08em" } as any}>{x.label}</span><input value={x.val} onChange={x.set} placeholder={x.ph} style={{ flex: "1", minWidth: "0", border: "0", borderBottom: "2px dashed #14123a", background: "transparent", font: "600 17px 'Instrument Sans',sans-serif", padding: "6px 2px", outline: "none", color: "#14123a" } as any} /></div></>) : null}
{x.area ? (<><div><span style={{ display: "inline-block", background: `${x.chipBg}`, color: `${x.chipFg}`, border: "2px solid #14123a", borderRadius: "8px", padding: "3px 10px", font: "800 11px ui-monospace,Menlo,monospace", letterSpacing: ".08em", marginBottom: "6px" } as any}>{x.label}</span><textarea value={x.val} onChange={x.set} placeholder={x.ph} rows={x.rows} style={{ display: "block", width: "100%", boxSizing: "border-box", border: "2px solid #14123a", borderRadius: "12px", background: "#fffdf7", font: "500 15px/1.45 'Instrument Sans',sans-serif", padding: "8px 12px", resize: "vertical", outline: "none", color: "#14123a" } as any}></textarea></div></>) : null}
</div>
</Fragment>))}
</div>
</div>
<div>
<div style={{ border: "2px solid #14123a", borderRadius: "16px", padding: "12px 14px", background: "#fff6cf", marginBottom: "18px" } as any}>
<div style={{ font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em", marginBottom: "6px" } as any}>🚂 ASSIGNED TO TEAM</div>
<select value={v.sel.teamValW} onChange={v.sel.setTeamW} aria-label="Team" style={{ width: "100%", border: "2px solid #14123a", borderRadius: "99px", padding: "8px 12px", font: "600 14px 'Instrument Sans',sans-serif", background: "#fff" } as any}>{(v.sel.teamOpts || []).map((o: any, o_n: number) => (<Fragment key={o_n}><option value={o.id}>{o.t}</option></Fragment>))}</select>
<div style={{ fontSize: "12px", color: "#5b5b6e", marginTop: "6px" } as any}>Pick another team to hand this over: it moves with everything under it and lands in that team&apos;s freight yard.</div>
</div>
{v.sel.canParent ? (<><div style={{ border: "2px solid #14123a", borderRadius: "16px", padding: "12px 14px", background: "#f4f1ea", marginBottom: "18px" } as any}>
<div style={{ font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em", marginBottom: "6px" } as any}>⛓ LINKED TO · {v.sel.parentLbl}</div>
<select value={v.sel.parentValW} onChange={v.sel.setParentW} style={{ width: "100%", border: "2px solid #14123a", borderRadius: "99px", padding: "8px 12px", font: "600 14px 'Instrument Sans',sans-serif", background: "#fff" } as any}>{(v.parentOptsW || []).map((o: any, o_n: number) => (<Fragment key={o_n}><option value={o.id}>{o.t}</option></Fragment>))}</select>
<div style={{ fontSize: "12px", color: "#5b5b6e", marginTop: "6px" } as any}>Pick another one to move this ticket, or unlink it.</div>
</div></>) : null}
<div style={{ font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em", marginBottom: "8px" } as any}>LINEAGE · WHY THIS EXISTS</div>
<div style={{ display: "flex", flexDirection: "column" } as any}>
{(v.chain || []).map((n: any, n_n: number) => (<Fragment key={n_n}><div onClick={n.go} style={{ display: "flex", gap: "12px", cursor: `${n.cursor}` } as any}><div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "18px", flex: "none" } as any}><i style={{ width: "16px", height: "16px", borderRadius: "50%", background: `${n.color}`, border: "2px solid #14123a", display: "block", boxSizing: "border-box", outline: `${n.ring}`, outlineOffset: "2px" } as any}></i><i style={{ flex: "1", width: "2px", background: "#14123a", opacity: `${n.line}`, display: "block", minHeight: "14px" } as any}></i></div><div style={{ paddingBottom: "12px" } as any}><div style={{ font: "700 10.5px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>{n.kind}{n.key}</div><div style={{ fontWeight: `${n.fw}`, fontSize: "16px", lineHeight: "1.25" } as any}>{n.title}</div><div style={{ fontSize: "12.5px", color: "#5b5b6e" } as any}>{n.meta}</div></div></div></Fragment>))}
</div>
</div>
</div>
<div style={{ padding: "18px 34px 26px" } as any}>
<div style={{ font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em", marginBottom: "8px" } as any}><span style={{ display: "flex", gap: "10px", alignItems: "center" } as any}>DOWNSTREAM · HANGS OFF THIS TICKET{v.sel.canKids ? (<><button onClick={v.sel.openColl} style={{ border: "2px solid #14123a", background: "#ffe14d", borderRadius: "99px", padding: "2px 12px", font: "800 11px ui-monospace,Menlo,monospace", cursor: "pointer", color: "#14123a" } as any}>▤ OPEN STACK + ADD {v.sel.kidType}</button></>) : null}</span></div>
<div style={{ display: "flex", gap: "8px", flexWrap: "wrap" } as any}>
{(v.down || []).map((d: any, d_n: number) => (<Fragment key={d_n}><div onClick={d.go} style={{ display: "flex", gap: "8px", alignItems: "center", background: "#fff", border: "2px solid #14123a", borderRadius: "12px", padding: "8px 12px", fontSize: "14px", fontWeight: "600", cursor: "pointer" } as any}><i style={{ width: "12px", height: "12px", borderRadius: "4px", background: `${d.color}`, display: "block", flex: "none" } as any}></i><span>{d.t}</span><span style={{ fontSize: "12px", color: "#5b5b6e", fontWeight: "500" } as any}>{d.where}</span></div></Fragment>))}
{v.noDown ? (<><span style={{ fontSize: "14px", color: "#8a8a99" } as any}>Nothing hangs off this ticket yet.</span></>) : null}
</div>
</div>
<div style={{ padding: "10px 34px", background: "#f4f1ea", borderTop: "2px solid #14123a", font: "600 12px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>← → move between tickets · Esc to fold it back up</div>
</div>
</div>
</>) : null}
{v.showColl ? (<>
<div onClick={v.closeColl} style={{ position: "fixed", inset: "0", zIndex: "120", background: "rgba(20,18,58,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "4vh 3vw", animation: "fadeIn .2s ease-out" } as any}>
<div onClick={v.stopClick} style={{ width: "min(880px,100%)", maxHeight: "90vh", display: "flex", flexDirection: "column", background: "#fff", border: "3px solid #14123a", borderRadius: "22px", boxShadow: "8px 8px 0 #14123a", overflow: "hidden", animation: "unfold .35s cubic-bezier(.2,.8,.2,1)" } as any}>
<div style={{ background: `${v.collColor}`, color: `${v.collFg}`, padding: "14px 20px", borderBottom: "3px solid #14123a", display: "flex", gap: "12px", alignItems: "center" } as any}><div style={{ flex: "1", minWidth: "0" } as any}><div style={{ font: "700 11px ui-monospace,Menlo,monospace", letterSpacing: ".14em", opacity: ".85" } as any}>STACK · {v.collKind} · {v.collN} INSIDE</div><div style={{ font: "800 21px/1.1 'Familjen Grotesk',sans-serif" } as any}>{v.collTitle}</div></div><button onClick={v.closeColl} style={{ border: "2px solid #14123a", background: "#fff", color: "#14123a", borderRadius: "99px", width: "32px", height: "32px", fontWeight: "800", cursor: "pointer" } as any}>✕</button></div>
<div style={{ overflowY: "auto", padding: "18px 22px", background: "#f4f1ea", backgroundImage: "radial-gradient(#d9d2c0 1.2px,transparent 1.2px)", backgroundSize: "18px 18px" } as any}>
{v.hasSummary ? (<><div style={{ background: "#fff", border: "2px dashed #14123a", borderRadius: "12px", padding: "10px 14px", fontSize: "14px", lineHeight: "1.4", marginBottom: "16px" } as any}><b style={{ font: "700 10.5px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em", display: "block", marginBottom: "2px" } as any}>HYPOTHESIS</b>{v.collSummary}</div></>) : null}
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: "18px" } as any}>
{(v.collRows || []).map((r: any, r_n: number) => (<Fragment key={r_n}>
<div style={{ transform: `rotate(${r.rot}deg)`, transition: "transform .2s" } as any}>
<div style={{ animation: "deal .5s cubic-bezier(.2,.8,.2,1) both", animationDelay: `${r.delay}`, backgroundColor: `${r.color}`, backgroundImage: `${r.img}`, color: `${r.fg}`, border: "2px solid #14123a", borderRadius: "10px", boxShadow: "5px 5px 0 #14123a", padding: "12px", display: "flex", flexDirection: "column", gap: "8px", minHeight: "150px", position: "relative" } as any}>
<span style={{ font: "800 10px ui-monospace,Menlo,monospace", letterSpacing: ".12em", opacity: ".9" } as any}>{r.tag}</span>
<b style={{ font: "800 17px/1.15 'Familjen Grotesk',sans-serif", flex: "1" } as any}>{r.t}</b>
{r.hasSize ? (<><span style={{ position: "absolute", right: "-8px", top: "-10px", background: "#fff", color: "#14123a", border: "2px solid #14123a", borderRadius: "99px", minWidth: "26px", height: "26px", boxSizing: "border-box", display: "grid", placeItems: "center", font: "800 12px ui-monospace,Menlo,monospace" } as any}>{r.size}</span></>) : null}
<span style={{ fontSize: "11.5px", opacity: ".9" } as any}>{r.meta}</span>
<div style={{ display: "flex", gap: "6px" } as any}><button onClick={r.locate} style={{ flex: "1", border: "2px solid #14123a", background: "#fff", color: "#14123a", borderRadius: "99px", padding: "3px 0", fontWeight: "700", fontSize: "12px", cursor: "pointer" } as any}>Locate</button><button onClick={r.open} style={{ flex: "1", border: "2px solid #14123a", background: "#ffe14d", color: "#14123a", borderRadius: "99px", padding: "3px 0", fontWeight: "700", fontSize: "12px", cursor: "pointer" } as any}>⤢ Open</button></div>
<select value={r.moveVal} onChange={r.move} title="Change parent" style={{ width: "100%", border: "2px solid #14123a", borderRadius: "99px", padding: "4px 8px", font: "600 12px 'Instrument Sans',sans-serif", background: "#fff", color: "#14123a" } as any}>{(r.moveOpts || []).map((o: any, o_n: number) => (<Fragment key={o_n}><option value={o.id}>⇄ {o.t}</option></Fragment>))}</select>
</div>
</div>
</Fragment>))}
</div>
{v.collEmpty ? (<><div style={{ color: "#5b5b6e", fontSize: "15px", padding: "28px 0", textAlign: "center" } as any}>Empty stack. Deal the first card below.</div></>) : null}
</div>
{v.canAddKid ? (<><div style={{ padding: "12px 20px", background: "#fbf9f4", borderTop: "2px solid #14123a", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" } as any}><input value={v.collText} onChange={v.setCollText} onKeyDown={v.collKey} placeholder={`${v.collAdd}…`} style={{ flex: "1 1 180px", minWidth: "0", border: "2px solid #14123a", borderRadius: "99px", padding: "8px 14px", fontSize: "14px", background: "#fff" } as any} /><button onClick={v.toggleCollEn} style={{ border: "2px solid #14123a", background: `${v.collEnBg}`, borderRadius: "99px", padding: "6px 12px", fontWeight: "700", fontSize: "12px", cursor: "pointer" } as any}>⚙ Enabler</button><button onClick={v.addKid} style={{ border: "0", background: "#14123a", color: "#fff", borderRadius: "99px", padding: "9px 16px", fontWeight: "800", fontSize: "13px", cursor: "pointer" } as any}>{v.collAdd}</button></div></>) : null}
</div>
</div>
</>) : null}
</div>
</>) : null}

{v.ghost ? (<><div style={{ position: "fixed", left: `${v.gx}px`, top: `${v.gy}px`, pointerEvents: "none", zIndex: "99", background: "#ffe14d", color: "#14123a", border: "2px solid #14123a", borderRadius: "8px", padding: "8px 12px", font: "700 13px 'Instrument Sans',sans-serif", boxShadow: "4px 4px 0 #14123a", maxWidth: "200px", transform: "rotate(-3deg)" } as any}>{v.gt}</div></>) : null}
</div>

    </>
  );
}

export function AartView({ v }: { v: any }) {
  return (
    <>
<div style={{ fontFamily: "'Instrument Sans',sans-serif", color: "#14123a", display: "flex", flexDirection: "column", gap: "14px" } as any}><div style={{ display: "flex", justifyContent: "flex-end" } as any}><div style={{ display: "flex", gap: "10px", alignItems: "center", background: "#fff", border: "2px solid #14123a", borderRadius: "18px", padding: "10px 16px", boxShadow: "5px 5px 0 #14123a" } as any}><div style={{ font: "800 34px 'Familjen Grotesk',sans-serif" } as any}>{v.rated}/12</div><div style={{ fontSize: "13px", lineHeight: "1.3", color: "#5b5b6e" } as any}>statements<br />rated for your ART</div></div></div><div style={{ background: "#fff", border: "2px solid #14123a", borderRadius: "24px", boxShadow: "8px 8px 0 #14123a", overflow: "hidden" } as any}><div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: "18px" } as any}>
<div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "18px", lineHeight: "1.45", maxWidth: "70ch" } as any}>
{(v.cur.lines || []).map((l: any, l_n: number) => (<Fragment key={l_n}><div style={{ display: "flex", gap: "10px" } as any}><i style={{ color: `${v.cur.color}`, fontStyle: "normal", flex: "none", display: `${l.dot}` } as any}>▶</i><span>{l.t}</span></div></Fragment>))}
</div>

{v.isScale ? (<>
<div style={{ background: "#f4f1ea", borderRadius: "18px", padding: "18px" } as any}>
<div style={{ font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>SCORE THIS STATEMENT</div>
<div style={{ font: "700 24px/1.2 'Familjen Grotesk',sans-serif", margin: "8px 0 14px" } as any}>“We settled working agreements for this class.”</div>
<div style={{ display: "flex", gap: "8px", flexWrap: "wrap" } as any}>{(v.scalePills || []).map((p: any, p_n: number) => (<Fragment key={p_n}><button onClick={p.go} style={{ flex: "1 1 150px", border: "2px solid #14123a", borderRadius: "14px", padding: "14px", font: "700 16px 'Instrument Sans',sans-serif", cursor: "pointer", background: `${p.bg}`, color: "#14123a" } as any}>{p.n}</button></Fragment>))}</div>
<div style={{ marginTop: "16px", font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>ROOM TALLY · FACILITATOR CLICKS</div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" } as any}>{(v.scaleRoom || []).map((r: any, r_n: number) => (<Fragment key={r_n}><div style={{ display: "grid", gridTemplateColumns: "130px minmax(0,1fr) 90px", gap: "10px", alignItems: "center" } as any}><span style={{ fontWeight: "600", fontSize: "14px" } as any}>{r.n}</span><div style={{ height: "18px", border: "2px solid #14123a", borderRadius: "9px", overflow: "hidden", background: "#fff" } as any}><i style={{ display: "block", height: "100%", width: `${r.pct}%`, background: `${r.c}`, transition: "width .25s" } as any}></i></div><div style={{ display: "flex", gap: "4px", alignItems: "center" } as any}><button onClick={r.dec} style={{ width: "26px", height: "26px", borderRadius: "8px", border: "2px solid #14123a", background: "#fff", cursor: "pointer", padding: "0" } as any}>−</button><b style={{ minWidth: "20px", textAlign: "center" } as any}>{r.count}</b><button onClick={r.inc} style={{ width: "26px", height: "26px", borderRadius: "8px", border: "2px solid #14123a", background: "#fff", cursor: "pointer", padding: "0" } as any}>+</button></div></div></Fragment>))}</div>
<div style={{ marginTop: "12px", fontWeight: "600", color: "#7b44f5" } as any}>{v.scaleVerdict}</div>
</div>
</>) : null}

{v.isFlow ? (<>
<div style={{ background: "#f4f1ea", borderRadius: "18px", padding: "18px 18px 14px", overflowX: "auto" } as any}>
<div style={{ font: "700 13px 'Instrument Sans',sans-serif", textAlign: "center", marginBottom: "10px" } as any}>AI-Native SAFe outcome-driven product development</div>
<div style={{ minWidth: "640px" } as any}>
<div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8a8a99", font: "600 12px 'Instrument Sans',sans-serif", margin: "0 6px" } as any}><i style={{ flex: "1", borderTop: "2px solid #8a8a99", borderLeft: "2px solid #8a8a99", height: "12px", display: "block" } as any}></i>Flow ▸<i style={{ flex: "1", borderTop: "2px solid #8a8a99", borderRight: "2px solid #8a8a99", height: "12px", display: "block" } as any}></i></div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: "22px", margin: "8px 0" } as any}>
{(v.stages || []).map((s: any, s_n: number) => (<Fragment key={s_n}><div style={{ position: "relative", background: "#7b44f5", color: "#fff", borderRadius: "12px", padding: "12px 8px", textAlign: "center", minHeight: "70px", display: "flex", flexDirection: "column", justifyContent: "center" } as any}><b style={{ font: "700 14px/1.2 'Instrument Sans',sans-serif" } as any}>{s.t}</b><span style={{ fontSize: "12px", opacity: ".95" } as any}>({s.sub})</span><span style={{ position: "absolute", right: "-19px", top: "50%", marginTop: "-9px", color: "#7b44f5", display: `${s.arrow}` } as any}>▶</span></div></Fragment>))}
</div>
<div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8a8a99", font: "600 12px 'Instrument Sans',sans-serif", margin: "0 6px" } as any}><i style={{ flex: "1", borderBottom: "2px solid #8a8a99", borderLeft: "2px solid #8a8a99", height: "12px", display: "block" } as any}></i>◂ Feedback<i style={{ flex: "1", borderBottom: "2px solid #8a8a99", borderRight: "2px solid #8a8a99", height: "12px", display: "block" } as any}></i></div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: "22px", marginTop: "12px" } as any}>
{(v.stages || []).map((s: any, s_n: number) => (<Fragment key={s_n}><textarea key={s.val} defaultValue={s.val} onBlur={s.set} placeholder="In your ART today…" style={{ minHeight: "84px", border: `2px solid ${s.bd}`, borderRadius: "10px", padding: "8px", fontSize: "13px", resize: "vertical", background: "#fff", color: "#14123a" } as any}></textarea></Fragment>))}
</div></div>
<div style={{ fontSize: "13px", marginTop: "10px", fontWeight: "600", color: `${v.flowColor}` } as any}>{v.flowMsg}</div>
</div>
</>) : null}

{v.isOkr ? (<>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: "16px" } as any}>
<div style={{ background: "#fff", border: "3px solid #7b44f5", boxShadow: "6px 6px 0 #7b44f5", borderRadius: "6px", padding: "16px 18px" } as any}>
<div style={{ font: "800 26px 'Familjen Grotesk',sans-serif" } as any}>Data Platform ART</div>
<div style={{ margin: "10px 0 4px", fontSize: "16px" } as any}><b>Objective:</b> Modernize our platform.</div>
<div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" } as any}>{(v.okrObj || []).map((c: any, c_n: number) => (<Fragment key={c_n}><button onClick={c.go} style={{ border: "2px solid #14123a", borderRadius: "99px", padding: "4px 10px", font: "700 12px 'Instrument Sans',sans-serif", cursor: "pointer", background: `${c.bg}` } as any}>{c.n}</button></Fragment>))}</div>
<div style={{ fontWeight: "700", marginBottom: "6px" } as any}>Key Results:</div>
<div style={{ display: "flex", flexDirection: "column", gap: "10px" } as any}>{(v.okrKrs || []).map((k: any, k_n: number) => (<Fragment key={k_n}><div style={{ background: "#f4f1ea", borderRadius: "12px", padding: "10px 12px" } as any}><div style={{ fontSize: "15px", lineHeight: "1.3", marginBottom: "6px" } as any}>{k.t}</div><div style={{ display: "flex", gap: "6px", flexWrap: "wrap" } as any}>{(k.crit || []).map((c: any, c_n: number) => (<Fragment key={c_n}><button onClick={c.go} style={{ border: "2px solid #14123a", borderRadius: "99px", padding: "3px 10px", font: "700 12px 'Instrument Sans',sans-serif", cursor: "pointer", background: `${c.bg}` } as any}>{c.mark} {c.n}</button></Fragment>))}</div></div></Fragment>))}</div>
</div>
<div style={{ background: "#f4f1ea", borderRadius: "18px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" } as any}>
<div style={{ font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>YOUR VERDICT</div>
<div style={{ font: "800 44px/1 'Familjen Grotesk',sans-serif" } as any}>{v.okrScore}<span style={{ fontSize: "20px", color: "#5b5b6e" } as any}> / 16 criteria</span></div>
<div style={{ height: "12px", border: "2px solid #14123a", borderRadius: "8px", overflow: "hidden", background: "#fff" } as any}><i style={{ display: "block", height: "100%", width: `${v.okrPct}%`, background: "#7b44f5" } as any}></i></div>
<div style={{ fontSize: "15px", lineHeight: "1.45" } as any}>{v.okrMsg}</div>
<div style={{ fontSize: "13px", color: "#5b5b6e" } as any}>Tap pills to mark what the OKR meets. Then talk: would this make it obvious what to prioritize? Which Key Result could a dashboard show automatically? See the <a href="/okrs/board">OKR board</a>.</div>
</div></div>
</>) : null}

{v.isSf ? (<>
<div style={{ border: "2px solid #14123a", borderRadius: "16px", overflow: "hidden" } as any}>
<div style={{ background: "#7b44f5", color: "#fff", padding: "12px 18px", font: "800 19px 'Familjen Grotesk',sans-serif", textAlign: "center" } as any}>{v.sfTitle}</div>
{(v.sfRows || []).map((r: any, r_n: number) => (<Fragment key={r_n}>
<div style={{ padding: "14px 18px", borderTop: "1px solid #cfd7e2", background: `${r.bg}`, display: "flex", flexDirection: "column", gap: "10px" } as any}>
<div style={{ fontSize: "16.5px", lineHeight: "1.35" } as any}>{r.t}</div>
<div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" } as any}>
{(r.pills || []).map((p: any, p_n: number) => (<Fragment key={p_n}><button onClick={p.go} style={{ border: "2px solid #14123a", borderRadius: "99px", padding: "7px 14px", font: "700 13.5px 'Instrument Sans',sans-serif", cursor: "pointer", background: `${p.bg}`, color: "#14123a" } as any}>{p.n}</button></Fragment>))}
{r.changed ? (<><span style={{ fontSize: "12.5px", fontWeight: "700", color: "#7b44f5" } as any}>changed · was {r.was}</span></>) : null}
</div>
{v.showRoom ? (<><div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center", background: "#fff", borderRadius: "12px", padding: "8px 12px" } as any}>
<span style={{ font: "700 11px ui-monospace,Menlo,monospace", color: "#5b5b6e" } as any}>ROOM</span>
{(r.room || []).map((o: any, o_n: number) => (<Fragment key={o_n}><span style={{ display: "flex", gap: "4px", alignItems: "center", fontSize: "13px" } as any}><i style={{ width: "10px", height: "10px", borderRadius: "50%", background: `${o.c}`, display: "block" } as any}></i>{o.short}<button onClick={o.dec} style={{ width: "22px", height: "22px", borderRadius: "6px", border: "1.5px solid #14123a", background: "#fff", cursor: "pointer", padding: "0" } as any}>−</button><b style={{ minWidth: "16px", textAlign: "center" } as any}>{o.count}</b><button onClick={o.inc} style={{ width: "22px", height: "22px", borderRadius: "6px", border: "1.5px solid #14123a", background: "#fff", cursor: "pointer", padding: "0" } as any}>+</button></span></Fragment>))}
<span style={{ fontSize: "13px", fontWeight: "700", color: `${r.splitColor}` } as any}>{r.split}</span></div></>) : null}
</div>
</Fragment>))}</div>
{v.showRoom ? (<><div style={{ fontSize: "14px", color: "#5b5b6e" } as any}><b>Note:</b> you do not need to agree. Understanding the differences is the point.</div></>) : null}
</>) : null}

{v.isStrategy ? (<>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "14px" } as any}>
{(v.strat || []).map((q: any, q_n: number) => (<Fragment key={q_n}><label style={{ display: "flex", flexDirection: "column", gap: "6px", font: "700 13px 'Instrument Sans',sans-serif" } as any}>{q.q}<textarea key={q.val} defaultValue={q.val} onBlur={q.set} style={{ minHeight: "130px", border: "2px solid #14123a", borderRadius: "14px", padding: "12px", fontSize: "15px", background: "#fbf9f4", resize: "vertical", color: "#14123a" } as any}></textarea></label></Fragment>))}
</div>
<div style={{ fontSize: "14px", color: `${v.stratColor}`, fontWeight: "600" } as any}>{v.stratMsg}</div>
</>) : null}

{v.isData ? (<>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" } as any}>
<div><div style={{ font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em", marginBottom: "6px" } as any}>1 · PICK A DATA TYPE YOUR ART RELIES ON</div><div style={{ display: "flex", gap: "8px", flexWrap: "wrap" } as any}>{(v.dataTypes || []).map((d: any, d_n: number) => (<Fragment key={d_n}><button onClick={d.go} style={{ border: "2px solid #14123a", borderRadius: "99px", padding: "9px 16px", font: "700 14px 'Instrument Sans',sans-serif", cursor: "pointer", background: `${d.bg}` } as any}>{d.n}</button></Fragment>))}</div></div>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>2 · NAME A SPECIFIC SOURCE THAT ALREADY EXISTS<input key={v.dataSource} defaultValue={v.dataSource} onBlur={v.setSource} placeholder="A real system or document, not a category" style={{ border: "2px solid #14123a", borderRadius: "12px", padding: "11px 14px", fontSize: "16px", background: "#fbf9f4", color: "#14123a", fontFamily: "'Instrument Sans',sans-serif" } as any} /></label>
<div><div style={{ font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em", marginBottom: "6px" } as any}>3 · WHICH QUALITIES DOES IT MEET?</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "10px" } as any}>{(v.dataQ || []).map((q: any, q_n: number) => (<Fragment key={q_n}><button onClick={q.go} style={{ border: "2px solid #14123a", borderRadius: "16px", padding: "16px 10px", cursor: "pointer", background: `${q.bg}`, font: "700 15px 'Instrument Sans',sans-serif", color: "#14123a" } as any}>{q.mark} {q.n}</button></Fragment>))}</div></div>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>4 · ONE CONCRETE ACTION THAT FIXES THE GAP<input key={v.dataAction} defaultValue={v.dataAction} onBlur={v.setAction} style={{ border: "2px solid #14123a", borderRadius: "12px", padding: "11px 14px", fontSize: "16px", background: "#fbf9f4", color: "#14123a", fontFamily: "'Instrument Sans',sans-serif" } as any} /></label>
<div style={{ fontWeight: "600", color: `${v.dataColor}` } as any}>{v.dataMsg}</div>
</div>
</>) : null}

{v.isGap ? (<>
<div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "12px" } as any}>
{(v.gapTotals || []).map((g: any, g_n: number) => (<Fragment key={g_n}><div style={{ background: `${g.bg}`, border: "2px solid #14123a", borderRadius: "16px", padding: "14px 16px" } as any}><div style={{ font: "800 40px/1 'Familjen Grotesk',sans-serif" } as any}>{g.count}</div><div style={{ fontWeight: "600", fontSize: "14px" } as any}>{g.n}</div></div></Fragment>))}
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" } as any}>
{(v.gapSf || []).map((f: any, f_n: number) => (<Fragment key={f_n}><div style={{ border: "2px solid #14123a", borderRadius: "16px", overflow: "hidden" } as any}><div style={{ background: "#7b44f5", color: "#fff", padding: "9px 16px", font: "800 16px 'Familjen Grotesk',sans-serif" } as any}>{f.title}</div>
{(f.rows || []).map((r: any, r_n: number) => (<Fragment key={r_n}><div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "10px", alignItems: "center", padding: "10px 16px", borderTop: "1px solid #cfd7e2" } as any}><div><div style={{ fontSize: "15px", lineHeight: "1.3" } as any}>{r.t}</div><div style={{ fontSize: "12px", color: "#5b5b6e" } as any}>You: {r.mine}</div></div><div style={{ display: "flex", gap: "5px" } as any}>{(r.pills || []).map((p: any, p_n: number) => (<Fragment key={p_n}><button onClick={p.go} title="Consensus" style={{ width: "38px", height: "38px", borderRadius: "50%", border: "2px solid #14123a", font: "800 14px 'Instrument Sans',sans-serif", cursor: "pointer", background: `${p.bg}`, color: "#14123a" } as any}>{p.k}</button></Fragment>))}</div></div></Fragment>))}</div></Fragment>))}
</div>
<div style={{ background: "#14123a", color: "#fff", borderRadius: "18px", padding: "16px 20px", display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" } as any}>
<div style={{ flex: "1 1 280px", fontSize: "15px", lineHeight: "1.4" } as any}><b style={{ font: "800 19px 'Familjen Grotesk',sans-serif" } as any}>Build the launch plan.</b><br />Every gap becomes a card in the <a href="/roadmap" style={{ color: "#5ff0e0" } as any}>Roadmap</a> collection. Not in place becomes an epic, partially in place an enabler.</div>
<button onClick={v.sendGaps} style={{ border: "0", background: "#ffe14d", color: "#14123a", borderRadius: "99px", padding: "13px 22px", fontWeight: "800", fontSize: "15px", cursor: "pointer" } as any}>{v.sendLabel}</button></div>
</>) : null}

{v.hasNotes ? (<><label style={{ display: "flex", flexDirection: "column", gap: "6px", font: "700 12px ui-monospace,Menlo,monospace", color: "#5b5b6e", letterSpacing: ".1em" } as any}>SCRIBE NOTES<textarea key={v.notes} defaultValue={v.notes} onBlur={v.setNotes} placeholder="What did the room say?" style={{ minHeight: "90px", border: "2px solid #14123a", borderRadius: "14px", padding: "12px", fontSize: "15px", background: "#fbf9f4", resize: "vertical", color: "#14123a", fontFamily: "'Instrument Sans',sans-serif" } as any}></textarea></label></>) : null}

</div></div></div>
    </>
  );
}
