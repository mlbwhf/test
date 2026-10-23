// Team capacity: three ways to get the number per iteration, and the breakdown that shows
// where it came from. SAFe's quick-start estimation: one full-time contributor delivers
// 8 points in a two-week iteration (a point is roughly a day), subtract one point per day
// off, and people who do not deliver stories (Scrum Master, Product Owner) do not count.
// A team that has shipped a few iterations can use its velocity instead. Either way the
// figure can be overridden by hand.

import type { Increment, Iteration, Person, Team, TeamMembership, WorkItem } from "./model.js";

export const POINTS_PER_FULL_TIME = 8;
/** Iterations of history the velocity mode averages over. */
export const VELOCITY_WINDOW = 3;

export interface MemberCapacity {
  personId: string;
  name: string;
  roles: string[];
  allocation: number;
  contributes: boolean;
  vacationDays: number;
  /** allocation × points per full-time − vacation days, never below zero. */
  points: number;
}

export interface VelocitySample {
  iterationId: string;
  iterationName: string;
  /** Points of items that reached done in that iteration. */
  done: number;
}

export interface IterationCapacity {
  iterationId: string;
  iterationName: string;
  isIP: boolean;
  mode: Team["capacityMode"] & string;
  /** The figure the board uses. */
  effective: number;
  /** What each mode would give, so the room can compare. */
  manual: number;
  calculated: { members: MemberCapacity[]; total: number };
  velocity: { samples: VelocitySample[]; mean: number | null };
}

const round = (n: number) => Math.round(n * 10) / 10;

/** Calculated capacity for one iteration: Σ contributing members' allocation × points − days off. */
export function calculatedCapacity(team: Team, iteration: Iteration, people: readonly Person[]): { members: MemberCapacity[]; total: number } {
  const ppft = team.pointsPerFullTime ?? POINTS_PER_FULL_TIME;
  const members = (team.members ?? []).map((m) => memberCapacity(m, iteration.id, people, ppft));
  const total = iteration.isIP ? 0 : round(members.reduce((a, m) => a + m.points, 0));
  return { members, total };
}

function memberCapacity(m: TeamMembership, iterationId: string, people: readonly Person[], ppft: number): MemberCapacity {
  const p = people.find((x) => x.id === m.personId);
  const vacationDays = m.vacationDays?.[iterationId] ?? 0;
  const points = m.contributes ? Math.max(0, round(m.allocation * ppft - vacationDays)) : 0;
  return { personId: m.personId, name: p?.name ?? m.personId, roles: p?.roles ?? [], allocation: m.allocation, contributes: m.contributes, vacationDays, points };
}

/** Points a team finished per iteration, for the last few iterations that ended before the given one. */
export function velocityHistory(team: Team, items: readonly WorkItem[], increments: readonly Increment[], before: Iteration, window = VELOCITY_WINDOW): VelocitySample[] {
  const past = increments
    .flatMap((inc) => inc.iterations)
    .filter((it) => !it.isIP && it.end < before.start)
    .sort((a, b) => (a.end < b.end ? -1 : 1))
    .slice(-window);
  return past.map((it) => ({
    iterationId: it.id,
    iterationName: it.name,
    done: round(items.filter((w) => w.teamId === team.id && w.status === "done" && (w.iterationId === it.id || (!w.iterationId && w.doneAt !== undefined && w.doneAt.slice(0, 10) >= it.start && w.doneAt.slice(0, 10) <= it.end))).reduce((a, w) => a + (w.estimate ?? 0), 0)),
  }));
}

export function velocityCapacity(team: Team, items: readonly WorkItem[], increments: readonly Increment[], iteration: Iteration): { samples: VelocitySample[]; mean: number | null } {
  const samples = velocityHistory(team, items, increments, iteration);
  // A team that finished nothing in every past iteration has no velocity yet, only a gap.
  const mean = samples.length && samples.some((s) => s.done > 0) ? round(samples.reduce((a, s) => a + s.done, 0) / samples.length) : null;
  return { samples, mean: iteration.isIP ? 0 : mean };
}

/** The full picture for one iteration: what the team uses and what each mode would say. */
export function iterationCapacity(team: Team, iteration: Iteration, ws: { people: readonly Person[]; items: readonly WorkItem[]; increments: readonly Increment[] }): IterationCapacity {
  const mode = team.capacityMode ?? "manual";
  const manual = team.capacity[iteration.id] ?? 0;
  const calculated = calculatedCapacity(team, iteration, ws.people);
  const velocity = velocityCapacity(team, ws.items, ws.increments, iteration);
  const effective = mode === "calculated" ? calculated.total : mode === "velocity" ? (velocity.mean ?? manual) : manual;
  return { iterationId: iteration.id, iterationName: iteration.name, isIP: !!iteration.isIP, mode, effective, manual, calculated, velocity };
}

/**
 * Recomputes team.capacity for every iteration of the increments from the team's mode.
 * Manual keeps the stored figures; velocity falls back to the stored figure where there is
 * no history yet.
 */
export function applyCapacity(team: Team, ws: { people: readonly Person[]; items: readonly WorkItem[]; increments: readonly Increment[] }, increments: readonly Increment[] = ws.increments): Team {
  const mode = team.capacityMode ?? "manual";
  if (mode === "manual") return team;
  const capacity = { ...team.capacity };
  for (const inc of increments) for (const it of inc.iterations) capacity[it.id] = iterationCapacity(team, it, ws).effective;
  return { ...team, capacity };
}
