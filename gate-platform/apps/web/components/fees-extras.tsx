import { ActionForm } from "@/components/action-form";
import { updateRevenueSettingsAction } from "@/app/actions";
import type { Organization } from "@/lib/api";

/** Money → Settings: who pays the EnrollClass fee, the class-finder listing and flexible tickets. */
export function FeesExtrasCard({ org, canEdit, rates }: { org: Organization; canEdit: boolean; rates: { marketplacePct: string; flexiblePct: string; flexibleKeepPct: string; fxPct: string } }) {
  const body = (
    <>
      <fieldset className="fx-fieldset">
        <legend>Who pays the EnrollClass fee</legend>
        <label className="label-check">
          <input type="radio" name="feePayer" value="learner" defaultChecked={org.passFeeToAttendee} disabled={!canEdit} /> Learners, as a booking fee at checkout: you keep the full ticket price
        </label>
        <label className="label-check">
          <input type="radio" name="feePayer" value="organizer" defaultChecked={!org.passFeeToAttendee} disabled={!canEdit} /> You: learners see one all-in price and the fee comes out of your share
        </label>
      </fieldset>
      <label className="label-check">
        <input type="checkbox" name="marketplaceListing" defaultChecked={org.marketplaceListing} disabled={!canEdit} />
        <span>
          <strong>List my classes in Find a class.</strong> Learners browsing enrollclass.com/classes find your courses. Bookings that come through it carry a {rates.marketplacePct} referral fee; bookings from your own links never do.
        </span>
      </label>
      <label className="label-check">
        <input type="checkbox" name="flexibleTickets" defaultChecked={org.flexibleTickets} disabled={!canEdit} />
        <span>
          <strong>Offer flexible tickets.</strong> At checkout learners can add {rates.flexiblePct} to the ticket price for a full refund if they cancel up to 24 hours before the start. You keep {rates.flexibleKeepPct} of the upgrade and the cancelled seat goes back on sale; refunds come from that class&apos;s payments.
        </span>
      </label>
      <p className="hint">Learners paying in a currency you haven&apos;t priced (converted at your stored rates) pay a {rates.fxPct} conversion fee at checkout. Prices you set per currency never carry it.</p>
    </>
  );
  return (
    <section className="card fees-extras" aria-labelledby="fx-title" id="extras">
      <h2 id="fx-title">Fees and extras</h2>
      {canEdit ? (
        <ActionForm action={updateRevenueSettingsAction} submitLabel="Save" pendingLabel="Saving…" wide>
          {body}
        </ActionForm>
      ) : (
        body
      )}
    </section>
  );
}
