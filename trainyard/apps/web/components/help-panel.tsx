"use client";

// The ? in the top bar: how to use the page you are on, from lib/help.ts, with the way to the
// help centre and to support. Opens with the ? key too; Esc closes it.

import Link from "next/link";
import { useEffect, useState } from "react";
import { HELP, helpFor } from "@/lib/help";

export function HelpPanel({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "?") setOpen((o) => !o);
      else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => setOpen(false), [path]);
  const topic = helpFor(path) ?? HELP[0]!;
  return (
    <>
      <button className="ws-btn ws-help-btn" aria-label="Help for this page" aria-expanded={open} onClick={() => setOpen(!open)} title="Help (?)">
        ?
      </button>
      {open ? (
        <aside className="ws-help" role="dialog" aria-label={`Help: ${topic.title}`}>
          <div className="ws-help-head">
            <span className="eyebrow">{topic.space} · how to use</span>
            <button className="btn ghost small" onClick={() => setOpen(false)} aria-label="Close help">
              ×
            </button>
          </div>
          <h2>{topic.title}</h2>
          <p className="muted">{topic.what}</p>
          <ol>
            {topic.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          {topic.tips?.length ? (
            <div className="notice">
              {topic.tips.map((t) => (
                <p key={t} style={{ margin: "2px 0" }}>
                  {t}
                </p>
              ))}
            </div>
          ) : null}
          <div className="ws-help-foot">
            <Link href="/help" className="btn small" onClick={() => setOpen(false)}>
              All help topics
            </Link>
            <a href="/support" className="btn small" target="_blank" rel="noopener">
              Contact support
            </a>
          </div>
        </aside>
      ) : null}
    </>
  );
}
