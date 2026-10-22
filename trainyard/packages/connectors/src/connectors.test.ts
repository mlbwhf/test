import { describe, expect, it } from "vitest";
import type { WorkItem } from "@trainyard/core";
import { AdoConnector, JiraConnector, TrackerHttpError, planSync, resolveConflict, type FetchLike } from "./index.js";

interface Call {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

function fakeFetch(responses: { status?: number; body?: unknown; headers?: Record<string, string> }[]) {
  const calls: Call[] = [];
  const fetch: FetchLike = async (url, init) => {
    calls.push({ method: init.method, url, headers: init.headers, ...(init.body ? { body: JSON.parse(init.body) } : {}) });
    const r = responses.shift() ?? { status: 204 };
    const status = r.status ?? 200;
    return {
      ok: status < 300,
      status,
      headers: { get: (n: string) => r.headers?.[n] ?? null },
      text: async () => (r.body === undefined ? "" : JSON.stringify(r.body)),
    };
  };
  return { fetch, calls };
}

const noSleep = async () => {};

const jiraIssue = (key: string, over: Record<string, unknown> = {}) => ({
  id: key,
  key,
  fields: {
    summary: `Issue ${key}`,
    issuetype: { name: "Story" },
    status: { statusCategory: { key: "indeterminate" } },
    project: { key: key.split("-")[0] },
    parent: { key: "CHK-1" },
    created: "2026-10-01T09:00:00.000+0000",
    updated: "2026-10-20T09:00:00.000+0000",
    resolutiondate: null,
    statuscategorychangedate: "2026-10-05T09:00:00.000+0000",
    customfield_10016: 5,
    customfield_10020: [
      { id: 41, state: "closed" },
      { id: 42, state: "active" },
    ],
    ...over,
  },
});

function jira(fetch: FetchLike) {
  return new JiraConnector({
    baseUrl: "https://northwind.atlassian.net/",
    email: "bot@northwind.example",
    apiToken: "tok",
    jql: "project = CHK",
    mapping: { levels: { Story: "story", Bug: "story", Feature: "feature" }, projectTeams: { CHK: "t-checkout" }, iterations: { "42": "pi-26-4.3", "43": "pi-26-4.4" } },
    fields: { storyPoints: "customfield_10016", sprint: "customfield_10020" },
    fetch,
    sleep: noSleep,
  });
}

describe("Jira connector", () => {
  it("pages through the enhanced JQL search and normalises issues", async () => {
    const { fetch, calls } = fakeFetch([
      { body: { issues: [jiraIssue("CHK-7"), jiraIssue("CHK-8", { issuetype: { name: "Epic" } })], nextPageToken: "p2", isLast: false } },
      { body: { issues: [jiraIssue("CHK-9", { issuetype: { name: "Bug" }, status: { statusCategory: { key: "done" } }, resolutiondate: "2026-10-09T10:00:00.000+0000" })], isLast: true } },
    ]);
    const items = await jira(fetch).pull();
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({ method: "POST", url: "https://northwind.atlassian.net/rest/api/3/search/jql" });
    expect(calls[0]!.headers.Authorization).toBe(`Basic ${Buffer.from("bot@northwind.example:tok").toString("base64")}`);
    expect(calls[1]!.body).toMatchObject({ nextPageToken: "p2", jql: "project = CHK" });
    expect(items.map((i) => i.id)).toEqual(["jira:CHK-7", "jira:CHK-9"]);
    expect(items[0]).toMatchObject({ level: "story", teamId: "t-checkout", iterationId: "pi-26-4.3", status: "in_progress", estimate: 5, parentId: "jira:CHK-1", startedAt: "2026-10-05T09:00:00.000Z" });
    expect(items[1]).toMatchObject({ status: "done", flowType: "defect", doneAt: "2026-10-09T10:00:00.000Z" });
    expect(items[0]!.source).toEqual({ system: "jira", externalId: "CHK-7", url: "https://northwind.atlassian.net/browse/CHK-7", updatedAt: "2026-10-20T09:00:00.000Z" });
  });

  it("pushes fields, sprint moves and links", async () => {
    const { fetch, calls } = fakeFetch([]);
    const c = jira(fetch);
    const item = { ...(await Promise.resolve(c.toItem(jiraIssue("CHK-7"))!)), iterationId: "pi-26-4.4", estimate: 8, title: "Renamed" };
    await c.push({ kind: "update", item, fields: ["title", "estimate", "iterationId"] });
    expect(calls[0]).toMatchObject({ method: "PUT", url: "https://northwind.atlassian.net/rest/api/3/issue/CHK-7", body: { fields: { summary: "Renamed", customfield_10016: 8 } } });
    expect(calls[1]).toMatchObject({ method: "POST", url: "https://northwind.atlassian.net/rest/agile/1.0/sprint/43/issue", body: { issues: ["CHK-7"] } });
    await c.push({ kind: "update", item: { ...item, iterationId: "unmapped" }, fields: ["iterationId"] });
    expect(calls[2]!.url).toBe("https://northwind.atlassian.net/rest/agile/1.0/backlog/issue");
    const other = c.toItem(jiraIssue("CHK-8"))!;
    await c.push({ kind: "link", provider: item, consumer: other });
    expect(calls[3]!.body).toEqual({ type: { name: "Blocks" }, inwardIssue: { key: "CHK-7" }, outwardIssue: { key: "CHK-8" } });
  });

  it("retries on 429 using Retry-After and gives up on 4xx", async () => {
    const waits: number[] = [];
    const { fetch, calls } = fakeFetch([{ status: 429, headers: { "Retry-After": "2" } }, { body: { issues: [], isLast: true } }, { status: 400, body: { errorMessages: ["bad jql"] } }]);
    const c = new JiraConnector({ baseUrl: "https://x.atlassian.net", email: "e", apiToken: "t", jql: "x", mapping: { levels: {}, projectTeams: {} }, fields: {}, fetch, sleep: async (ms) => void waits.push(ms) });
    expect(await c.pull()).toEqual([]);
    expect(waits).toEqual([2000]);
    await expect(c.pull()).rejects.toBeInstanceOf(TrackerHttpError);
    expect(calls).toHaveLength(3);
  });
});

function ado(fetch: FetchLike) {
  return new AdoConnector({
    organization: "northwind",
    project: "Customer",
    pat: "pat",
    where: "[System.AreaPath] UNDER 'Customer'",
    mapping: {
      levels: { "User Story": "story", Feature: "feature", Bug: "story" },
      areaTeams: { Customer: "t-unknown", "Customer\\Payments": "t-payments" },
      iterations: { "Customer\\PI 26.4\\It 3": "pi-26-4.3" },
    },
    fetch,
    sleep: noSleep,
  });
}

const adoItem = (id: number, fields: Record<string, unknown> = {}) => ({
  id,
  rev: 3,
  fields: {
    "System.Id": id,
    "System.Title": `Item ${id}`,
    "System.WorkItemType": "User Story",
    "System.State": "Active",
    "System.AreaPath": "Customer\\Payments\\Wallet",
    "System.IterationPath": "Customer\\PI 26.4\\It 3",
    "System.Parent": 4100,
    "System.CreatedDate": "2026-10-01T09:00:00Z",
    "System.ChangedDate": "2026-10-20T09:00:00Z",
    "Microsoft.VSTS.Common.ActivatedDate": "2026-10-06T09:00:00Z",
    "Microsoft.VSTS.Scheduling.StoryPoints": 3,
    ...fields,
  },
});

describe("Azure DevOps connector", () => {
  it("queries WIQL then batches fields 200 at a time", async () => {
    const ids = Array.from({ length: 250 }, (_, i) => ({ id: 5000 + i }));
    const { fetch, calls } = fakeFetch([
      { body: { workItems: ids } },
      { body: { value: [adoItem(5000), adoItem(5001, { "System.State": "Removed" })] } },
      { body: { value: [adoItem(5200, { "System.WorkItemType": "Bug", "System.State": "Closed", "Microsoft.VSTS.Common.ClosedDate": "2026-10-10T09:00:00Z", "System.AreaPath": "Customer" })] } },
    ]);
    const items = await ado(fetch).pull();
    expect(calls[0]!.url).toBe("https://dev.azure.com/northwind/Customer/_apis/wit/wiql?api-version=7.1");
    expect((calls[0]!.body as { query: string }).query).toContain("[System.WorkItemType] IN ('User Story', 'Feature', 'Bug')");
    expect(calls[0]!.headers.Authorization).toBe(`Basic ${Buffer.from(":pat").toString("base64")}`);
    expect((calls[1]!.body as { ids: number[] }).ids).toHaveLength(200);
    expect((calls[2]!.body as { ids: number[] }).ids).toHaveLength(50);
    expect(items.map((i) => i.id)).toEqual(["ado:5000", "ado:5200"]);
    expect(items[0]).toMatchObject({ teamId: "t-payments", iterationId: "pi-26-4.3", status: "in_progress", parentId: "ado:4100", estimate: 3, startedAt: "2026-10-06T09:00:00.000Z" });
    expect(items[1]).toMatchObject({ teamId: "t-unknown", status: "done", flowType: "defect", doneAt: "2026-10-10T09:00:00.000Z" });
    expect(items[1]!.iterationId).toBe("pi-26-4.3");
  });

  it("writes JSON Patch for fields and successor links", async () => {
    const { fetch, calls } = fakeFetch([]);
    const c = ado(fetch);
    const item = c.toItem(adoItem(5000))!;
    await c.push({ kind: "update", item: { ...item, estimate: undefined as unknown as number, iterationId: "nope" }, fields: ["estimate", "iterationId"] });
    expect(calls[0]).toMatchObject({ method: "PATCH", url: "https://dev.azure.com/northwind/Customer/_apis/wit/workitems/5000?api-version=7.1" });
    expect(calls[0]!.headers["Content-Type"]).toBe("application/json-patch+json");
    expect(calls[0]!.body).toEqual([
      { op: "remove", path: "/fields/Microsoft.VSTS.Scheduling.StoryPoints" },
      { op: "add", path: "/fields/System.IterationPath", value: "Customer" },
    ]);
    await c.push({ kind: "link", provider: item, consumer: c.toItem(adoItem(5001))! });
    expect(calls[1]!.body).toEqual([{ op: "add", path: "/relations/-", value: { rel: "System.LinkTypes.Dependency-Forward", url: "https://dev.azure.com/northwind/Customer/_apis/wit/workItems/5001" } }]);
  });
});

describe("sync planning", () => {
  const base: WorkItem = {
    id: "jira:CHK-7",
    title: "Guest checkout",
    level: "feature",
    teamId: "t-checkout",
    iterationId: "pi-26-4.2",
    status: "todo",
    flowType: "feature",
    estimate: 8,
    createdAt: "2026-10-01T00:00:00.000Z",
    source: { system: "jira", externalId: "CHK-7", updatedAt: "2026-10-10T00:00:00.000Z" },
    aiInitiativeId: "ai-x",
  };

  it("adds new items, pulls remote changes and keeps local-only fields", () => {
    const remote = { ...base, status: "in_progress" as const, source: { ...base.source, updatedAt: "2026-10-12T00:00:00.000Z" } };
    delete (remote as Partial<WorkItem>).aiInitiativeId;
    const fresh = { ...base, id: "jira:CHK-9", source: { ...base.source, externalId: "CHK-9" } };
    const plan = planSync([base, { ...base, id: "jira:CHK-1" }], [remote, fresh], []);
    expect(plan.added).toEqual(["jira:CHK-9"]);
    expect(plan.updated).toEqual(["jira:CHK-7"]);
    expect(plan.missing).toEqual(["jira:CHK-1"]);
    expect(plan.items.find((i) => i.id === "jira:CHK-7")).toMatchObject({ status: "in_progress", aiInitiativeId: "ai-x" });
    expect(plan.push).toEqual([]);
  });

  it("pushes local edits when the tracker has not changed", () => {
    const local = { ...base, iterationId: "pi-26-4.3" };
    const plan = planSync([local], [base], [{ itemId: base.id, fields: ["iterationId"], at: "2026-10-11T00:00:00.000Z" }]);
    expect(plan.conflicts).toEqual([]);
    expect(plan.push).toEqual([{ kind: "update", item: local, fields: ["iterationId"] }]);
  });

  it("raises a conflict when both sides changed the same field", () => {
    const local = { ...base, iterationId: "pi-26-4.3", estimate: 13 };
    const remote = { ...base, iterationId: "pi-26-4.4", title: "Guest checkout v2", source: { ...base.source, updatedAt: "2026-10-12T00:00:00.000Z" } };
    const plan = planSync([local], [remote], [{ itemId: base.id, fields: ["iterationId", "estimate"], at: "t", base: { iterationId: "pi-26-4.2", estimate: 8 } }]);
    expect(plan.conflicts).toEqual([{ itemId: base.id, field: "iterationId", local: "pi-26-4.3", remote: "pi-26-4.4" }]);
    expect(plan.push).toHaveLength(1);
    expect(plan.push[0]).toMatchObject({ fields: ["estimate"] });
    const stored = plan.items[0]!;
    expect(stored).toMatchObject({ title: "Guest checkout v2", iterationId: "pi-26-4.3", estimate: 13 });
    expect(resolveConflict(stored, plan.conflicts[0]!, "remote").item.iterationId).toBe("pi-26-4.4");
    expect(resolveConflict(stored, plan.conflicts[0]!, "local").push).toMatchObject({ fields: ["iterationId"] });
  });

  it("treats every pending field as a conflict when no base value was recorded", () => {
    const remote = { ...base, source: { ...base.source, updatedAt: "2026-10-12T00:00:00.000Z" } };
    const plan = planSync([{ ...base, estimate: 13 }], [remote], [{ itemId: base.id, fields: ["estimate"], at: "t" }]);
    expect(plan.conflicts.map((c) => c.field)).toEqual(["estimate"]);
  });
});

describe("status history for value stream maps", () => {
  it("reads Jira changelogs into ordered status changes", async () => {
    const { fetch, calls } = fakeFetch([
      {
        body: {
          isLast: true,
          issues: [
            {
              key: "CHK-1",
              fields: { summary: "Guest checkout", status: { name: "Done" }, created: "2026-01-05T08:00:00.000Z" },
              changelog: {
                histories: [
                  { created: "2026-01-05T12:00:00.000Z", items: [{ field: "status", fromString: "In dev", toString: "Ready for test" }] },
                  { created: "2026-01-05T10:00:00.000Z", items: [{ field: "status", fromString: "Ready for dev", toString: "In dev" }, { field: "assignee", fromString: null, toString: "x" }] },
                ],
              },
            },
          ],
        },
      },
    ]);
    const hist = await jira(fetch).statusHistory({ query: "project = CHK", limit: 50 });
    expect(hist).toEqual([{ itemId: "CHK-1", title: "Guest checkout", changes: [{ status: "Ready for dev", at: "2026-01-05T08:00:00.000Z" }, { status: "In dev", at: "2026-01-05T10:00:00.000Z" }, { status: "Ready for test", at: "2026-01-05T12:00:00.000Z" }] }]);
    expect(calls[0]!.body).toMatchObject({ jql: "project = CHK", expand: "changelog", maxResults: 50 });
  });
});
