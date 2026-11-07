// Teams in a class. A class splits its students into teams (set up with the students, before the
// invitations go out); every exercise board then holds one copy of its work per team, and each
// student works on their own team's copy. The teams live in the class board's fields; the work of a
// team on an exercise is kept in the frame's state under keys prefixed with the team's id, so the
// boards, their saving and the template upgrade need no change.

import type { Board, BoardNode, Frame } from "./boards.js";
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

// ---- Canvas exercises: one copy per team ------------------------------------------------------
// A purpose-built exercise board keeps a state per team (above). A canvas exercise (stickies, a
// table, zones drawn on the board) is copied once per team instead: the copy carries the
// template's cards, sits to the right of the class, and the class board shows a team its copy.

/** The canvas exercises of a class: frames inside a lesson with no purpose-built board. */
export function canvasExercises(b: Pick<Board, "frames">): Frame[] {
  // Inside a numbered lesson: the Welcome area (board intro, icebreaker, the team) stays one for the class.
  const lessons = new Set(b.frames.filter((f) => !f.parentId && !f.copyOf && /^Lesson\s+\d+/i.test(f.title)).map((f) => f.id));
  return b.frames.filter((f) => f.parentId && lessons.has(f.parentId) && !f.activity && !f.copyOf);
}

/** The team's copy of a canvas exercise, when the team has one. */
export const teamCopyOf = (b: Pick<Board, "frames">, frameId: string, teamId: string): Frame | undefined => b.frames.find((f) => f.copyOf === frameId && f.team === teamId);

/** Gives every team its own copy of every canvas exercise it does not have yet; returns how many were made. */
export function teamCopies(b: Board, teams: ClassTeam[]): number {
  let made = 0;
  for (const f of canvasExercises(b)) {
    // The exercise's own frames (lanes, zones) and the cards on any of them, or simply placed on it.
    const ids = new Set([f.id]);
    for (let grew = true; grew; ) {
      grew = false;
      for (const x of b.frames) if (x.parentId && ids.has(x.parentId) && !ids.has(x.id)) (ids.add(x.id), (grew = true));
    }
    const on = (n: BoardNode) => (n.frameId ? ids.has(n.frameId) : n.x >= f.x && n.y >= f.y && n.x < f.x + f.width && n.y < f.y + f.height);
    for (const t of teams) {
      if (teamCopyOf(b, f.id, t.id)) continue;
      const right = Math.max(0, ...b.frames.map((x) => x.x + x.width), ...b.nodes.map((n) => n.x + (n.width ?? 0)));
      const dx = right + 240 - f.x;
      const suffix = `~${t.id}`;
      const { parentId: _lesson, done: _done, ...rest } = structuredClone(f);
      b.frames.push({ ...rest, id: f.id + suffix, title: `${f.title} · ${t.name}`, x: f.x + dx, copyOf: f.id, team: t.id });
      for (const x of b.frames.filter((y) => ids.has(y.id) && y.id !== f.id)) b.frames.push({ ...structuredClone(x), id: x.id + suffix, parentId: x.parentId! + suffix, x: x.x + dx });
      const inside = b.nodes.filter(on);
      const nodeIds = new Set(inside.map((n) => n.id));
      for (const n of inside) b.nodes.push({ ...structuredClone(n), id: n.id + suffix, ...(n.frameId ? { frameId: n.frameId + suffix } : {}), x: n.x + dx });
      for (const e of b.edges) if (nodeIds.has(e.fromId) && nodeIds.has(e.toId)) b.edges.push({ ...structuredClone(e), id: e.id + suffix, fromId: e.fromId + suffix, toId: e.toId + suffix });
      made++;
    }
  }
  return made;
}

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

// ---- Rotation: new teams every day or every chapter ---------------------------------------------
// With a policy, the class holds one seating per round (a day or a chapter), all with the same team
// names. Which round is in force follows the lesson being worked on, so every student and the
// trainer land on the same teams for a given chapter without anyone pressing a button.

export type TeamPolicy = "never" | "day" | "chapter";

export function teamPolicy(b: Pick<Board, "fields">): TeamPolicy {
  const p = b.fields?.teamPolicy;
  return p === "day" || p === "chapter" ? p : "never";
}

/** The seatings, one per round; without a policy, the one seating. */
export function teamRounds(b: Pick<Board, "fields">): ClassTeam[][] {
  const r = b.fields?.teamRounds;
  const rounds = Array.isArray(r) ? (r as unknown[]).map((x) => classTeams({ fields: { teams: x } })) : [];
  return teamPolicy(b) !== "never" && rounds.length ? rounds : [classTeams(b)];
}

/** How many rounds the policy needs: one per day or per chapter (lessons, days from the class board's fields). */
export function roundCount(b: Pick<Board, "fields">, policy = teamPolicy(b)): number {
  const lessons = Math.max(1, Number(b.fields?.lessons) || 1);
  const days = Math.max(1, Number(b.fields?.days) || Math.ceil(lessons / 2));
  return policy === "chapter" ? lessons : policy === "day" ? days : 1;
}

/** The round a lesson falls in (lessonIdx counts the numbered lessons from 0; the Welcome area is round 0). */
export function roundOf(b: Pick<Board, "fields">, lessonIdx: number): number {
  const n = roundCount(b);
  if (n <= 1 || lessonIdx < 0) return 0;
  const lessons = Math.max(1, Number(b.fields?.lessons) || 1);
  const perRound = Math.ceil(lessons / n);
  return Math.min(n - 1, Math.floor(lessonIdx / perRound));
}

/** The teams in force for a lesson. */
export function teamsAt(b: Pick<Board, "fields">, lessonIdx: number): ClassTeam[] {
  const rounds = teamRounds(b);
  return rounds[Math.min(rounds.length - 1, roundOf(b, lessonIdx))] ?? [];
}

const shuffled = <T>(xs: T[], rnd: () => number) => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

/**
 * The seatings for a policy: round 0 is the teams as they are; every later round deals the
 * students out again at random (the team names kept). Existing later rounds are kept when their
 * count fits, re-seated for students who came or went.
 */
export function makeRounds(policy: TeamPolicy, teams: ClassTeam[], existing: ClassTeam[][], studentIds: string[], rounds: number, rnd: () => number = Math.random): ClassTeam[][] {
  if (policy === "never" || !teams.length) return [teams];
  const out: ClassTeam[][] = [teams];
  for (let r = 1; r < rounds; r++) {
    const prev = existing[r];
    const base = prev && prev.length === teams.length ? prev.map((t, i) => ({ ...t, id: teams[i]!.id, name: teams[i]!.name })) : teams.map((t) => ({ ...t, members: [] }));
    out.push(makeTeams(teams.length, base, prev && prev.length === teams.length ? studentIds : shuffled(studentIds, rnd)));
  }
  return out;
}
