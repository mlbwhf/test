import Link from "next/link";
import { feeLabel } from "@/lib/fees";
import { ORGANIZATION_LD, apiUrl, appUrl, jsonLd, siteUrl } from "@/lib/seo";
import { LiveCohort } from "@/components/live-cohort";
import { APP, DashboardSection, FaqSection, HOME_FAQ, HowSection, PricingSection, StartSection, feeData } from "./sections";

const ON_THIS_PAGE = [
  ["#how", "How it works"],
  ["#dashboard", "Dashboard"],
  ["#pricing", "Pricing"],
  ["#start", "Who it's for"],
  ["#faq", "Questions"],
] as const;

export default async function SiteHome() {
  const data = await feeData();
  const { fees } = data;
  const ld = [
    ORGANIZATION_LD(),
    { "@context": "https://schema.org", "@type": "WebSite", "@id": `${siteUrl()}/#website`, name: "EnrollClass", url: siteUrl(), publisher: { "@id": `${siteUrl()}/#organization` } },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "EnrollClass",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: appUrl(),
      description: "Registration and payments for training providers: publish cohorts, take card or invoice payments held until delivery, check-in with QR tickets, certificates, team roles, webhooks, API and an MCP server for AI assistants.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: `Free to start, and free classes are always free. Paid seats: ${feeLabel(fees.protected, "USD")} all-in (Protected, held until delivery) or ${feeLabel(fees.direct, "USD")} plus card processing (Direct, paid to your Stripe).` },
      publisher: { "@id": `${siteUrl()}/#organization` },
      sameAs: [`${apiUrl()}/docs`],
    },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <section className="site-hero">
        <div>
          <p className="eyebrow">Cohort registration &amp; payments</p>
          <h1 className="site-h1">Fill every seat. Get paid when you teach.</h1>
          <p className="site-lede">Publish cohorts, take registrations by card or invoice, and receive funds in your Stripe account once the course is delivered.</p>
          <div className="site-cta">
            <a href={`${APP}/login?mode=signup`} className="pill pill-green">
              Sign up free
            </a>
            <a href="/pricing" className="pill pill-outline">
              See pricing
            </a>
          </div>
          <p className="hero-learner">
            Signing up for a class? No account needed: <Link href="/classes">find your class</Link> and register on its page.
          </p>
        </div>
        <LiveCohort />
      </section>

      <nav className="page-menu" aria-label="On this page">
        {ON_THIS_PAGE.map(([href, label]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
      </nav>

      <HowSection />
      <DashboardSection />
      <PricingSection data={data} />
      <StartSection />
      <FaqSection questions={HOME_FAQ} />
    </>
  );
}
