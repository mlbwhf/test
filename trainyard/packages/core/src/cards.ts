// Card types: what a card is, with the fields it carries, the way Jira has issue types and
// iObeya has card templates. Built-in types cover SAFe's vocabulary; a workspace adds its own.
// A card type may stand for a workspace record kind, so a linked card knows what it shows.

import type { RefKind } from "./boards.js";

export type CardFieldType = "text" | "number" | "select" | "date" | "person" | "ref" | "url";

export interface CardField {
  key: string;
  label: string;
  type: CardFieldType;
  options?: string[];
  /** For type "ref": which record kinds the field may point at. */
  refKinds?: RefKind[];
  required?: boolean;
}

export interface CardType {
  id: string;
  name: string;
  /** Card colour. */
  color: string;
  /** A short label shown on the card, e.g. "FEATURE". */
  badge: string;
  blurb: string;
  fields: CardField[];
  /** The record kind this type stands for, when it is one of the structured ones. */
  refKind?: RefKind;
  builtin?: boolean;
}

export const BUILTIN_CARD_TYPES: CardType[] = [
  { id: "sticky", name: "Sticky note", color: "#fff6c2", badge: "", blurb: "Free text, any colour.", fields: [], builtin: true },
  { id: "feature", name: "Feature", color: "#cfe3fb", badge: "FEATURE", blurb: "A service that fulfils a stakeholder need, fits in one PI.", refKind: "item", builtin: true, fields: [{ key: "benefit", label: "Benefit hypothesis", type: "text" }, { key: "acceptance", label: "Acceptance criteria", type: "text" }, { key: "storyPoints", label: "Size (points)", type: "number" }, { key: "businessValue", label: "Business value", type: "number" }, { key: "owner", label: "Owner", type: "person" }, { key: "status", label: "Status", type: "select", options: ["Funnel", "Analysing", "Backlog", "Implementing", "Validating", "Done"] }] },
  { id: "story", name: "User story", color: "#c5e1a5", badge: "G · STORY", blurb: "A small piece of a feature a team finishes in an iteration.", refKind: "item", builtin: true, fields: [{ key: "storyPoints", label: "Points", type: "number" }, { key: "acceptance", label: "Acceptance criteria", type: "text" }, { key: "status", label: "Status", type: "select", options: ["To do", "In progress", "Done"] }] },
  { id: "maintenance", name: "Maintenance", color: "#ce93d8", badge: "P · MAINTENANCE", blurb: "Keeping what exists working: fixes, upgrades, small changes.", refKind: "item", builtin: true, fields: [{ key: "storyPoints", label: "Points", type: "number" }, { key: "status", label: "Status", type: "select", options: ["To do", "In progress", "Done"] }] },
  { id: "exploration-enabler", name: "Exploration enabler", color: "#ffd600", badge: "Y · EXPLORATION", blurb: "Research, prototyping and spikes that reduce uncertainty before building.", refKind: "item", builtin: true, fields: [{ key: "question", label: "Question to answer", type: "text" }, { key: "storyPoints", label: "Points", type: "number" }] },
  { id: "infrastructure-enabler", name: "Infrastructure enabler", color: "#ffb74d", badge: "O · INFRASTRUCTURE", blurb: "Pipelines, environments, platforms and tooling that make features possible.", refKind: "item", builtin: true, fields: [{ key: "storyPoints", label: "Points", type: "number" }, { key: "status", label: "Status", type: "select", options: ["To do", "In progress", "Done"] }] },
  { id: "enabler", name: "Enabler (architectural or compliance)", color: "#dcf3e4", badge: "ENABLER", blurb: "Architecture and compliance work that makes features possible.", refKind: "item", builtin: true, fields: [{ key: "enablerType", label: "Kind", type: "select", options: ["Architectural", "Compliance"] }, { key: "storyPoints", label: "Size (points)", type: "number" }] },
  { id: "epic", name: "Epic", color: "#e6e0ff", badge: "EPIC", blurb: "A portfolio initiative with a hypothesis, a Lean business case and WSJF.", refKind: "epic", builtin: true, fields: [{ key: "hypothesis", label: "Hypothesis statement", type: "text" }, { key: "wsjf", label: "WSJF", type: "number" }, { key: "state", label: "Kanban state", type: "select", options: ["Funnel", "Reviewing", "Analyzing", "Backlog", "Implementing", "Done"] }, { key: "epicOwner", label: "Epic owner", type: "person" }] },
  { id: "dependency", name: "Significant dependency", color: "#ff5252", badge: "R · DEPENDENCY", blurb: "Another team waits on this before their feature can ship.", refKind: "dependency", builtin: true, fields: [{ key: "neededBy", label: "Needed by", type: "ref", refKinds: ["item", "card"] }, { key: "status", label: "Status", type: "select", options: ["Open", "Committed", "Resolved"] }] },
  { id: "risk", name: "Risk", color: "#ff5252", badge: "R · RISK", blurb: "Something that may stop the plan; ROAM it.", refKind: "risk", builtin: true, fields: [{ key: "roam", label: "ROAM", type: "select", options: ["Unroamed", "Resolved", "Owned", "Accepted", "Mitigated"] }, { key: "owner", label: "Owner", type: "person" }] },
  { id: "milestone", name: "Milestone or event", color: "#ffd58a", badge: "MILESTONE", blurb: "A date that matters: release, trade show, audit.", refKind: "milestone", builtin: true, fields: [{ key: "date", label: "Date", type: "date" }, { key: "kind", label: "Kind", type: "select", options: ["Milestone", "Event", "Release"] }] },
  { id: "objective", name: "PI objective", color: "#d9f2ef", badge: "OBJECTIVE", blurb: "What a team commits to for the PI, with business value.", refKind: "objective", builtin: true, fields: [{ key: "plannedValue", label: "Planned BV", type: "number" }, { key: "actualValue", label: "Actual BV", type: "number" }, { key: "committed", label: "Committed", type: "select", options: ["Committed", "Uncommitted"] }] },
  { id: "outcome", name: "Outcome", color: "#e2ecd4", badge: "OUTCOME", blurb: "A measurable change in behaviour, with key results (PI Outcome Planning).", refKind: "outcome", builtin: true, fields: [{ key: "keyResults", label: "Key results", type: "text" }, { key: "ambition", label: "Ambition", type: "select", options: ["Roofshot", "Moonshot"] }] },
  { id: "decision", name: "Decision needed", color: "#f6d6ff", badge: "DECISION", blurb: "Raised in a breakout, answered at the management review.", builtin: true, fields: [{ key: "options", label: "Options", type: "text" }, { key: "decidedBy", label: "Decided by", type: "person" }, { key: "due", label: "Needed by", type: "date" }] },
  { id: "action", name: "Action", color: "#fff1c9", badge: "ACTION", blurb: "Something someone will do by a date.", builtin: true, fields: [{ key: "owner", label: "Owner", type: "person" }, { key: "due", label: "Due", type: "date" }, { key: "done", label: "Done", type: "select", options: ["No", "Yes"] }] },
];

/** Admin overrides of a built-in type's look (colour, badge, description), kept apart so built-ins can evolve. */
export interface CardTypeOverride {
  id: string;
  color?: string;
  badge?: string;
  blurb?: string;
}

export function withOverrides(types: CardType[], overrides: CardTypeOverride[] | undefined): CardType[] {
  if (!overrides?.length) return types;
  return types.map((t) => {
    const o = overrides.find((x) => x.id === t.id);
    return o ? { ...t, ...(o.color ? { color: o.color } : {}), ...(o.badge !== undefined ? { badge: o.badge } : {}), ...(o.blurb !== undefined ? { blurb: o.blurb } : {}) } : t;
  });
}

export const cardTypeById = (types: CardType[], id: string | undefined) => (id ? types.find((t) => t.id === id) : undefined);
