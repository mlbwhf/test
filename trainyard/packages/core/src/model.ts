// Domain types shared by every package. Nothing here knows about Jira, Azure DevOps or a
// specific scaling framework: frameworks are data (see frameworks.ts) and trackers are
// adapters (see @trainyard/connectors).

export type SourceSystem = "jira" | "ado" | "github" | "native";
export type StatusCategory = "todo" | "in_progress" | "done";
/** Flow item types, used for flow distribution. */
export type FlowType = "feature" | "enabler" | "defect" | "risk" | "debt";

export interface SourceRef {
  system: SourceSystem;
  /** Jira issue key, ADO work item id, GitHub issue node id. Empty for native items. */
  externalId: string;
  url?: string;
  /** Last update time reported by the tracker, ISO 8601. Drives sync conflict detection. */
  updatedAt?: string;
}

export interface WorkItem {
  id: string;
  title: string;
  /** Key of a work level in the operating model, e.g. "epic", "feature", "story". */
  level: string;
  parentId?: string;
  teamId?: string;
  iterationId?: string;
  status: StatusCategory;
  flowType: FlowType;
  estimate?: number;
  businessValue?: number;
  createdAt: string;
  startedAt?: string;
  doneAt?: string;
  source: SourceRef;
  /** Set when the item delivers part of an AI initiative (see @trainyard/ai-portfolio). */
  aiInitiativeId?: string;
}

export interface Person {
  id: string;
  name: string;
  roles: string[];
}

export interface Team {
  id: string;
  name: string;
  /** Id of the group (ART, requirement area, tribe...) this team belongs to. */
  groupId: string;
  source: SourceSystem;
  /** Planned capacity per iteration id, in the team's estimate unit. */
  capacity: Record<string, number>;
  memberIds: string[];
  /** AI agents working as part of the team (AI-native models). */
  agentIds: string[];
}

export interface Group {
  id: string;
  name: string;
  /** Key of a group level in the operating model, e.g. "train". */
  level: string;
  parentId?: string;
}

export interface Iteration {
  id: string;
  name: string;
  start: string;
  end: string;
  /** Innovation and planning iteration: no feature work is planned into it. */
  isIP?: boolean;
}

export interface Increment {
  id: string;
  name: string;
  start: string;
  end: string;
  iterations: Iteration[];
}

export interface Dependency {
  id: string;
  /** The item that delivers something. */
  providerId: string;
  /** The item that needs it. */
  consumerId: string;
  note?: string;
  status: "open" | "committed" | "resolved";
}

export type Roam = "unroamed" | "resolved" | "owned" | "accepted" | "mitigated";

export interface Risk {
  id: string;
  title: string;
  roam: Roam;
  ownerId?: string;
  groupId?: string;
  itemIds: string[];
  raisedAt: string;
}

export interface Objective {
  id: string;
  incrementId: string;
  teamId: string;
  title: string;
  /** Business value assigned at planning (1–10 in SAFe). */
  plannedValue: number;
  /** Business value achieved, scored at the end of the increment. */
  actualValue?: number;
  /** Uncommitted (stretch) objectives count toward actual value but not planned value. */
  committed: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  modelId: string;
  groups: Group[];
  teams: Team[];
  people: Person[];
  increments: Increment[];
  items: WorkItem[];
  dependencies: Dependency[];
  risks: Risk[];
  objectives: Objective[];
}
