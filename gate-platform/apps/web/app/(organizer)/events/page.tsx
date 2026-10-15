import Link from "next/link";
import { api } from "@/lib/api";
import { formatDateTimeInZone, humanize } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { ApiNotice, Empty, Section, StatusBadge } from "@/components/ui";
import { createEventAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const [eventsRes, orgRes] = await Promise.all([api.listEvents(), api.getOrganization()]);
  const defaultCurrency = orgRes.ok ? orgRes.data.currency : "USD";

  return (
    <>
      <div className="page-header">
        <h1>Events</h1>
      </div>

      {!eventsRes.ok && <ApiNotice failure={eventsRes.error} />}

      <Section title="All events">
        {!eventsRes.ok ? (
          <Empty>Events unavailable.</Empty>
        ) : eventsRes.data.items.length === 0 ? (
          <Empty>No events yet. Create one below.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Starts</th>
                  <th>Format</th>
                  <th>Currency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {eventsRes.data.items.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link href={`/events/${encodeURIComponent(e.id)}`}>{e.name}</Link>
                    </td>
                    <td>{formatDateTimeInZone(e.startsAt, e.timezone)}</td>
                    <td>{humanize(e.format)}</td>
                    <td>{e.currency}</td>
                    <td>
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Create event">
        <ActionForm action={createEventAction} submitLabel="Create event" pendingLabel="Creating…">
          <div className="fields">
            <label>
              Name
              <input name="name" required placeholder="Spring Gala" />
            </label>
            <label>
              Starts at
              <input name="startsAt" type="datetime-local" required />
            </label>
            <label>
              Currency
              <input
                name="currency"
                required
                maxLength={3}
                minLength={3}
                pattern="[A-Za-z]{3}"
                defaultValue={defaultCurrency}
                style={{ textTransform: "uppercase" }}
              />
            </label>
          </div>
        </ActionForm>
      </Section>
    </>
  );
}
