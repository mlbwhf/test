import { ActionForm } from "@/components/action-form";
import { connectStripeAction, setPaymentModeAction } from "@/app/auth-actions";
import type { PaymentMode, PaymentsState } from "@/lib/api";
import type { Fee } from "@/lib/public-api";
import { feeLabel, feeOn } from "@/lib/fees";
import { formatMoney } from "@/lib/format";

const SETUP_LABEL = { none: "Stripe not connected", incomplete: "Stripe setup not finished", ready: "Stripe connected" } as const;

/** Money → Settings: choose how learners' card payments flow, and connect that mode's Stripe account. */
export function PaymentModeCard({ state, fees, currency, canEdit }: { state: PaymentsState; fees: { protected: Fee; direct: Fee }; currency: string; canEdit: boolean }) {
  const example = currency === "USD" ? 129_500 : 100_000;
  const options: Array<{ mode: PaymentMode; title: string; tag: string; fee: string; points: string[] }> = [
    {
      mode: "protected",
      title: "Protected",
      tag: "Held until delivery",
      fee: `${feeLabel(fees.protected, currency)} per paid seat, card processing included`,
      points: [
        "EnrollClass takes the payment and holds your share until the class is delivered, then pays it to your Stripe account.",
        "Learners book with confidence: refunds are guaranteed if a class is cancelled.",
        "EnrollClass pays the card fees and handles disputes.",
      ],
    },
    {
      mode: "direct",
      title: "Direct",
      tag: "Paid to your Stripe now",
      fee: `${feeLabel(fees.direct, currency)} per paid seat + Stripe's card fee, billed by Stripe`,
      points: [
        "Learners pay your own Stripe account. Money arrives on Stripe's normal payout schedule, before the class.",
        "You're the merchant: you pay Stripe's card fees and handle refunds and disputes in your Stripe dashboard.",
        "Lower EnrollClass fee, since nothing is held.",
      ],
    },
  ];
  return (
    <section className="card pay-mode" aria-labelledby="pay-mode-title" id="payments">
      <div className="today-card-head">
        <h2 id="pay-mode-title">How you get paid</h2>
        <span className={`chip ${state.setup === "ready" ? "chip-ok" : "chip-warn"}`}>{SETUP_LABEL[state.setup]}</span>
      </div>
      <div className="pay-mode-options">
        {options.map((o) => {
          const active = state.mode === o.mode;
          const setup = state[o.mode].setup;
          return (
            <article key={o.mode} className={`pay-mode-option${active ? " is-active" : ""}`} aria-current={active ? "true" : undefined}>
              <header>
                <strong>{o.title}</strong>
                <span className="mono">{o.tag}</span>
              </header>
              <p className="pay-mode-fee">{o.fee}</p>
              <p className="hint">
                On a {formatMoney(example, currency)} seat: {formatMoney(feeOn(example, fees[o.mode]), currency)} to EnrollClass{o.mode === "direct" ? ", plus Stripe's fee" : ", nothing else"}.
              </p>
              <ul>
                {o.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <footer>
                {active ? (
                  <span className="pay-mode-current">Current · {SETUP_LABEL[setup]}</span>
                ) : (
                  <span className="muted">{setup === "ready" ? "Stripe connected" : "Needs its own Stripe account"}</span>
                )}
                {canEdit && !active && (
                  <ActionForm action={setPaymentModeAction} submitLabel={`Switch to ${o.title}`} pendingLabel="Switching…" inline>
                    <input type="hidden" name="mode" value={o.mode} />
                  </ActionForm>
                )}
                {canEdit && active && setup !== "ready" && (
                  <ActionForm action={connectStripeAction} submitLabel={setup === "incomplete" ? "Continue Stripe setup" : o.mode === "direct" ? "Connect your Stripe" : "Connect Stripe"} pendingLabel="Opening Stripe…" inline>
                    <span />
                  </ActionForm>
                )}
              </footer>
            </article>
          );
        })}
      </div>
      <p className="hint">
        Switching only affects new payments: money already held keeps its release date, and Direct payments stay in your Stripe account. Free classes never carry a fee in either mode, and you can pass the fee on to learners so you keep the full ticket price.
      </p>
    </section>
  );
}
