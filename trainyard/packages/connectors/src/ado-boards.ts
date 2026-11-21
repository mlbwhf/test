// Azure DevOps for the Kanban and team boards: the calls a board needs to show work items as its
// cards and write a card's changes back (title, state, size, value, iteration, kind). Azure
// DevOps Services only (dev.azure.com), with a personal access token that has Work Items
// (Read & write).

import { TrackerHttp, basicAuth, type FetchLike } from "./http.js";

export interface AdoBoardsConfig {
  organization: string;
  project: string;
  pat: string;
  fetch?: FetchLike;
  sleep?: (ms: number) => Promise<void>;
}

export interface AdoState {
  name: string;
  /** Proposed, InProgress, Resolved, Completed or Removed. */
  category: string;
}

export interface AdoIteration {
  /** As System.IterationPath has it: "Project\PI 1\Iteration 1". */
  path: string;
  name: string;
  start?: string;
  finish?: string;
}

export interface AdoCard {
  id: number;
  rev: number;
  title: string;
  type: string;
  state: string;
  iterationPath?: string;
  storyPoints?: number;
  effort?: number;
  businessValue?: number;
  timeCriticality?: number;
  /** "Business" or "Architectural" (an enabler). */
  valueArea?: string;
  tags: string[];
  url: string;
}

/** A card's fields as Azure DevOps names them; `undefined` clears the field. */
export type AdoFields = Partial<{
  title: string;
  state: string;
  iterationPath: string;
  storyPoints: number | undefined;
  effort: number | undefined;
  businessValue: number | undefined;
  timeCriticality: number | undefined;
  valueArea: string;
  tags: string[];
}>;

const API = "api-version=7.1";
const NAME: Record<keyof AdoFields, string> = {
  title: "System.Title",
  state: "System.State",
  iterationPath: "System.IterationPath",
  storyPoints: "Microsoft.VSTS.Scheduling.StoryPoints",
  effort: "Microsoft.VSTS.Scheduling.Effort",
  businessValue: "Microsoft.VSTS.Common.BusinessValue",
  timeCriticality: "Microsoft.VSTS.Common.TimeCriticality",
  valueArea: "Microsoft.VSTS.Common.ValueArea",
  tags: "System.Tags",
};
const FIELDS = ["System.Id", "System.WorkItemType", ...Object.values(NAME)];
/** Organization and project names as Azure DevOps allows them, so a name never changes a URL's structure. */
export const ADO_NAME = /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,63}$/;

interface Raw {
  id: number;
  rev: number;
  fields: Record<string, unknown>;
}
interface Node {
  name: string;
  attributes?: { startDate?: string; finishDate?: string };
  children?: Node[];
}

export class AdoBoardsClient {
  private readonly http: TrackerHttp;
  private readonly org: string;
  private readonly root: string;

  constructor(private readonly cfg: AdoBoardsConfig) {
    if (!ADO_NAME.test(cfg.organization) || !ADO_NAME.test(cfg.project)) throw new Error("The organization or project name is not one Azure DevOps allows.");
    this.http = new TrackerHttp({ authorization: basicAuth("", cfg.pat), ...(cfg.fetch ? { fetch: cfg.fetch } : {}), ...(cfg.sleep ? { sleep: cfg.sleep } : {}) });
    this.org = "https://dev.azure.com/" + encodeURIComponent(cfg.organization);
    this.root = this.org + "/" + encodeURIComponent(cfg.project);
  }

  /** The project, as a check that the organization, project and token work together. */
  async project(): Promise<{ id: string; name: string }> {
    const p: { id: string; name: string } = await this.http.request("GET", `${this.org}/_apis/projects/${encodeURIComponent(this.cfg.project)}?${API}`);
    return { id: p.id, name: p.name };
  }

  async types(): Promise<string[]> {
    const r: { value: { name: string; isDisabled?: boolean }[] } = await this.http.request("GET", `${this.root}/_apis/wit/workitemtypes?${API}`);
    return r.value.filter((t) => !t.isDisabled).map((t) => t.name);
  }

  async states(type: string): Promise<AdoState[]> {
    const r: { value: AdoState[] } = await this.http.request("GET", `${this.root}/_apis/wit/workitemtypes/${encodeURIComponent(type)}/states?${API}`);
    return r.value.map((s) => ({ name: s.name, category: s.category }));
  }

