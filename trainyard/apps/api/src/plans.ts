// Plans and their limits, enforced where they are felt. A workspace record lives in the
// platform store's registry; the limits read the workspace's own state (boards, trains) and
// its member count from the platform users. Going over a limit answers 402 PLAN_LIMIT with
// what to do about it, so the web app can offer the upgrade instead of a bare error.

import { ApiError } from "./errors.js";
import type { Plan } from "./signups.js";
import type { StoreState } from "./store.js";

export type WorkspaceStatus = "active" | "frozen";

export interface WorkspaceRecord {
  id: string;
  name: string;
  plan: Plan;
  /** Trainers (Trainer plan) or trains (Academy plan); unused on Practice. */
  seats: number;
  status: WorkspaceStatus;
  ownerUserId: string;
  createdAt: string;
  /** Why it is frozen (subscription cancelled, unpaid, by support), and when. */
  frozenAt?: string;
  frozenReason?: string;
  /** Platform admin's note, e.g. "comped for the SPC class in March". */
  note?: string;
  /** Last time a platform admin opened this workspace as support. */
  supportVisitAt?: string;
  supportVisitBy?: string;
}

export interface PlanLimits {
  /** People who can sign in to the workspace (any role). */
  members: number | null;
  /** People with a role above viewer: trainers and planners. */
  staff: number | null;
  /** Boards of the workspace's own: imports, class boards, instantiated templates. */
  boards: number | null;
  /** Top-level groups (trains). */
  trains: number | null;
}

/** seats = paid quantity; null means unlimited. */
export function limitsFor(plan: Plan, seats: number): PlanLimits {
  switch (plan) {
    case "practice":
      return { members: 5, staff: null, boards: 1, trains: 1 };
    case "trainer":
      return { members: null, staff: Math.max(1, seats), boards: null, trains: null };
    case "academy":
      return { members: null, staff: null, boards: null, trains: Math.max(1, seats) };
  }
}

export interface Usage {
  members: number;
  staff: number;
  boards: number;
  trains: number;
}

export function usageOf(state: StoreState, members: { role: string; disabled?: boolean }[]): Usage {
  const active = members.filter((m) => !m.disabled);
  const topLevel = state.model.groupLevels[0]?.key;
  return {
    members: active.length,
    staff: active.filter((m) => m.role !== "viewer").length,
    boards: (state.workspace.boards ?? []).length,
    trains: state.workspace.groups.filter((g) => !g.parentId || g.level === topLevel).length,
  };
}

const WHAT: Record<keyof Usage, string> = { members: "people", staff: "trainers", boards: "boards", trains: "trains" };

export function planLimitError(record: WorkspaceRecord, kind: keyof Usage, limit: number, current: number): ApiError {
  const upgrade = record.plan === "practice" ? "Upgrade to Trainer or Academy under Billing." : record.plan === "trainer" ? "Add trainers under Billing." : "Add trains under Billing.";
  return new ApiError(402, "PLAN_LIMIT", `The ${record.plan} plan allows ${limit} ${WHAT[kind]} and this workspace has ${current}. ${upgrade}`, { kind, limit, current, plan: record.plan, upgrade: "/billing" });
}

/** Throws when the state is over a limit. Members are checked where they are added. */
export function enforceStateLimits(record: WorkspaceRecord, state: StoreState): void {
  const limits = limitsFor(record.plan, record.seats);
  const usage = usageOf(state, []);
  for (const kind of ["boards", "trains"] as const) {
    const limit = limits[kind];
    if (limit !== null && usage[kind] > limit) throw planLimitError(record, kind, limit, usage[kind]);
  }
}

export function frozenError(record: WorkspaceRecord): ApiError {
  return new ApiError(423, "WORKSPACE_FROZEN", `${record.name} is read-only: ${record.frozenReason ?? "the subscription is not active"}. Reactivate it under Billing; everything is kept and can be exported.`, { workspaceId: record.id, upgrade: "/billing" });
}
