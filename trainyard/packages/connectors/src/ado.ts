// Azure DevOps Services adapter. Reads ids with WIQL, then fields in batches of 200 with
// workitemsbatch; writes with JSON Patch, and records dependencies as Successor links
// (System.LinkTypes.Dependency-Forward) from the provider to the consumer.

import type { ItemHistory, StatusCategory, WorkItem } from "@trainyard/core";
import { TrackerHttp, basicAuth, type FetchLike } from "./http.js";
import { defaultFlowType, invert, itemId, type CommonMapping, type PushChange, type TrackerConnector } from "./types.js";

export interface AdoConfig {
  organization: string;
  project: string;
  /** Personal access token with Work Items (Read & write) scope. */
  pat: string;
  /** WIQL WHERE clause for the pull, e.g. `[System.AreaPath] UNDER 'Customer'`. */
  where: string;
  mapping: CommonMapping & {
    /** Area path → Trainyard team id. The longest matching prefix wins. */
    areaTeams: Record<string, string>;
    /** State name → status. Merged over the defaults for the Agile, Scrum and CMMI processes. */
    states?: Record<string, StatusCategory>;
  };
  /** Override the host, e.g. for Azure DevOps Server. Defaults to https://dev.azure.com. */
  host?: string;
  fetch?: FetchLike;
  sleep?: (ms: number) => Promise<void>;
}

const API = "api-version=7.1";
const DEFAULT_STATES: Record<string, StatusCategory> = {
  New: "todo",
  Proposed: "todo",
  "To Do": "todo",
  Approved: "todo",
  Active: "in_progress",
  Committed: "in_progress",
  "In Progress": "in_progress",
  Doing: "in_progress",
  Resolved: "done",
  Closed: "done",
  Done: "done",
};

const FIELDS = [
  "System.Id",
  "System.Title",
  "System.WorkItemType",
  "System.State",
  "System.AreaPath",
  "System.IterationPath",
  "System.Parent",
  "System.CreatedDate",
  "System.ChangedDate",
  "Microsoft.VSTS.Common.ActivatedDate",
  "Microsoft.VSTS.Common.ClosedDate",
  "Microsoft.VSTS.Scheduling.StoryPoints",
  "Microsoft.VSTS.Common.BusinessValue",
];

interface AdoWorkItem {
  id: number;
  rev: number;
  fields: Record<string, unknown>;
}

export class AdoConnector implements TrackerConnector {
  readonly system = "ado" as const;
  private readonly http: TrackerHttp;
  private readonly root: string;
  private readonly states: Record<string, StatusCategory>;

  constructor(private readonly cfg: AdoConfig) {
    const host = (cfg.host ?? "https://dev.azure.com").replace(/\/+$/, "");
    this.root = `${host}/${encodeURIComponent(cfg.organization)}/${encodeURIComponent(cfg.project)}`;
    this.http = new TrackerHttp({ authorization: basicAuth("", cfg.pat), ...(cfg.fetch ? { fetch: cfg.fetch } : {}), ...(cfg.sleep ? { sleep: cfg.sleep } : {}) });
    this.states = { ...DEFAULT_STATES, ...cfg.mapping.states };
  }

  async pull(): Promise<WorkItem[]> {
    const types = Object.keys(this.cfg.mapping.levels).map((t) => `'${t.replace(/'/g, "''")}'`).join(", ");
    const query = `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.WorkItemType] IN (${types}) AND (${this.cfg.where}) ORDER BY [System.Id]`;
    const wiql: { workItems: { id: number }[] } = await this.http.request("POST", `${this.root}/_apis/wit/wiql?${API}`, { query });
    const ids = wiql.workItems.map((w) => w.id);
    const out: WorkItem[] = [];
    for (let i = 0; i < ids.length; i += 200) {
      const batch: { value: AdoWorkItem[] } = await this.http.request("POST", `${this.root}/_apis/wit/workitemsbatch?${API}`, { ids: ids.slice(i, i + 200), fields: FIELDS });
      for (const wi of batch.value) {
        const item = this.toItem(wi);
        if (item) out.push(item);
      }
    }
    return out;
  }

