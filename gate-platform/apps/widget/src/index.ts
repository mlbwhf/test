// Entry point for the embeddable bundle: finds every [data-gate-widget] element and mounts the widget.

import { mount, type Widget, type WidgetOptions } from "./widget.js";

export { mount, config } from "./widget.js";
export type { Widget, WidgetOptions } from "./widget.js";

const SELECTOR = "[data-gate-widget]";

function readOptions(el: HTMLElement): WidgetOptions | string {
  const { gateApi, gateOrg, gateCourse, gateCurrency, gateStripePk, gateWaitlist, gateEvent } = el.dataset;
  const missing = [
    !gateApi && "data-gate-api",
    !gateOrg && "data-gate-org",
    !gateCourse && "data-gate-course",
  ].filter((x): x is string => typeof x === "string");
  if (missing.length > 0 || !gateApi || !gateOrg || !gateCourse) {
    return `EnrollClass widget: missing required attribute(s) ${missing.join(", ")}.`;
  }
  const options: WidgetOptions = { api: gateApi, org: gateOrg, course: gateCourse };
  if (gateCurrency) options.currency = gateCurrency.trim().toUpperCase();
  if (gateStripePk) options.stripePk = gateStripePk.trim();
  if (gateWaitlist) options.waitlist = gateWaitlist.trim();
  if (gateEvent) options.event = gateEvent.trim();
  return options;
}

/** Mount every not-yet-initialised [data-gate-widget] element under `root`. Safe to call repeatedly. */
export function init(root: ParentNode = document): Widget[] {
  const mounted: Widget[] = [];
  root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
    if (el.dataset.gateMounted) return;
    el.dataset.gateMounted = "1";
    const options = readOptions(el);
    if (typeof options === "string") {
      el.textContent = options;
      console.error(`[gate-widget] ${options}`);
      return;
    }
    mounted.push(mount(el, options));
  });
  return mounted;
}

declare global {
  interface Window { GateWidget?: { mount: typeof mount; init: typeof init } }
}

if (typeof document !== "undefined") {
  window.GateWidget = { mount, init };
  init();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { init(); });
  }
}
