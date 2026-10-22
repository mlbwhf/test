// Mural public API v1. Needs an OAuth access token with murals:read, workspaces:read and
// rooms:read. Areas become frames; sticky notes, text, shapes and titles become nodes;
// arrows become edges.

import { emptyBoard, type Board, type NodeKind } from "@trainyard/core";
import { requestJson, stripHtml, type FetchLike, type Importer, type RemoteBoard } from "./types.js";

interface Widget {
  id: string;
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  htmlText?: string;
  title?: string;
  parentId?: string;
  style?: { backgroundColor?: string };
  backgroundColor?: string;
  tags?: { text?: string; title?: string }[];
  arrowType?: string;
  startRefId?: string;
  endRefId?: string;
  stackingOrder?: number;
}

interface Page<T> {
  value: T[];
  next?: string;
}

const KIND: Record<string, NodeKind> = { "sticky note": "sticky", text: "text", title: "text", shape: "shape", image: "image", file: "other", table: "other", comment: "text" };

export class MuralImporter implements Importer {
  readonly system = "mural" as const;
  private readonly fetchFn: FetchLike;
  private readonly base: string;

  constructor(
    private readonly token: string,
    opts: { fetch?: FetchLike; baseUrl?: string } = {},
  ) {
    this.fetchFn = opts.fetch ?? fetch;
    this.base = (opts.baseUrl ?? "https://app.mural.co/api/public/v1").replace(/\/+$/, "");
  }

  private get<T>(path: string) {
    return requestJson<T>(this.fetchFn, `${this.base}${path}`, { headers: { Authorization: `Bearer ${this.token}`, Accept: "application/json" } }, "Mural");
  }

  private async all<T>(path: string): Promise<T[]> {
    const out: T[] = [];
    let next: string | undefined;
    do {
      const page: Page<T> = await this.get(`${path}${path.includes("?") ? "&" : "?"}limit=100${next ? `&next=${encodeURIComponent(next)}` : ""}`);
      out.push(...(page.value ?? []));
      next = page.next;
    } while (next);
    return out;
  }

  async whoami() {
    const me = await this.get<{ value?: { firstName?: string; lastName?: string; email?: string } }>("/users/me");
    const v = me.value ?? {};
    return { name: [v.firstName, v.lastName].filter(Boolean).join(" ") || v.email || "Mural user" };
  }

  async listBoards(): Promise<RemoteBoard[]> {
    const workspaces = await this.all<{ id: string; name: string }>("/workspaces");
    const out: RemoteBoard[] = [];
    for (const w of workspaces) {
      const murals = await this.all<{ id: string; title: string; _canvasLink?: string; updatedOn?: number }>(`/workspaces/${encodeURIComponent(w.id)}/murals`);
      for (const m of murals) out.push({ id: m.id, name: m.title, container: w.name, ...(m._canvasLink ? { url: m._canvasLink } : {}), ...(m.updatedOn ? { updatedAt: new Date(m.updatedOn).toISOString() } : {}) });
    }
    return out;
  }

  async fetchBoard(externalId: string): Promise<Board> {
    const meta = await this.get<{ value?: { title?: string; _canvasLink?: string } }>(`/murals/${encodeURIComponent(externalId)}`);
    const widgets = await this.all<Widget>(`/murals/${encodeURIComponent(externalId)}/widgets`);
    const title = meta.value?.title ?? `Mural ${externalId}`;
    const board = emptyBoard(`mural-${externalId}`, title, { system: "mural", externalId, importedAt: new Date().toISOString(), ...(meta.value?._canvasLink ? { url: meta.value._canvasLink } : {}) });
    for (const w of widgets) {
      if (w.type === "area") {
        board.frames.push({ id: w.id, title: stripHtml(w.title ?? w.text) || "Area", x: w.x ?? 0, y: w.y ?? 0, width: w.width ?? 0, height: w.height ?? 0, ...(w.parentId ? { parentId: w.parentId } : {}) });
      }
    }
    const frameIds = new Set(board.frames.map((f) => f.id));
    for (const w of widgets) {
      if (w.type === "area") continue;
      if (w.type === "arrow") {
        if (w.startRefId && w.endRefId) board.edges.push({ id: w.id, fromId: w.startRefId, toId: w.endRefId, ...(stripHtml(w.text) ? { label: stripHtml(w.text) } : {}) });
        continue;
      }
      const color = w.style?.backgroundColor ?? w.backgroundColor;
      board.nodes.push({
        id: w.id,
        kind: KIND[w.type] ?? "other",
        text: stripHtml(w.htmlText ?? w.text ?? w.title),
        x: w.x ?? 0,
        y: w.y ?? 0,
        ...(w.width !== undefined ? { width: w.width } : {}),
        ...(w.height !== undefined ? { height: w.height } : {}),
        ...(color ? { color } : {}),
        ...(w.parentId && frameIds.has(w.parentId) ? { frameId: w.parentId } : {}),
        tags: (w.tags ?? []).map((t) => t.text ?? t.title ?? "").filter(Boolean),
        fields: { muralType: w.type },
      });
    }
    return board;
  }
}
