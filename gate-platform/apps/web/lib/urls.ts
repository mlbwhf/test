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
