// Value stream map numbers from status history. Every tracker records when an item entered
// each status (Jira changelog, Azure DevOps revisions, a Kanban tool's CSV export, our own
// boards). Map statuses onto the map's steps (statuses that mean "waiting for this step" and
// statuses that mean "working on it"), and each step's wait and active time follow from the
// time items spent in those statuses, its %C&A from how often work came back to it.

import type { MapMeasure } from "./valuestreams.js";

export interface StatusChange {
  status: string;
  /** ISO timestamp the item entered this status. */
  at: string;
}

export interface ItemHistory {
  itemId: string;
  title?: string;
  /** Status changes in any order; sorted by time here. */
  changes: StatusChange[];
}

export interface StepStatusMapping {
  name: string;
  /** Statuses that mean the item is queued for this step (e.g. "Ready for test"). */
  wait: string[];
  /** Statuses that mean someone is working on it (e.g. "In test"). */
  active: string[];
}

export interface DeriveOptions {
  unit: "hours" | "days";
  /** How per-item times combine into the step's number. Default median. */
  stat?: "median" | "mean" | "p85";
  /** Only count time inside this window (ISO dates). */
  since?: string;
  until?: string;
}

export interface DerivedStep {
  name: string;
  measure: MapMeasure;
  sample: { items: number; reworked: number; passed: number };
}

export interface DerivedMap {
  steps: DerivedStep[];
  items: number;
  /** Statuses seen in the history that no step claims, with how often they occur. */
  unmapped: { status: string; count: number }[];
  period: { from: string | null; to: string | null };
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const MS = { hours: 3_600_000, days: 86_400_000 };

function statOf(xs: number[], stat: DeriveOptions["stat"]): number {
  if (!xs.length) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  if (stat === "mean") return xs.reduce((a, b) => a + b, 0) / xs.length;
  const q = stat === "p85" ? 0.85 : 0.5;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function deriveMapFromHistory(histories: ItemHistory[], mapping: StepStatusMapping[], opts: DeriveOptions): DerivedMap {
  const stepOf = new Map<string, { index: number; kind: "wait" | "active" }>();
  mapping.forEach((m, index) => {
    for (const s of m.wait) stepOf.set(norm(s), { index, kind: "wait" });
    for (const s of m.active) stepOf.set(norm(s), { index, kind: "active" });
  });
  const since = opts.since ? Date.parse(opts.since) : -Infinity;
  const until = opts.until ? Date.parse(opts.until) : Infinity;
  const waits = mapping.map(() => [] as number[]);
  const actives = mapping.map(() => [] as number[]);
  const visited = mapping.map(() => 0);
  const passed = mapping.map(() => 0);
  const reworked = mapping.map(() => 0);
  const unmapped = new Map<string, number>();
  let first: number | null = null;
  let last: number | null = null;
  let counted = 0;

  for (const h of histories) {
    const changes = [...h.changes].filter((c) => Number.isFinite(Date.parse(c.at))).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    if (changes.length < 2) continue;
    const w = mapping.map(() => 0);
    const a = mapping.map(() => 0);
    const seen = mapping.map(() => false);
    const left = mapping.map(() => false);
    const back = mapping.map(() => false);
    let any = false;
    let maxStep = -1;
    for (let i = 0; i < changes.length; i++) {
      const c = changes[i]!;
      const hit = stepOf.get(norm(c.status));
      if (!hit) {
        unmapped.set(c.status, (unmapped.get(c.status) ?? 0) + 1);
      } else {
        seen[hit.index] = true;
        // Coming back to an earlier step than the furthest reached: the earlier step's output
        // was not complete and accurate.
        if (hit.index < maxStep) back[hit.index] = true;
        for (let k = 0; k < hit.index; k++) if (seen[k]) left[k] = true;
        maxStep = Math.max(maxStep, hit.index);
      }
      const next = changes[i + 1];
      if (!next || !hit) continue;
      // Only the part of the interval inside the window counts.
      const from = Math.max(Date.parse(c.at), since);
      const to = Math.min(Date.parse(next.at), until);
      if (to <= from) continue;
      any = true;
      first = first === null ? from : Math.min(first, from);
      last = last === null ? to : Math.max(last, to);
      { const arr = hit.kind === "wait" ? w : a; arr[hit.index] = (arr[hit.index] ?? 0) + (to - from) / MS[opts.unit]; }
    }
    if (!any) continue;
    counted++;
    mapping.forEach((_, k) => {
      if (!seen[k]) return;
      visited[k]!++;
      waits[k]!.push(w[k]!);
      actives[k]!.push(a[k]!);
      if (left[k]) passed[k]!++;
      if (back[k]) reworked[k]!++;
    });
  }

  return {
    steps: mapping.map((m, k) => ({
      name: m.name,
      measure: {
        wait: m.wait.length ? r1(statOf(waits[k]!, opts.stat)) : null,
        active: r1(statOf(actives[k]!, opts.stat)),
        ca: passed[k] ? Math.round((1 - reworked[k]! / passed[k]!) * 100) : 100,
      },
      sample: { items: visited[k]!, reworked: reworked[k]!, passed: passed[k]! },
    })),
    items: counted,
    unmapped: [...unmapped.entries()].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
    period: { from: first === null ? null : new Date(first).toISOString(), to: last === null ? null : new Date(last).toISOString() },
  };
}

const DONE = /^(done|closed|resolved|released|complete(d)?|cancel(l)?ed|removed|won'?t do)$/i;
const WAITING = /(^|\b)(ready|to do|todo|backlog|new|open|waiting|awaiting|queue[d]?|blocked|pending|selected|approved|funnel)(\b|$)/i;

/**
 * A first mapping from the statuses in a history: statuses in their usual order, each
 * "working" status becoming a step and the "waiting" statuses before it its queue.
 * Terminal statuses (Done, Closed…) are left out. People adjust the result.
 */
export function suggestMapping(histories: ItemHistory[]): StepStatusMapping[] {
  const pos = new Map<string, number[]>();
  const label = new Map<string, string>();
  for (const h of histories) {
    const changes = [...h.changes].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    const n = Math.max(1, changes.length - 1);
    changes.forEach((c, i) => {
      const k = norm(c.status);
      label.set(k, label.get(k) ?? c.status.trim());
      pos.set(k, [...(pos.get(k) ?? []), i / n]);
    });
  }
  const ordered = [...pos.entries()].map(([k, ps]) => ({ k, at: statOf(ps, "median") })).sort((a, b) => a.at - b.at).map((x) => label.get(x.k)!);
  const out: StepStatusMapping[] = [];
  let queue: string[] = [];
  for (const s of ordered) {
    if (DONE.test(s.trim())) continue;
    if (WAITING.test(s)) queue.push(s);
    else {
      out.push({ name: s.replace(/^(in|doing)\s+/i, "").replace(/^\w/, (c) => c.toUpperCase()), wait: queue, active: [s] });
      queue = [];
    }
  }
  if (queue.length && out.length) out[out.length - 1]!.wait.push(...queue);
  return out;
}

/** Histories from rows of (item, status, timestamp), e.g. a Kanban tool's transition export. */
export function historiesFromRows(rows: { item: string; status: string; at: string; title?: string }[]): ItemHistory[] {
  const by = new Map<string, ItemHistory>();
  for (const r of rows) {
    if (!r.item || !r.status || !r.at) continue;
    const h = by.get(r.item) ?? { itemId: r.item, ...(r.title ? { title: r.title } : {}), changes: [] };
    h.changes.push({ status: r.status, at: r.at });
    by.set(r.item, h);
  }
  return [...by.values()];
}
