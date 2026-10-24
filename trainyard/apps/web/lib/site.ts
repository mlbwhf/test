// Server-side knowledge of where this deployment lives. Read per request so one image
// serves any domain; the fallbacks match the default VPS hostnames.

export function siteUrl(): string {
  return (process.env.TRAINYARD_PUBLIC_WEB_URL ?? process.env.NEXT_PUBLIC_TRAINYARD_WEB_URL ?? "https://trainyard.app").replace(/\/$/, "");
}

export function apiUrl(): string {
  return process.env.TRAINYARD_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_TRAINYARD_API_URL ?? "";
}

export const REPO_URL = "https://github.com/mlbwhf/test/tree/claude/confident-cray-JTbgD/trainyard";

/**
 * IndexNow key (Bing, Yandex, Seznam, Naver; Bing feeds ChatGPT search and Copilot). The key is
 * public by design: it is served at /<key>.txt to prove the site owns the submissions.
 */
export const INDEXNOW_KEY = "7c1e4b9a2f6d48e3b05a9c7d3e1f2a64";
