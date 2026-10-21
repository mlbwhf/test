"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ActionForm } from "@/components/action-form";
import { createCourseAction } from "@/app/actions";
import { LANGUAGES, initials, slugify } from "@/lib/course-utils";

export type CourseRow = {
  id: string;
  name: string;
  slug: string;
  certificationBody: string | null;
  durationDays: number | null;
  language: string;
  upcoming: number;
  badge: { name: string; imageUrl: string | null } | null;
};

const langLabel = (code: string) => LANGUAGES.find((l) => l.code === code)?.label ?? code.toUpperCase();
const days = (n: number | null) => (n === null ? "—" : `${n} day${n === 1 ? "" : "s"}`);

/** Courses as expanding rows (one open at a time), with search, a language filter and inline create. */
export function CourseList({ courses, canWrite }: { courses: CourseRow[]; canWrite: boolean }) {
  const [q, setQ] = useState("");
  const [lang, setLang] = useState("all");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const langs = useMemo(() => [...new Set(courses.map((c) => c.language))].sort(), [courses]);
  const needle = q.trim().toLowerCase();
  const list = courses.filter((c) => (lang === "all" || c.language === lang) && (!needle || `${c.name} ${c.slug}`.toLowerCase().includes(needle)));

  return (
    <div className="admin-list">
      <div className="admin-toolbar">
        <input className="admin-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses or slugs" aria-label="Search courses" />
        {langs.length > 1 && (
          <div className="admin-seg" role="group" aria-label="Language">
            {["all", ...langs].map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
                {l === "all" ? "All" : l.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        <span className="admin-count">
          {list.length} course{list.length === 1 ? "" : "s"}
        </span>
        {canWrite && (
          <button type="button" className="m-btn admin-new" aria-expanded={creating} onClick={() => setCreating(!creating)}>
            {creating ? "Close" : "+ New course"}
          </button>
        )}
      </div>

      {creating && (
        <div className="admin-create">
          <ActionForm action={createCourseAction} submitLabel="Create course" pendingLabel="Creating…">
            <div className="fields">
              <label>
                Name
                <input name="name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Certified SAFe® Product Owner" autoFocus />
              </label>
              <label>
                Slug
                <input name="slug" value={slugify(name)} readOnly aria-describedby="slug-hint" className="mono-input" />
              </label>
              <label>
                Certification body
                <input name="certificationBody" placeholder="Scaled Agile, Inc." />
              </label>
              <label>
                Days
                <input name="durationDays" type="number" min={1} step={1} placeholder="2" />
              </label>
              <label>
                Language
                <select name="language" defaultValue="en">
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="hint" id="slug-hint">
              The slug is the course&apos;s web address, made from the name. It can&apos;t change later.
            </p>
          </ActionForm>
        </div>
      )}

      {list.length === 0 ? (
        <p className="admin-empty">{courses.length ? "No courses match." : "No courses yet. Create the first one."}</p>
      ) : (
        list.map((c) => (
          <details key={c.id} className="admin-row" name="course-row">
            <summary>
              <span className={`admin-tile${c.badge?.imageUrl ? " admin-tile-img" : ""}`} aria-hidden="true">
                {c.badge?.imageUrl ? <img src={c.badge.imageUrl} alt="" /> : initials(c.name)}
              </span>
              <span className="admin-row-name">
                <strong>{c.name}</strong>
                <span className="mono">{c.slug}</span>
              </span>
              <span className="admin-row-body">{c.certificationBody ?? "—"}</span>
              <span className="admin-row-days mono">{days(c.durationDays)}</span>
              <span className="acc-chev" aria-hidden="true">
                ▾
              </span>
            </summary>
            <div className="admin-row-open">
              <div className="fact-tiles">
                <div>
                  <span>UPCOMING COHORTS</span>
                  <strong>{c.upcoming}</strong>
                </div>
                <div>
                  <span>LANGUAGE</span>
                  <strong>{langLabel(c.language)}</strong>
                </div>
                <div>
                  <span>BADGE</span>
                  <strong>{c.badge?.name ?? "None"}</strong>
                </div>
                <div>
                  <span>DURATION</span>
                  <strong>{days(c.durationDays)}</strong>
                </div>
              </div>
              <div className="admin-actions">
                <Link className="m-btn m-btn-green" href={`/courses/${encodeURIComponent(c.id)}#add-cohort`}>
                  + Create cohort
                </Link>
                <Link className="m-btn" href={`/badges?course=${encodeURIComponent(c.id)}`}>
                  {c.badge ? "Edit badge →" : "Design badge →"}
                </Link>
                <Link className="m-btn" href={`/courses/${encodeURIComponent(c.id)}`}>
                  Edit
                </Link>
              </div>
            </div>
          </details>
        ))
      )}
    </div>
  );
}
