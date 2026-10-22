// PI Outcome Planning (AI-Native SAFe): the one-day event that replaced two-day PI Planning.
// The data is the outcome tree (ART outcomes → PI outcomes → team outcomes, each with key
// results), the PI Outcome Planning Board (PI outcomes × iterations with team outcomes and
// milestones), each team's Outcome Planning Board (team outcomes × iterations with the
// experiments, prototypes, enablers and features they expect to need), the Management Review
// Board (decisions needed, risks, decisions confirmed, actions), the agenda and the
// confidence vote. Everything here is plain data plus the few derivations the pages show.

export type OutcomeLevel = "art" | "pi" | "team";
export type MilestoneKind = "fixed" | "learning" | "sync" | "release";
export type WorkKind = "experiment" | "prototype" | "enabler" | "feature";
export type ReviewKind = "decision-needed" | "risk" | "decision-confirmed" | "action";
export type PlanStage = "draft" | "adjusted" | "final";

export interface OutcomeKeyResult {
  id: string;
  /** The measure, written as a sentence: "Increase quarterly revenue from specialized diet product lines by". */
  text: string;
  /** The committed value, as written ("8%", "120,000", "1.5 days"). */
  target: string;
  /** What was first proposed, kept when the event changes the target so the adjustment shows. */
  draftTarget?: string;
  /** Latest measured value, filled in during the PI by Sense and Respond. */
  current?: string;
}

export interface Outcome {
  id: string;
  level: OutcomeLevel;
  title: string;
  /** PI outcomes point at an ART outcome; team outcomes at a PI outcome (or nothing: "other" commitments). */
  parentId?: string;
  /** Team outcomes belong to a team. */
  teamId?: string;
  keyResults: OutcomeKeyResult[];
}

export interface Milestone {
  id: string;
  kind: MilestoneKind;
  label: string;
  /** 1-based iteration; iterations + 1 means "next PI". */
  iteration: number;
  /** The PI outcome row it sits on; none means the "Other" row. */
  outcomeId?: string;
  /** Teams that own it (appears on their team boards). */
  teamIds?: string[];
}

export interface WorkSticky {
  id: string;
  teamId: string;
  kind: WorkKind;
  label: string;
  iteration: number;
  /** The team outcome row it sits on; none means "Other". */
  outcomeId?: string;
}

export interface ReviewItem {
  id: string;
  kind: ReviewKind;
  text: string;
  /** Who raised it or owns it. */
  owner?: string;
  teamId?: string;
  /** For a confirmed decision or action: the decision-needed or risk it answers. */
  answers?: string;
}

export interface AgendaSlot {
  id: string;
  half: "morning" | "afternoon";
  /** Minutes. */
  minutes: number;
  title: string;
  detail?: string;
  /** Business context, breakouts, presentations: the shape of the slot for the display. */
  kind: "plenary" | "outcome-breakout" | "team-breakout" | "review";
  done?: boolean;
}

export interface Vote {
  teamId: string;
  /** Fist of five. */
  value: 1 | 2 | 3 | 4 | 5;
  concern?: string;
}

export interface PlanningSession {
  id: string;
  artName: string;
  vision: string;
  piName: string;
  /** Iterations in the PI; the board shows one more column for "next PI". */
  iterations: number;
  stage: PlanStage;
  teams: { id: string; name: string }[];
  outcomes: Outcome[];
  milestones: Milestone[];
  work: WorkSticky[];
  review: ReviewItem[];
  agenda: AgendaSlot[];
  votes: Vote[];
  updatedAt: string;
}

export const MILESTONE_KINDS: Record<MilestoneKind, { label: string; color: string; blurb: string }> = {
  fixed: { label: "Fixed-date milestone", color: "#2b2b2b", blurb: "Events and contractual obligations on or before a date set outside the ART." },
  learning: { label: "Learning milestone", color: "#1a73c8", blurb: "Where the ART validates a technical or business hypothesis and decides whether the work is still worth pursuing." },
  sync: { label: "Synchronization milestone", color: "#e8912d", blurb: "Where two or more teams' work must converge; missing it stalls the dependent work." },
  release: { label: "Release", color: "#a7c23a", blurb: "A planned point where value reaches customers; mostly on demand, sometimes tied to a fixed date." },
};

