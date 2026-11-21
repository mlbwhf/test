import type { Metadata } from "next";
import { publicApi } from "@/lib/public-api";
import { formatMoney } from "@/lib/format";
import { SampleBadge } from "@/components/sample-badge";
import { jsonLd, siteUrl } from "@/lib/seo";
import { APP } from "../sections";

export const metadata: Metadata = {
  title: "Verified digital badges for training providers",
  description: "Design a badge, issue it with every certificate or on its own, and let anyone verify it. Open Badges 3.0, shareable on LinkedIn. Move your earners from Credly for free. $1 per badge, no subscription.",
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

const MOVE = [
  ["Export from Credly", "In Credly, open the badge's issued list and export it as CSV. Accredible, Badgr / Canvas Credentials and Certopus exports work too."],
  ["Upload and check", "Create the badge program on EnrollClass, upload the file and see exactly who will move, with any rows we can't read, before anything happens."],
  ["Earners keep their dates", "Each person gets the same badge, signed by you, with their original issue date. Nobody has to earn it again."],
  ["“Your badge has moved”", "We email each earner a link to their badge on EnrollClass, ready to add to LinkedIn. Or move them quietly and tell them yourself."],
] as const;

const FAQ = [
  ["Who issues the badge, EnrollClass or me?", "You do. The badge names your organization as the issuer and is signed for you; EnrollClass hosts the verification."],
  ["Do learners need an account?", "No. They receive the badge by email and can download it or add it to LinkedIn straight away."],
  ["Can I bring my earners from Credly?", "Yes. Upload the CSV export of a badge's earners: each person gets the badge on EnrollClass with their original issue date and an email with a link to it. Moving earners is free. Badges already issued on Credly stay valid there until you close your account."],
  ["Do I have to sell classes on EnrollClass?", "No. Create a badge program, design its badge and issue it to people directly: after an exam, an event or training you ran somewhere else."],
  ["What does it cost?", "Nothing to design, set up or move earners. A badge you issue directly is $1, invoiced monthly. Badges on paid EnrollClass classes are $1 per paid seat, collected with the booking; free classes are free."],
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
          <p className="site-lede">Design a badge, issue it with your classes or on its own, and let anyone check it in seconds. Open Badges 3.0, no badge platform subscription. Moving from Credly? Bring your earners for free.</p>
          <div className="site-cta">
            <a href={`${APP}/login?mode=signup&returnTo=${encodeURIComponent("/badges")}`} className="pill pill-green">
              Start issuing badges
            </a>
            <a href={`${APP}/verify`} className="pill pill-outline">
              Verify a badge
            </a>
          </div>
          <p className="hero-learner">
            {price} per badge, no subscription. Moving earners from Credly: free.
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

      <section className="site-section" aria-labelledby="badge-move">
        <p className="eyebrow">Moving from Credly, Accredible or Badgr?</p>
        <h2 className="site-h2" id="badge-move">
          Bring your earners with you, free
        </h2>
        <div className="steps steps-4">
          {MOVE.map(([t, d], i) => (
            <article key={t} className="step">
              <p className="mono green">{String(i + 1).padStart(2, "0")}</p>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section sand" aria-labelledby="badge-why">
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
          Pay per badge, never per month
        </h2>
        <div className="tiers">
          <article className="tier tier-ink">
            <p className="mono">BADGES ON THEIR OWN</p>
            <p className="rate">$1</p>
            <p className="rate-sub">per badge issued, invoiced monthly</p>
            <p>Issue to anyone: exam passes, events, training you run elsewhere. Designer, signing, hosting, verification and emails included.</p>
          </article>
          <article className="tier tier-paper">
            <p className="mono">MOVING FROM CREDLY</p>
            <p className="rate">$0</p>
            <p className="rate-sub">for every earner you move</p>
            <p>Bring every earner from Credly, Accredible or Badgr with their original issue date. No limit on how many.</p>
          </article>
          <article className="tier tier-paper">
            <p className="mono">WITH YOUR CLASSES</p>
            <p className="rate">{price}</p>
            <p className="rate-sub">per paid seat, collected with the booking</p>
            <p>Every certificate on an EnrollClass class comes with the badge. Free classes stay free.</p>
          </article>
        </div>
        <p className="footnote">
          No setup fee, no monthly plan. See <a href="/pricing">full pricing</a> for the seat fee.
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
        <h2 className="site-h2">Give your earners a badge they'll share</h2>
        <div className="site-cta">
          <a href={`${APP}/login?mode=signup&returnTo=${encodeURIComponent("/badges")}`} className="pill pill-green">
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
