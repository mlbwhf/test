export * from "./types.js";
export * from "./miro.js";
export * from "./mural.js";
export * from "./monday.js";
export * from "./trello.js";
export * from "./files.js";

import type { BoardSource } from "@trainyard/core";
import { MiroImporter } from "./miro.js";
import { MondayImporter } from "./monday.js";
import { MuralImporter } from "./mural.js";
import { TrelloImporter } from "./trello.js";
import type { FetchLike, Importer } from "./types.js";

export type ConnectableSource = Extract<BoardSource, "miro" | "mural" | "monday" | "trello">;

/** What a user must paste to connect each tool, for the UI and validation. */
export const CONNECTION_FIELDS: Record<ConnectableSource, { label: string; fields: { key: "token" | "apiKey"; label: string; help: string }[]; docs: string }> = {
  miro: { label: "Miro", fields: [{ key: "token", label: "Access token", help: "Miro > Profile settings > Your apps > create an app with boards:read, install it to your team, copy the token." }], docs: "https://developers.miro.com/docs/getting-started-with-oauth" },
  mural: { label: "Mural", fields: [{ key: "token", label: "OAuth access token", help: "Register an app at developers.mural.co with murals:read, rooms:read, workspaces:read and complete the OAuth flow once." }], docs: "https://developers.mural.co/public/docs/authentication" },
  monday: { label: "monday.com", fields: [{ key: "token", label: "Personal API token", help: "monday.com > avatar > Developers > My access tokens." }], docs: "https://developer.monday.com/api-reference/docs/authentication" },
  trello: {
    label: "Trello",
    fields: [
      { key: "apiKey", label: "API key", help: "trello.com/power-ups/admin > your Power-Up > API key." },
      { key: "token", label: "Token", help: "Generate a token from the same page (read scope is enough)." },
    ],
    docs: "https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/",
  },
};

export function createImporter(system: ConnectableSource, creds: { token: string; apiKey?: string }, fetchFn?: FetchLike): Importer {
  const opts = fetchFn ? { fetch: fetchFn } : {};
  switch (system) {
    case "miro":
      return new MiroImporter(creds.token, opts);
    case "mural":
      return new MuralImporter(creds.token, opts);
    case "monday":
      return new MondayImporter(creds.token, opts);
    case "trello":
      return new TrelloImporter(creds.apiKey ?? "", creds.token, opts);
  }
}
