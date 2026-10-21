import { importCsvAction, importEventbriteAction } from "@/app/actions";
import { DEFAULT_TIMEZONE } from "@/lib/forms";
import { ImportPanel } from "@/components/import-panel";

export const dynamic = "force-dynamic";

// Copy courses and cohorts from another ticketing tool. Every run is a preview until the
// organizer switches the mode to "Import".
export default function ImportPage() {
  return (
    <div className="admin-page">
      <div className="admin-head admin-head-stack">
        <h1>Import</h1>
        <p>
          Bring cohorts over from Eventbrite or a spreadsheet. Preview first, then import. Cohorts are created live with the same ticket names, prices and seat counts; past registrations stay where they are.
        </p>
      </div>
      <ImportPanel eventbrite={importEventbriteAction} csv={importCsvAction} defaultTimezone={DEFAULT_TIMEZONE} />
    </div>
  );
}
