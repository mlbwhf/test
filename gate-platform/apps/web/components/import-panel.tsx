"use client";

import { useState } from "react";
import { ActionForm, type ActionState } from "@/components/action-form";

type Action = (prev: ActionState, data: FormData) => Promise<ActionState>;

/** Mode segmented control; the radios submit with the form. */
function ModeAndPast({ mode, setMode }: { mode: "preview" | "import"; setMode: (m: "preview" | "import") => void }) {
  return (
    <div className="import-run">
      <div className="admin-seg" role="radiogroup" aria-label="Mode">
        {(
          [
            ["preview", "Preview (write nothing)"],
            ["import", "Import"],
          ] as const
        ).map(([v, l]) => (
          <label key={v} className={mode === v ? "is-on" : undefined}>
            <input type="radio" name="mode" value={v} checked={mode === v} onChange={() => setMode(v)} />
            {l}
          </label>
        ))}
      </div>
      <label className="label-check">
        <input type="checkbox" name="includePast" /> Also import cohorts already started
      </label>
    </div>
  );
}

/** Import from Eventbrite or a CSV: pick the source, read the help if needed, preview, then import. */
export function ImportPanel({ eventbrite, csv, defaultTimezone }: { eventbrite: Action; csv: Action; defaultTimezone: string }) {
  const [src, setSrc] = useState<"eventbrite" | "csv">("eventbrite");
  const [mode, setMode] = useState<"preview" | "import">("preview");
  const run = mode === "preview" ? "Run preview" : "Run import";
  return (
    <>
      <div className="source-cards" role="radiogroup" aria-label="Import from">
        <button type="button" role="radio" aria-checked={src === "eventbrite"} className="source-card" onClick={() => setSrc("eventbrite")}>
          <span className="source-icon source-icon-eb">EB</span>
          <span>
            <strong>Eventbrite</strong>
            <span>Private API token</span>
          </span>
        </button>
        <button type="button" role="radio" aria-checked={src === "csv"} className="source-card" onClick={() => setSrc("csv")}>
          <span className="source-icon">CSV</span>
          <span>
            <strong>CSV file</strong>
            <span>Corsizio, spreadsheets, other tools</span>
          </span>
        </button>
      </div>

      <section className="import-card">
        <details className="import-help">
          <summary>
            <span className="help-q" aria-hidden="true">
              ?
            </span>
            {src === "eventbrite" ? "How to get a token and what gets imported" : "Which columns are read"}
          </summary>
          {src === "eventbrite" ? (
            <div className="hint">
              <p>Create a private token at Eventbrite: Account settings → Developer links → API keys → &quot;Private token&quot;. It is used for this request only and never stored.</p>
              <p>
                Each Eventbrite event becomes a cohort; events with the same title (ignoring dates) are grouped into one course. The event image becomes the course cover, a Credly or other badge link in the description becomes the course badge, free
                tickets stay free and Eventbrite drafts arrive as drafts.
              </p>
            </div>
          ) : (
            <div className="hint">
              <p>
                Export your events from Corsizio (Events → Export) or any tool. Columns are matched by name: title/name, start, end, time zone, currency, price (0 = free), seats or capacity, minimum, format or location, instructors or trainer, meeting or
                Zoom link, description, ticket type, cover image, badge (a Credly, Accredible, Badgr or Certopus link), badge image and certification body.
              </p>
              <p>Rows with the same name and start become one cohort with several ticket types; a draft status imports as a draft.</p>
            </div>
          )}
        </details>

        {src === "eventbrite" ? (
          <ActionForm key="eb" action={eventbrite} submitLabel={run} pendingLabel="Talking to Eventbrite…" wide>
            <label>
              Private token
              <input name="token" type="password" autoComplete="off" required placeholder="Paste the token (used once, never stored)" />
            </label>
            <label className="half">
              Eventbrite organization ID (optional)
              <input name="eventbriteOrganizationId" placeholder="Leave blank for your first organization" />
            </label>
            <ModeAndPast mode={mode} setMode={setMode} />
          </ActionForm>
        ) : (
          <ActionForm key="csv" action={csv} submitLabel={run} pendingLabel="Reading the file…" wide>
            <label className="drop-zone">
              <span>Drop a CSV here or choose one</span>
              <input name="file" type="file" accept=".csv,text/csv" />
              <a href="/import/template.csv">Download the template</a>
            </label>
            <label>
              …or paste CSV text
              <textarea name="csv" rows={5} className="mono-input" placeholder={'name,start,end,timezone,currency,price,seats\n"CSM Workshop - Dec 2026",2026-12-03 09:00,2026-12-04 17:00,America/Toronto,CAD,995,16'} />
            </label>
            <div className="fields-row">
              <label>
                Time zone when the file has none
                <input name="timezone" defaultValue={defaultTimezone} />
              </label>
              <label>
                Currency when the file has none
                <input name="currency" placeholder="Organization default" maxLength={3} />
              </label>
            </div>
            <ModeAndPast mode={mode} setMode={setMode} />
          </ActionForm>
        )}
      </section>
    </>
  );
}
