import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'fs';
const { cards, SERIES } = await import('./cards.mjs');
const OUT = process.argv[2] || 'out'; fs.mkdirSync(OUT,{recursive:true});
const fmt=(c,r)=>{ if(r.lab) return r.lab; const d=c.dec??0; let v=r.v.toLocaleString('en-US',{minimumFractionDigits:(r.v%1? d:0),maximumFractionDigits:d}); return (c.pre||'')+v+(c.unit||''); };
const css=`@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:675px;overflow:hidden;font-family:'Archivo',sans-serif;background:#fff;color:#111114}
.card{width:1200px;height:675px;padding:44px 64px 36px;display:flex;flex-direction:column;position:relative}
.rule{position:absolute;left:0;top:0;width:100%;height:10px;background:#2545f5}
.top{display:flex;justify-content:space-between;align-items:baseline}
.eyebrow{font-family:'IBM Plex Mono',monospace;font-size:17px;letter-spacing:.12em;text-transform:uppercase;color:#2545f5;font-weight:600}
.eyebrow b{color:#77777f;font-weight:500}
.brand{font-weight:900;font-size:24px;letter-spacing:-.02em}.brand span{color:#2545f5}
h1{font-size:44px;line-height:1.1;font-weight:800;letter-spacing:-.02em;margin-top:18px;max-width:1040px}
.chart{flex:1;display:flex;flex-direction:column;justify-content:center;margin:14px 0 6px}
.hrow{display:flex;align-items:center;margin:9px 0}
.hl{width:400px;font-size:22px;font-weight:600;color:#33333a;padding-right:18px;line-height:1.15}
.ht{flex:1;display:flex;align-items:center;height:40px}
.hb{height:40px;border-radius:0 4px 4px 0;background:#c9cfe0;min-width:4px}
.hb.hi{background:#2545f5}
.hb.cl{background:repeating-linear-gradient(135deg,#d6d6dc 0 8px,#ececf0 8px 14px)}
.hv{font-family:'IBM Plex Mono',monospace;font-size:24px;font-weight:600;margin-left:14px;white-space:nowrap;color:#111114}
.tag{font-family:'IBM Plex Mono',monospace;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#77777f;margin-left:10px}
.cols{display:flex;align-items:flex-end;justify-content:center;gap:56px;height:270px;border-bottom:3px solid #111114;padding:0 40px}
.col{width:190px;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center}
.cv{font-family:'IBM Plex Mono',monospace;font-size:26px;font-weight:600;margin-bottom:8px;color:#111114}
.cb{width:100%;border-radius:4px 4px 0 0;background:#c9cfe0}.cb.hi{background:#2545f5}
.cl2{display:flex;justify-content:center;gap:56px;padding:0 40px;margin-top:10px}
.cl2 span{width:190px;text-align:center;font-size:19px;font-weight:600;color:#55555e;line-height:1.2}
.note{font-size:19px;line-height:1.4;color:#55555e;max-width:1060px}
.bottom{display:flex;align-items:center;gap:16px;margin-top:14px}
.chip{font-family:'IBM Plex Mono',monospace;font-size:14px;letter-spacing:.06em;text-transform:uppercase;border:2px solid;padding:6px 12px;font-weight:600;white-space:nowrap}
.HIGH{color:#177245}.MEDIUM{color:#9a6a00}.DERIVED{color:#2545f5}
.src{font-family:'IBM Plex Mono',monospace;font-size:16px;color:#77777f}`;
function chart(c){
  const max=Math.max(...c.rows.map(r=>r.v));
  if(c.chart==='hbar') return c.rows.map(r=>`<div class="hrow"><div class="hl">${r.l}</div><div class="ht"><div class="hb ${r.hl?'hi':''} ${r.claim?'cl':''}" style="width:${Math.max(r.v/max*100,0.6).toFixed(2)}%"></div><span class="hv">${fmt(c,r)}</span>${r.claim?'<span class="tag">claimed</span>':''}</div></div>`).join('');
  return `<div class="cols">${c.rows.map(r=>`<div class="col"><span class="cv">${fmt(c,r)}</span><div class="cb ${r.hl?'hi':''}" style="height:${(r.v/max*82).toFixed(1)}%"></div></div>`).join('')}</div><div class="cl2">${c.rows.map(r=>`<span>${r.l}</span>`).join('')}</div>`;
}
const page=await (await chromium.launch()).newPage({viewport:{width:1200,height:675}});
for(const c of cards){
  const h=`<style>${css}</style><div class="card"><div class="rule"></div><div class="top"><span class="eyebrow">${SERIES} · ${String(c.n).padStart(2,'0')}/14 <b>· ${c.eyebrow}</b></span><span class="brand">REPORT<span>AI</span></span></div><h1>${c.headline}</h1><div class="chart">${chart(c)}</div><div class="note">${c.note}</div><div class="bottom"><span class="chip ${c.conf}">${c.conf}</span><span class="src">${c.source} · report-ai.org</span></div></div>`;
  await page.setContent(h,{waitUntil:'networkidle'}); await page.evaluate(()=>document.fonts.ready);
  const over=await page.evaluate(()=>{const cd=document.querySelector('.card');return [...cd.querySelectorAll('*')].some(e=>e.getBoundingClientRect().bottom>675.5||e.getBoundingClientRect().right>1200.5)});
  await page.screenshot({path:`${OUT}/${c.file}`}); console.log(c.file, over?'OVERFLOW':'ok');
}
process.exit(0);
