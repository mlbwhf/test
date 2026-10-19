import type { Metadata } from "next";
import { LegalPage, OPERATOR } from "../legal";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" intro="What EnrollClass collects, why, where it is kept, and the choices you have.">
      <h2>1. Controller</h2>
      <p>{OPERATOR} is the controller for the platform itself (provider accounts, billing, security logs). For learner data submitted through a provider's registration page, the provider is an independent controller and EnrollClass processes that data on the provider's behalf to run the registration.</p>

      <h2>2. What we collect</h2>
      <ul>
        <li><strong>Learners:</strong> name, email, company and billing address when given, the cohort registered for, invoices, and the status of the registration (paid, transferred, cancelled, certificate issued).</li>
        <li><strong>Payment details:</strong> card numbers are entered directly into Stripe and never reach EnrollClass servers. We keep Stripe's reference to the payment, the amount, and the last four digits where Stripe provides them.</li>
        <li><strong>Providers:</strong> business name, contact email, Stripe account reference, course and cohort content, and dashboard activity.</li>
        <li><strong>Technical:</strong> request logs with IP address and timing for security and troubleshooting, retained for 30 days. Logs do not contain query strings, credentials, or email addresses.</li>
      </ul>

      <h2>3. Why we use it</h2>
      <p>To confirm and manage registrations, send confirmation, reminder and certificate emails, hold and release funds, prevent fraud, meet tax and accounting obligations, and support users. Providers may use our AI drafting tools on their own course descriptions and messages; learner records are not used to train any model.</p>

      <h2>4. Who else sees it</h2>
      <p>Subprocessors, each bound by their own data protection terms: Stripe (payments and provider payouts), Resend (transactional email), Hostinger (hosting, Netherlands), Cloudflare (DNS and email routing), Anthropic (AI drafting for providers, prompt content only). Optional integrations a provider enables, such as Zoom, Microsoft Teams or HubSpot, receive the attendee details needed for that integration. We do not sell personal data.</p>

      <h2>5. Where it lives and how long</h2>
      <p>Production data is stored in the European Union (Netherlands) with encrypted backups. Registration and financial records are kept for seven years to satisfy tax and accounting rules, then deleted. A provider can request deletion of a learner's non-financial details at any time; we also honour requests from learners directly where the provider has closed its account.</p>

      <h2>6. Your rights</h2>
      <p>Depending on where you live (including under GDPR, UK GDPR, PIPEDA and provincial Canadian law) you may ask to access, correct, export or delete your personal data, or object to certain processing. Learners should contact their provider first, since the provider owns the registration; or write to us and we will route the request. We answer within 30 days.</p>

      <h2>7. Cookies</h2>
      <p>The dashboard and learner pages use only strictly necessary cookies for sign-in and form protection. The marketing site sets no cookies and uses no third-party analytics.</p>

      <h2>8. Security</h2>
      <p>Traffic is encrypted in transit, the database is reachable only from the application, credentials are stored hashed, and access to production is limited to named staff using key-based authentication. Report a vulnerability to <a href="mailto:security@enrollclass.com">security@enrollclass.com</a>.</p>

      <h2>9. Contact</h2>
      <p>Privacy questions and requests: <a href="mailto:privacy@enrollclass.com">privacy@enrollclass.com</a>. You may also complain to your local data protection authority.</p>
    </LegalPage>
  );
}
