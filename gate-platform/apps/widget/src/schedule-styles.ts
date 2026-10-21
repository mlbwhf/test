// Schedule widget CSS, injected once per page. Classes are prefixed "gs-" and the widget uses the
// host page's font, so it sits naturally inside a WordPress or Webflow theme. Brand colours come
// from --gs-ink and --gs-accent (data-gate-ink / data-gate-accent).

export const SCHEDULE_STYLE_ID = "gate-schedule-css";

export const SCHEDULE_CSS = `
.gs-root{--gs-ink:#0b1320;--gs-accent:#16a34a;--gs-text:#0f172a;--gs-muted:#64748b;--gs-line:#e6e9ee;--gs-soft:#f0fdf4;--gs-tz:#0e7490;
font-family:inherit;color:var(--gs-text);text-align:left;max-width:1180px;margin:30px auto;box-sizing:border-box}
.gs-root *,.gs-root *::before,.gs-root *::after{box-sizing:border-box}
.gs-root button{font-family:inherit}
.gs-wrap{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:26px;align-items:start}
.gs-wrap.gs-no-side{grid-template-columns:minmax(0,1fr)}
.gs-head{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.gs-head h2{margin:0;color:var(--gs-text);font-size:30px;font-weight:800;line-height:1.1}
.gs-count{color:var(--gs-muted);font-size:14px}
.gs-toggle{margin-left:auto;display:inline-flex;border:1px solid #e2e8f0;border-radius:30px;overflow:hidden}
.gs-toggle button{border:none;background:#fff;color:#475569;font-weight:700;font-size:13px;padding:8px 16px;cursor:pointer}
.gs-toggle button[aria-pressed="true"]{background:var(--gs-ink);color:#fff}
.gs-filters{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin-bottom:20px}
.gs-pill{cursor:pointer;border:1px solid #e2e8f0;background:#fff;color:var(--gs-text);font-weight:600;font-size:13px;padding:9px 18px;border-radius:30px;transition:all .15s}
.gs-pill:hover{border-color:var(--gs-accent)}
.gs-pill[aria-pressed="true"]{background:var(--gs-ink);color:#fff;border-color:var(--gs-ink)}
.gs-pill-static{cursor:default;color:var(--gs-tz);border-color:#a5f3fc;background:#ecfeff}
.gs-pill-reset{color:var(--gs-muted)}
.gs-select{border:1px solid #e2e8f0;border-radius:30px;padding:9px 16px;font-size:13px;color:var(--gs-text);font-weight:600;background:#fff;cursor:pointer;width:auto;max-width:220px}
.gs-card{display:grid;grid-template-columns:1.5fr .7fr 1.05fr;border:1px solid var(--gs-line);border-radius:14px;padding:24px 26px;margin-bottom:18px;align-items:center;cursor:pointer;background:#fff;transition:box-shadow .15s,border-color .15s}
.gs-card:hover{border-color:var(--gs-accent);box-shadow:0 6px 20px rgba(2,44,54,.08)}
.gs-card.is-active{border-color:var(--gs-ink);border-width:2px;box-shadow:0 8px 26px rgba(2,44,54,.12)}
.gs-info{display:flex;flex-direction:column;gap:5px;padding-right:24px}
.gs-badge{align-self:flex-start;font-size:12px;font-weight:700;padding:4px 13px;border-radius:20px;background:#e7f6ec;color:#15803d;margin-bottom:4px}
.gs-date{font-size:21px;font-weight:800;color:var(--gs-text)}
.gs-time,.gs-meta{font-size:13px;color:#334155;display:flex;align-items:center;gap:6px}
.gs-time2{padding-left:20px;color:var(--gs-muted)}
.gs-meta{color:#475569;margin-top:3px}
.gs-ic{color:var(--gs-accent);font-size:14px;width:14px;text-align:center}
.gs-details{font-size:13px;font-weight:700;color:var(--gs-tz);text-decoration:none;margin-top:6px;align-self:flex-start}
.gs-details:hover{text-decoration:underline}
.gs-qty{display:flex;justify-content:center;border-left:1px solid #eef2f6;border-right:1px solid #eef2f6;height:100%;align-items:center}
.gs-stepper{display:inline-flex;align-items:center;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
.gs-stepper button{width:40px;height:42px;border:none;background:#fff;font-size:18px;cursor:pointer;color:var(--gs-text)}
.gs-stepper button:hover{background:#f1f5f9}
.gs-qval{width:44px;text-align:center;font-weight:700;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;line-height:42px}
.gs-soldout{font-weight:700;color:var(--gs-muted)}
.gs-buy{padding-left:24px;text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.gs-sale{font-size:13px;color:#dc2626;font-weight:600}
.gs-price{font-size:25px;font-weight:800;color:var(--gs-text)}
.gs-price-sub{font-size:12px;color:var(--gs-muted)}
.gs-buy-row{display:flex;align-items:center;gap:12px;margin-top:8px}
.gs-filling{color:#b45309;font-weight:700;font-size:13px;white-space:nowrap}
.gs-enroll{display:inline-block;white-space:nowrap;background:var(--gs-ink);color:#fff;font-weight:800;padding:13px 30px;border-radius:8px;border:none;cursor:pointer;font-size:15px}
.gs-enroll:hover{filter:brightness(1.25)}
.gs-enroll-block{display:block;width:100%;text-align:center;margin-top:12px}
.gs-enroll-holder{position:relative;border:2px solid var(--gs-accent);border-radius:14px;padding:22px 24px;margin:-8px 0 22px;background:#f8fffb;animation:gsExpand .25s ease}
.gs-close{position:absolute;top:10px;right:12px;width:32px;height:32px;border-radius:50%;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font-size:14px;z-index:1}
.gs-checkout .gw-root{border:none;background:transparent;padding:0;max-width:none;font-family:inherit;--gw-accent:var(--gs-ink);--gw-accent-fg:#fff;--gw-fg:var(--gs-text);--gw-bg:#fff;--gw-surface:#fff;color-scheme:light}
.gs-checkout .gw-back{display:none}
.gs-checkout .gw-btn-primary{border-radius:8px;font-weight:800}
@keyframes gsExpand{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.gs-cal-head{display:flex;align-items:center;justify-content:center;gap:18px;margin-bottom:10px}
.gs-cal-head button{width:38px;height:38px;border:1px solid #e2e8f0;background:#fff;border-radius:50%;font-size:18px;cursor:pointer}
.gs-cal-head span{font-weight:800;font-size:18px;min-width:180px;text-align:center}
.gs-cal-dow,.gs-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.gs-cal-dow{margin-bottom:6px}
.gs-cal-dow span{text-align:center;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase}
.gs-cal-cell{min-height:74px;border:1px solid #eef2f6;border-radius:10px;padding:8px;font-size:13px;color:#94a3b8;background:#fff;text-align:left;font:inherit;display:flex;flex-direction:column;align-items:flex-start}
.gs-cal-cell.gs-has{border-color:var(--gs-accent);background:var(--gs-soft);color:var(--gs-text);cursor:pointer}
.gs-cal-cell.gs-has:hover{background:#dcfce7}
.gs-cal-cell.gs-full{border-color:#e2e8f0;background:#f8fafc}
.gs-cal-day{font-weight:700}
.gs-cal-tag{display:inline-block;margin-top:6px;font-size:11px;font-weight:700;color:#15803d;background:#dcfce7;border-radius:6px;padding:2px 7px}
.gs-full .gs-cal-tag{color:var(--gs-muted);background:#e2e8f0}
.gs-cal-hint{margin-top:10px;font-size:13px;color:var(--gs-muted);text-align:center}
.gs-side{position:sticky;top:20px;display:flex;flex-direction:column;gap:16px}
.gs-side-card{border-radius:14px;overflow:hidden;box-shadow:0 6px 20px rgba(2,44,54,.06);background:#fff}
.gs-side-title{background:#fff7ed;font-weight:800;font-size:15px;padding:15px 18px}
.gs-side-inner{padding:18px;border:2px solid var(--gs-accent);border-top:none;border-radius:0 0 14px 14px;display:flex;flex-direction:column;gap:5px}
.gs-side-sep{height:1px;background:var(--gs-line);margin:12px 0}
.gs-side-all{border:none;background:none;color:var(--gs-tz);font-weight:700;text-align:center;margin-top:12px;font-size:14px;cursor:pointer}
.gs-muted{color:var(--gs-muted)}
.gs-empty{text-align:center;padding:30px 0}
.gs-error{color:#b91c1c;font-weight:600}
.gs-root button:focus-visible,.gs-root select:focus-visible,.gs-root a:focus-visible{outline:2px solid var(--gs-accent);outline-offset:2px}
@media(max-width:900px){.gs-wrap{grid-template-columns:1fr}.gs-side{position:static}.gs-card{grid-template-columns:1fr;padding:20px}.gs-info{padding-right:0}.gs-qty{border:none;justify-content:flex-start;margin:12px 0}.gs-buy{padding-left:0;text-align:left;align-items:flex-start}.gs-cal-cell{min-height:54px}.gs-head h2{font-size:24px}}
@media(prefers-reduced-motion:reduce){.gs-enroll-holder{animation:none}.gs-card,.gs-pill{transition:none}}
`;

export function injectScheduleStyles(doc: Document): void {
  if (doc.getElementById(SCHEDULE_STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = SCHEDULE_STYLE_ID;
  style.textContent = SCHEDULE_CSS;
  doc.head.append(style);
}
