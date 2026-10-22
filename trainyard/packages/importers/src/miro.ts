// Miro REST API v2. Needs an access token with boards:read (a Developer-team app's token
// works on the free plan). Frames become frames, sticky notes / cards / text / shapes
// become nodes placed relative to the board, connectors become edges.

import { emptyBoard, type Board, type BoardNode, type Frame, type NodeKind } from "@trainyard/core";
import { ImportError, requestJson, stripHtml, type FetchLike, type Importer, type RemoteBoard } from "./types.js";

interface MiroItem {
  id: string;
  type: string;
  data?: { content?: string; title?: string; description?: string; shape?: string; format?: string; title_text?: string };
  style?: { fillColor?: string; color?: string };
  position?: { x: number; y: number; origin?: string; relativeTo?: string };
  geometry?: { width?: number; height?: number };
  parent?: { id: string } | null;
  createdAt?: string;
  modifiedAt?: string;
}

interface Page<T> {
  data: T[];
  cursor?: string;
}

const KIND: Record<string, NodeKind> = { sticky_note: "sticky", card: "card", app_card: "card", text: "text", shape: "shape", image: "image" };

export class MiroImporter implements Importer {
  readonly system = "miro" as const;
  private readonly fetchFn: FetchLike;
  private readonly base: string;

  constructor(
    private readonly token: string,
    opts: { fetch?: FetchLike; baseUrl?: string } = {},
  ) {
    this.fetchFn = opts.fetch ?? fetch;
    this.base = (opts.baseUrl ?? "https://api.miro.com").replace(/\/+$/, "");
  }

  private get<T>(path: string) {
    return requestJson<T>(this.fetchFn, `${this.base}${path}`, { headers: { Authorization: `Bearer ${this.token}`, Accept: "application/json" } }, "Miro");
  }

  private async all<T>(path: string): Promise<T[]> {
    const out: T[] = [];
    let cursor: string | undefined;
    do {
      const page: Page<T> = await this.get(`${path}${path.includes("?") ? "&" : "?"}limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
      out.push(...(page.data ?? []));
      cursor = page.cursor;
    } while (cursor);
    return out;
  }

  async whoami() {
    const me = await this.get<{ id: string; name?: string; email?: string }>("/v2/users/me").catch((): { id: string; name?: string; email?: string } => ({ id: "?" }));
    return { name: me.name ?? me.email ?? "Miro user" };
  }

  async listBoards(): Promise<RemoteBoard[]> {
    const boards = await this.all<{ id: string; name: string; viewLink?: string; modifiedAt?: string; team?: { name?: string } }>("/v2/boards?sort=last_modified");
    return boards.map((b) => ({ id: b.id, name: b.name, ...(b.viewLink ? { url: b.viewLink } : {}), ...(b.team?.name ? { container: b.team.name } : {}), ...(b.modifiedAt ? { updatedAt: b.modifiedAt } : {}) }));
  }

  async fetchBoard(externalId: string): Promise<Board> {
    const meta = await this.get<{ id: string; name: string; viewLink?: string }>(`/v2/boards/${encodeURIComponent(externalId)}`);
    const items = await this.all<MiroItem>(`/v2/boards/${encodeURIComponent(externalId)}/items`);
    const connectors = await this.all<{ id: string; startItem?: { id: string }; endItem?: { id: string }; captions?: { content?: string }[] }>(`/v2/boards/${encodeURIComponent(externalId)}/connectors`).catch((e: unknown) => {
      if (e instanceof ImportError && e.code === "NOT_FOUND") return [];
      throw e;
    });
    const board = emptyBoard(`miro-${externalId}`, meta.name, { system: "miro", externalId, importedAt: new Date().toISOString(), ...(meta.viewLink ? { url: meta.viewLink } : {}) });

    const frames: Frame[] = [];
    for (const it of items) {
      if (it.type !== "frame") continue;
      const w = it.geometry?.width ?? 0;
      const h = it.geometry?.height ?? 0;
      // Miro positions frames by their centre on the board.
      frames.push({ id: it.id, title: stripHtml(it.data?.title) || "Frame", x: (it.position?.x ?? 0) - w / 2, y: (it.position?.y ?? 0) - h / 2, width: w, height: h, ...(it.parent?.id ? { parentId: it.parent.id } : {}) });
    }
    const frameById = new Map(frames.map((f) => [f.id, f]));
    board.frames = frames;

    for (const it of items) {
      if (it.type === "frame") continue;
      const kind = KIND[it.type] ?? "other";
      const parent = it.parent?.id ? frameById.get(it.parent.id) : undefined;
      // Children are positioned relative to their parent frame's top-left; others to the board centre.
      const x = (it.position?.x ?? 0) + (parent ? parent.x : 0);
      const y = (it.position?.y ?? 0) + (parent ? parent.y : 0);
      const text = stripHtml(it.data?.content ?? it.data?.title ?? "");
      const node: BoardNode = {
        id: it.id,
        kind,
        text: it.data?.description && it.type === "card" ? `${text}\n${stripHtml(it.data.description)}`.trim() : text,
        x,
        y,
        ...(it.geometry?.width !== undefined ? { width: it.geometry.width } : {}),
        ...(it.geometry?.height !== undefined ? { height: it.geometry.height } : {}),
        ...(it.style?.fillColor ? { color: it.style.fillColor } : {}),
        ...(parent ? { frameId: parent.id } : {}),
        tags: [],
        fields: { miroType: it.type, ...(it.data?.shape ? { shape: it.data.shape } : {}), ...(it.modifiedAt ? { modifiedAt: it.modifiedAt } : {}) },
      };
      board.nodes.push(node);
    }
    for (const c of connectors) {
      if (!c.startItem?.id || !c.endItem?.id) continue;
      const label = stripHtml(c.captions?.[0]?.content);
      board.edges.push({ id: c.id, fromId: c.startItem.id, toId: c.endItem.id, ...(label ? { label } : {}) });
    }
    return board;
  }
}
