import type { Metadata } from "next";
import Link from "next/link";
import { Prose, PublicPage } from "@/components/public-page";
import { LEGAL, supportEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms for using Trainyard: accounts, plans and payment, the free trial, the money-back guarantee, cancellation, your content, acceptable use and liability.",
  alternates: { canonical: "/terms" },
};

export const dynamic = "force-dynamic";

export default function TermsPage() {
  const email = supportEmail();
  return (
    <PublicPage crumbs={[{ href: "/terms", label: "Terms" }]}>
      <h1>Terms of service</h1>
      <p className="lede">
        These terms are an agreement between you and {LEGAL.operator}, which runs Trainyard at trainyard.app. By creating an account, joining a workspace or paying for a plan, you agree to them. In effect from {LEGAL.effective}.
      </p>
      <Prose>
        <h2>1. Who can use Trainyard</h2>
        <p>
          You must be at least 16 and able to enter a contract. If you sign up for a company or another organisation, you confirm you may bind it to these terms, and &quot;you&quot; means that organisation. The person who creates a workspace (the owner) is responsible for who they invite and how the workspace is used.
        </p>

        <h2>2. Your account</h2>
        <p>
          Keep your password, sign-in key and students&apos; personal class links to yourself and the people they are meant for: anyone with a link or key can act as that person. Tell us at <a href={`mailto:${email}`}>{email}</a> if you think one has leaked; you can replace keys and class links yourself at any time.
        </p>

        <h2>3. Plans, trial and payment</h2>
        <ul>
          <li>
            <b>Practice</b> is free with the limits shown on the <Link href="/pricing">pricing page</Link>. <b>Trainer</b>, <b>Academy</b> and <b>Insights</b> are paid subscriptions, priced per seat (per trainer, per Agile Release Train, or per pack of data sources) as shown on the pricing page when you subscribe.
          </li>
          <li>Paid plans start with a free trial, one per customer. We email you when it starts and again 7 days before the first charge. If you cancel before the trial ends, you pay nothing.</li>
          <li>After the trial, the subscription renews automatically each month (or each year, if you switch to yearly) until you cancel. Payments are processed by Stripe and charged in US dollars, plus any taxes that apply.</li>
          <li>Adding seats is charged pro rata for the rest of the period. We may change prices for future periods with at least 30 days&apos; notice by email; the change applies from your next renewal.</li>
          <li>Card statements show the charge as &quot;TRAINYARD&quot;.</li>
        </ul>

        <h2>4. Money-back guarantee and cancellation</h2>
        <ul>
          <li>Within 30 days of your first paid charge, you can claim a full refund of that charge yourself under <b>Plan &amp; billing</b>. The subscription ends and the workspace moves to Practice with everything kept.</li>
          <li>You can cancel at any time from <b>Plan &amp; billing</b> or Stripe&apos;s billing portal. Cancellation takes effect at the end of the period you&apos;ve paid for; apart from the guarantee above, payments already made are not refunded except where the law requires.</li>
          <li>If a payment fails and isn&apos;t fixed, or a subscription ends, the workspace is frozen: you can still read and export everything, but not make changes, until a plan is active again.</li>
        </ul>

        <h2>5. Your content</h2>
        <p>
          What you and your team put into Trainyard stays yours. You give us permission to host, copy, process and display it only as needed to run the service for you, including through the providers listed in our <Link href="/privacy">privacy policy</Link>. You are responsible for having the right to upload what you add, and for the personal information of the people you invite or add as students. You can export your workspace at any time.
        </p>

        <h2>6. Course material</h2>
        <p>
          Some built-in classes include course content and pictures © Scaled Agile, Inc., used under a partner agreement. They are licensed to you only for running and taking classes in Trainyard; don&apos;t copy or redistribute them elsewhere. SAFe and Scaled Agile Framework are registered trademarks of Scaled Agile, Inc.
        </p>

        <h2>7. Acceptable use</h2>
        <p>Don&apos;t use Trainyard to:</p>
        <ul>
          <li>break the law or infringe anyone&apos;s rights, or upload malware or unlawful content;</li>
          <li>try to get into other workspaces or accounts, probe or overload the service, or get around plan limits or security;</li>
          <li>send spam through invitations or class links;</li>
          <li>resell the hosted service without our written agreement.</li>
        </ul>
        <p>We may suspend access that puts the service or other customers at risk, and will tell you why unless the law or safety prevents it.</p>

        <h2>8. Open source</h2>
        <p>
          Trainyard&apos;s software is open source under the Apache License 2.0, and you may run it yourself under that licence. These terms cover the hosted service at trainyard.app; the course material in section 6 is not part of the open-source licence.
        </p>

        <h2>9. Availability and changes</h2>
        <p>
          We work to keep Trainyard available and your data safe, with regular backups, but we don&apos;t promise it will be uninterrupted or error-free. We improve the product continuously and may change or retire features; if we remove something material to a paid plan, we&apos;ll tell you in advance, and you can cancel.
        </p>

        <h2>10. Disclaimers and liability</h2>
        <p>
          Apart from what these terms promise, Trainyard is provided &quot;as is&quot;, without warranties of fitness for a particular purpose or non-infringement, to the extent the law allows. Neither of us is liable for indirect or consequential losses, such as lost profits or data you could have exported. Our total liability for any claim is limited to what you paid us in the 12 months before it arose (or CAD $100 if you use a free plan). Nothing here limits liability that cannot be limited by law, or your rights as a consumer where those apply.
        </p>

        <h2>11. Ending the agreement</h2>
        <p>
          You can stop using Trainyard and ask us to delete your workspace at any time. We may end these terms for a serious or repeated breach, with notice where reasonable. After a workspace is closed, you have 30 days to ask for an export before its content is deleted.
        </p>

        <h2>12. Governing law</h2>
        <p>
          These terms are governed by the laws of {LEGAL.jurisdiction}. Disputes go to {LEGAL.courts}, unless the law where you live as a consumer gives you the right to go to your local courts.
        </p>

        <h2>13. Changes to these terms</h2>
        <p>
          If we change these terms in a way that matters, we&apos;ll update the date at the top and email workspace owners at least 30 days before the change applies to them. Continuing to use Trainyard after that means you accept the new terms.
        </p>

        <h2>14. Contact</h2>
        <p>
          {LEGAL.operator}: <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </Prose>
    </PublicPage>
  );
}
