import type { Metadata } from "next";
import Link from "next/link";
import { Prose, PublicPage } from "@/components/public-page";
import { LEGAL, SECURITY_EMAIL, supportEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What Trainyard collects, why, who processes it for us, how long we keep it, and how to see, export, correct or delete your data.",
  alternates: { canonical: "/privacy" },
};

// The contact address comes from the server's settings.
export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  const email = supportEmail();
  return (
    <PublicPage crumbs={[{ href: "/privacy", label: "Privacy" }]}>
      <h1>Privacy policy</h1>
      <p className="lede">
        Trainyard is run by {LEGAL.operator}. This policy explains what we collect when you use trainyard.app, why, and what you can do about it. In effect from {LEGAL.effective}.
      </p>
      <Prose>
        <h2>The short version</h2>
        <ul>
          <li>We collect what we need to run your workspace and bill you, and nothing for advertising.</li>
          <li>There are no analytics or advertising trackers on trainyard.app and no tracking cookies.</li>
          <li>Card details go straight to Stripe; we never see or store your card number.</li>
          <li>We don&apos;t sell or rent personal information.</li>
          <li>You can export your workspace at any time and ask us to delete it.</li>
        </ul>

        <h2>Who is responsible</h2>
        <p>
          {LEGAL.operator} operates trainyard.app and is responsible for the personal information described here. For the content of a workspace (boards, plans, class work), the customer who owns the workspace decides what goes in it; we process that content on their behalf. Questions about privacy: <a href={`mailto:${email}`}>{email}</a>.
        </p>

        <h2>What we collect</h2>
        <h3>Account and sign-up</h3>
        <p>Your name, email address and company when you sign up or are invited; a password if you choose one (stored only as a salted scrypt hash, never in readable form); your role in the workspace; and a one-time code we email you to confirm your address.</p>
        <h3>Students in a class</h3>
        <p>When a trainer adds students to a class, we store each student&apos;s name and email so we can send them their personal link and show their name on the class board. Students don&apos;t create an account or a password.</p>
        <h3>What you put in Trainyard</h3>
        <p>Boards, sticky notes, plans, objectives, risks, class exercises, files and anything else you or your team add. If you connect Jira, Azure DevOps, Miro, Lucid, Mural, Trello or monday.com, we store the access tokens encrypted (AES-256-GCM) and the items we sync.</p>
        <h3>Payments</h3>
        <p>For paid plans: your plan, number of seats, billing interval and the status of your subscription and invoices. Stripe collects your card or bank details directly; we receive only a customer reference and the status of your payments.</p>
        <h3>Technical information</h3>
        <p>Our servers log each request with its time, address (URL) and the IP address it came from, to keep the service secure, limit abuse and fix problems. Your browser keeps your sign-in key and your current workspace in its local storage so you stay signed in; nothing else is stored on your device.</p>
        <h3>Booking a session</h3>
        <p>If you book a demo, support or billing call, the booking is made in Google Calendar, which collects the name, email and any note you enter and sends the invitation.</p>
        <h3>Writing to us</h3>
        <p>If you email us, we keep the conversation so we can help you and refer back to it.</p>

        <h2>Why we use it</h2>
        <ul>
          <li><b>To provide the service</b> you signed up for: running your workspace, sending sign-up codes, class links and the emails the product needs. This is necessary to perform our contract with you.</li>
          <li><b>To bill you</b> and meet tax and accounting obligations: subscriptions, invoices, trial confirmations and the reminder before your first charge.</li>
          <li><b>To keep Trainyard secure and working</b>: preventing abuse, investigating problems, backups. This is our legitimate interest in running a safe service.</li>
          <li><b>To answer you</b> when you contact support or book a session.</li>
        </ul>
        <p>We don&apos;t use your workspace content to train AI models. If your workspace uses the optional AI assistant, the text you ask it about is sent to the AI provider for that request only (see below).</p>

        <h2>Who processes it for us</h2>
        <p>We use a small number of service providers, each only for the job listed and under their own data protection terms:</p>
        <ul>
          <li><b>Hostinger</b>: the virtual server that runs Trainyard and stores its database.</li>
          <li><b>Cloudflare</b>: DNS and network protection in front of trainyard.app.</li>
          <li><b>Stripe</b>: payments, invoices and the customer billing portal.</li>
          <li><b>Postmark</b>: sending account, class and billing emails.</li>
          <li><b>Google Workspace</b>: our email, and Google Calendar for booked sessions.</li>
          <li><b>Anthropic</b>, only when the AI assistant is turned on for a workspace: processes the prompts sent to it.</li>
        </ul>
        <p>Some of these providers process data outside your country, including in the United States. Where the law requires it, we rely on their standard contractual safeguards for those transfers. We may also disclose information when the law requires it, or to protect the rights and safety of our users or the public.</p>

        <h2>How long we keep it</h2>
        <ul>
          <li>Workspace content and accounts: for as long as the workspace exists. When a workspace is deleted, its content is removed from the live service within 30 days and from backups as they roll over.</li>
          <li>Student names and emails: until the trainer removes the student or the class is deleted.</li>
          <li>Billing records: as long as tax and accounting law requires, usually seven years.</li>
          <li>Server logs: kept for a short period for security and troubleshooting, then deleted.</li>
        </ul>

        <h2>Your choices and rights</h2>
        <p>
          Depending on where you live (for example under Canada&apos;s PIPEDA, the EU and UK GDPR, or US state privacy laws), you can ask to see the personal information we hold about you, correct it, export it, delete it, or object to or restrict how we use it. Workspace owners can export everything from <b>Plan &amp; billing</b> at any time. For anything else, write to <a href={`mailto:${email}`}>{email}</a>; we answer within 30 days. If you are a student or a member of someone else&apos;s workspace, we may refer your request to the workspace owner, who controls that content. You can also complain to your data protection authority, such as the Office of the Privacy Commissioner of Canada.
        </p>

        <h2>Security</h2>
        <p>
          Traffic to trainyard.app is encrypted with HTTPS. Passwords are hashed, integration tokens are encrypted at rest, each workspace is kept separate, and access is limited to what each role needs. No service is perfectly secure; if we learn of a breach that affects you, we will tell you as the law requires. To report a vulnerability, email <a href={`mailto:${SECURITY_EMAIL}`}>{SECURITY_EMAIL}</a>.
        </p>

        <h2>Children</h2>
        <p>Trainyard is a professional tool for teams and trainers. It is not meant for children under 16, and we don&apos;t knowingly collect their information.</p>

        <h2>Changes</h2>
        <p>If we change this policy in a way that matters, we&apos;ll update the date at the top and tell workspace owners by email before the change takes effect.</p>

        <p>
          See also the <Link href="/terms">terms of service</Link>.
        </p>
      </Prose>
    </PublicPage>
  );
}
