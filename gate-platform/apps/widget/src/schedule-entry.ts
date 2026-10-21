// Entry point for gate-schedule.js: finds every [data-gate-schedule] element and mounts the
// website schedule widget (which carries the registration widget for its inline checkout).

import { mountSchedule, type ScheduleOptions, type ScheduleWidget } from "./schedule.js";

export { mountSchedule } from "./schedule.js";
export type { ScheduleOptions, ScheduleWidget } from "./schedule.js";

const SELECTOR = "[data-gate-schedule]";

function readOptions(el: HTMLElement): ScheduleOptions | string {
  const d = el.dataset;
  if (!d.gateApi || !d.gateOrg || !d.gateCourse) return "EnrollClass schedule: data-gate-api, data-gate-org and data-gate-course are required.";
  const o: ScheduleOptions = { api: d.gateApi, org: d.gateOrg, course: d.gateCourse };
  if (d.gateCurrency) o.currency = d.gateCurrency.trim().toUpperCase();
  if (d.gateStripePk) o.stripePk = d.gateStripePk.trim();
  if (d.gateTitle) o.title = d.gateTitle;
  if (d.gateInk) o.ink = d.gateInk;
  if (d.gateAccent) o.accent = d.gateAccent;
  if (d.gateSidebar === "off") o.sidebar = false;
  if (d.gatePageBase) o.pageBase = d.gatePageBase;
  return o;
}

/** Mount every not-yet-initialised schedule under `root`. Safe to call repeatedly. */
export function init(root: ParentNode = document): ScheduleWidget[] {
  const mounted: ScheduleWidget[] = [];
  root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
    if (el.dataset.gateMounted) return;
    el.dataset.gateMounted = "1";
    const options = readOptions(el);
    if (typeof options === "string") {
      el.textContent = options;
      console.error(`[gate-schedule] ${options}`);
      return;
    }
    mounted.push(mountSchedule(el, options));
  });
  return mounted;
}

declare global {
  interface Window { GateSchedule?: { mountSchedule: typeof mountSchedule; init: typeof init } }
}

if (typeof document !== "undefined") {
  window.GateSchedule = { mountSchedule, init };
  init();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { init(); });
  }
}
