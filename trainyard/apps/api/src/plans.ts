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
  /** Data sources on the outcome dashboard. */
  sources: number | null;
  /** Rooms that organise boards and access (rooms.ts in core). */
  rooms: number | null;
  /** Whether rooms can be private (members only). */
  privateRooms: boolean;
}

/** seats = paid quantity; null means unlimited. */
export function limitsFor(plan: Plan, seats: number): PlanLimits {
  switch (plan) {
    case "practice":
      return { members: 5, staff: null, boards: 1, trains: 1, sources: 2, rooms: 1, privateRooms: false };
    case "trainer":
      // A room per cohort: five per trainer seat.
      return { members: null, staff: Math.max(1, seats), boards: null, trains: null, sources: 3, rooms: 5 * Math.max(1, seats), privateRooms: true };
    case "academy":
      // Priced by trains; rooms (ART, portfolio, OKR, team) are as many as the trains need.
      return { members: null, staff: null, boards: null, trains: Math.max(1, seats), sources: null, rooms: null, privateRooms: true };
    // The outcome dashboard on its own: unlimited viewers, ten sources per pack, one planning room.
    case "insights":
      return { members: null, staff: 5, boards: 1, trains: 1, sources: 10 * Math.max(1, seats), rooms: 2, privateRooms: true };
  }
}

export interface Usage {
  members: number;
  staff: number;
  boards: number;
  trains: number;
  sources: number;
  rooms: number;
}

export function usageOf(state: StoreState, members: { role: string; disabled?: boolean }[]): Usage {
  const active = members.filter((m) => !m.disabled);
  const topLevel = state.model.groupLevels[0]?.key;
  return {
    members: active.length,
    staff: active.filter((m) => m.role !== "viewer").length,
    boards: (state.workspace.boards ?? []).length,
    trains: state.workspace.groups.filter((g) => !g.parentId || g.level === topLevel).length,
    sources: state.insights?.sources.length ?? 0,
    rooms: (state.rooms ?? []).length,
  };
}

const WHAT: Record<keyof Usage, string> = { members: "people", staff: "trainers", boards: "boards", trains: "trains", sources: "data sources", rooms: "rooms" };

export function planLimitError(record: WorkspaceRecord, kind: keyof Usage, limit: number, current: number): ApiError {
  const upgrade = kind === "sources" ? (record.plan === "insights" ? "Add a source pack under Billing." : "Add the Insights plan under Billing: ten sources a pack, unlimited viewers.") : record.plan === "practice" ? "Upgrade to Trainer or Academy under Billing." : record.plan === "trainer" ? "Add trainers under Billing." : record.plan === "insights" ? "Insights is the outcome dashboard; for planning rooms add Trainer or Academy under Billing." : "Add trains under Billing.";
  return new ApiError(402, "PLAN_LIMIT", `The ${record.plan} plan allows ${limit} ${WHAT[kind]} and this workspace has ${current}. ${upgrade}`, { kind, limit, current, plan: record.plan, upgrade: "/billing" });
}

/** Throws when the state is over a limit. Members are checked where they are added. */
export function enforceStateLimits(record: WorkspaceRecord, state: StoreState): void {
  const limits = limitsFor(record.plan, record.seats);
  const usage = usageOf(state, []);
  for (const kind of ["boards", "trains", "rooms"] as const) {
    const limit = limits[kind];
    if (limit !== null && usage[kind] > limit) throw planLimitError(record, kind, limit, usage[kind]);
  }
  if (!limits.privateRooms && (state.rooms ?? []).some((r) => r.visibility === "private")) {
    throw new ApiError(402, "PLAN_LIMIT", `Private rooms come with the Trainer and Academy plans; on ${record.plan} every room is open to the workspace. Upgrade under Billing.`, { kind: "privateRooms", plan: record.plan, upgrade: "/billing" });
  }
}

export function frozenError(record: WorkspaceRecord): ApiError {
  return new ApiError(423, "WORKSPACE_FROZEN", `${record.name} is read-only: ${record.frozenReason ?? "the subscription is not active"}. Reactivate it under Billing; everything is kept and can be exported.`, { workspaceId: record.id, upgrade: "/billing" });
}
