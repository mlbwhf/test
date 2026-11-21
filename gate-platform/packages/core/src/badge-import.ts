// Reading the earner lists other badge platforms export, so an organization can move the people
// who already hold its badges to EnrollClass. Credly, Accredible and Badgr all export CSV with
// slightly different column names; this finds the name, email and issue date in any of them.

export type EarnerRow = { name: string; email: string; issuedAt?: Date | undefined };
export type ParsedEarners = { rows: EarnerRow[]; skipped: Array<{ line: number; reason: string }>; columns: { email: string; name: string; issued: string | null } };

/** RFC 4180 CSV: quoted fields, doubled quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === "," || c === ";" || c === "\t") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

// "Issued At (UTC)" and "Recipient Email (required)" match like their bare names.
const norm = (h: string) => h.replace(/\([^)]*\)/g, " ").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const EMAIL = ["recipient email", "earner email", "email", "email address", "recipient identifier", "recipient", "issued to email"];
const NAME = ["recipient name", "earner name", "name", "full name", "recipient full name", "issued to"];
const FIRST = ["recipient first name", "earner first name", "first name", "given name"];
const LAST = ["recipient last name", "earner last name", "last name", "family name", "surname"];
const ISSUED = ["issued at", "issued on", "issue date", "date issued", "issued date", "awarded on", "awarded at", "date awarded", "created at", "issued"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function find(headers: string[], names: string[]): number {
  for (const n of names) {
    const i = headers.indexOf(n);
    if (i >= 0) return i;
  }
  return -1;
}

/** A date from an export: ISO, "2024-03-05 14:02:11 UTC", "03/05/2024" (US order), or "5 Mar 2024". */
export function parseIssued(v: string): Date | undefined {
  const t = v.trim().replace(/\s+UTC$/i, "Z").replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}(:\d{2})?)/, "$1T$2");
  if (!t) return undefined;
  const us = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const d = us ? new Date(Date.UTC(Number(us[3]), Number(us[1]) - 1, Number(us[2]))) : new Date(t);
  return Number.isNaN(d.getTime()) || d.getUTCFullYear() < 1990 ? undefined : d;
}

/** Earners from a CSV export; rows without a usable email are listed as skipped, duplicates kept once. */
export function parseEarners(text: string): ParsedEarners {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], skipped: [], columns: { email: "", name: "", issued: null } };
  const raw = table[0]!;
  const headers = raw.map(norm);
  const iEmail = find(headers, EMAIL);
  if (iEmail < 0) throw new Error("no email column found: the export needs a column like \"Recipient Email\"");
  const iName = find(headers, NAME), iFirst = find(headers, FIRST), iLast = find(headers, LAST), iIssued = find(headers, ISSUED);
  const rows: EarnerRow[] = [];
  const skipped: ParsedEarners["skipped"] = [];
  const seen = new Set<string>();
  table.slice(1).forEach((r, k) => {
    const line = k + 2;
    const email = (r[iEmail] ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return skipped.push({ line, reason: email ? `"${email}" is not an email address` : "no email" });
    if (seen.has(email)) return skipped.push({ line, reason: `${email} appears more than once` });
    seen.add(email);
    const joined = [iFirst >= 0 ? r[iFirst] : "", iLast >= 0 ? r[iLast] : ""].map((x) => (x ?? "").trim()).filter(Boolean).join(" ");
    const name = ((iName >= 0 ? r[iName] : "") ?? "").trim() || joined || email.split("@")[0]!;
    const issuedAt = iIssued >= 0 ? parseIssued(r[iIssued] ?? "") : undefined;
    rows.push({ name: name.slice(0, 200), email, ...(issuedAt ? { issuedAt } : {}) });
  });
  return { rows, skipped, columns: { email: raw[iEmail]!, name: iName >= 0 ? raw[iName]! : iFirst >= 0 ? `${raw[iFirst]} + ${iLast >= 0 ? raw[iLast] : ""}`.trim() : "(from the email)", issued: iIssued >= 0 ? raw[iIssued]! : null } };
}
