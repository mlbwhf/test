"use client";

// The help centre inside the app: every page explained, grouped by space, searchable.

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHead } from "@/components/ui";
import { HELP, HELP_SPACES } from "@/lib/help";

export default function HelpPage() {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? HELP.filter((h) => [h.title, h.what, ...h.steps, ...(h.tips ?? [])].join(" ").toLowerCase().includes(t)) : HELP;
  }, [q]);
  return (
    <>
      <PageHead
        title="Help and how-to"
        sub="Every page explained: what it is for and how to use it. On any page, press ? or use the ? in the top bar for the help on that page."
        actions={
          <a className="btn primary" href="/support" target="_blank" rel="noopener">
            Contact support
          </a>
        }
      />
      <input className="input" style={{ maxWidth: 480 }} placeholder="Search the help: WSJF, breakouts, check-in, import…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the help" />
      {HELP_SPACES.map((space) => {
        const topics = shown.filter((h) => h.space === space);
        if (!topics.length) return null;
        return (
          <section key={space} className="stack">
            <h2>{space}</h2>
            <div className="grid-2">
              {topics.map((h) => (
                <details key={h.path} className="panel panel-body" open={!!q.trim()}>
                  <summary style={{ cursor: "pointer" }}>
                    <b>{h.title}</b> <span className="faint">· {h.what}</span>
                  </summary>
                  <ol style={{ margin: "10px 0 0", paddingLeft: 20, display: "grid", gap: 6 }}>
                    {h.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  {h.tips?.map((t) => (
                    <p key={t} className="faint" style={{ marginTop: 8 }}>
                      {t}
                    </p>
                  ))}
                  {!h.path.endsWith("/") && h.path !== "/welcome" ? (
                    <Link href={h.path} className="btn small" style={{ marginTop: 10, display: "inline-flex" }}>
                      Open {h.title}
                    </Link>
                  ) : null}
                </details>
              ))}
            </div>
          </section>
        );
      })}
      {shown.length === 0 ? <p className="faint">Nothing matches. Try another word, or contact support.</p> : null}
    </>
  );
}
