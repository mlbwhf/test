import type { Metadata } from "next";
import { publicApi } from "@/lib/public-api";
import { formatMoney } from "@/lib/format";
import { SampleBadge } from "@/components/sample-badge";
import { jsonLd, siteUrl } from "@/lib/seo";
import { APP } from "../sections";

export const metadata: Metadata = {
  title: "Verified digital badges for training providers",
  description: "Design a badge, issue it with every certificate and let anyone verify it. Open Badges 3.0, shareable on LinkedIn, no badge platform subscription: $1 per paid seat, free on free classes.",
  alternates: { canonical: "/badges" },
};

const STEPS = [
  ["Design or upload", "Build a badge in the designer (shape, colours, icon, text) or upload your own artwork. Already on Credly or Accredible? Move your badges over in one click."],
  ["Teach the class", "Track attendance from Zoom or Teams, or mark it yourself. Choose whether only learners who attended get a certificate."],
  ["Issue with the certificate", "Every certificate comes with a signed badge. Learners get it by email and on their certificate page, ready to download."],
  ["Share and verify", "Learners add it to LinkedIn or an Open Badges wallet. Employers check it on EnrollClass's verify page, or with tools that support Open Badges 3.0."],
] as const;

const FEATURES = [
  ["Open Badges 3.0", "The open standard behind Credly and other platforms: a W3C verifiable credential, signed by your organization."],
  ["Proof inside the image", "The credential is baked into the badge PNG, so the image itself carries the proof wherever it travels."],
  ["Checks that last", "Anyone can verify a badge at enrollclass.com, years later. Badges keep the name and design they were issued with, even if you change the course."],
  ["No subscription", "No platform fee and no per-badge invoice: a small fee per paid seat, collected with the booking. Badges for free classes are free."],
  ["Award past learners", "Add a badge to a course you've run for years and award it to everyone who already has a certificate, with an email."],
  ["Works with what you use", "Keep a Credly or Accredible badge linked if you prefer, or send every new certificate to other tools with a webhook."],
] as const;

const FAQ = [
  ["Who issues the badge, EnrollClass or me?", "You do. The badge names your organization as the issuer and is signed for you; EnrollClass hosts the verification."],
  ["Do learners need an account?", "No. They receive the badge by email and can download it or add it to LinkedIn straight away."],
  ["Can I bring badges from Credly?", "Yes. We copy each badge's name and image, then award it to past learners if you want. Badges already issued on Credly stay valid there."],
  ["What does it cost?", "Nothing to design or set up. Each paid seat on a course that issues a verified badge carries a small fee, shown below; free classes are free."],
] as const;

export default async function BadgesMarketingPage() {
  const fees = await publicApi.getFees();
  const perSeat = fees.ok ? fees.data.currencies.USD?.verifiedBadgeMinor ?? 100 : 100;
  const price = formatMoney(perSeat, "USD").replace(/\.00$/, "");
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: `${siteUrl()}/badges`,
    mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <section className="site-hero badges-hero">
        <div>
          <p className="eyebrow">Verified digital badges</p>
          <h1 className="site-h1">Badges your learners are proud to share.</h1>
          <p className="site-lede">Design a badge, issue it with every certificate, and let anyone check it in seconds. Open Badges 3.0, no badge platform subscription.</p>
          <div className="site-cta">
            <a href={`${APP}/login?mode=signup`} className="pill pill-green">
              Start issuing badges
            </a>
            <a href={`${APP}/verify`} className="pill pill-outline">
              Verify a badge
            </a>
          </div>
          <p className="hero-learner">
            {price} per paid seat on courses that issue one. Free classes: free.
          </p>
        </div>
        <SampleBadge />
      </section>

      <section className="site-section sand" aria-labelledby="badge-how">
        <h2 className="site-h2" id="badge-how">
          From class to LinkedIn in four steps
        </h2>
        <div className="steps steps-4">
          {STEPS.map(([t, d], i) => (
            <article key={t} className="step">
              <p className="mono green">{String(i + 1).padStart(2, "0")}</p>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section" aria-labelledby="badge-why">
        <h2 className="site-h2" id="badge-why">
          Real credentials, not just pictures
        </h2>
        <div className="feature-grid">
          {FEATURES.map(([t, d]) => (
            <article key={t} className="feature">
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section sand badge-price" aria-labelledby="badge-price">
        <h2 className="site-h2" id="badge-price">
          One price, only when a seat sells
        </h2>
        <div className="tiers">
          <article className="tier tier-ink">
            <p className="mono">VERIFIED BADGE</p>
            <p className="rate">{price}</p>
            <p className="rate-sub">per paid seat, collected with the booking</p>
            <p>Designer, signing, hosting, verification and emails included. No setup fee, no monthly plan, no per-badge invoice.</p>
          </article>
          <article className="tier tier-paper">
            <p className="mono">FREE CLASSES</p>
            <p className="rate">$0</p>
            <p className="rate-sub">badges on free classes are free</p>
            <p>Run a free workshop or an internal training for your team and badge everyone who attends.</p>
          </article>
        </div>
        <p className="footnote">
          Badges come with EnrollClass registrations and certificates. See <a href="/pricing">full pricing</a> for the seat fee.
        </p>
      </section>

      <section className="site-section home-faq" aria-labelledby="badge-faq">
        <h2 id="badge-faq">Questions</h2>
        {FAQ.map(([q, a]) => (
          <details key={q} className="faq-item">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
        <p className="faq-more">
          <a href="/help/badges">How badges work, step by step</a>
        </p>
      </section>

      <section className="site-section ink cta-band">
        <h2 className="site-h2">Give your next cohort a badge</h2>
        <div className="site-cta">
          <a href={`${APP}/login?mode=signup`} className="pill pill-green">
            Sign up free
          </a>
          <a href={`${APP}/verify`} className="pill pill-outline-paper">
            Verify a badge
          </a>
        </div>
      </section>
    </>
  );
}
