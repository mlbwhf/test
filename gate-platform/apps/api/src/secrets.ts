import { timingSafeEqual } from "node:crypto";

/** Constant-time comparison of a presented secret against the configured one. */
export function secretMatches(presented: unknown, expected: string | undefined): boolean {
  if (!expected || typeof presented !== "string") return false;
  const a = Buffer.from(presented), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

