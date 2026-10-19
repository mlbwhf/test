// All widget CSS. Injected once per document into <style id="gate-widget-css">.
// Every class is prefixed "gw-" so host-page styles (WordPress themes etc.) are not affected.

export const STYLE_ID = "gate-widget-css";

export const CSS = `
.gw-root{--gw-ink:#14213d;--gw-paper:#f7f6f2;--gw-sand:#eeebe2;--gw-green:#3fcb7e;--gw-green-text:#2f7a52;
--gw-bg:var(--gw-paper);--gw-fg:var(--gw-ink);--gw-muted:#5a627a;--gw-border:rgba(20,33,61,.16);--gw-surface:#fdfdfb;--gw-accent:var(--gw-green);--gw-accent-fg:var(--gw-ink);--gw-danger:#b4302e;--gw-success:var(--gw-green-text);--gw-badge-bg:rgba(63,203,126,.25);--gw-badge-fg:var(--gw-ink);
color-scheme:light;font:15px/1.5 "Instrument Sans",system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--gw-fg);background:var(--gw-bg);border:1px solid var(--gw-border);border-radius:20px;padding:24px;max-width:720px;box-sizing:border-box;text-align:left}
@media (prefers-color-scheme:dark){.gw-root{--gw-bg:#14213d;--gw-fg:#f7f6f2;--gw-muted:#a7afc4;--gw-border:rgba(247,246,242,.16);--gw-surface:#253252;--gw-accent:#3fcb7e;--gw-accent-fg:#14213d;--gw-danger:#ff8a80;--gw-success:#7bd88f;--gw-badge-bg:rgba(63,203,126,.22);--gw-badge-fg:#f7f6f2;color-scheme:dark}}
.gw-root *,.gw-root *::before,.gw-root *::after{box-sizing:border-box}
.gw-title{margin:0 0 4px;font-family:"Bricolage Grotesque",inherit;font-size:1.5em;line-height:1.1;font-weight:800;letter-spacing:-.03em;color:var(--gw-fg)}
.gw-subtitle{margin:0 0 8px;font-family:"Bricolage Grotesque",inherit;font-size:1.2em;font-weight:700;letter-spacing:-.02em;color:var(--gw-fg)}
.gw-muted{margin:0 0 12px;color:var(--gw-muted)}
.gw-status{margin:0 0 12px;font-size:.9em;color:var(--gw-muted)}
.gw-status:empty{display:none}
.gw-toolbar{display:flex;gap:8px 12px;align-items:center;justify-content:flex-end;flex-wrap:wrap;margin-bottom:12px}
.gw-fx-note{flex-basis:100%;text-align:right;font-size:.8em;color:var(--gw-muted)}
.gw-cohorts,.gw-tickets,.gw-seatlist{list-style:none;margin:0;padding:0}
.gw-cohort{border:1px solid var(--gw-border);border-radius:16px;padding:16px;margin:0 0 12px;background:var(--gw-surface)}
.gw-cohort-head{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}
.gw-cohort-name{margin:0;font-size:1.05em;font-weight:600}
.gw-cohort-dates,.gw-cohort-sessions{margin:4px 0 0;font-size:.95em;color:var(--gw-muted)}
.gw-ticket{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:12px 0 0;margin-top:12px;border-top:1px solid var(--gw-border)}
.gw-ticket-info{flex:1 1 180px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.gw-ticket-name{font-weight:600}
.gw-ticket-soldout .gw-ticket-name,.gw-ticket-soldout .gw-price{color:var(--gw-muted)}
.gw-price{min-width:96px;text-align:right;font-family:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:500;font-variant-numeric:tabular-nums}
.gw-badge{display:inline-block;padding:2px 10px;border-radius:999px;border:1px solid var(--gw-border);background:var(--gw-bg);font-family:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.76em;line-height:1.6;white-space:nowrap;color:var(--gw-muted)}
.gw-badge-early{background:var(--gw-badge-bg);color:var(--gw-badge-fg);border-color:transparent}
.gw-badge-left{color:var(--gw-danger);border-color:var(--gw-danger)}
.gw-badge-held{color:var(--gw-success);border-color:var(--gw-success)}
.gw-banner{margin:0 0 12px;padding:10px 14px;border:1px solid var(--gw-accent);border-radius:10px;background:var(--gw-surface)}
.gw-banner-hint{display:block;margin-top:2px;font-size:.92em;color:var(--gw-muted)}
.gw-btn{font:inherit;font-weight:600;min-height:42px;padding:9px 20px;border-radius:999px;border:1.5px solid var(--gw-fg);background:transparent;color:var(--gw-fg);cursor:pointer;text-decoration:none}
.gw-btn-primary{background:var(--gw-accent);border-color:var(--gw-accent);color:var(--gw-accent-fg)}.gw-btn-primary:hover{filter:brightness(.94)}
.gw-btn:disabled{opacity:.55;cursor:not-allowed}
.gw-btn:focus-visible,.gw-input:focus-visible,.gw-select:focus-visible,.gw-link:focus-visible,.gw-check input:focus-visible{outline:2px solid var(--gw-accent);outline-offset:2px}
.gw-link{font:inherit;padding:0;border:0;background:none;color:var(--gw-accent);cursor:pointer;text-decoration:underline}
.gw-back{display:inline-block;margin-bottom:12px}
.gw-field{display:flex;flex-direction:column;gap:4px;margin:0 0 12px}
.gw-label{font-size:.9em;font-weight:600;color:var(--gw-fg)}
.gw-input,.gw-select{font:inherit;width:100%;min-height:42px;padding:8px 12px;border:1px solid rgba(20,33,61,.32);border-radius:10px;background:var(--gw-surface);color:var(--gw-fg)}
.gw-input:read-only{background:var(--gw-surface);color:var(--gw-muted)}
.gw-select{width:auto;min-width:110px}
.gw-attendee{margin:0 0 12px;padding:8px 16px 4px;border:1px solid var(--gw-border);border-radius:10px;min-width:0}
.gw-legend{padding:0 4px;font-weight:600}
.gw-check{display:flex;gap:8px;align-items:center;margin:4px 0 12px;font-size:.95em;cursor:pointer}
.gw-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}
.gw-summary{margin:16px 0;padding:12px 16px;border:1px solid var(--gw-border);border-radius:10px;background:var(--gw-surface)}
.gw-row{display:flex;justify-content:space-between;gap:12px;padding:4px 0;font-family:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.95em;font-variant-numeric:tabular-nums}
.gw-total{margin-top:4px;padding-top:8px;border-top:1px solid var(--gw-border);font-weight:700}
.gw-error{margin:8px 0;color:var(--gw-danger)}
.gw-error-hint{display:block;margin-top:2px;font-size:.9em;color:var(--gw-muted)}
.gw-payment-element{margin:12px 0;min-height:48px}
.gw-success{padding:16px;border:1px solid var(--gw-success);border-radius:10px}
.gw-success .gw-subtitle{color:var(--gw-success)}
.gw-seatlist li{padding:4px 0}
.gw-note{margin:12px 0 0;color:var(--gw-muted)}
.gw-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.gw-spinner{display:inline-block;width:14px;height:14px;margin-right:8px;vertical-align:-2px;border:2px solid var(--gw-border);border-top-color:var(--gw-accent);border-radius:50%;animation:gw-spin .8s linear infinite}
@keyframes gw-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.gw-spinner{animation:none}}
@media (max-width:480px){.gw-root{padding:14px;border-radius:8px}.gw-toolbar{justify-content:flex-start}.gw-ticket{flex-direction:column;align-items:stretch}.gw-price{min-width:0;text-align:left}.gw-ticket .gw-btn,.gw-form .gw-btn-primary,.gw-waitlist .gw-btn{width:100%}.gw-grid{grid-template-columns:1fr}.gw-select{width:100%}}
`;

export function injectStyles(doc: Document = document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.append(style);
}
