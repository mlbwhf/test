"use client";

// The comparison picker: choose the tools you use or are weighing, choose what matters, and the
// tools line up against those needs with a fit score each and a plain verdict, including when
// another tool is the better pick. The facts are the comparison table's own.

import Link from "next/link";
import { useState } from "react";

export interface CompareRow {
  slug: string;
  tool: string;
  hosting: string;
  pi: string;
  art: string;
  beyond: string;
  integration: string;
  pricedBy: string;
  ours?: boolean;
  /** When this tool is the better pick (competitors only). */
  when?: string;
}

type Fit = 0 | 1 | 2;
interface Need {
  id: string;
  label: string;
  /** Which column of the table carries the evidence. */
  field: "hosting" | "pi" | "beyond" | "integration" | "pricedBy";
  fit: Record<string, Fit>;
}

/** Each need, and how far each tool meets it (2 yes, 1 partly, 0 no), read off the table. */
export const NEEDS: Need[] = [
  { id: "pi", label: "A purpose-built PI planning room", field: "pi", fit: { trainyard: 2, "jira-align": 2, iobeya: 2, "easy-agile": 2, "agile-hive": 2, bigpicture: 2, "piplanning-io": 2, miro: 1 } },
  { id: "seats", label: "A price that does not grow with every person", field: "pricedBy", fit: { trainyard: 2, "jira-align": 0, iobeya: 2, "easy-agile": 0, "agile-hive": 0, bigpicture: 0, "piplanning-io": 2, miro: 0 } },
  { id: "ado", label: "Works with Azure DevOps", field: "integration", fit: { trainyard: 2, "jira-align": 1, iobeya: 1, "easy-agile": 0, "agile-hive": 0, bigpicture: 0, "piplanning-io": 0, miro: 0 } },
  { id: "beyond", label: "More than the board: portfolio, roadmaps, reporting", field: "beyond", fit: { trainyard: 2, "jira-align": 2, iobeya: 2, "easy-agile": 0, "agile-hive": 2, bigpicture: 2, "piplanning-io": 0, miro: 0 } },
  { id: "host", label: "Runs on our own servers", field: "hosting", fit: { trainyard: 2, "jira-align": 2, iobeya: 2, "easy-agile": 1, "agile-hive": 1, bigpicture: 1, "piplanning-io": 2, miro: 0 } },
  { id: "jira", label: "Everything stays inside Jira", field: "hosting", fit: { trainyard: 1, "jira-align": 1, iobeya: 0, "easy-agile": 2, "agile-hive": 2, bigpicture: 2, "piplanning-io": 1, miro: 0 } },
];
const WORD = ["No", "Partly", "Yes"] as const;
const tone = (pct: number) => (pct >= 75 ? "#1f9d6f" : pct >= 45 ? "#d99400" : "#d6453d");

function Ring({ pct, label }: { pct: number; label: string }) {
  const C = 2 * Math.PI * 30;
  return (
    <span className="ct-ring">
      <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={label}>
        <circle cx="38" cy="38" r="30" fill="none" stroke="#14123a1f" strokeWidth="8" />
        <circle className="ct-ring-v" cx="38" cy="38" r="30" fill="none" stroke={tone(pct)} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform="rotate(-90 38 38)" />
      </svg>
      <b>{pct}%</b>
    </span>
  );
}

