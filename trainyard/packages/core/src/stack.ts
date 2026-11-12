// Kanban lanes on a canvas (a frame with layout "stack"): cards keep one column from the top of
// the lane, in order, and a card dropped into the lane takes the place its drop point says.
// The quick agenda on a class board works this way: a lesson dragged to WIP or Done lands in
// the column, not wherever the finger let go.

import type { BoardNode, Frame } from "./boards.js";

/** Space from the lane's edges to its cards, and the lane title's height above the first card. */
export const STACK_PAD = 16;
export const STACK_HEAD = 44;
export const STACK_GAP = 14;
/** A card drawn without a height is as tall as the agenda cards. */
const hOf = (n: BoardNode) => n.height ?? 64;

/** The lane at a point: the smallest stack frame containing it, or null. */
export function stackLaneAt(frames: Frame[], p: { x: number; y: number }): Frame | null {
  const hits = frames.filter((f) => f.layout === "stack" && p.x >= f.x && p.x <= f.x + f.width && p.y >= f.y && p.y <= f.y + f.height);
  return hits.sort((a, b) => a.width * a.height - b.width * b.height)[0] ?? null;
}

/**
 * Where every card of a lane goes once `dropped` (if any) is placed by its drop point: the lane's
 * other cards in their current order, the dropped card where the pointer's height falls among them.
 * Returns the cards that change (position, size or lane), with their new values.
 */
export function stackCards(lane: Frame, nodes: BoardNode[], dropped?: { id: string; y: number }): BoardNode[] {
  const inLane = nodes.filter((n) => n.frameId === lane.id && n.id !== dropped?.id).sort((a, b) => a.y - b.y || a.x - b.x);
  const card = dropped ? nodes.find((n) => n.id === dropped.id) : undefined;
  if (card) {
    // Insert before the first card whose middle is below the drop point.
    let at = inLane.length;
    let y = lane.y + STACK_HEAD;
    for (let i = 0; i < inLane.length; i++) {
      const mid = y + hOf(inLane[i]!) / 2;
      if (dropped!.y < mid) { at = i; break; }
      y += hOf(inLane[i]!) + STACK_GAP;
    }
    inLane.splice(at, 0, card);
  }
  const width = Math.max(40, lane.width - STACK_PAD * 2);
  const out: BoardNode[] = [];
  let y = lane.y + STACK_HEAD;
  for (const n of inLane) {
    const next = { ...n, x: lane.x + STACK_PAD, y, width, frameId: lane.id };
    if (next.x !== n.x || next.y !== n.y || next.width !== n.width || next.frameId !== n.frameId) out.push(next);
    y += hOf(n) + STACK_GAP;
  }
  return out;
}

/** The height a lane needs for its cards, so a long column is never clipped. */
export function stackHeight(lane: Frame, nodes: BoardNode[]): number {
  const h = nodes.filter((n) => n.frameId === lane.id).reduce((a, n) => a + hOf(n) + STACK_GAP, 0);
  return Math.max(lane.height, STACK_HEAD + h + STACK_PAD);
}
