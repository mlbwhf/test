// An importer connects to one tool, lists what the user can bring in, and fetches one
// board as a Trainyard Board with nothing dropped that the Board model can hold. Anything
// else from the source lands in node.fields or row.cells verbatim.

import type { Board, BoardSource } from "@trainyard/core";

export interface RemoteBoard {
  id: string;
  name: string;
  url?: string;
  /** Workspace, team or project the board sits in, for listing. */
  container?: string;
  updatedAt?: string;
}

export interface Importer {
  readonly system: BoardSource;
  /** Check the credential; returns who it belongs to. */
  whoami(): Promise<{ name: string; detail?: string }>;
  listBoards(): Promise<RemoteBoard[]>;
  fetchBoard(externalId: string): Promise<Board>;
}

export type FetchLike = typeof fetch;

export class ImportError extends Error {
  constructor(
    readonly code: "AUTH" | "NOT_FOUND" | "RATE_LIMIT" | "UPSTREAM" | "UNSUPPORTED",
    message: string,
  ) {
    super(message);
    this.name = "ImportError";
  }
}

export async function requestJson<T>(fetchFn: FetchLike, url: string, init: RequestInit, tool: string, sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms))): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetchFn(url, init);
    } catch (e) {
      throw new ImportError("UPSTREAM", `Could not reach ${tool}: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (res.ok) {
      const text = await res.text();
      return (text ? JSON.parse(text) : {}) as T;
    }
    if (res.status === 401 || res.status === 403) throw new ImportError("AUTH", `${tool} rejected the token (${res.status}). Check it and the scopes it was granted.`);
    if (res.status === 404) throw new ImportError("NOT_FOUND", `${tool} has no such board, or the token cannot see it.`);
    if ((res.status === 429 || res.status >= 500) && attempt < 3) {
      const after = Number(res.headers.get("Retry-After"));
      await sleep(Number.isFinite(after) && after > 0 ? after * 1000 : 500 * 2 ** attempt);
      continue;
    }
    if (res.status === 429) throw new ImportError("RATE_LIMIT", `${tool} is rate limiting; try again in a minute.`);
    throw new ImportError("UPSTREAM", `${tool} answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

/** Flatten HTML the whiteboard tools store in sticky notes into plain text. */
export function stripHtml(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
