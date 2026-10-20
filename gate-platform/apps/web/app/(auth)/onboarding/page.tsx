import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { ActionForm } from "@/components/action-form";
import { createOrganizationAction } from "@/app/auth-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set up" };

const COUNTRIES: Array<[string, string, string]> = [
  ["US", "United States", "USD"], ["CA", "Canada", "CAD"], ["GB", "United Kingdom", "GBP"], ["IE", "Ireland", "EUR"], ["DE", "Germany", "EUR"], ["FR", "France", "EUR"],
  ["NL", "Netherlands", "EUR"], ["ES", "Spain", "EUR"], ["IT", "Italy", "EUR"], ["AU", "Australia", "AUD"], ["NZ", "New Zealand", "NZD"], ["AE", "United Arab Emirates", "AED"],
  ["SA", "Saudi Arabia", "SAR"], ["KW", "Kuwait", "KWD"], ["IN", "India", "INR"], ["SG", "Singapore", "SGD"], ["ZA", "South Africa", "ZAR"],
];
const CURRENCIES = ["USD", "CAD", "EUR", "GBP", "AUD", "NZD", "AED", "SAR", "KWD", "INR", "SGD", "ZAR"];

type SP = Record<string, string | string[] | undefined>;

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const me = await api.me();
  if (!me.ok) redirect("/login?returnTo=/onboarding");
  const another = sp.new === "1";
  if (me.data.organization && !another) redirect("/dashboard");
  const first = me.data.user.name?.split(" ")[0];

  return (
    <section className="auth-card auth-card-wide">
      <p className="eyebrow-mono">{another ? "NEW WORKSPACE" : "STEP 1 OF 2"}</p>
      <h1>{first && !another ? `Welcome, ${first}. How do you teach?` : "How do you teach?"}</h1>
      <p className="muted">Both can publish classes, take payments and check people in. You can invite colleagues later either way.</p>
      <ActionForm action={createOrganizationAction} submitLabel="Continue" pendingLabel="Setting up…" wide>
        <div className="kind-choice" role="radiogroup" aria-label="Account type">
          <label className="kind-card">
            <input type="radio" name="kind" value="individual" defaultChecked />
            <span className="kind-title">Independent instructor</span>
            <span className="kind-body">You teach your own classes. Your name appears as the provider and you are the instructor.</span>
          </label>
          <label className="kind-card">
            <input type="radio" name="kind" value="company" />
            <span className="kind-title">Training organization</span>
            <span className="kind-body">A company with several instructors. Invite instructors, admins and finance with their own access.</span>
          </label>
        </div>
        <label>
          Organization name <span className="hint">(for an organization; instructors can leave this blank to use their name)</span>
          <input name="name" maxLength={120} placeholder="e.g. Agile Agilist" />
        </label>
        <div className="fields-row">
          <label>
            Country
            <select name="country" defaultValue="US">
              {COUNTRIES.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Currency you charge in
            <select name="currency" defaultValue="USD">
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="hint">Next you'll connect Stripe to receive payouts, then publish your first cohort.</p>
      </ActionForm>
      {another && (
        <p className="auth-small">
          <a href="/dashboard">← Back to the dashboard</a>
        </p>
      )}
    </section>
  );
}
