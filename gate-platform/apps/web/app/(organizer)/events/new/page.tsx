import { api } from "@/lib/api";
import { ActionForm } from "@/components/action-form";
import { createEventAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const orgRes = await api.getOrganization();
  const defaultCurrency = orgRes.ok ? orgRes.data.currency : "USD";
  return (
    <>
      <h1>Create event</h1>
      <section className="card">
        <ActionForm action={createEventAction} submitLabel="Create event" pendingLabel="Creating…">
          <div className="fields">
            <label>
              Name
              <input name="name" required placeholder="Leading SAFe · November" />
            </label>
            <label>
              Starts at
              <input name="startsAt" type="datetime-local" required />
            </label>
            <label>
              Currency
              <input name="currency" required maxLength={3} minLength={3} pattern="[A-Za-z]{3}" defaultValue={defaultCurrency} style={{ textTransform: "uppercase" }} />
            </label>
          </div>
        </ActionForm>
      </section>
    </>
  );
}
