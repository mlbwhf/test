"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Entry = { slug: string; title: string; summary: string; section: string; text: string };

/** Instant search over every help article (titles weigh most). */
export function HelpSearch({ entries }: { entries: Entry[] }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    if (!words.length) return [];
    return entries
      .map((e) => {
        const title = e.title.toLowerCase();
        const body = `${e.summary} ${e.text}`.toLowerCase();
        let score = 0;
        for (const w of words) {
          if (title.includes(w)) score += 5;
          else if (body.includes(w)) score += 1;
          else return null;
        }
        return { e, score };
      })
      .filter((x): x is { e: Entry; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [q, entries]);

  return (
    <div className="help-search">
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help: refund, check-in, duplicate, Zapier…" aria-label="Search help" autoFocus />
      {q.trim().length > 1 && (
        <ul className="help-results" aria-live="polite">
          {results.length === 0 ? (
            <li className="muted">No articles match. Try fewer words.</li>
          ) : (
            results.map(({ e }) => (
              <li key={e.slug}>
                <Link href={`/help/${e.slug}`}>
                  <strong>{e.title}</strong>
                  <span>
                    {e.section} · {e.summary}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
