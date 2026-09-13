import { chromium } from 'playwright-core';
import fs from 'fs';

const OUT = process.argv[3] || '/home/user/test/social-posts/out';
fs.mkdirSync(OUT, { recursive: true });

const { cards } = await import(process.argv[2] ? new URL(process.argv[2], `file://${process.cwd()}/`).href : '../social-posts/2026-08-21/cards.sample.js');

const css = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1200px;height:675px;font-family:'Archivo',sans-serif;overflow:hidden;}
.card{width:1200px;height:675px;padding:64px 72px 56px;display:flex;flex-direction:column;position:relative;}
.light{background:#fff;color:#111114;}
.dark{background:#111114;color:#fff;}
.mono{font-family:'IBM Plex Mono',monospace;}
.topbar{display:flex;justify-content:space-between;align-items:baseline;}
.eyebrow{font-family:'IBM Plex Mono',monospace;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:#2545f5;font-weight:600;}
.dark .eyebrow{color:#5a78ff;}
.brand{font-weight:900;font-size:24px;letter-spacing:-0.02em;}
.brand span{color:#2545f5;}
.dark .brand span{color:#5a78ff;}
.big{font-weight:900;font-size:230px;line-height:.92;letter-spacing:-0.05em;margin-top:26px;}
.big .unit{color:#2545f5;}
.dark .big .unit{color:#5a78ff;}
.statement{font-size:36px;line-height:1.32;font-weight:600;max-width:960px;margin-top:18px;letter-spacing:-0.01em;}
.light .statement{color:#33333a;}
.dark .statement{color:#e8e8ec;}
.sub{font-family:'IBM Plex Mono',monospace;font-size:20px;margin-top:20px;color:#77777f;}
.dark .sub{color:#9a9aa2;}
.bottom{margin-top:auto;display:flex;align-items:center;gap:18px;}
.chip{font-family:'IBM Plex Mono',monospace;font-size:16px;letter-spacing:.05em;text-transform:uppercase;border:2px solid currentColor;padding:8px 14px;font-weight:600;}
.chip.hi{color:#177245;border-color:#177245;}
.dark .chip.hi{color:#79d6a3;border-color:#79d6a3;}
.chip.med{color:#9a6a00;border-color:#9a6a00;}
.dark .chip.med{color:#ffd479;border-color:#ffd479;}
.src{font-family:'IBM Plex Mono',monospace;font-size:18px;color:#77777f;}
.dark .src{color:#9a9aa2;}
.rule{position:absolute;left:0;top:0;width:100%;height:10px;background:#2545f5;}
.title{font-family:'IBM Plex Mono',monospace;font-size:24px;letter-spacing:.06em;text-transform:uppercase;color:#77777f;margin-top:34px;}
.chart{display:flex;align-items:flex-end;gap:70px;height:320px;border-bottom:4px solid #111114;margin-top:36px;max-width:900px;}
.col{flex:1;max-width:150px;display:flex;flex-direction:column;justify-content:flex-end;height:100%;}
.val{font-family:'IBM Plex Mono',monospace;font-size:30px;font-weight:600;text-align:center;margin-bottom:10px;}
.bar{display:block;background:#d8d8de;}
.col:last-child .bar{background:#2545f5;}
.col:last-child .val{color:#2545f5;}
.years{display:flex;gap:70px;max-width:900px;margin-top:12px;}
.years span{flex:1;max-width:150px;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:22px;color:#77777f;}
.hrows{display:flex;flex-direction:column;gap:22px;margin-top:40px;max-width:1000px;}
.hrow{display:flex;align-items:center;gap:24px;}
.hlab{width:170px;font-size:26px;font-weight:700;}
.htrack{flex:1;display:flex;align-items:center;}
.hbar{height:34px;background:#c8d0f5;}
.hrow:first-child .hbar{background:#2545f5;}
.hval{font-family:'IBM Plex Mono',monospace;font-size:24px;margin-left:16px;width:90px;}
`;

function html(c){
  let body='';
  const top = `<div class="topbar"><span class="eyebrow">${c.eyebrow}</span><span class="brand">REPORT<span>AI</span></span></div>`;
  const bottom = `<div class="bottom"><span class="chip ${c.conf==='HIGH'?'hi':'med'}">${c.conf} confidence</span><span class="src">Source: ${c.source} · <span style="white-space:nowrap">report-ai.org</span></span></div>`;
  if(c.mode==='chart'){
    const max=Math.max(...c.bars.map(b=>b.v));
    body=`${top}<div class="title">${c.title}</div><div class="chart">${c.bars.map(b=>`<div class="col"><span class="val">${b.v}${c.suffix}</span><span class="bar" style="height:${(b.v/max*100).toFixed(1)}%"></span></div>`).join('')}</div><div class="years">${c.bars.map(b=>`<span>${b.y}</span>`).join('')}</div>${bottom}`;
    return `<style>${css}</style><div class="card light"><div class="rule"></div>${body}</div>`;
  }
  if(c.mode==='hbar'){
    const max=Math.max(...c.hbars.map(b=>b.v));
    body=`${top}<div class="title">${c.title}</div><div class="hrows">${c.hbars.map(b=>`<div class="hrow"><span class="hlab">${b.l}</span><span class="htrack"><span class="hbar" style="width:${(b.v/max*100).toFixed(1)}%"></span><span class="hval">${b.v}${c.hsuffix}</span></span></div>`).join('')}</div>${bottom}`;
    return `<style>${css}</style><div class="card light"><div class="rule"></div>${body}</div>`;
  }
  body=`${top}<div class="big">${c.big}<span class="unit">${c.unit}</span></div><div class="statement">${c.statement}</div>${c.sub?`<div class="sub">${c.sub}</div>`:''}${bottom}`;
  return `<style>${css}</style><div class="card ${c.mode}">${c.mode==='light'?'<div class="rule"></div>':''}${body}</div>`;
}

const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport:{width:1200,height:675}, deviceScaleFactor:1 });
for(const c of cards){
  await page.setContent(html(c), { waitUntil:'networkidle' });
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({ path:`${OUT}/${c.file}` });
  console.log('rendered', c.file);
}
await browser.close();
