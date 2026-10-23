// Server-side knowledge of where this deployment lives. Read per request so one image
// serves any domain; the fallbacks match the default VPS hostnames.

export function siteUrl(): string {
  return (process.env.TRAINYARD_PUBLIC_WEB_URL ?? process.env.NEXT_PUBLIC_TRAINYARD_WEB_URL ?? "https://trainyard.app").replace(/\/$/, "");
}

export function apiUrl(): string {
  return process.env.TRAINYARD_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_TRAINYARD_API_URL ?? "";
}

export const REPO_URL = "https://github.com/mlbwhf/test/tree/claude/confident-cray-JTbgD/trainyard";
