import type { Metadata } from "next";
import { LegalPage, OPERATOR } from "../legal";

export const metadata: Metadata = { title: "Terms of service" };

export default function Terms() {
  return (
    <LegalPage title="Terms of service" intro="These terms govern use of the EnrollClass platform by training providers and by the people who register for their courses.">
      <h2>1. Who we are</h2>
      <p>{OPERATOR} ("EnrollClass", "we") provides software that lets training providers publish course cohorts, take registrations and collect payment. EnrollClass does not design, deliver or certify any training. The provider named on a registration page is responsible for the course.</p>

      <h2>2. Two kinds of users</h2>
      <p><strong>Providers</strong> are the businesses that publish cohorts and receive the proceeds of registrations. <strong>Learners</strong> are the people, or the companies buying on their behalf, who register for a cohort. Sections 3 to 5 apply to providers; sections 6 to 8 apply to learners; the rest applies to everyone.</p>

      <h2>3. Provider accounts and payouts</h2>
      <p>Providers connect a Stripe account to receive funds. Stripe's own terms, including the Stripe Connected Account Agreement, apply to that account. EnrollClass holds registration proceeds in a ledger against each cohort and releases them to the connected account after the cohort is delivered, less our platform fee and any refunds. Providers must give accurate course information, honour the refund and transfer policy they publish, and deliver the course as described.</p>

      <h2>4. Platform fees</h2>
      <p>The platform fee is a percentage plus a fixed amount per paid seat, shown on our pricing page and in the provider dashboard before a cohort is published. Fees are deducted at release. Taxes a provider collects from learners are passed through in full. We may change fees with 30 days' notice; the change applies to cohorts published after the notice.</p>

      <h2>5. Provider obligations</h2>
      <ul>
        <li>Collect and remit any sales tax, VAT or GST that applies to your courses.</li>
        <li>Use learner data only to deliver and support the course the learner registered for.</li>
        <li>Do not use EnrollClass for anything unlawful, deceptive, or outside professional training and education.</li>
        <li>Keep your dashboard credentials and API keys secret. You are responsible for activity under them.</li>
      </ul>

      <h2>6. Registering for a course</h2>
      <p>When a learner registers, a contract for the course forms between the learner and the provider. EnrollClass collects the payment on the provider's behalf. The price, dates, format and refund terms shown at checkout are the provider's. A registration is confirmed when payment succeeds (card) or when the provider marks an invoice paid.</p>

      <h2>7. Refunds, transfers and cancellations</h2>
      <p>Each provider sets a refund and transfer policy per cohort. It is shown at checkout and on the learner's registration page, where eligible changes can be made directly. Our <a href="/refunds">refunds and cancellations page</a> explains how this works. Where a provider cancels a cohort, the learner is refunded in full to the original payment method.</p>

      <h2>8. Learner conduct</h2>
      <p>Learners must provide accurate attendee details and may not resell seats. A seat may be reassigned to another person through the registration page where the provider allows it.</p>

      <h2>9. Acceptable use and availability</h2>
      <p>We work to keep the service available and secure, but it is provided "as is" without a guarantee of uninterrupted operation. We may suspend an account that breaches these terms, puts other users at risk, or is subject to fraud or chargeback abuse.</p>

      <h2>10. Liability</h2>
      <p>To the extent permitted by law, EnrollClass is not liable for the quality, delivery or outcome of any course, nor for indirect or consequential loss. Our total liability to a provider in any twelve-month period is limited to the platform fees paid by that provider in that period. Nothing in these terms limits liability that cannot be limited by law, including consumer rights that apply to learners.</p>

      <h2>11. Privacy</h2>
      <p>Our <a href="/privacy">privacy policy</a> explains what personal data we process and why. Providers are independent controllers of learner data they receive through the platform.</p>

      <h2>12. Changes, law and contact</h2>
      <p>We may update these terms; the current version is always at this address with its date. Material changes are announced to providers by email. These terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable there, without affecting mandatory consumer protections where a learner lives. Questions: <a href="mailto:support@enrollclass.com">support@enrollclass.com</a>.</p>
    </LegalPage>
  );
}
