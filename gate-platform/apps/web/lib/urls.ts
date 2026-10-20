/** Browser-facing API origin, read at request time (not inlined at build). */
export function publicApiUrl(): string {
  const explicit = process.env.GATE_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.GATE_DOMAIN && process.env.NODE_ENV === "production") return `https://api.${process.env.GATE_DOMAIN}`;
  return "http://localhost:4000";
}

/** Same-site relative paths only, so a crafted link can't bounce someone elsewhere. */
export function safePath(v: unknown, fallback = "/dashboard"): string {
  return typeof v === "string" && /^\/(?!\/)[\x21-\x7e]*$/.test(v) && !v.includes("\\") ? v : fallback;
}

/** This site's own origin as the visitor reached it (behind Traefik: forwarded proto and host). */
export async function siteOrigin(): Promise<string> {
  const explicit = process.env.GATE_WEB_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
