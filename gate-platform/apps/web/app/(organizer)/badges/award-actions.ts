"use server";

import { revalidatePath } from "next/cache";
import { api, describeFailure, type BadgeImportResult } from "@/lib/api";

export type ImportOutcome = { ok: true; result: BadgeImportResult } | { ok: false; message: string };

/** Preview (dryRun) or run an import of earners from another badge platform's CSV export. */
export async function importEarnersAction(courseId: string, input: { csv: string; platform: string; notify: boolean; dryRun: boolean }): Promise<ImportOutcome> {
  if (input.csv.length > 8_000_000) return { ok: false, message: "That file is larger than 8 MB. Split it and import the parts." };
  const r = await api.importBadgeEarners(courseId, input);
  if (!r.ok) return { ok: false, message: describeFailure(r.error) };
  if (!input.dryRun) revalidatePath("/badges");
  return { ok: true, result: r.data };
}

/** Issue a badge directly to people typed or pasted as "Name, email" lines. */
export async function issueBadgesAction(courseId: string, lines: string, notify: boolean): Promise<{ ok: boolean; message: string }> {
  const recipients: { name: string; email: string }[] = [];
  for (const raw of lines.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(.*?)[,;\t]\s*([^\s,;]+@[^\s,;]+)\s*$/) ?? line.match(/^([^\s,;]+@[^\s,;]+)$/);
    if (!m) return { ok: false, message: `Couldn't read "${line}". Use one person per line: Name, email` };
    recipients.push(m[2] ? { name: m[1]!.trim(), email: m[2] } : { name: "", email: m[1]! });
  }
  if (!recipients.length) return { ok: false, message: "Add at least one person: Name, email" };
  const r = await api.issueBadges(courseId, { recipients, notify });
  if (!r.ok) return { ok: false, message: describeFailure(r.error) };
  revalidatePath("/badges");
  const { issued, already } = r.data;
  return { ok: true, message: `Issued ${issued} badge${issued === 1 ? "" : "s"}${notify && issued ? " and emailed each person" : ""}.${already.length ? ` ${already.length} already had it: ${already.slice(0, 5).join(", ")}${already.length > 5 ? "…" : ""}.` : ""}` };
}

/** A badge program for badges-only use: a course with no classes, ready for its badge design. */
export async function createBadgeProgramAction(name: string): Promise<{ ok: true; courseId: string } | { ok: false; message: string }> {
  const n = name.trim();
  if (n.length < 2) return { ok: false, message: "Name the badge program, e.g. Innovation Framework Practitioner." };
  const base = n.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "badge";
  for (let i = 0; i < 5; i++) {
    const r = await api.createCourse({ slug: i ? `${base}-${i + 1}` : base, name: n });
    if (r.ok) {
      revalidatePath("/badges");
      return { ok: true, courseId: r.data.id };
    }
    if (!(r.error.kind === "api" && r.error.status === 409)) return { ok: false, message: describeFailure(r.error) };
  }
  return { ok: false, message: "A program with that name already exists." };
}
