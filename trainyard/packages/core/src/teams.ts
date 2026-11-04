// Teams in a class. A class splits its students into teams (set up with the students, before the
// invitations go out); every exercise board then holds one copy of its work per team, and each
// student works on their own team's copy. The teams live in the class board's fields; the work of a
// team on an exercise is kept in the frame's state under keys prefixed with the team's id, so the
// boards, their saving and the template upgrade need no change.

import type { Board, Frame } from "./boards.js";
import type { StateOp } from "./activities.js";

export interface ClassTeam {
  id: string;
  name: string;
  /** Student ids (the class guests). */
  members: string[];
}

export const MAX_TEAMS = 12;

export function classTeams(b: Pick<Board, "fields">): ClassTeam[] {
  const t = b.fields?.teams;
  return Array.isArray(t) ? (t as ClassTeam[]).filter((x) => x && typeof x.id === "string" && typeof x.name === "string").map((x) => ({ id: x.id, name: x.name, members: Array.isArray(x.members) ? x.members.filter((m): m is string => typeof m === "string") : [] })) : [];
}

export const teamOf = (teams: ClassTeam[], studentId: string): ClassTeam | undefined => teams.find((t) => t.members.includes(studentId));

/**
 * `count` teams: the existing ones keep their names and members, extra ones are added (Team n),
 * surplus ones dropped. Every student is in exactly one team: those not yet seated, and those of
 * dropped teams, join the smallest team in turn; students no longer in the class leave.
 */
export function makeTeams(count: number, existing: ClassTeam[], studentIds: string[]): ClassTeam[] {
  const n = Math.max(0, Math.min(MAX_TEAMS, Math.floor(count)));
  const teams: ClassTeam[] = existing.slice(0, n).map((t) => ({ ...t, members: t.members.filter((m) => studentIds.includes(m)) }));
  for (let i = teams.length; i < n; i++) teams.push({ id: `t${i + 1}`, name: `Team ${i + 1}`, members: [] });
  if (!n) return [];
  const seated = new Set<string>();
  for (const t of teams) t.members = t.members.filter((m) => (seated.has(m) ? false : (seated.add(m), true)));
  for (const s of studentIds) {
    if (seated.has(s)) continue;
    const smallest = teams.reduce((a, t) => (t.members.length < a.members.length ? t : a), teams[0]!);
    smallest.members.push(s);
    seated.add(s);
  }
  return teams;
}

/** Moves a student to a team (or out of every team with teamId null). */
export function placeStudent(teams: ClassTeam[], studentId: string, teamId: string | null): ClassTeam[] {
  return teams.map((t) => ({ ...t, members: [...t.members.filter((m) => m !== studentId), ...(t.id === teamId ? [studentId] : [])] }));
}

/** Boards the whole class shares, whatever the teams: the agenda and the PI planning room (which has teams of its own). */
const CLASS_WIDE = new Set(["agenda", "cap", "pib", "pcs", "ppr", "pbv", "prm"]);
export function isClassWide(frame: Pick<Frame, "activity">): boolean {
  const a = frame.activity;
  return !a?.board || CLASS_WIDE.has(a.board) || a.config?.classWide === true;
}

const prefix = (teamId: string) => `${teamId}|`;

/** The part of a frame's state that is one team's: its keys without the team prefix. */
export function teamState(state: Record<string, unknown>, teamId: string): Record<string, unknown> {
  const p = prefix(teamId);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(state)) if (k.startsWith(p)) out[k.slice(p.length)] = v;
  return out;
}

/** The same change, addressed to one team's copy. */
export function teamOp(change: StateOp, teamId: string): StateOp {
  return { ...change, key: `${prefix(teamId)}${change.key}` };
}