export const WORK_KINDS: Record<WorkKind, { label: string; color: string; ink: string }> = {
  experiment: { label: "Experiment", color: "#7d6fd6", ink: "#fff" },
  prototype: { label: "Prototype", color: "#2ea39a", ink: "#fff" },
  enabler: { label: "Enabler", color: "#b94a48", ink: "#fff" },
  feature: { label: "Feature", color: "#2d5d8a", ink: "#fff" },
};

export const REVIEW_KINDS: Record<ReviewKind, { label: string; color: string }> = {
  "decision-needed": { label: "Decisions needed", color: "#ffe9a3" },
  risk: { label: "Risks", color: "#e9a1a1" },
  "decision-confirmed": { label: "Decisions confirmed", color: "#b9cf5b" },
  action: { label: "Actions", color: "#b9cf5b" },
};

/** SAFe's one-day agenda: 3.5 hours each half (lunch and the management review sit between), drafting the plan then finalizing it. */
export function defaultAgenda(): AgendaSlot[] {
  const m = (id: string, minutes: number, title: string, kind: AgendaSlot["kind"], detail?: string): AgendaSlot => ({ id, half: "morning", minutes, title, kind, ...(detail ? { detail } : {}) });
  const a = (id: string, minutes: number, title: string, kind: AgendaSlot["kind"], detail?: string): AgendaSlot => ({ id, half: "afternoon", minutes, title, kind, ...(detail ? { detail } : {}) });
  return [
    m("ctx", 30, "Business context", "plenary", "ART vision, ART outcomes, progress on key results, the draft PI outcomes, and what changed since last PI."),
    m("ob1", 60, "Outcome breakout", "outcome-breakout", "Per PI outcome, across teams: how each team contributes, and the milestones that keep them aligned."),
    m("tb1", 60, "Team breakout", "team-breakout", "Per team: all its outcomes on one board, capacity, constraints, the critical experiments, prototypes, enablers and features."),
    m("ob2", 30, "Outcome breakout", "outcome-breakout", "Draft the PI Outcome Planning Board; surface decisions needed and risks."),
    m("draft", 30, "Draft PI Outcome Planning Board presentation", "plenary", "Representatives walk the board: team outcomes, milestones, decisions needed, risks."),
    m("mgmt", 60, "Lunch & Management Review and Problem-Solving", "review", "Leadership and stakeholders turn decisions needed and risks into confirmed decisions and actions, each with an owner."),
    a("adj", 30, "Communicate planning adjustments", "plenary", "Each decision and action, with the owner who helps teams adjust."),
    a("ob3", 30, "Outcome breakout", "outcome-breakout", "Fold the adjustments in; deepen the cross-team conversations."),
    a("tb2", 60, "Team breakout", "team-breakout", "Adjust intentions and sequencing; re-examine the team outcomes and their key results."),
    a("ob4", 30, "Outcome breakout", "outcome-breakout", "Finalize the PI Outcome Planning Board, including other commitments."),
    a("final", 60, "Final plan review", "plenary", "Each PI outcome, the other commitments, open decisions and risks, then the fist-of-five confidence vote."),
  ];
}

// ---- derivations -----------------------------------------------------------------------

export interface OutcomeTree {
  art: { outcome: Outcome; pis: { outcome: Outcome; teams: Outcome[] }[] }[];
  /** Team outcomes that trace to no PI outcome: the team's own commitments. */
  other: Outcome[];
}

