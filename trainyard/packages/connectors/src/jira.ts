// Jira Cloud adapter. Reads with the enhanced JQL search (POST /rest/api/3/search/jql,
// paged by nextPageToken), writes fields with PUT /rest/api/3/issue/{key}, moves issues
// between sprints with the Agile API and creates "Blocks" links for dependencies.

import type { ItemHistory, StatusCategory, WorkItem } from "@trainyard/core";
import { TrackerHttp, basicAuth, type FetchLike } from "./http.js";
import { defaultFlowType, invert, itemId, type CommonMapping, type PushChange, type TrackerConnector } from "./types.js";

export interface JiraConfig {
  /** e.g. https://northwind.atlassian.net */
  baseUrl: string;
  email: string;
  apiToken: string;
  /** Scope of the pull, e.g. `project in (CHK, SRC) AND updated >= -180d`. */
  jql: string;
  mapping: CommonMapping & {
    /** Project key → Trainyard team id. */
    projectTeams: Record<string, string>;
  };
  /** Custom field ids differ per site; find them under Settings → Issues → Custom fields. */
  fields: {
    storyPoints?: string;
    sprint?: string;
    businessValue?: string;
  };
  /**
   * Which side of a "Blocks" link the provider goes on. Jira's API field names do not fix the
   * direction and community reports disagree, so check once on a sandbox: create a link and
   * see which issue shows "blocks" in the UI. Default "inward".
   */
  providerSide?: "inward" | "outward";
  fetch?: FetchLike;
  sleep?: (ms: number) => Promise<void>;
}

interface JiraIssue {
  id: string;
  key: string;
  fields: Record<string, unknown> & {
    summary: string;
    issuetype: { name: string };
    status: { statusCategory: { key: string } };
    project: { key: string };
    parent?: { key: string };
    created: string;
    updated: string;
    resolutiondate?: string | null;
    statuscategorychangedate?: string;
  };
}

interface SearchResponse {
  issues: JiraIssue[];
  nextPageToken?: string;
  isLast?: boolean;
}

const STATUS: Record<string, StatusCategory> = { new: "todo", indeterminate: "in_progress", done: "done" };

export class JiraConnector implements TrackerConnector {
  readonly system = "jira" as const;
  private readonly http: TrackerHttp;
  private readonly base: string;

  constructor(private readonly cfg: JiraConfig) {
    this.base = cfg.baseUrl.replace(/\/+$/, "");
    this.http = new TrackerHttp({ authorization: basicAuth(cfg.email, cfg.apiToken), ...(cfg.fetch ? { fetch: cfg.fetch } : {}), ...(cfg.sleep ? { sleep: cfg.sleep } : {}) });
  }

  private fieldList(): string[] {
    const f = this.cfg.fields;
    return ["summary", "issuetype", "status", "project", "parent", "created", "updated", "resolutiondate", "statuscategorychangedate", f.storyPoints, f.sprint, f.businessValue].filter((x): x is string => !!x);
  }

  async pull(): Promise<WorkItem[]> {
    const out: WorkItem[] = [];
    let nextPageToken: string | undefined;
    do {
      const res: SearchResponse = await this.http.request("POST", `${this.base}/rest/api/3/search/jql`, {
        jql: this.cfg.jql,
        fields: this.fieldList(),
        maxResults: 100,
        ...(nextPageToken ? { nextPageToken } : {}),
      });
      for (const issue of res.issues) {
        const item = this.toItem(issue);
        if (item) out.push(item);
      }
      nextPageToken = res.isLast === false || (res.isLast === undefined && res.nextPageToken) ? res.nextPageToken : undefined;
    } while (nextPageToken);
    return out;
  }

  /**
   * Status changes from each issue's changelog. The enhanced search returns up to 100 recent
   * changelog entries per issue with expand=changelog, plenty for status history; the first
   * status is the one before the first change, entered at creation.
   */
  async statusHistory(opts: { query?: string; limit?: number } = {}): Promise<ItemHistory[]> {
    const limit = opts.limit ?? 500;
    const out: ItemHistory[] = [];
    let nextPageToken: string | undefined;
    do {
      const res: SearchResponse & { issues: (JiraIssue & { changelog?: { histories: { created: string; items: { field: string; fromString?: string | null; toString?: string | null }[] }[] } })[] } = await this.http.request("POST", `${this.base}/rest/api/3/search/jql`, {
        jql: opts.query ?? this.cfg.jql,
        fields: ["summary", "status", "created"],
        expand: "changelog",
        maxResults: Math.min(100, limit - out.length),
        ...(nextPageToken ? { nextPageToken } : {}),
      });
      for (const issue of res.issues) {
        const moves = (issue.changelog?.histories ?? [])
          .flatMap((h) => h.items.filter((i) => i.field === "status").map((i) => ({ at: h.created, from: i.fromString ?? "", to: i.toString ?? "" })))
          .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
        const initial = moves[0]?.from || (issue.fields.status as unknown as { name?: string }).name || "";
        out.push({
          itemId: issue.key,
          title: issue.fields.summary,
          changes: [...(initial ? [{ status: initial, at: new Date(issue.fields.created).toISOString() }] : []), ...moves.map((m) => ({ status: m.to, at: new Date(m.at).toISOString() }))],
        });
      }
      nextPageToken = out.length < limit && (res.isLast === false || (res.isLast === undefined && res.nextPageToken)) ? res.nextPageToken : undefined;
    } while (nextPageToken);
    return out;
  }

