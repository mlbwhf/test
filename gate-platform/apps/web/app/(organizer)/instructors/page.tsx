import { api, PARTY_KINDS } from "@/lib/api";
import { humanize } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { ApiNotice, Empty, Section } from "@/components/ui";
import { createPartyAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function InstructorsPage() {
  const partiesRes = await api.listParties();
  const parties = partiesRes.ok ? partiesRes.data.items : [];
  const instructors = parties.filter((p) => p.kind === "instructor");
  const others = parties.filter((p) => p.kind !== "instructor");

  return (
    <>
      <div className="page-header">
        <h1>Instructors</h1>
        <span className="muted">Instructors are parties that can be assigned to cohorts and paid out.</span>
      </div>

      {!partiesRes.ok && <ApiNotice failure={partiesRes.error} />}

      <Section title="Instructors">
        {!partiesRes.ok ? (
          <Empty>Parties unavailable.</Empty>
        ) : instructors.length === 0 ? (
          <Empty>No instructors yet. Add one below.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Payments account</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="mono">{p.paymentsAccountRef ?? <span className="muted">not connected</span>}</td>
                    <td className="mono">{p.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Add party">
        <ActionForm action={createPartyAction} submitLabel="Add party" pendingLabel="Adding…">
          <div className="fields">
            <label>
              Name
              <input name="name" required placeholder="Jane Doe" />
            </label>
            <label>
              Kind
              <select name="kind" required defaultValue="instructor">
                {PARTY_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {humanize(k)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </ActionForm>
      </Section>

      {partiesRes.ok && others.length > 0 && (
        <Section title="Other parties">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Kind</th>
                  <th>Payments account</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {others.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{humanize(p.kind)}</td>
                    <td className="mono">{p.paymentsAccountRef ?? <span className="muted">not connected</span>}</td>
                    <td className="mono">{p.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </>
  );
}