export function outcomeTree(s: PlanningSession): OutcomeTree {
  const by = (level: OutcomeLevel) => s.outcomes.filter((o) => o.level === level);
  const teams = by("team");
  const pis = by("pi");
  const art = by("art").map((a) => ({ outcome: a, pis: pis.filter((p) => p.parentId === a.id).map((p) => ({ outcome: p, teams: teams.filter((t) => t.parentId === p.id) })) }));
  // PI outcomes with no ART parent still belong on the board.
  const orphanPis = pis.filter((p) => !p.parentId || !s.outcomes.some((a) => a.id === p.parentId));
  if (orphanPis.length) art.push({ outcome: { id: "art-none", level: "art", title: "Not traced to an ART outcome", keyResults: [] }, pis: orphanPis.map((p) => ({ outcome: p, teams: teams.filter((t) => t.parentId === p.id) })) });
  return { art, other: teams.filter((t) => !t.parentId || !pis.some((p) => p.id === t.parentId)) };
}

export interface BoardRow {
  outcome: Outcome | null;
  teamOutcomes: Outcome[];
  /** Milestones by iteration (1..iterations+1). */
  byIteration: Milestone[][];
}

/** The PI Outcome Planning Board: one row per PI outcome, then "Other". */
export function planningBoard(s: PlanningSession): { milestonesRow: Milestone[][]; rows: BoardRow[] } {
  const cols = s.iterations + 1;
  const empty = () => Array.from({ length: cols }, () => [] as Milestone[]);
  const place = (ms: Milestone[]) => {
    const out = empty();
    for (const m of ms) {
      const i = Math.min(cols, Math.max(1, m.iteration)) - 1;
      out[i]!.push(m);
    }
    return out;
  };
  const pis = s.outcomes.filter((o) => o.level === "pi");
  const rows: BoardRow[] = pis.map((p) => ({ outcome: p, teamOutcomes: s.outcomes.filter((o) => o.level === "team" && o.parentId === p.id), byIteration: place(s.milestones.filter((m) => m.outcomeId === p.id && m.kind !== "fixed")) }));
  rows.push({ outcome: null, teamOutcomes: s.outcomes.filter((o) => o.level === "team" && (!o.parentId || !pis.some((p) => p.id === o.parentId))), byIteration: place(s.milestones.filter((m) => !m.outcomeId && m.kind !== "fixed")) });
  // Fixed-date milestones constrain the whole ART, so they sit on their own row at the top.
  return { milestonesRow: place(s.milestones.filter((m) => m.kind === "fixed")), rows };
}

export interface TeamBoardRow {
  outcome: Outcome | null;
  byIteration: { work: WorkSticky[]; milestones: Milestone[] }[];
}

/** A team's Outcome Planning Board: its outcomes × iterations, with work stickies and the milestones it owns. */
export function teamBoard(s: PlanningSession, teamId: string): { fixed: Milestone[][]; rows: TeamBoardRow[]; load: number[] } {
  const cols = s.iterations + 1;
  const mine = s.outcomes.filter((o) => o.level === "team" && o.teamId === teamId);
  const owned = (m: Milestone) => m.teamIds?.includes(teamId);
  const cell = () => Array.from({ length: cols }, () => ({ work: [] as WorkSticky[], milestones: [] as Milestone[] }));
  const rowFor = (outcome: Outcome | null): TeamBoardRow => {
    const cells = cell();
    const parent = outcome?.parentId;
    for (const w of s.work.filter((w) => w.teamId === teamId && (outcome ? w.outcomeId === outcome.id : !w.outcomeId || !mine.some((o) => o.id === w.outcomeId)))) cells[Math.min(cols, Math.max(1, w.iteration)) - 1]!.work.push(w);
    // A milestone sits on the PI outcome row; when the team has several outcomes under that
    // PI outcome it shows on the first of them, not on each.
    // Milestones on no PI outcome row go with the team's first parentless outcome, and only
    // fall to the "Other" row when the team has none.
    const first = outcome ? mine.find((o) => o.parentId === parent)?.id === outcome.id : !mine.some((o) => !o.parentId);
    if (first) for (const m of s.milestones.filter((m) => owned(m) && m.kind !== "fixed" && (outcome ? m.outcomeId === parent : !m.outcomeId))) cells[Math.min(cols, Math.max(1, m.iteration)) - 1]!.milestones.push(m);
    return { outcome, byIteration: cells };
  };
  const rows = [...mine.map((o) => rowFor(o)), rowFor(null)];
  const fixed = Array.from({ length: cols }, () => [] as Milestone[]);
  for (const m of s.milestones.filter((m) => m.kind === "fixed")) fixed[Math.min(cols, Math.max(1, m.iteration)) - 1]!.push(m);
  // Stickies per iteration: the simplest signal of a capacity clash, like the Cart Team's iteration 2.
  const load = Array.from({ length: cols }, (_, i) => rows.reduce((n, r) => n + r.byIteration[i]!.work.length + r.byIteration[i]!.milestones.length, 0));
  return { fixed, rows, load };
}

