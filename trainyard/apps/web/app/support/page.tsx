import type { Metadata } from "next";
import Link from "next/link";
import { Prose, PublicPage } from "@/components/public-page";
import { HELP, HELP_SPACES } from "@/lib/help";
import { ISSUES_URL, REPO_URL, SECURITY_EMAIL, supportEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "Support and how to use Trainyard",
  description: "How to get help with Trainyard: help inside the app, email support by plan, bug reports and feature requests, security reports, billing, and a page-by-page guide to using every part of the product.",
  alternates: { canonical: "/support" },
};

// Read at request time so the address can change on the server without a rebuild.
export const dynamic = "force-dynamic";

export default function SupportPage() {
  const email = supportEmail();
  return (
    <PublicPage
      crumbs={[{ href: "/support", label: "Support" }]}
      jsonLd={[{ "@context": "https://schema.org", "@type": "Organization", name: "Trainyard", contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", email, availableLanguage: ["English"] }, { "@type": "ContactPoint", contactType: "security", email: SECURITY_EMAIL }] }]}
    >
      <h1>Support, help and how to use Trainyard.</h1>
      <p className="lede">Most answers are one keystroke away: press ? on any page inside Trainyard for the help on that page. When you need a person, here is who to reach and how.</p>
      <Prose>
        <h2>Get help</h2>
        <div className="ly-cards">
          <div className="ly-card">
            <span className="tag">IN THE APP</span>
            <h3>Help on every page</h3>
            <p>
              Press <b>?</b> or use the ? in the top bar: what the page is for and how to use it, step by step. The full help centre is under the account menu → Help and how-to.
            </p>
          </div>
          <div className="ly-card">
            <span className="tag">EMAIL</span>
            <h3>Write to a person</h3>
            <p>
              <a href={`mailto:${email}`}>{email}</a>. Trainer and Insights include email support; Academy adds a named success lead. Practice is supported by the community.
            </p>
          </div>
          <div className="ly-card">
            <span className="tag">BUGS AND IDEAS</span>
            <h3>Open an issue</h3>
            <p>
              Trainyard is open source. Report a bug or ask for a feature on <a href={ISSUES_URL} rel="noopener">GitHub issues</a>, where you can follow the fix.
            </p>
          </div>
          <div className="ly-card">
            <span className="tag">SECURITY</span>
            <h3>Report a vulnerability</h3>
            <p>
              Email <a href={`mailto:${SECURITY_EMAIL}`}>{SECURITY_EMAIL}</a> with the steps to reproduce; you get an answer within three working days. Please do not open a public issue until a fix has shipped.
            </p>
          </div>
        </div>

        <h2>What to include</h2>
        <ul>
          <li>Your workspace name (shown in the account menu) and the email you sign in with.</li>
          <li>The page you were on (copy the address) and what you expected to happen.</li>
          <li>The steps that lead to the problem, and a screenshot if you can.</li>
          <li>For Jira or Azure DevOps sync: the site or organisation and the project or area path.</li>
        </ul>
        <p>Never send passwords or API keys. If a key may have leaked, rotate it under Users.</p>

        <h2>Billing</h2>
        <p>
          Plans, seats, invoices and the switch to yearly are under <b>Plan &amp; billing</b> in the account menu. Every paid plan starts with a free 30-day trial and a reminder 7 days before the first charge; within your first paid month you can claim your money back there yourself. See <Link href="/pricing">pricing</Link>.
        </p>

        <h2>Hosting it yourself</h2>
        <p>
          The whole product is Apache-2.0. Installation, configuration and the API are documented in the <a href={REPO_URL} rel="noopener">README</a>; the API serves its OpenAPI reference at /docs.
        </p>

        <h2>How to use Trainyard</h2>
        {HELP_SPACES.map((space) => (
          <section key={space}>
            <h3 style={{ marginTop: 28 }}>{space}</h3>
            {HELP.filter((h) => h.space === space).map((h) => (
              <div key={h.path} style={{ marginTop: 14 }}>
                <h4 style={{ margin: "0 0 4px" }}>{h.title}</h4>
                <p style={{ margin: "0 0 6px" }}>{h.what}</p>
                <ol style={{ margin: 0 }}>
                  {h.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                {h.tips?.map((t) => (
                  <p key={t} style={{ margin: "6px 0 0", opacity: 0.75 }}>
                    {t}
                  </p>
                ))}
              </div>
            ))}
          </section>
        ))}
      </Prose>
    </PublicPage>
  );
}