  toItem(issue: JiraIssue): WorkItem | undefined {
    const f = issue.fields;
    const type = f.issuetype.name;
    const level = this.cfg.mapping.levels[type];
    if (!level) return undefined;
    const status = STATUS[f.status.statusCategory.key] ?? "todo";
    const num = (id?: string) => (id && typeof f[id] === "number" ? (f[id] as number) : undefined);
    const estimate = num(this.cfg.fields.storyPoints);
    const businessValue = num(this.cfg.fields.businessValue);
    // The sprint field is an array of every sprint the issue has been in; the last open or active one is current.
    const sprints = this.cfg.fields.sprint ? ((f[this.cfg.fields.sprint] as { id: number; state: string }[] | null) ?? []) : [];
    const sprint = [...sprints].reverse().find((s) => s.state !== "closed") ?? sprints[sprints.length - 1];
    const iterationId = sprint ? this.cfg.mapping.iterations?.[String(sprint.id)] : undefined;
    const teamId = this.cfg.mapping.projectTeams[f.project.key];
    // Jira has no "started" timestamp; the status category change date is the closest signal.
    const startedAt = status !== "todo" ? f.statuscategorychangedate : undefined;
    return {
      id: itemId("jira", issue.key),
      title: f.summary,
      level,
      ...(f.parent ? { parentId: itemId("jira", f.parent.key) } : {}),
      ...(teamId ? { teamId } : {}),
      ...(iterationId ? { iterationId } : {}),
      status,
      flowType: this.cfg.mapping.flowTypes?.[type] ?? defaultFlowType(type),
      ...(estimate !== undefined ? { estimate } : {}),
      ...(businessValue !== undefined ? { businessValue } : {}),
      createdAt: new Date(f.created).toISOString(),
      ...(startedAt && status === "in_progress" ? { startedAt: new Date(startedAt).toISOString() } : {}),
      ...(status === "done" && f.resolutiondate ? { doneAt: new Date(f.resolutiondate).toISOString() } : {}),
      source: { system: "jira", externalId: issue.key, url: `${this.base}/browse/${issue.key}`, updatedAt: new Date(f.updated).toISOString() },
    };
  }

  async push(change: PushChange): Promise<void> {
    if (change.kind === "link") {
      const provider = { key: change.provider.source.externalId };
      const consumer = { key: change.consumer.source.externalId };
      const inward = (this.cfg.providerSide ?? "inward") === "inward";
      await this.http.request("POST", `${this.base}/rest/api/3/issueLink`, {
        type: { name: "Blocks" },
        inwardIssue: inward ? provider : consumer,
        outwardIssue: inward ? consumer : provider,
      });
      return;
    }
    const { item, fields } = change;
    const key = item.source.externalId;
    const body: Record<string, unknown> = {};
    if (fields.includes("title")) body.summary = item.title;
    if (fields.includes("estimate") && this.cfg.fields.storyPoints) body[this.cfg.fields.storyPoints] = item.estimate ?? null;
    if (fields.includes("businessValue") && this.cfg.fields.businessValue) body[this.cfg.fields.businessValue] = item.businessValue ?? null;
    if (Object.keys(body).length) await this.http.request("PUT", `${this.base}/rest/api/3/issue/${encodeURIComponent(key)}`, { fields: body });

    if (fields.includes("iterationId")) {
      const sprintId = item.iterationId ? invert(this.cfg.mapping.iterations)[item.iterationId] : undefined;
      if (sprintId) await this.http.request("POST", `${this.base}/rest/agile/1.0/sprint/${sprintId}/issue`, { issues: [key] });
      else await this.http.request("POST", `${this.base}/rest/agile/1.0/backlog/issue`, { issues: [key] });
    }
  }
}