  /** Every iteration of the project, in tree order. */
  async iterations(): Promise<AdoIteration[]> {
    const depth = "$depth=6";
    const top: Node = await this.http.request("GET", `${this.root}/_apis/wit/classificationnodes/iterations?${depth}&${API}`);
    const out: AdoIteration[] = [];
    const walk = (n: Node, path: string) => {
      for (const c of n.children ?? []) {
        const p = path + "\\" + c.name;
        out.push({ path: p, name: c.name, ...(c.attributes?.startDate ? { start: c.attributes.startDate } : {}), ...(c.attributes?.finishDate ? { finish: c.attributes.finishDate } : {}) });
        walk(c, p);
      }
    };
    walk(top, top.name);
    return out;
  }

  /** The work items of one type, optionally under an area path; removed ones are left out. */
  async cards(type: string, areaPath?: string): Promise<AdoCard[]> {
    const q = (s: string) => s.replace(/'/g, "''");
    const area = areaPath ? ` AND [System.AreaPath] UNDER '${q(areaPath)}'` : "";
    const query = `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${q(this.cfg.project)}' AND [System.WorkItemType] = '${q(type)}' AND [System.State] <> 'Removed'${area} ORDER BY [System.Id]`;
    const top = "$top=1000";
    const wiql: { workItems: { id: number }[] } = await this.http.request("POST", `${this.root}/_apis/wit/wiql?${top}&${API}`, { query });
    const ids = wiql.workItems.map((w) => w.id);
    const out: AdoCard[] = [];
    for (let i = 0; i < ids.length; i += 200) {
      const r: { value: Raw[] } = await this.http.request("POST", `${this.root}/_apis/wit/workitemsbatch?${API}`, { ids: ids.slice(i, i + 200), fields: FIELDS });
      out.push(...r.value.map((w) => this.card(w)));
    }
    return out;
  }

  async create(type: string, fields: AdoFields, areaPath?: string): Promise<AdoCard> {
    const ops = [...this.ops(fields), ...(areaPath ? [{ op: "add", path: "/fields/System.AreaPath", value: areaPath }] : [])];
    const url = this.root + "/_apis/wit/workitems/" + encodeURIComponent("$" + type) + "?" + API;
    return this.card(await this.http.request("POST", url, ops, "application/json-patch+json"));
  }

  async update(id: number, fields: AdoFields): Promise<AdoCard> {
    return this.card(await this.http.request("PATCH", `${this.root}/_apis/wit/workitems/${id}?${API}`, this.ops(fields), "application/json-patch+json"));
  }

  private ops(fields: AdoFields) {
    return (Object.keys(fields) as (keyof AdoFields)[]).map((k) => {
      const v = fields[k];
      return v === undefined ? { op: "remove", path: `/fields/${NAME[k]}` } : { op: "add", path: `/fields/${NAME[k]}`, value: Array.isArray(v) ? v.join("; ") : v };
    });
  }

  private card(w: Raw): AdoCard {
    const f = w.fields;
    const str = (k: string) => (typeof f[k] === "string" ? (f[k] as string) : undefined);
    const num = (k: string) => (typeof f[k] === "number" ? (f[k] as number) : undefined);
    const card: AdoCard = {
      id: w.id,
      rev: w.rev,
      title: str(NAME.title) ?? `#${w.id}`,
      type: str("System.WorkItemType") ?? "",
      state: str(NAME.state) ?? "",
      tags: (str(NAME.tags) ?? "").split(";").map((t) => t.trim()).filter(Boolean),
      url: `${this.root}/_workitems/edit/${w.id}`,
    };
    const iterationPath = str(NAME.iterationPath), storyPoints = num(NAME.storyPoints), effort = num(NAME.effort), businessValue = num(NAME.businessValue), timeCriticality = num(NAME.timeCriticality), valueArea = str(NAME.valueArea);
    if (iterationPath !== undefined) card.iterationPath = iterationPath;
    if (storyPoints !== undefined) card.storyPoints = storyPoints;
    if (effort !== undefined) card.effort = effort;
    if (businessValue !== undefined) card.businessValue = businessValue;
    if (timeCriticality !== undefined) card.timeCriticality = timeCriticality;
    if (valueArea !== undefined) card.valueArea = valueArea;
    return card;
  }
}
