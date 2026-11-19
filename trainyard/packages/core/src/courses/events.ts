// Event boards: what a train needs to prepare a PI, run PI planning and close the PI, built from
// the same designed exercise boards the classes use (the RTE and Leading SAFe courses), so a
// package from the template gallery opens in the class design, not on a blank canvas.

import type { ActivitySpec } from "../activities.js";
import type { Board } from "../boards.js";
import { classBoard, type ClassSpec, type Exercise } from "../classes.js";
import { LEADING_SAFE_COURSE } from "./leading-safe.js";
import { RTE_COURSE } from "./rte.js";

type Course = { title: string; activities: ActivitySpec[] }[];
const pick = (course: Course, titles: string[]): ActivitySpec[] =>
  titles.map((t) => course.flatMap((l) => l.activities).find((a) => a.title === t) ?? (() => { throw new Error(`No activity "${t}"`); })());
const rte = (...titles: string[]) => pick(RTE_COURSE, titles);
const lsa = (...titles: string[]) => pick(LEADING_SAFE_COURSE, titles);

export interface EventSpec {
  /** The package id in the template gallery. */
  id: string;
  name: string;
  short: string;
  blurb: string;
  /** When in the PI the package is used. */
  when: string;
  days: number;
  parts: Course;
}

export const EVENT_BOARDS: EventSpec[] = [
  {
    id: "prepare-pi-planning",
    name: "Prepare for PI planning",
    short: "PREP",
    blurb: "Get the content, the teams and the room ready: how much preparation is enough, the ART readiness checklist sorted into must be in place, not needed and depends, and the ART backlog through the Kanban.",
    when: "Through the PI, finishing in the IP iteration",
    days: 1,
    parts: [
      { title: "PI planning readiness", activities: rte("How much preparation is enough?", "PI Planning readiness preparation") },
      { title: "The ART backlog", activities: rte("Build your own ART kanban board") },
    ],
  },
  {
    id: "pi-planning",
    name: "PI planning",
    short: "PI",
    blurb: "The two days in the planning room: capacity, a train per team with its iterations, the ART planning board with dependencies, the Coach Sync, the draft plan review, business value, ART PI risks to ROAM and what to do when confidence is not high.",
    when: "PI planning, days 1 and 2",
    days: 2,
    parts: [
      { title: "Team breakouts", activities: lsa("Calculate your initial capacity", "PI planning board", "Coach Sync") },
      { title: "Plan review and business value", activities: [...lsa("Draft plan review", "Setting business value"), ...rte("Reading the ART planning board in PI Planning")] },
      { title: "Risks and confidence", activities: [...lsa("Manage ART PI risks"), ...rte("ROAM ART PI risks", "Confidence not high? Plan rework.")] },
    ],
  },
  {
    id: "closing-pi",
    name: "Close the PI",
    short: "I&A",
    blurb: "The IP iteration and then Inspect & Adapt: balancing the IP iteration, preparing the PI System Demo, and the problem-solving workshop from the agreed problem through root cause analysis to the improvement backlog.",
    when: "The IP iteration, then Inspect & Adapt",
    days: 1,
    parts: [
      { title: "The IP iteration and the PI System Demo", activities: rte("Balancing the IP iteration", "Preparing for the PI System Demo") },
      { title: "Problem-solving workshop", activities: rte("Problem-solving workshop: full board", "Agree on the problem", "Root cause analysis", "Restate the new problem", "Brainstorm solutions", "Problem-solving workshop readout") },
    ],
  },
];

const asClass = (e: EventSpec, parts: Course): ClassSpec => ({
  id: `event-${e.id}`, name: e.name, short: e.short, blurb: e.blurb, days: e.days, welcome: ["Quick agenda"],
  lessons: parts.map((l) => ({ title: l.title, exercises: l.activities.map((a): Exercise => ({ kind: "slide", title: `${a.kind}: ${a.title}`, body: "", minutes: (a.prepare ?? 0) + (a.share ?? 0) })) })),
  course: parts,
});

/** The event's board: every part with its exercises, or (`part`) one part alone. Opens in the class design; `fields.event` marks it as an event, not a class. */
export function eventBoard(e: EventSpec, part?: number, now?: string): Board {
  const b = classBoard(asClass(e, part === undefined ? e.parts : [e.parts[part]!]), now);
  b.id = `tpl-builtin-event-${e.id}${part === undefined ? "" : `-${part + 1}`}`;
  b.origin = { ...b.origin, externalId: `builtin:event-${e.id}` };
  b.fields = { ...b.fields, event: e.id };
  if (part !== undefined) b.name = `${e.name} · ${e.parts[part]!.title}`;
  // The agenda's tickets read "Part n", as the board does for an event.
  for (const f of b.frames) {
    const items = f.activity?.board === "agenda" ? (f.activity.config?.items as { t: string }[] | undefined) : undefined;
    if (items) for (const it of items) it.t = it.t.replace(/^Lesson (\d+): /, "Part $1: ");
  }
  return b;
}

/** The event template with this id ("tpl-builtin-event-<id>" or "…-<part>"), so boards made from it follow its updates. */
export function eventTemplate(id: string | undefined, now?: string): Board | undefined {
  const m = /^tpl-builtin-event-(.+?)(?:-(\d+))?$/.exec(id ?? "");
  const e = m && EVENT_BOARDS.find((x) => x.id === m[1] || x.id === `${m[1]}-${m[2]}`);
  if (!m || !e) return undefined;
  const part = e.id === m[1] && m[2] ? Number(m[2]) - 1 : undefined;
  return part !== undefined && !e.parts[part] ? undefined : eventBoard(e, part, now);
}
