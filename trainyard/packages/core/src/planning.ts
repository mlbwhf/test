// Program board logic: building increments from a cadence, team load against capacity,
// and dependency checks. All functions are pure; the API and UI call them on every change.

import type { Cadence } from "./frameworks.js";
import type { Dependency, Increment, Iteration, Team, WorkItem } from "./model.js";

const DAY_MS = 86_400_000;

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Lay out one increment of iterations from a start date (YYYY-MM-DD). */
export function buildIncrement(id: string, name: string, start: string, cadence: Cadence): Increment {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  if (Number.isNaN(startMs)) throw new Error(`invalid start date: ${start}`);
  const len = cadence.iterationWeeks * 7 * DAY_MS;
  const iterations: Iteration[] = [];
  for (let i = 0; i < cadence.iterationsPerIncrement; i++) {
    const isIP = cadence.ipIteration && i === cadence.iterationsPerIncrement - 1;
    iterations.push({
      id: `${id}.${i + 1}`,
      name: isIP ? `${name}.IP` : `${name}.${i + 1}`,
      start: isoDate(startMs + i * len),
      end: isoDate(startMs + (i + 1) * len - DAY_MS),
      ...(isIP ? { isIP: true } : {}),
    });
  }
  return { id, name, start, end: iterations[iterations.length - 1]!.end, iterations };
}

export interface LoadCell {
  teamId: string;
  iterationId: string;
  load: number;
  capacity: number;
  /** load / capacity; Infinity when work is planned against zero capacity. */
  ratio: number;
  state: "ok" | "near" | "over";
}

/** Load per team per iteration for the planned items in an increment. */
export function teamLoad(items: readonly WorkItem[], teams: readonly Team[], increment: Increment, plannedLevel: string): LoadCell[] {
  const ids = new Set(increment.iterations.map((i) => i.id));
  const sums = new Map<string, number>();
  for (const it of items) {
    if (it.level !== plannedLevel || !it.teamId || !it.iterationId || !ids.has(it.iterationId)) continue;
    const k = `${it.teamId}|${it.iterationId}`;
    sums.set(k, (sums.get(k) ?? 0) + (it.estimate ?? 0));
  }
  const cells: LoadCell[] = [];
  for (const team of teams) {
    for (const iter of increment.iterations) {
      const load = sums.get(`${team.id}|${iter.id}`) ?? 0;
      const capacity = team.capacity[iter.id] ?? 0;
      const ratio = capacity > 0 ? load / capacity : load > 0 ? Infinity : 0;
      cells.push({ teamId: team.id, iterationId: iter.id, load, capacity, ratio, state: ratio > 1 ? "over" : ratio >= 0.85 ? "near" : "ok" });
    }
  }
  return cells;
}

export type DependencyProblem = "provider-after-consumer" | "same-iteration" | "provider-unscheduled" | "consumer-unscheduled" | "missing-item";

export interface DependencyCheck {
  dependencyId: string;
  problem?: DependencyProblem;
  severity: "ok" | "warning" | "critical";
  message: string;
}

/**
 * A dependency is healthy when the provider lands in an earlier iteration than the consumer.
 * Iteration order comes from the increments as given.
 */
export function checkDependencies(deps: readonly Dependency[], items: readonly WorkItem[], increments: readonly Increment[]): DependencyCheck[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const order = new Map<string, number>();
  let n = 0;
  for (const inc of increments) for (const it of inc.iterations) order.set(it.id, n++);

  return deps.map((d): DependencyCheck => {
    const provider = byId.get(d.providerId);
    const consumer = byId.get(d.consumerId);
    if (!provider || !consumer) return { dependencyId: d.id, problem: "missing-item", severity: "critical", message: "One side of this dependency no longer exists." };
    if (d.status === "resolved" || provider.status === "done") return { dependencyId: d.id, severity: "ok", message: "Delivered." };
    const p = provider.iterationId !== undefined ? order.get(provider.iterationId) : undefined;
    const c = consumer.iterationId !== undefined ? order.get(consumer.iterationId) : undefined;
    if (p === undefined) return { dependencyId: d.id, problem: "provider-unscheduled", severity: "critical", message: `"${provider.title}" is not planned into an iteration.` };
    if (c === undefined) return { dependencyId: d.id, problem: "consumer-unscheduled", severity: "warning", message: `"${consumer.title}" is not planned into an iteration.` };
    if (p > c) return { dependencyId: d.id, problem: "provider-after-consumer", severity: "critical", message: `"${provider.title}" lands after "${consumer.title}" needs it.` };
    if (p === c) return { dependencyId: d.id, problem: "same-iteration", severity: "warning", message: `"${provider.title}" and "${consumer.title}" are in the same iteration.` };
    return { dependencyId: d.id, severity: "ok", message: "Planned in order." };
  });
}

export interface ReadinessReport {
  ready: boolean;
  checks: { key: string; ok: boolean; message: string }[];
}

/** Pre-event checklist for an increment planning event. */
export function planningReadiness(input: {
  increment: Increment;
  teams: readonly Team[];
  items: readonly WorkItem[];
  plannedLevel: string;
}): ReadinessReport {
  const { increment, teams, items, plannedLevel } = input;
  const work = increment.iterations.filter((i) => !i.isIP);
  const missingCapacity = teams.filter((t) => work.some((i) => (t.capacity[i.id] ?? 0) <= 0));
  const candidates = items.filter((i) => i.level === plannedLevel && i.status !== "done");
  const unestimated = candidates.filter((i) => i.estimate === undefined);
  const unvalued = candidates.filter((i) => i.businessValue === undefined);
  const checks = [
    { key: "capacity", ok: missingCapacity.length === 0, message: missingCapacity.length ? `${missingCapacity.length} team(s) have iterations with no capacity set.` : "Every team has capacity for every iteration." },
    { key: "backlog", ok: candidates.length > 0, message: candidates.length ? `${candidates.length} item(s) ready to plan.` : "The backlog has nothing to plan." },
    { key: "estimates", ok: unestimated.length === 0, message: unestimated.length ? `${unestimated.length} item(s) have no estimate.` : "Every item is estimated." },
    { key: "value", ok: unvalued.length === 0, message: unvalued.length ? `${unvalued.length} item(s) have no business value.` : "Every item has business value." },
  ];
  return { ready: checks.every((c) => c.ok), checks };
}
