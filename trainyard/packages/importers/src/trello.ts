// Trello REST API with an API key and token (free plan). Lists become groups, cards become
// rows with name, description, labels, due date, members and the list they sit in.

import { emptyBoard, type Board } from "@trainyard/core";
import { requestJson, type FetchLike, type Importer, type RemoteBoard } from "./types.js";

interface TrelloCard {
  id: string;
  name: string;
  desc?: string;
  idList: string;
  due?: string | null;
  dueComplete?: boolean;
  closed?: boolean;
  labels?: { name?: string; color?: string }[];
  idMembers?: string[];
  shortUrl?: string;
  dateLastActivity?: string;
  customFieldItems?: unknown[];
}

export class TrelloImporter implements Importer {
  readonly system = "trello" as const;
  private readonly fetchFn: FetchLike;
  private readonly base: string;

  constructor(
    private readonly key: string,
    private readonly token: string,
    opts: { fetch?: FetchLike; baseUrl?: string } = {},
  ) {
    this.fetchFn = opts.fetch ?? fetch;
    this.base = (opts.baseUrl ?? "https://api.trello.com/1").replace(/\/+$/, "");
  }

  private get<T>(path: string, params: Record<string, string> = {}) {
    const q = new URLSearchParams({ ...params, key: this.key, token: this.token });
    return requestJson<T>(this.fetchFn, `${this.base}${path}?${q}`, { headers: { Accept: "application/json" } }, "Trello");
  }

  async whoami() {
    const me = await this.get<{ fullName?: string; username?: string }>("/members/me", { fields: "fullName,username" });
    return { name: me.fullName ?? me.username ?? "Trello user" };
  }

  async listBoards(): Promise<RemoteBoard[]> {
    const boards = await this.get<{ id: string; name: string; shortUrl?: string; dateLastActivity?: string; closed?: boolean; idOrganization?: string }[]>("/members/me/boards", { fields: "name,shortUrl,dateLastActivity,closed", filter: "open" });
    return boards.filter((b) => !b.closed).map((b) => ({ id: b.id, name: b.name, ...(b.shortUrl ? { url: b.shortUrl } : {}), ...(b.dateLastActivity ? { updatedAt: b.dateLastActivity } : {}) }));
  }

  async fetchBoard(externalId: string): Promise<Board> {
    const meta = await this.get<{ id: string; name: string; shortUrl?: string }>(`/boards/${encodeURIComponent(externalId)}`, { fields: "name,shortUrl" });
    const lists = await this.get<{ id: string; name: string; closed?: boolean }[]>(`/boards/${encodeURIComponent(externalId)}/lists`, { fields: "name,closed", filter: "open" });
    const cards = await this.get<TrelloCard[]>(`/boards/${encodeURIComponent(externalId)}/cards`, { fields: "name,desc,idList,due,dueComplete,closed,labels,idMembers,shortUrl,dateLastActivity", filter: "open" });
    const members = await this.get<{ id: string; fullName?: string; username?: string }[]>(`/boards/${encodeURIComponent(externalId)}/members`, { fields: "fullName,username" }).catch(() => []);
    const memberName = new Map(members.map((m) => [m.id, m.fullName ?? m.username ?? m.id]));
    const listTitle = new Map(lists.map((l) => [l.id, l.name]));

    const board = emptyBoard(`trello-${externalId}`, meta.name, { system: "trello", externalId, importedAt: new Date().toISOString(), ...(meta.shortUrl ? { url: meta.shortUrl } : {}) });
    board.columns = [
      { id: "name", title: "Card", type: "text" },
      { id: "list", title: "List", type: "status" },
      { id: "labels", title: "Labels", type: "tags" },
      { id: "members", title: "Members", type: "people" },
      { id: "due", title: "Due", type: "date" },
      { id: "desc", title: "Description", type: "long_text" },
    ];
    board.groups = lists.map((l) => ({ id: l.id, title: l.name }));
    board.rows = cards.map((c) => ({
      id: c.id,
      groupId: c.idList,
      cells: {
        name: c.name,
        list: listTitle.get(c.idList) ?? c.idList,
        labels: (c.labels ?? []).map((l) => l.name || l.color || "").filter(Boolean).join(", "),
        members: (c.idMembers ?? []).map((m) => memberName.get(m) ?? m).join(", "),
        due: c.due ?? "",
        dueComplete: c.dueComplete ?? false,
        desc: c.desc ?? "",
        url: c.shortUrl ?? "",
        labelColors: (c.labels ?? []).map((l) => l.color).filter(Boolean),
      },
    }));
    return board;
  }
}
