import type { Metadata } from "next";
import { LegalPage } from "../legal";

export const metadata: Metadata = { title: "Refunds and cancellations" };

export default function Refunds() {
  return (
    <LegalPage title="Refunds and cancellations" intro="How refunds, transfers and substitutions work for courses registered through EnrollClass.">
      <h2>The provider sets the policy</h2>
      <p>Every cohort carries its own policy, chosen by the training provider: how long before the start a registration can be cancelled for a refund, whether a seat can be moved to another cohort and at what fee, and whether a seat can be handed to a colleague. The policy is shown at checkout and again on your registration page.</p>

      <h2>Doing it yourself</h2>
      <p>Your confirmation email links to a registration page. From there you can, when the policy allows it, cancel for a refund, transfer to a different cohort, or substitute another attendee, without emailing anyone. Changes that fall outside the policy show why they are unavailable and how to reach the provider.</p>

      <h2>How refunds are paid</h2>
      <ul>
        <li>Refunds go back to the original payment method. Card refunds usually appear within 5 to 10 business days depending on your bank.</li>
        <li>Invoice registrations are refunded by bank transfer from the provider.</li>
        <li>If a provider cancels or reschedules a cohort and you cannot attend, you receive a full refund regardless of the policy.</li>
      </ul>

      <h2>Disputes</h2>
      <p>If you believe a refund due under the published policy has not been made, contact the provider first, then <a href="mailto:support@enrollclass.com">support@enrollclass.com</a> with your registration reference. We can see the cohort, the policy and the ledger, and we will make sure the policy is honoured.</p>

      <h2>Platform fees</h2>
      <p>When a registration is refunded in full, EnrollClass does not keep its platform fee for that seat.</p>
    </LegalPage>
  );
}