export interface Confidence {
  votes: number;
  teams: number;
  average: number | null;
  /** Teams voting 1 or 2, with their concern. */
  low: { teamId: string; value: number; concern?: string }[];
  /** Every team voted and none below 3. */
  committed: boolean;
}

export function confidence(s: PlanningSession): Confidence {
  const votes = s.votes.filter((v) => s.teams.some((t) => t.id === v.teamId));
  const average = votes.length ? Math.round((votes.reduce((a, v) => a + v.value, 0) / votes.length) * 10) / 10 : null;
  const low = votes.filter((v) => v.value <= 2).map((v) => ({ teamId: v.teamId, value: v.value, ...(v.concern ? { concern: v.concern } : {}) }));
  return { votes: votes.length, teams: s.teams.length, average, low, committed: votes.length === s.teams.length && s.teams.length > 0 && low.length === 0 };
}

/** How a key result moved during the event: "cut", "raised" or "kept". */
export function krChange(kr: OutcomeKeyResult): "cut" | "raised" | "kept" {
  if (!kr.draftTarget || kr.draftTarget === kr.target) return "kept";
  const n = (x: string) => parseFloat(x.replace(/[^0-9.-]/g, ""));
  const a = n(kr.draftTarget);
  const b = n(kr.target);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return "kept";
  return b < a ? "cut" : b > a ? "raised" : "kept";
}

/** Facilitator's checks before the final review. */
export function planningIssues(s: PlanningSession): string[] {
  const out: string[] = [];
  const tree = outcomeTree(s);
  for (const a of tree.art) for (const p of a.pis) if (!p.teams.length) out.push(`"${p.outcome.title}" has no team outcome contributing to it.`);
  for (const o of s.outcomes) if (!o.keyResults.length) out.push(`"${o.title}" has no key result; an outcome without a measure is a wish.`);
  for (const t of s.teams) if (!s.outcomes.some((o) => o.level === "team" && o.teamId === t.id)) out.push(`${t.name} has no team outcome.`);
  const open = s.review.filter((r) => (r.kind === "decision-needed" || r.kind === "risk") && !s.review.some((x) => x.answers === r.id));
  if (open.length) out.push(`${open.length} decision${open.length === 1 ? "" : "s"} needed or risk${open.length === 1 ? "" : "s"} still unanswered.`);
  const c = confidence(s);
  if (c.votes < c.teams) out.push(`${c.teams - c.votes} team${c.teams - c.votes === 1 ? "" : "s"} still to vote.`);
  return out;
}

// ---- the worked example ----------------------------------------------------------------

