// monday.com GraphQL API v2 with a personal API token. Boards become table boards: columns
// as columns, groups as groups, items as rows with the displayed text of every column cell
// (and the raw JSON value kept under "<column>:raw" so nothing is lost).

import { emptyBoard, type Board } from "@trainyard/core";
import { requestJson, type FetchLike, type Importer, type RemoteBoard } from "./types.js";

interface MondayBoard {
  id: string;
  name: string;
  url?: string;
  updated_at?: string;
  workspace?: { name?: string } | null;
  columns?: { id: string; title: string; type: string }[];
  groups?: { id: string; title: string; color?: string }[];
  items_page?: { cursor?: string | null; items: MondayItem[] };
}

interface MondayItem {
  id: string;
  name: string;
  group?: { id: string } | null;
  column_values?: { id: string; text?: string | null; value?: string | null }[];
}

export class MondayImporter implements Importer {
  readonly system = "monday" as const;
  private readonly fetchFn: FetchLike;
  private readonly url: string;

  constructor(
    private readonly token: string,
    opts: { fetch?: FetchLike; url?: string } = {},
  ) {
    this.fetchFn = opts.fetch ?? fetch;
    this.url = opts.url ?? "https://api.monday.com/v2";
  }

  private async query<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await requestJson<{ data?: T; errors?: { message: string }[]; error_message?: string }>(
      this.fetchFn,
      this.url,
      { method: "POST", headers: { Authorization: this.token, "Content-Type": "application/json", "API-Version": "2024-10" }, body: JSON.stringify({ query, variables }) },
      "monday.com",
    );
    if (res.errors?.length || res.error_message) throw new Error(`monday.com: ${res.errors?.map((e) => e.message).join("; ") ?? res.error_message}`);
    return res.data as T;
  }

  async whoami() {
    const d = await this.query<{ me: { name: string; email?: string; account?: { name?: string } } }>("{ me { name email account { name } } }");
    return { name: d.me.name, ...(d.me.account?.name ? { detail: d.me.account.name } : {}) };
  }

  async listBoards(): Promise<RemoteBoard[]> {
    const d = await this.query<{ boards: MondayBoard[] }>("{ boards(limit: 200, order_by: used_at, state: active) { id name url updated_at workspace { name } } }");
    return d.boards.map((b) => ({ id: b.id, name: b.name, ...(b.url ? { url: b.url } : {}), ...(b.workspace?.name ? { container: b.workspace.name } : {}), ...(b.updated_at ? { updatedAt: b.updated_at } : {}) }));
  }

  async fetchBoard(externalId: string): Promise<Board> {
    const first = await this.query<{ boards: MondayBoard[] }>(
      `query ($id: [ID!]) { boards(ids: $id) { id name url workspace { name } columns { id title type } groups { id title color }
         items_page(limit: 500) { cursor items { id name group { id } column_values { id text value } } } } }`,
      { id: [externalId] },
    );
    const b = first.boards[0];
    if (!b) throw new Error(`monday.com board ${externalId} not found or not visible to this token`);
    const items: MondayItem[] = [...(b.items_page?.items ?? [])];
    let cursor = b.items_page?.cursor ?? null;
    while (cursor) {
      const next = await this.query<{ next_items_page: { cursor?: string | null; items: MondayItem[] } }>(`query ($cursor: String!) { next_items_page(limit: 500, cursor: $cursor) { cursor items { id name group { id } column_values { id text value } } } }`, { cursor });
      items.push(...next.next_items_page.items);
      cursor = next.next_items_page.cursor ?? null;
    }
    const board = emptyBoard(`monday-${externalId}`, b.name, { system: "monday", externalId, importedAt: new Date().toISOString(), ...(b.url ? { url: b.url } : {}) });
    board.columns = [{ id: "name", title: "Item", type: "name" }, ...(b.columns ?? []).filter((c) => c.id !== "name").map((c) => ({ id: c.id, title: c.title, type: c.type }))];
    board.groups = (b.groups ?? []).map((g) => ({ id: g.id, title: g.title, ...(g.color ? { color: g.color } : {}) }));
    board.rows = items.map((it) => {
      const cells: Record<string, unknown> = { name: it.name };
      for (const cv of it.column_values ?? []) {
        cells[cv.id] = cv.text ?? "";
        if (cv.value) {
          try {
            cells[`${cv.id}:raw`] = JSON.parse(cv.value);
          } catch {
            cells[`${cv.id}:raw`] = cv.value;
          }
        }
      }
      return { id: it.id, ...(it.group?.id ? { groupId: it.group.id } : {}), cells };
    });
    return board;
  }
}
