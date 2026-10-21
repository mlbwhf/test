import type { Metadata } from "next";
import { APP, FaqSection, PricingSection, feeData } from "../sections";

export const metadata: Metadata = {
  title: "Pricing",
  description: "One fee per paid seat, nothing monthly. Free classes are free. Compare Protected and Direct payments, optional extras, and what a seat costs on other platforms.",
  alternates: { canonical: "/pricing" },
};

const PRICING_FAQ = ["How much does it cost?", "Do you charge anything for free classes?", "When do I get paid?", "Are there any other fees?"];

export default async function PricingPage() {
  const data = await feeData();
  return (
    <>
      <header className="page-head">
        <p className="eyebrow">Pricing</p>
        <h1>Pay per seat. Nothing monthly.</h1>
        <p>Free to start, free classes are always free, and you choose how the money flows for paid ones.</p>
      </header>
      <PricingSection data={data} full />
      <FaqSection questions={PRICING_FAQ} />
      <section className="site-section ink cta-band">
        <h2 className="site-h2">Start free, pay only when seats sell</h2>
        <div className="site-cta">
          <a href={`${APP}/login?mode=signup`} className="pill pill-green">
            Sign up free
          </a>
        </div>
      </section>
    </>
  );
}