/** SAFe's Retail Pharmacy ART, planning its second PI, after the Management Review deferred the diet-swap pilot. */
export function demoPlanningSession(now = "2026-10-01T09:00:00.000Z"): PlanningSession {
  const kr = (id: string, text: string, target: string, draftTarget?: string, current?: string): OutcomeKeyResult => ({ id, text, target, ...(draftTarget ? { draftTarget } : {}), ...(current ? { current } : {}) });
  const teams = [
    { id: "ai-engine", name: "AI Engine Team" },
    { id: "cart", name: "Cart Team" },
    { id: "marketing", name: "Marketing Team" },
    { id: "in-store", name: "In-store Team" },
  ];
  const outcomes: Outcome[] = [
    // ART outcomes: the year, with the state after the first PI as "current".
    { id: "art-1", level: "art", title: "The household's trusted health partner", keyResults: [kr("art-1-1", "Increase health & specialized-diet line revenue by", "40%", undefined, "12% growth"), kr("art-1-2", "Increase active households completing a guided health journey from 12% to", "45%", undefined, "18%"), kr("art-1-3", "Increase diabetic/heart-health household diet-swap completion from 15% to", "60%", undefined, "34%")] },
    { id: "art-2", level: "art", title: "Family health as a shared, sticky habit", keyResults: [kr("art-2-1", "Enroll households in shared health challenges throughout the year:", "350,000", undefined, "100,000"), kr("art-2-2", "Achieve weekly active challenge participation for enrolled households of", "60%", undefined, "55%"), kr("art-2-3", "Increase 12-month retention among engaged households from 68% to", "80%", undefined, "71%")] },
    { id: "art-3", level: "art", title: "Profitable growth as AI reshapes the cost base", keyResults: [kr("art-3-1", "Increase blended gross margin from 22% to", "30%", undefined, "24%"), kr("art-3-2", "Reduce cost-to-serve per basket by", "25%", undefined, "8%"), kr("art-3-3", "Contain AI operating cost to at most", "3% of revenue", undefined, "3.4%")] },
    // PI outcomes: drafted by leadership, adjusted during the event (draftTarget → target).
    { id: "pi-diets", level: "pi", parentId: "art-1", title: "Scale Specialized Diets", keyResults: [kr("pi-diets-1", "Increase quarterly revenue from specialized diet product lines by", "8%", "12%"), kr("pi-diets-2", "Diabetic-flagged households completing a guided diet-swap journey:", "35%", "40%")] },
    { id: "pi-margins", level: "pi", parentId: "art-3", title: "Optimize Margins", keyResults: [kr("pi-margins-1", "Reduce cost-to-serve per basket by", "9%", "8%"), kr("pi-margins-2", "Increase blended gross margin on promoted baskets by", "4%", "5%")] },
    { id: "pi-game", level: "pi", parentId: "art-2", title: "Household Gamification", keyResults: [kr("pi-game-1", "Enroll multi-user households into shared health challenges:", "120,000", "100,000"), kr("pi-game-2", "Enrolled households completing at least one challenge weekly:", "55%")] },
    // Team outcomes.
    { id: "t-ai-1", level: "team", teamId: "ai-engine", parentId: "pi-diets", title: "Make diet classification trustworthy", keyResults: [kr("t-ai-1-1", "Diet classification accuracy on the validation set from 81% to", "94%")] },
    { id: "t-ai-2", level: "team", teamId: "ai-engine", parentId: "pi-diets", title: "Broaden personalized diet recommendations", keyResults: [kr("t-ai-2-1", "Households with a usable diet profile from 30% to", "70%")] },
    { id: "t-cart-1", level: "team", teamId: "cart", parentId: "pi-diets", title: "Raise confidence in specialized diet choices at checkout", keyResults: [kr("t-cart-1-1", "Raise diet-swap recommendation acceptance from 0% to", "5%", "10%"), kr("t-cart-1-2", "Raise diabetic-household diet-swap completion from 15% to", "22.5%", "30%")] },
    { id: "t-cart-2", level: "team", teamId: "cart", parentId: "pi-game", title: "Make the family cart a shared habit", keyResults: [kr("t-cart-2-1", "Grow weekly challenge-linked baskets among enrolled households from 10% to", "44%", "40%"), kr("t-cart-2-2", "Raise in-cart challenge-progress nudges acted on from 5% to", "28%", "25%")] },
    { id: "t-cart-3", level: "team", teamId: "cart", title: "Make agents dependable co-builders with curated data", keyResults: [kr("t-cart-3-1", "Raise agent-change first-pass acceptance from 40% to", "70%"), kr("t-cart-3-2", "Cut spec-to-validated-change cycle time from 5 days to", "1.5 days")] },
    { id: "t-mkt-1", level: "team", teamId: "marketing", parentId: "pi-diets", title: "Drive demand for specialized diet baskets", keyResults: [kr("t-mkt-1-1", "Specialized-diet basket starts from campaigns per week:", "25,000")] },
    { id: "t-mkt-2", level: "team", teamId: "marketing", parentId: "pi-game", title: "Grow the challenge community", keyResults: [kr("t-mkt-2-1", "Household challenge enrolments per week from 6,000 to", "10,000")] },
    { id: "t-store-1", level: "team", teamId: "in-store", parentId: "pi-diets", title: "Extend specialized-diet guidance into the store", keyResults: [kr("t-store-1-1", "Stores with diet-swap shelf guidance from 0 to", "120")] },
    { id: "t-store-2", level: "team", teamId: "in-store", parentId: "pi-margins", title: "Cut pick-and-pack cost on promoted baskets", keyResults: [kr("t-store-2-1", "Minutes per promoted basket from 6.5 to", "5.5")] },
  ];
  const milestones: Milestone[] = [
    { id: "m-fixed-1", kind: "fixed", label: "National Diabetes awareness month opens", iteration: 4 },
    { id: "m-fixed-2", kind: "fixed", label: "National Diabetes awareness month ends", iteration: 6 },
    { id: "m-learn-1", kind: "learning", label: "Diet classification model accuracy validated", iteration: 2, outcomeId: "pi-diets", teamIds: ["ai-engine", "cart"] },
    { id: "m-sync-1", kind: "sync", label: "Shared diet-profile for AI Engine, Cart, In-Store", iteration: 3, outcomeId: "pi-diets", teamIds: ["ai-engine", "cart", "in-store"] },
    { id: "m-learn-2", kind: "learning", label: "Validate diet adoption sustains into repeat purchasing", iteration: 4, outcomeId: "pi-diets", teamIds: ["cart", "marketing"] },
    { id: "m-rel-1", kind: "release", label: "Pilot diet-swap recommendations at checkout (limited cohort)", iteration: 3, outcomeId: "pi-diets", teamIds: ["cart"] },
    { id: "m-rel-2", kind: "release", label: "Full specialized-diet experience", iteration: 6, outcomeId: "pi-diets", teamIds: ["cart", "in-store"] },
    { id: "m-learn-3", kind: "learning", label: "Pick-path change validated in 10 stores", iteration: 1, outcomeId: "pi-margins", teamIds: ["in-store"] },
    { id: "m-sync-2", kind: "sync", label: "Promoted-basket costing shared with finance", iteration: 4, outcomeId: "pi-margins", teamIds: ["in-store"] },
    { id: "m-rel-3", kind: "release", label: "In-cart nudges", iteration: 2, outcomeId: "pi-game", teamIds: ["cart"] },
    { id: "m-learn-4", kind: "learning", label: "Nudge format validated", iteration: 3, outcomeId: "pi-game", teamIds: ["cart"] },
    { id: "m-rel-4", kind: "release", label: "Household challenges", iteration: 4, outcomeId: "pi-game", teamIds: ["cart", "marketing"] },
    { id: "m-fixed-3", kind: "learning", label: "Challenge retention read-out", iteration: 5, outcomeId: "pi-game", teamIds: ["marketing"] },
    { id: "m-learn-5", kind: "learning", label: "Curated-spec update validated", iteration: 2, teamIds: ["cart"] },
    { id: "m-sync-3", kind: "sync", label: "Spec standard aligned with AI Engine team", iteration: 4, teamIds: ["cart", "ai-engine"] },
    { id: "m-fixed-4", kind: "fixed", label: "Security audit", iteration: 2, teamIds: ["cart"] },
  ];
  const work: WorkSticky[] = [
    { id: "w-1", teamId: "cart", kind: "prototype", label: "Diet-swap at checkout", iteration: 1, outcomeId: "t-cart-1" },
    { id: "w-2", teamId: "cart", kind: "enabler", label: "Household diet-profile read", iteration: 1, outcomeId: "t-cart-1" },
    { id: "w-3", teamId: "cart", kind: "experiment", label: "Swap-acceptance framing A/B test", iteration: 2, outcomeId: "t-cart-1" },
    { id: "w-4", teamId: "cart", kind: "feature", label: "Diet-swap at checkout", iteration: 4, outcomeId: "t-cart-1" },
    { id: "w-5", teamId: "cart", kind: "experiment", label: "Baseline end-to-end cycle time", iteration: 1, outcomeId: "t-cart-3" },
    { id: "w-6", teamId: "cart", kind: "enabler", label: "Auditability instrumentation", iteration: 1 },
    { id: "w-7", teamId: "ai-engine", kind: "experiment", label: "Classifier retrain on curated labels", iteration: 1, outcomeId: "t-ai-1" },
    { id: "w-8", teamId: "ai-engine", kind: "feature", label: "Diet-profile service v1", iteration: 2, outcomeId: "t-ai-2" },
    { id: "w-9", teamId: "in-store", kind: "prototype", label: "Shelf-edge diet labels, 10 stores", iteration: 1, outcomeId: "t-store-1" },
    { id: "w-10", teamId: "marketing", kind: "experiment", label: "Diabetes-month campaign creative test", iteration: 2, outcomeId: "t-mkt-1" },
  ];
  const review: ReviewItem[] = [
    { id: "r-1", kind: "decision-needed", teamId: "cart", text: "The Cart Team are proposing deferral of the diet-swap recommendation pilot due to a capacity clash early in the PI caused by the planned release of in-cart nudges." },
    { id: "r-2", kind: "decision-confirmed", answers: "r-1", owner: "Product Management", text: "Defer the diet-swap pilot to iteration 3; keep in-cart nudges in iteration 2. Scale Specialized Diets key results adjusted (8%, 35%)." },
    { id: "r-3", kind: "action", answers: "r-1", owner: "RTE", text: "Re-plan the Scale Specialized Diets row with Cart, AI Engine and Marketing in the afternoon outcome breakout." },
    { id: "r-4", kind: "decision-needed", teamId: "ai-engine", text: "Can the AI Engine team use the curated household data for retraining before the privacy review completes?" },
    { id: "r-5", kind: "risk", teamId: "marketing", text: "Diabetes-month campaign spend is not yet approved; demand may arrive before the experience is ready." },
    { id: "r-6", kind: "action", answers: "r-5", owner: "Business Owner, Retail", text: "Confirm campaign budget with finance by end of iteration 1." },
    { id: "r-7", kind: "risk", teamId: "in-store", text: "Shelf-edge hardware lead time is 6 weeks; 120 stores by iteration 5 is tight." },
    { id: "r-8", kind: "risk", text: "AI operating cost rose to 3.4% of revenue in PI 1; the margin outcome assumes it stops rising." },
  ];
  return {
    id: "retail-pharmacy-pi2",
    artName: "Retail Pharmacy ART",
    vision: "Make the healthy choice the easy choice for every household we serve",
    piName: "PI 2",
    iterations: 5,
    stage: "adjusted",
    teams,
    outcomes,
    milestones,
    work,
    review,
    agenda: defaultAgenda().map((a, i) => (i < 6 ? { ...a, done: true } : a)),
    votes: [
      { teamId: "ai-engine", value: 4 },
      { teamId: "cart", value: 3 },
      { teamId: "marketing", value: 4 },
    ],
    updatedAt: now,
  };
}

/** A blank session for a new PI, with SAFe's agenda and no outcomes yet. */
export function emptyPlanningSession(id: string, artName: string, piName: string, teams: { id: string; name: string }[], now: string, iterations = 5): PlanningSession {
  return { id, artName, vision: "", piName, iterations, stage: "draft", teams, outcomes: [], milestones: [], work: [], review: [], agenda: defaultAgenda(), votes: [], updatedAt: now };
}
