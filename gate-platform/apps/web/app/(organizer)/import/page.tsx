import { ActionForm } from "@/components/action-form";
import { Section } from "@/components/ui";
import { importCsvAction, importEventbriteAction } from "@/app/actions";
import { DEFAULT_TIMEZONE } from "@/lib/forms";

export const dynamic = "force-dynamic";

// Copy courses and cohorts from another ticketing tool. Both forms run a preview first;
// nothing is written until the organizer switches the mode to "Import".
export default function ImportPage() {
  return (
    <>
      <div className="page-header">
        <h1>Import</h1>
        <p className="muted">Bring your existing cohorts over from Eventbrite or a spreadsheet. Preview first, then import. Cohorts are created as live, with the same ticket names, prices and seat counts; past registrations stay where they are.</p>
      </div>

      <Section title="From Eventbrite">
        <p className="hint">
          Create a private token at Eventbrite: Account settings → Developer links → API keys → &quot;Private token&quot;. It is used for this request only and never stored. Each Eventbrite event becomes a cohort; events with the same title (ignoring dates) are grouped into one course.
        </p>
        <ActionForm action={importEventbriteAction} submitLabel="Run" pendingLabel="Talking to Eventbrite…">
            <label>
              Private token
              <input name="token" type="password" autoComplete="off" required placeholder="Paste the token" />
            </label>
            <div className="fields-row">
              <label>
                Mode
                <select name="mode" defaultValue="preview">
                  <option value="preview">Preview (write nothing)</option>
                  <option value="import">Import</option>
                </select>
              </label>
              <label>
                Eventbrite organization ID (optional)
                <input name="eventbriteOrganizationId" placeholder="Leave blank for your first organization" />
              </label>
            </div>
            <label className="label-check">
              <input type="checkbox" name="includePast" /> Also import cohorts that already started
            </label>
        </ActionForm>
      </Section>

      <Section title="From a CSV file (Corsizio, spreadsheets, other tools)">
        <p className="hint">
          Export your events from Corsizio (Events → Export) or any tool and upload the CSV. Columns are matched by name: title/name, start, end, time zone, currency, price, seats or capacity, format or location, description, ticket type. Rows with the same name and start become one cohort with several ticket types.{" "}
          <a href="/import/template.csv">Download the template</a> for the canonical column names.
        </p>
        <ActionForm action={importCsvAction} submitLabel="Run" pendingLabel="Reading the file…" wide>
            <label>
              CSV file
              <input name="file" type="file" accept=".csv,text/csv" />
            </label>
            <label>
              …or paste CSV text
              <textarea name="csv" rows={6} placeholder={"name,start,end,timezone,currency,price,seats\n\"CSM Workshop - Dec 2026\",2026-12-03 09:00,2026-12-04 17:00,America/Toronto,CAD,995,16"} />
            </label>
            <div className="fields-row">
              <label>
                Mode
                <select name="mode" defaultValue="preview">
                  <option value="preview">Preview (write nothing)</option>
                  <option value="import">Import</option>
                </select>
              </label>
              <label>
                Time zone when the file has none
                <input name="timezone" defaultValue={DEFAULT_TIMEZONE} />
              </label>
              <label>
                Currency when the file has none
                <input name="currency" placeholder="Organization default" maxLength={3} />
              </label>
            </div>
            <label className="label-check">
              <input type="checkbox" name="includePast" /> Also import cohorts that already started
            </label>
        </ActionForm>
      </Section>
    </>
  );
}
