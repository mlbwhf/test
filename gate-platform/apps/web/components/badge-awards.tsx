"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { BadgeImportResult } from "@/lib/api";
import { createBadgeProgramAction, importEarnersAction, issueBadgesAction } from "@/app/(organizer)/badges/award-actions";

const PLATFORMS = [
  ["credly", "Credly"],
  ["accredible", "Accredible"],
  ["badgr", "Badgr / Canvas Credentials"],
  ["certopus", "Certopus"],
  ["other", "Another platform"],
] as const;

/** Under a verified badge: move its earners from another platform (free), or issue it to people directly. */
export function BadgeAwardsPanel({ courseId, badgeName }: { courseId: string; badgeName: string }) {
  const [tab, setTab] = useState<"import" | "issue">("import");
  const [platform, setPlatform] = useState("credly");
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [notify, setNotify] = useState(true);
  const [preview, setPreview] = useState<BadgeImportResult | null>(null);
  const [lines, setLines] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const onFile = async (f: File | undefined) => {
    setPreview(null);
    setMsg(null);
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) return setMsg({ ok: false, text: "That file is larger than 8 MB. Split it and import the parts." });
    setFileName(f.name);
    setCsv(await f.text());
  };
  const runImport = (dryRun: boolean) =>
    start(async () => {
      setMsg(null);
      const r = await importEarnersAction(courseId, { csv, platform, notify, dryRun });
      if (!r.ok) return setMsg({ ok: false, text: r.message });
      if (dryRun) return setPreview(r.result);
      setPreview(null);
      setCsv("");
      setFileName("");
      const n = r.result.imported;
      setMsg({ ok: true, text: `Moved ${n} earner${n === 1 ? "" : "s"} to EnrollClass${notify && n ? " and emailed each one a link to their badge" : ""}.${r.result.already ? ` ${r.result.already} already had it.` : ""}` });
    });
  const runIssue = () =>
    start(async () => {
      setMsg(null);
      const r = await issueBadgesAction(courseId, lines, notify);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) setLines("");
    });

  return (
    <div className="badge-awards">
      <div className="seg" role="tablist" aria-label={`Give the ${badgeName} badge`}>
        <button type="button" role="tab" aria-selected={tab === "import"} onClick={() => setTab("import")}>
          Move earners from another platform
        </button>
        <button type="button" role="tab" aria-selected={tab === "issue"} onClick={() => setTab("issue")}>
          Issue to people
        </button>
      </div>

      {tab === "import" ? (
        <div className="badge-awards-body">
          <p className="hint">
            Export the earners of this badge from your current platform as CSV (in Credly: the badge&apos;s <em>Issued badges</em> list, then <em>Export</em>) and upload it here. Each person gets
            this verified badge with their original issue date. Moving earners is free.
          </p>
          <div className="pd-row">
            <label className="pd-field">
              From
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {PLATFORMS.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="pd-field">
              Earners export (CSV)
              <input type="file" accept=".csv,text/csv" onChange={(e) => void onFile(e.target.files?.[0])} />
            </label>
          </div>
          {fileName && !preview && (
            <button type="button" className="btn" onClick={() => runImport(true)} disabled={pending || !csv}>
              {pending ? "Reading…" : `Check ${fileName}`}
            </button>
          )}
          {preview && (
            <div className="badge-preview" role="status">
              <p>
                <strong>
                  {preview.imported} earner{preview.imported === 1 ? "" : "s"} ready to move
                </strong>
                {preview.already ? ` · ${preview.already} already ha${preview.already === 1 ? "s" : "ve"} it` : ""}
                {preview.skipped.length ? ` · ${preview.skipped.length} row${preview.skipped.length === 1 ? "" : "s"} skipped` : ""}
              </p>
              <p className="hint">
                Read emails from &ldquo;{preview.columns.email}&rdquo;, names from &ldquo;{preview.columns.name}&rdquo;
                {preview.columns.issued ? `, issue dates from “${preview.columns.issued}”` : "; no issue-date column, so today's date is used"}.
              </p>
              {preview.preview.length > 0 && (
                <ul>
                  {preview.preview.map((p) => (
                    <li key={p.email}>
                      {p.name} · {p.email}
                      {p.issuedAt ? ` · issued ${p.issuedAt.slice(0, 10)}` : ""}
                    </li>
                  ))}
                </ul>
              )}
              {preview.skipped.length > 0 && (
                <details>
                  <summary>Skipped rows</summary>
                  <ul>
                    {preview.skipped.slice(0, 50).map((x) => (
                      <li key={x.line}>
                        Line {x.line}: {x.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <label className="label-check">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Email each person a link to their badge (&ldquo;your badge has moved&rdquo;)
              </label>
              <div className="pd-row">
                <button type="button" className="btn btn-primary" onClick={() => runImport(false)} disabled={pending || preview.imported === 0}>
                  {pending ? "Moving…" : `Move ${preview.imported} earner${preview.imported === 1 ? "" : "s"}`}
                </button>
                <button type="button" className="btn" onClick={() => setPreview(null)} disabled={pending}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="badge-awards-body">
          <p className="hint">One person per line: name, email. Each gets this verified badge dated today. Badges issued this way are $1 each, invoiced monthly.</p>
          <label className="pd-field">
            People
            <textarea rows={5} value={lines} onChange={(e) => setLines(e.target.value)} placeholder={"Ada Lovelace, ada@company.com\nGrace Hopper, grace@company.com"} />
          </label>
          <label className="label-check">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Email each person a link to their badge
          </label>
          <button type="button" className="btn btn-primary" onClick={runIssue} disabled={pending || !lines.trim()}>
            {pending ? "Issuing…" : "Issue badges"}
          </button>
        </div>
      )}
      {msg && (
        <p className={`result result-${msg.ok ? "ok" : "error"}`} role={msg.ok ? "status" : "alert"}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

/** Badges-only start: a badge program (a course with no classes) to design a badge for. */
export function NewBadgeProgram() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const create = () =>
    start(async () => {
      setErr(null);
      const r = await createBadgeProgramAction(name);
      if (!r.ok) return setErr(r.message);
      router.push(`/badges?course=${encodeURIComponent(r.courseId)}#badge-${encodeURIComponent(r.courseId)}`);
      setOpen(false);
      setName("");
    });
  if (!open)
    return (
      <button type="button" className="m-btn" onClick={() => setOpen(true)}>
        + New badge program
      </button>
    );
  return (
    <div className="badge-new">
      <label className="pd-field">
        Badge program name
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Innovation Framework Practitioner" maxLength={200} onKeyDown={(e) => e.key === "Enter" && create()} />
      </label>
      <button type="button" className="btn btn-primary" onClick={create} disabled={pending}>
        {pending ? "Creating…" : "Create and design its badge"}
      </button>
      <button type="button" className="btn" onClick={() => setOpen(false)} disabled={pending}>
        Cancel
      </button>
      {err && (
        <p className="result result-error" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
