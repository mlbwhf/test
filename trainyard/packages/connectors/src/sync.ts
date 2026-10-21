// Two-way sync planning. Local edits are recorded as pending changes; on each sync the
// tracker's items are compared with ours. Fields the tracker changed flow in, fields we
// changed flow out, and a field both sides changed becomes a conflict for a person to
// decide. The planner is pure: the caller applies the plan and pushes the changes.

import type { WorkItem } from "@trainyard/core";
import type { PushChange, PushField } from "./types.js";

export interface PendingChange {
  itemId: string;
  fields: PushField[];
  at: string;
  /** Field values before the local edit. Without them, any remote change to the item counts as a conflict. */
  base?: Partial<Record<PushField, unknown>>;
}

export interface Conflict {
  itemId: string;
  field: PushField;
  local: unknown;
  remote: unknown;
}

export interface SyncPlan {
  /** Items to store after the sync: remote data with our pending fields kept on top. */
  items: WorkItem[];
  added: string[];
  updated: string[];
  /** Synced items the tracker no longer returns (deleted or moved out of scope). */
  missing: string[];
  push: PushChange[];
  conflicts: Conflict[];
}

const PULLED: (keyof WorkItem)[] = ["title", "level", "parentId", "teamId", "iterationId", "status", "flowType", "estimate", "businessValue", "createdAt", "startedAt", "doneAt", "source"];

function newer(a?: string, b?: string): boolean {
  return !!a && (!b || a > b);
}

/** Plan a sync for one tracker. `local` holds every item currently stored for that tracker. */
export function planSync(local: readonly WorkItem[], remote: readonly WorkItem[], pending: readonly PendingChange[]): SyncPlan {
  const localById = new Map(local.map((i) => [i.id, i]));
  const remoteIds = new Set(remote.map((i) => i.id));
  const pendingById = new Map<string, Set<PushField>>();
  const baseById = new Map<string, Partial<Record<PushField, unknown>>>();
  for (const p of pending) {
    const s = pendingById.get(p.itemId) ?? new Set<PushField>();
    const b = baseById.get(p.itemId) ?? {};
    for (const f of p.fields) {
      s.add(f);
      // The earliest edit holds the value the tracker last agreed with.
      if (p.base && f in p.base && !(f in b)) b[f] = p.base[f];
    }
    pendingById.set(p.itemId, s);
    baseById.set(p.itemId, b);
  }

  const plan: SyncPlan = { items: [], added: [], updated: [], missing: [], push: [], conflicts: [] };
  for (const r of remote) {
    const l = localById.get(r.id);
    if (!l) {
      plan.items.push(r);
      plan.added.push(r.id);
      continue;
    }
    const mine = pendingById.get(r.id) ?? new Set<PushField>();
    const remoteChanged = newer(r.source.updatedAt, l.source.updatedAt);
    const merged: WorkItem = { ...l };
    const rec = merged as unknown as Record<string, unknown>;
    if (remoteChanged) {
      for (const k of PULLED) {
        if (mine.has(k as PushField)) continue;
        if (r[k] === undefined) delete rec[k];
        else rec[k] = r[k];
      }
    }
    const base = baseById.get(r.id) ?? {};
    const toPush: PushField[] = [];
    for (const f of mine) {
      const remoteMovedField = f in base ? r[f] !== base[f] : true;
      if (remoteChanged && remoteMovedField && r[f] !== l[f]) plan.conflicts.push({ itemId: r.id, field: f, local: l[f], remote: r[f] });
      else toPush.push(f);
    }
    if (toPush.length) plan.push.push({ kind: "update", item: merged, fields: toPush });
    if (remoteChanged) plan.updated.push(r.id);
    // Keep local fields that the tracker does not know about (e.g. AI initiative links).
    plan.items.push(merged);
  }
  for (const l of local) if (!remoteIds.has(l.id)) plan.missing.push(l.id);
  return plan;
}

/** Resolve a conflict by keeping one side. Returns the item to store and an optional push. */
export function resolveConflict(item: WorkItem, conflict: Conflict, keep: "local" | "remote"): { item: WorkItem; push?: PushChange } {
  if (keep === "local") return { item: { ...item, [conflict.field]: conflict.local }, push: { kind: "update", item: { ...item, [conflict.field]: conflict.local }, fields: [conflict.field] } };
  const next = { ...item } as unknown as Record<string, unknown>;
  if (conflict.remote === undefined) delete next[conflict.field];
  else next[conflict.field] = conflict.remote;
  return { item: next as unknown as WorkItem };
}