  /** State changes from each work item's update history. One request per item, so keep `limit` modest. */
  async statusHistory(opts: { query?: string; limit?: number } = {}): Promise<ItemHistory[]> {
    const limit = opts.limit ?? 200;
    const query = `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND (${opts.query ?? this.cfg.where}) ORDER BY [System.ChangedDate] DESC`;
    const wiql: { workItems: { id: number }[] } = await this.http.request("POST", `${this.root}/_apis/wit/wiql?$top=${limit}&${API}`, { query });
    const out: ItemHistory[] = [];
    for (const { id } of wiql.workItems.slice(0, limit)) {
      const res: { value: { fields?: Record<string, { oldValue?: unknown; newValue?: unknown }> }[] } = await this.http.request("GET", `${this.root}/_apis/wit/workItems/${id}/updates?${API}`);
      const changes: { status: string; at: string }[] = [];
      let title: string | undefined;
      for (const u of res.value) {
        const f = u.fields ?? {};
        if (typeof f["System.Title"]?.newValue === "string") title = f["System.Title"].newValue as string;
        const state = f["System.State"]?.newValue;
        const at = f["System.ChangedDate"]?.newValue;
        if (typeof state === "string" && typeof at === "string") changes.push({ status: state, at: new Date(at).toISOString() });
      }
      out.push({ itemId: String(id), ...(title ? { title } : {}), changes });
    }
    return out;
  }

  private teamFor(areaPath: string): string | undefined {
    let best: [string, string] | undefined;
    for (const [prefix, team] of Object.entries(this.cfg.mapping.areaTeams)) {
      const match = areaPath === prefix || areaPath.startsWith(`${prefix}\\`);
      if (match && (!best || prefix.length > best[0].length)) best = [prefix, team];
    }
    return best?.[1];
  }

  toItem(wi: AdoWorkItem): WorkItem | undefined {
    const f = wi.fields;
    const str = (k: string) => (typeof f[k] === "string" ? (f[k] as string) : undefined);
    const num = (k: string) => (typeof f[k] === "number" ? (f[k] as number) : undefined);
    const type = str("System.WorkItemType") ?? "";
    const level = this.cfg.mapping.levels[type];
    if (!level) return undefined;
    const state = str("System.State") ?? "";
    if (state === "Removed") return undefined;
    const status = this.states[state] ?? "todo";
    const teamId = this.teamFor(str("System.AreaPath") ?? "");
    const iterationId = this.cfg.mapping.iterations?.[str("System.IterationPath") ?? ""];
    const parent = num("System.Parent");
    const estimate = num("Microsoft.VSTS.Scheduling.StoryPoints");
    const businessValue = num("Microsoft.VSTS.Common.BusinessValue");
    const activated = str("Microsoft.VSTS.Common.ActivatedDate");
    const closed = str("Microsoft.VSTS.Common.ClosedDate");
    const id = String(wi.id);
    return {
      id: itemId("ado", id),
      title: str("System.Title") ?? `#${id}`,
      level,
      ...(parent !== undefined ? { parentId: itemId("ado", String(parent)) } : {}),
      ...(teamId ? { teamId } : {}),
      ...(iterationId ? { iterationId } : {}),
      status,
      flowType: this.cfg.mapping.flowTypes?.[type] ?? defaultFlowType(type),
      ...(estimate !== undefined ? { estimate } : {}),
      ...(businessValue !== undefined ? { businessValue } : {}),
      createdAt: new Date(str("System.CreatedDate") ?? 0).toISOString(),
      ...(activated && status !== "todo" ? { startedAt: new Date(activated).toISOString() } : {}),
      ...(closed && status === "done" ? { doneAt: new Date(closed).toISOString() } : {}),
      source: {
        system: "ado",
        externalId: id,
        url: `${this.root}/_workitems/edit/${id}`,
        ...(str("System.ChangedDate") ? { updatedAt: new Date(str("System.ChangedDate")!).toISOString() } : {}),
      },
    };
  }

  async push(change: PushChange): Promise<void> {
    const patch = (id: string, ops: unknown[]) => this.http.request("PATCH", `${this.root}/_apis/wit/workitems/${encodeURIComponent(id)}?${API}`, ops, "application/json-patch+json");
    if (change.kind === "link") {
      await patch(change.provider.source.externalId, [
        {
          op: "add",
          path: "/relations/-",
          value: { rel: "System.LinkTypes.Dependency-Forward", url: `${this.root}/_apis/wit/workItems/${change.consumer.source.externalId}` },
        },
      ]);
      return;
    }
    const { item, fields } = change;
    const ops: { op: string; path: string; value?: unknown }[] = [];
    const set = (field: string, value: unknown) => ops.push(value === undefined ? { op: "remove", path: `/fields/${field}` } : { op: "add", path: `/fields/${field}`, value });
    if (fields.includes("title")) set("System.Title", item.title);
    if (fields.includes("estimate")) set("Microsoft.VSTS.Scheduling.StoryPoints", item.estimate);
    if (fields.includes("businessValue")) set("Microsoft.VSTS.Common.BusinessValue", item.businessValue);
    if (fields.includes("iterationId")) {
      // An unplanned item goes back to the project root iteration.
      const path = item.iterationId ? invert(this.cfg.mapping.iterations)[item.iterationId] : undefined;
      set("System.IterationPath", path ?? this.cfg.project);
    }
    if (ops.length) await patch(item.source.externalId, ops);
  }
}
