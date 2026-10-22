import type { FlowType, ItemHistory, SourceSystem, StatusCategory, WorkItem } from "@trainyard/core";

/** Fields Trainyard writes back to a tracker. Status stays owned by the teams' own boards. */
export type PushField = "title" | "iterationId" | "estimate" | "businessValue";

export type PushChange =
  | { kind: "update"; item: WorkItem; fields: PushField[] }
  | { kind: "link"; provider: WorkItem; consumer: WorkItem };

export interface TrackerConnector {
  readonly system: SourceSystem;
  /** Fetch every item in the connector's configured scope, normalised to Trainyard items. */
  pull(): Promise<WorkItem[]>;
  push(change: PushChange): Promise<void>;
  /**
   * Status changes for items in scope (or in `query`, a JQL or WIQL WHERE clause), oldest first,
   * for value stream maps. At most `limit` items.
   */
  statusHistory?(opts?: { query?: string; limit?: number }): Promise<ItemHistory[]>;
}

/** Mappings shared by both adapters. Unmapped values fall back to sensible defaults. */
export interface CommonMapping {
  /** Tracker work type name → Trainyard work level key. Unmapped types are skipped. */
  levels: Record<string, string>;
  /** Tracker work type name → flow type. Default "feature". */
  flowTypes?: Record<string, FlowType>;
  /** Tracker iteration (Jira sprint id, ADO iteration path) → Trainyard iteration id. */
  iterations?: Record<string, string>;
}

export function invert(map: Record<string, string> = {}): Record<string, string> {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
}

export function itemId(system: SourceSystem, externalId: string): string {
  return `${system}:${externalId}`;
}

export function defaultFlowType(typeName: string): FlowType {
  const t = typeName.toLowerCase();
  if (t === "bug" || t === "defect") return "defect";
  if (t.includes("enabler") || t === "spike") return "enabler";
  if (t.includes("debt")) return "debt";
  if (t === "risk") return "risk";
  return "feature";
}

export type { StatusCategory };
