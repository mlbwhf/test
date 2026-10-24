// Lane boards: the workspace's drag-between-lanes boards (OKR alignment and check-in, class
// breakouts and agenda, template previews). Cards sit in lanes; lanes can carry rules that a drop
// must respect. The rules live here so the browser and the API apply the same ones.

export interface LaneRule {
  id: string;
  title: string;
  /** Soft capacity: a drop over it is allowed with a warning (story points, minutes). */
  cap?: number;
  unit?: string;
  /** Kanban WIP limit: a drop that would exceed it is refused. */
  wip?: number;
  /** With cap: the capacity is hard (four seats at a table, two bets). */
  hard?: boolean;
  /** Only cards whose authority is reviewed, recommended or escalated may enter. */
  gate?: boolean;
}

export interface LaneCard {
  id: string;
  lane: string | null;
  title: string;
  sub?: string;
  tag?: string;
  chip?: string;
  /** 0 neutral, 1 yellow, 2 blue, 3 green, 4 red: the theme's tones. */
  tone?: number;
  /** What the card weighs against a lane's capacity (points, minutes, seats default to 1). */
  size?: number;
  /** Authority level for gated lanes (Mutation loop). */
  auth?: string;
}

export interface LaneNote {
  id: string;
  kind: "sticky" | "timer";
  text: string;
  x: number;
  y: number;
  tone: number;
  /** Timers: seconds left and whether it runs. */
  seconds?: number;
  running?: boolean;
}

export interface LaneBoardState {
  cards: LaneCard[];
  notes: LaneNote[];
  /** Pen strokes as SVG path data. */
  strokes: string[];
  updatedAt: string;
}

export const REVIEWED_AUTHORITY = ["reviewed", "recommended", "escalated"];

export type DropVerdict = { ok: true; warning?: string } | { ok: false; reason: string };

const weight = (lane: LaneRule, c: LaneCard) => (lane.cap !== undefined && !lane.hard ? (c.size ?? 0) : 1);

/** May this card move into this lane, given the cards already there? */
export function checkDrop(lane: LaneRule, card: LaneCard, cards: LaneCard[]): DropVerdict {
  if (card.lane === lane.id) return { ok: true };
  const there = cards.filter((c) => c.lane === lane.id && c.id !== card.id);
  if (lane.gate && !REVIEWED_AUTHORITY.includes(card.auth ?? "")) return { ok: false, reason: `“${card.title}” is only ${card.auth ?? "unreviewed"}. A named human must review it before it leaves Signal.` };
  if (lane.wip !== undefined && there.length + 1 > lane.wip) return { ok: false, reason: `${lane.title} is at its WIP limit (${lane.wip}). Finish something first.` };
  if (lane.cap !== undefined) {
    const load = there.reduce((n, c) => n + weight(lane, c), 0) + weight(lane, card);
    if (load > lane.cap) {
      if (lane.hard) return { ok: false, reason: `${lane.title} is full (${lane.cap} ${lane.unit ?? ""}).`.replace(" )", ")") };
      return { ok: true, warning: `${lane.title} is over capacity by ${Math.round((load - lane.cap) * 10) / 10} ${lane.unit ?? ""}`.trim() };
    }
  }
  return { ok: true };
}

/** Load of a lane against its capacity, for the meter in the lane header. */
export function laneLoad(lane: LaneRule, cards: LaneCard[]): number {
  return cards.filter((c) => c.lane === lane.id).reduce((n, c) => n + weight(lane, c), 0);
}

/** The board as Markdown: title, lanes with caps and WIP limits, cards. For copy-as-text and agents. */
export function laneMarkdown(title: string, lanes: LaneRule[], cards: LaneCard[]): string {
  const head = (l: LaneRule) => `## ${l.title}${l.cap !== undefined ? ` (cap ${l.cap} ${l.unit ?? ""})`.replace(" )", ")") : ""}${l.wip !== undefined ? ` (WIP limit ${l.wip})` : ""}`;
  const items = (l: LaneRule) => cards.filter((c) => c.lane === l.id).map((c) => `- ${c.title}${c.chip ? ` [${c.chip}]` : ""}${c.sub ? `: ${c.sub}` : ""}`);
  return [`# ${title}`, ...lanes.map((l) => [head(l), ...(items(l).length ? items(l) : ["- (empty)"])].join("\n"))].join("\n\n");
}

/** Move a card to a lane at a position among that lane's cards, keeping everyone else's order. */
export function moveCard(cards: LaneCard[], id: string, lane: string, index?: number): LaneCard[] {
  const card = cards.find((c) => c.id === id);
  if (!card) return cards;
  const rest = cards.filter((c) => c.id !== id);
  const moved = { ...card, lane };
  const inLane = rest.filter((c) => c.lane === lane);
  const at = index === undefined || index >= inLane.length ? -1 : rest.indexOf(inLane[index]!);
  if (at < 0) {
    const last = inLane.length ? rest.indexOf(inLane[inLane.length - 1]!) + 1 : rest.length;
    return [...rest.slice(0, last), moved, ...rest.slice(last)];
  }
  return [...rest.slice(0, at), moved, ...rest.slice(at)];
}