export function CompareTool({ rows }: { rows: CompareRow[] }) {
  const ours = rows.find((r) => r.ours)!, theirs = rows.filter((r) => !r.ours);
  const [tools, setTools] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const flip = (list: string[], set: (v: string[]) => void, id: string, max: number) => set(list.includes(id) ? list.filter((x) => x !== id) : list.length < max ? [...list, id] : [...list.slice(1), id]);
  const picked = NEEDS.filter((n) => needs.includes(n.id));
  const shown = [ours, ...theirs.filter((t) => tools.includes(t.slug))];
  const score = (slug: string) => (picked.length ? Math.round((picked.reduce((n, p) => n + (p.fit[slug] ?? 0), 0) / (picked.length * 2)) * 100) : null);
  const ranked = picked.length ? [...shown].sort((a, b) => score(b.slug)! - score(a.slug)!) : shown;
  const best = picked.length && shown.length > 1 ? ranked[0]! : null;
  const tie = best ? ranked.filter((r) => score(r.slug) === score(best.slug)) : [];
  const ready = shown.length > 1 && picked.length > 0;

  return (
    <section className="ct" aria-label="Comparison picker">
      <div className="ct-step">
        <span className="ct-n">1</span>
        <div>
          <h2>Which tools are you using or weighing?</h2>
          <p>Pick up to three. Trainyard is always in the comparison.</p>
          <div className="ct-chips" role="group" aria-label="Tools">
            {theirs.map((t) => (
              <button key={t.slug} aria-pressed={tools.includes(t.slug)} onClick={() => flip(tools, setTools, t.slug, 3)}>{t.tool}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="ct-step">
        <span className="ct-n">2</span>
        <div>
          <h2>What matters to you?</h2>
          <p>Pick as many as apply. The comparison is scored on these only.</p>
          <div className="ct-chips" role="group" aria-label="Needs">
            {NEEDS.map((n) => (
              <button key={n.id} aria-pressed={needs.includes(n.id)} onClick={() => flip(needs, setNeeds, n.id, NEEDS.length)}>{n.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="ct-out" aria-live="polite">
        {!ready ? (
          <p className="ct-hint">{shown.length < 2 ? "Pick a tool above to line it up against Trainyard." : "Now pick what matters, and each tool gets a fit score."}</p>
        ) : (
          <>
            <div className="ct-verdict" key={`${tools.join()}|${needs.join()}`}>
              <span className="ct-tag">ON WHAT YOU PICKED</span>
              {tie.length > 1 ? (
                <h3>{tie.map((t) => t.tool).join(" and ")} fit equally well.</h3>
              ) : (
                <h3>{best!.tool} fits best{best!.ours ? "." : ", not Trainyard."}</h3>
              )}
              {best && !best.ours && tie.length === 1 && best.when ? <p>{best.when}</p> : null}
              {best && (best.ours || tie.some((t) => t.ours)) ? <p>Trainyard meets {picked.filter((p) => p.fit.trainyard === 2).length} of your {picked.length} needs in full{picked.some((p) => (p.fit.trainyard ?? 0) < 2) ? `, and only partly: ${picked.filter((p) => (p.fit.trainyard ?? 0) < 2).map((p) => p.label.toLowerCase()).join("; ")}` : ""}.</p> : null}
            </div>
            <div className="ct-cols" style={{ ["--cols" as string]: shown.length }}>
              {ranked.map((r, i) => (
                <article key={r.slug} className={`ct-col${r.ours ? " ours" : ""}`} style={{ animationDelay: `${i * 90}ms` }}>
                  <header>
                    <Ring pct={score(r.slug)!} label={`${r.tool}: ${score(r.slug)}% fit`} />
                    <div>
                      <h3>{r.tool}</h3>
                      <span>{picked.filter((p) => p.fit[r.slug] === 2).length} of {picked.length} in full</span>
                    </div>
                  </header>
                  {picked.map((p) => {
                    const f = (p.fit[r.slug] ?? 0) as Fit;
                    return (
                      <div key={p.id} className={`ct-row f${f}`}>
                        <b><i aria-hidden />{WORD[f]} · {p.label}</b>
                        <span>{r[p.field]}</span>
                      </div>
                    );
                  })}
                  {r.ours ? (
                    <Link href="/#join" className="pill navy">Start free</Link>
                  ) : (
                    <Link href={`/compare/${r.slug}`} className="pill">Trainyard vs {r.tool} →</Link>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
