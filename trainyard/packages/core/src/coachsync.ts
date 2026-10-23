// Coach Sync (the Scrum of Scrums during PI planning): the RTE's hourly checkpoints through
// the team breakouts, each a short list of questions answered per team. The radiator shows
// the questions down the side and the teams across the top, so the room sees at a glance
// which team needs help before the draft plan review.

export interface CoachSyncQuestion {
  id: string;
  text: string;
}

export interface CoachSyncCheckpoint {
  id: string;
  day: 1 | 2;
  /** Wall-clock label on the agenda, e.g. "1:00". */
  time: string;
  title: string;
  questions: CoachSyncQuestion[];
}

export type CoachSyncAnswer = "yes" | "partly" | "no" | "help";

export const COACH_SYNC_ANSWERS: { id: CoachSyncAnswer; label: string; color: string }[] = [
  { id: "yes", label: "Yes", color: "#5a9e1c" },
  { id: "partly", label: "Partly", color: "#d99400" },
  { id: "no", label: "Not yet", color: "#9aa3ad" },
  { id: "help", label: "Needs help", color: "#b9342f" },
];

export const COACH_SYNC_CHECKPOINTS: CoachSyncCheckpoint[] = [
  {
    id: "d1-getting-started",
    day: 1,
    time: "1:00",
    title: "Getting started",
    questions: [
      { id: "capacity", text: "Capacity set for every iteration (people, allocation, days off)" },
      { id: "features", text: "Features understood and prioritised with the Product Owner" },
      { id: "stories", text: "First features split into stories and estimated" },
      { id: "roles", text: "Facilitator and scribe in place; board and backlog open" },
    ],
  },
  {
    id: "d1-iteration-planning",
    day: 1,
    time: "2:00",
    title: "Iteration planning progress",
    questions: [
      { id: "loaded", text: "Iterations 1 and 2 loaded against capacity" },
      { id: "dependencies", text: "Dependencies on other teams identified and strung on the board" },
      { id: "risks", text: "Risks and impediments posted" },
      { id: "shared", text: "Shared services and system team needs raised" },
    ],
  },
  {
    id: "d1-objectives",
    day: 1,
    time: "3:00",
    title: "Team objectives progress",
    questions: [
      { id: "drafted", text: "Draft team PI objectives written as outcomes" },
      { id: "bv", text: "Business value discussed with the Business Owners" },
      { id: "uncommitted", text: "Uncommitted (stretch) objectives identified" },
      { id: "load", text: "Load within capacity for every iteration" },
    ],
  },
  {
    id: "d1-draft-plan",
    day: 1,
    time: "3:45",
    title: "Draft plan readiness",
    questions: [
      { id: "board", text: "Features and milestones on the ART planning board" },
      { id: "risks-board", text: "Program risks on the ROAM board" },
      { id: "presenter", text: "Presenter ready for the draft plan review (5 minutes)" },
      { id: "help", text: "Anything the RTE must fix before the review" },
    ],
  },
  {
    id: "d2-progress",
    day: 2,
    time: "10:30",
    title: "Progress check-in",
    questions: [
      { id: "adjustments", text: "Planning adjustments from the management review applied" },
      { id: "final-bv", text: "Objectives finalised with business value from the Business Owners" },
      { id: "roamed", text: "Team risks ROAMed or raised to the program board" },
      { id: "deps-closed", text: "Dependencies agreed with the other team" },
    ],
  },
  {
    id: "d2-final-plan",
    day: 2,
    time: "11:30",
    title: "Final plan readiness",
    questions: [
      { id: "final", text: "Final plan on the board with every iteration loaded" },
      { id: "objectives", text: "Final objectives posted with committed and uncommitted marked" },
      { id: "vote", text: "Team ready for the confidence vote" },
      { id: "rework", text: "Rework needed if the vote falls below three" },
    ],
  },
];

export interface CoachSyncState {
  incrementId: string;
  /** Answers keyed `${checkpointId}|${questionId}|${teamId}`. */
  answers: Record<string, CoachSyncAnswer>;
  /** Free-text notes keyed `${checkpointId}|${teamId}`. */
  notes: Record<string, string>;
  updatedAt: string;
}

export const coachSyncKey = (checkpointId: string, questionId: string, teamId: string) => `${checkpointId}|${questionId}|${teamId}`;

/** Per-checkpoint summary: how many answers are in, how many teams need help. */
export function coachSyncSummary(state: CoachSyncState | undefined, teamIds: readonly string[]): { checkpointId: string; answered: number; total: number; help: string[]; done: boolean }[] {
  return COACH_SYNC_CHECKPOINTS.map((c) => {
    const total = c.questions.length * teamIds.length;
    let answered = 0;
    const help = new Set<string>();
    for (const q of c.questions)
      for (const t of teamIds) {
        const a = state?.answers[coachSyncKey(c.id, q.id, t)];
        if (a) answered++;
        if (a === "help") help.add(t);
      }
    const done = total > 0 && answered === total && c.questions.every((q) => teamIds.every((t) => state?.answers[coachSyncKey(c.id, q.id, t)] === "yes"));
    return { checkpointId: c.id, answered, total, help: [...help], done };
  });
}
