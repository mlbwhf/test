"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { idleState, type ActionState } from "@/components/action-form";
import { formatMoney } from "@/lib/format";
import { StripeFeePayment } from "@/components/stripe-fee-payment";
import { simulateFeePaymentAction, transferSeatAction } from "@/app/my/actions";

/** A transfer that still needs its fee paid before it completes. */
export type FeePayment = {
  transferId: string;
  feeMinor: number;
  currency: string;
  /** Provider payment reference; drives the test-mode "simulate" button. */
  paymentRef: string | null;
  /** Stripe PaymentIntent client secret, when the API created one. */
  clientSecret: string | null;
  /** Direct payments: the organizer's own Stripe account. */
  stripeAccount: string | null;
  /** Original seat id (the credential). */
  seatId: string;
  /** New seat id when the API already created it, else null. */
  newSeatId: string | null;
  email: string;
};

/** ActionState plus the pending-fee payload the transfer action returns. */
export type TransferState = ActionState & { payment?: FeePayment };

export type TransferChoice = {
  eventId: string;
  /** Pre-formatted on the server: name, dates, remaining seats, fee and price difference. */
  label: string;
  disabled: boolean;
};

type Props = {
  seatId: string;
  email: string;
  currency: string;
  choices: TransferChoice[];
  /** Pre-formatted fee summary, e.g. "Free until Nov 13, 2026" or "Fee CA$50.00". */
  feeSummary: string;
  stripePublishableKey: string | null;
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

function ResultBox({ state }: { state: ActionState }) {
  if (state.status === "idle") return null;
  return (
    <div className={`result result-${state.status}`} role={state.status === "error" ? "alert" : "status"}>
      {state.message && <p className="result-message">{state.message}</p>}
      {state.details && state.details.length > 0 && (
        <dl className="result-details">
          {state.details.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function seatPath(seatId: string, email: string, notice: string): string {
  return `/my/seat/${encodeURIComponent(seatId)}?email=${encodeURIComponent(email)}&notice=${notice}`;
}

function SimulateFeePayment({ payment }: { payment: FeePayment }) {
  const [state, formAction] = useActionState(simulateFeePaymentAction, idleState);
  return (
    <form action={formAction} className="action-form">
      <input type="hidden" name="seatId" value={payment.seatId} />
      <input type="hidden" name="email" value={payment.email} />
      <input type="hidden" name="paymentRef" value={payment.paymentRef ?? ""} />
      <input type="hidden" name="newSeatId" value={payment.newSeatId ?? ""} />
      <SubmitButton label="Simulate payment (test mode)" pendingLabel="Simulating…" />
      <ResultBox state={state} />
    </form>
  );
}

function FeePanel({ payment, stripePublishableKey }: { payment: FeePayment; stripePublishableKey: string | null }) {
  const feeLabel = formatMoney(payment.feeMinor, payment.currency);
  const returnPath = seatPath(payment.newSeatId ?? payment.seatId, payment.email, "paid");

  if (stripePublishableKey && payment.clientSecret) {
    return (
      <div className="fee-panel">
        <h3>Pay the transfer fee</h3>
        <p className="hint">Your seat on the new cohort is confirmed once the {feeLabel} fee is paid.</p>
        <StripeFeePayment
          publishableKey={stripePublishableKey}
          clientSecret={payment.clientSecret}
          stripeAccount={payment.stripeAccount}
          feeLabel={feeLabel}
          returnPath={returnPath}
        />
      </div>
    );
  }

  return (
    <div className="fee-panel">
      <h3>Payment required</h3>
      <p>
        A transfer fee of <strong>{feeLabel}</strong> must be paid before your seat moves to the new cohort.
      </p>
      {payment.paymentRef ? (
        <>
          <p className="hint">Card payment coming soon. This environment runs in test mode, so you can simulate the payment instead.</p>
          <SimulateFeePayment payment={payment} />
        </>
      ) : (
        <p className="hint">Card payment coming soon. Please contact the organizer to settle the fee.</p>
      )}
    </div>
  );
}

export function TransferForm({ seatId, email, currency, choices, feeSummary, stripePublishableKey }: Props) {
  const [state, formAction] = useActionState(transferSeatAction, idleState as TransferState);
  const firstEnabled = choices.find((c) => !c.disabled);
  const awaitingPayment = state.payment !== undefined;

  return (
    <>
      <form action={formAction} className="action-form">
        <input type="hidden" name="seatId" value={seatId} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="currency" value={currency} />
        <label>
          Move to cohort
          <select name="toEventId" required defaultValue={firstEnabled?.eventId ?? ""} disabled={awaitingPayment}>
            {choices.map((c) => (
              <option key={c.eventId} value={c.eventId} disabled={c.disabled}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <p className="hint">{feeSummary}</p>
        {!awaitingPayment && <SubmitButton label="Transfer my seat" pendingLabel="Transferring…" />}
        <ResultBox state={state} />
      </form>
      {state.payment && <FeePanel payment={state.payment} stripePublishableKey={stripePublishableKey} />}
    </>
  );
}
