"use client";

import { useState, useTransition } from "react";
import type { CoursePage, CoursePageModule } from "@/lib/api";
import { savePageDesignAction } from "@/app/(organizer)/profile/actions";

type Has = { cover: boolean; logo: boolean; badge: boolean; instructors: boolean };
type Props = { courseId: string; courseName: string; orgName: string; page: CoursePage | null; has: Has; publicUrl: string | null; days: number };

const MODULES: { id: CoursePageModule; name: string; note: string }[] = [
  { id: "banner", name: "Banner image", note: "The cover image, across the top" },
  { id: "logo", name: "Company logo", note: "From your organizer profile" },
  { id: "badge", name: "Certification badge", note: "“Earn this badge” beside the title" },
  { id: "video", name: "Preview video", note: "YouTube or Vimeo" },
  { id: "agenda", name: "Agenda", note: "Topics per day, times in each visitor’s zone" },
  { id: "included", name: "What you leave with", note: "Certificate, badge, workbook…" },
  { id: "instructor", name: "Instructor", note: "Photo, title and bio" },
];

/** Class page sections: switches with inline fields, and a live preview that follows them. */
export function PageDesigner(p: Props) {
  const init = p.page ?? {};
  const [on, setOn] = useState<Record<CoursePageModule, boolean>>(() => Object.fromEntries(MODULES.map((m) => [m.id, init.modules?.[m.id] !== false])) as Record<CoursePageModule, boolean>);
  const [tagline, setTagline] = useState(init.tagline ?? "");
  const [video, setVideo] = useState(init.videoUrl ?? "");
  const [agenda, setAgenda] = useState<string[]>(() => {
    const days = Math.max(init.agenda?.length ?? 0, p.days, 1);
    return Array.from({ length: days }, (_, i) => (init.agenda?.[i] ?? []).join("\n"));
  });
  const [included, setIncluded] = useState<{ title: string; note: string }[]>(() => (init.included?.length ? init.included.map((i) => ({ title: i.title, note: i.note ?? "" })) : [{ title: "", note: "" }]));
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();

  const content: Record<CoursePageModule, boolean> = {
    banner: p.has.cover, logo: p.has.logo, badge: p.has.badge, video: Boolean(video.trim()),
    agenda: agenda.some((d) => d.trim()), included: included.some((i) => i.title.trim()), instructor: p.has.instructors,
  };
  const shows = (id: CoursePageModule) => on[id] && content[id];
  const missing: Partial<Record<CoursePageModule, string>> = {
    banner: "Add a cover image above to show it.",
    logo: "Upload a logo on your organizer profile.",
    badge: "Set the course's digital badge below.",
    instructor: "Assign an instructor to a date, and fill in their profile.",
  };
  const count = MODULES.filter((m) => shows(m.id)).length;

  const save = () => {
    setResult(null);
    const page: CoursePage = {
      ...(tagline.trim() ? { tagline: tagline.trim() } : {}),
      ...(video.trim() ? { videoUrl: video.trim() } : {}),
      agenda: agenda.map((d) => d.split("\n").map((t) => t.trim()).filter(Boolean)),
      included: included.filter((i) => i.title.trim()).map((i) => ({ title: i.title.trim(), ...(i.note.trim() ? { note: i.note.trim() } : {}) })),
      modules: Object.fromEntries(MODULES.filter((m) => !on[m.id]).map((m) => [m.id, false])),
    };
    start(async () => {
      const r = await savePageDesignAction(p.courseId, page);
      setResult({ ok: r.status === "ok", message: r.message ?? "" });
    });
  };

  return (
    <div className="pd">
      <div className="pd-mods">
        <p className="hint">Turn sections on or off. The Register button is always visible on first load. Sections with nothing to show stay hidden.</p>
        <label className="pd-field">
          One line under the title
          <input type="text" maxLength={240} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Three live days with a working RTE…" />
        </label>
        <div className="pd-mod is-locked">
          <span>
            <b>Register bar</b>
            <em>Price, seats left and Register, pinned to the top</em>
          </span>
          <span className="pd-always">Always on</span>
        </div>
        {MODULES.map((m) => (
          <div key={m.id} className={`pd-mod${on[m.id] ? "" : " is-off"}`}>
            <div className="pd-mod-row">
              <span>
                <b>{m.name}</b>
                <em>{m.note}</em>
              </span>
              <button type="button" role="switch" aria-checked={on[m.id]} aria-label={m.name} className="pd-switch" onClick={() => setOn((s) => ({ ...s, [m.id]: !s[m.id] }))}>
                <span />
              </button>
            </div>
            {on[m.id] && m.id === "video" && (
              <label className="pd-field">
                Video link
                <input type="url" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
              </label>
            )}
            {on[m.id] && m.id === "agenda" && (
              <div className="pd-days">
                {agenda.map((d, i) => (
                  <label key={i} className="pd-field">
                    Day {i + 1} topics <small>one per line</small>
                    <textarea rows={3} value={d} onChange={(e) => setAgenda((a) => a.map((x, j) => (j === i ? e.target.value : x)))} />
                  </label>
                ))}
                <div className="pd-row">
                  {agenda.length < 14 && (
                    <button type="button" className="btn" onClick={() => setAgenda((a) => [...a, ""])}>
                      + Add a day
                    </button>
                  )}
                  {agenda.length > 1 && (
                    <button type="button" className="btn" onClick={() => setAgenda((a) => a.slice(0, -1))}>
                      Remove last day
                    </button>
                  )}
                </div>
              </div>
            )}
            {on[m.id] && m.id === "included" && (
              <div className="pd-days">
                {included.map((it, i) => (
                  <div key={i} className="pd-pair">
                    <input type="text" aria-label={`Item ${i + 1}`} maxLength={80} placeholder="Certificate PDF" value={it.title} onChange={(e) => setIncluded((l) => l.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                    <input type="text" aria-label={`Item ${i + 1} note`} maxLength={140} placeholder="Issued when the class is delivered" value={it.note} onChange={(e) => setIncluded((l) => l.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
                    <button type="button" className="btn" aria-label={`Remove item ${i + 1}`} onClick={() => setIncluded((l) => (l.length > 1 ? l.filter((_, j) => j !== i) : [{ title: "", note: "" }]))}>
                      ×
                    </button>
                  </div>
                ))}
                {included.length < 12 && (
                  <button type="button" className="btn" onClick={() => setIncluded((l) => [...l, { title: "", note: "" }])}>
                    + Add an item
                  </button>
                )}
              </div>
            )}
            {on[m.id] && !content[m.id] && missing[m.id] && <p className="pd-missing">{missing[m.id]}</p>}
          </div>
        ))}
        <div className="pd-row">
          <button type="button" className="btn btn-primary" onClick={save} disabled={pending}>
            {pending ? "Publishing…" : "Publish changes"}
          </button>
          {p.publicUrl && (
            <a className="btn" href={p.publicUrl} target="_blank" rel="noreferrer">
              View live page ↗
            </a>
          )}
        </div>
        {result && (
          <p className={`result result-${result.ok ? "ok" : "error"}`} role={result.ok ? "status" : "alert"}>
            {result.message}
          </p>
        )}
      </div>

      <section className="pd-preview" aria-label="Live preview">
        <div className="pd-preview-label">LIVE PREVIEW</div>
        <div className="pd-page">
          <div className="pd-bar">
            <b>EnrollClass</b>
            <span>Register</span>
          </div>
          {shows("banner") && <div className="pd-banner" />}
          <div className={`pd-hero${shows("banner") ? " has-banner" : ""}`}>
            <div className="pd-org">
              {shows("logo") && <i className="pd-logo" />}
              <span>{p.orgName}</span>
            </div>
            <div className="pd-title-row">
              <strong>{p.courseName}</strong>
              {shows("badge") && <i className="pd-badge" />}
            </div>
            {tagline.trim() && <p className="pd-tag">{tagline}</p>}
            <span className="pd-cta">Register now</span>
          </div>
          {shows("video") && (
            <div className="pd-video">
              <i />
            </div>
          )}
          {shows("agenda") && (
            <div className="pd-agenda">
              {agenda.filter((d) => d.trim()).slice(0, 4).map((d, i) => (
                <div key={i}>
                  <b>Day {i + 1}</b>
                  {d
                    .split("\n")
                    .filter(Boolean)
                    .slice(0, 3)
                    .map((t, j) => (
                      <span key={j}>{t}</span>
                    ))}
                </div>
              ))}
            </div>
          )}
          {shows("included") && (
            <div className="pd-included">
              {included.filter((i) => i.title.trim()).slice(0, 6).map((i, n) => (
                <span key={n}>{i.title}</span>
              ))}
            </div>
          )}
          {shows("instructor") && <div className="pd-instructor" />}
        </div>
        <p className="hint">
          {count} of {MODULES.length} optional sections showing
        </p>
      </section>
    </div>
  );
}
