import type { Metadata } from "next";
import Link from "next/link";
import { SiteLogo } from "@/components/site-nav";
import { supportEmail } from "@/lib/site";
import "@/app/site.css";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** Any address the site does not have: the 404 from the design, with a way home and a way to a person. */
export default function NotFound() {
  const email = supportEmail();
  return (
    <section className="nf">
      <nav>
        <Link href="/" className="nf-brand">
          <SiteLogo size={44} />
          <span>
            Train<span className="nf-blue">yard</span>
          </span>
        </Link>
      </nav>
      <main id="main" className="nf-main">
        <div className="nf-copy">
          <div className="nf-mono nf-pink">ERROR 404 · PAGE NOT FOUND</div>
          <h1>This class isn&apos;t on the board.</h1>
          <p>The page you&apos;re after has moved, finished, or never started. Head back and we&apos;ll find you a seat.</p>
          <div className="nf-ctas">
            <Link href="/" className="nf-primary">
              Back to home
            </Link>
            <Link href="/book" className="nf-ghost">
              Book a session
            </Link>
          </div>
          <div className="nf-mono nf-help">
            Need a hand? <a href={`mailto:${email}`}>{email}</a>
          </div>
        </div>
        <div className="nf-glass" aria-hidden="true">
          <svg viewBox="0 0 240 240">
            <path d="M52 16h136a32 32 0 0 1 32 32v100a32 32 0 0 1-32 32H96l-46 38v-38h2A32 32 0 0 1 20 148V48a32 32 0 0 1 32-32z" fill="#5f7bff" transform="translate(0 2)" />
            <circle cx="120" cy="98" r="58" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="9" />
            <circle cx="120" cy="98" r="58" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeDasharray="365" strokeDashoffset="250" transform="rotate(-90 120 98)" />
            <text x="120" y="118" textAnchor="middle" fontSize="64" fontWeight="700" letterSpacing="-3" fill="#fff" fontFamily="-apple-system,Helvetica,Arial,sans-serif">
              404
            </text>
            <g className="nf-drift" style={{ ["--r" as string]: "-14deg" }}>
              <rect x="56" y="-6" width="26" height="26" rx="6" fill="#ffe27a" />
            </g>
            <g className="nf-drift" style={{ ["--r" as string]: "12deg", animationDuration: "5s", animationDelay: ".6s" }}>
              <rect x="168" y="-12" width="24" height="24" rx="6" fill="#ff9fc6" />
            </g>
            <g className="nf-drift" style={{ ["--r" as string]: "8deg", animationDuration: "4.5s", animationDelay: "1.2s" }}>
              <rect x="206" y="62" width="20" height="20" rx="5" fill="#5ff0e0" />
            </g>
            <rect x="186" y="170" width="44" height="34" rx="12" fill="#ff5fa2" stroke="#0a0a1f" strokeWidth="4" />
            <circle cx="198" cy="187" r="3.5" fill="#fff" />
            <circle className="nf-dot" cx="208" cy="187" r="3.5" fill="#fff" style={{ animationDelay: ".2s" }} />
            <circle className="nf-dot" cx="218" cy="187" r="3.5" fill="#fff" style={{ animationDelay: ".4s" }} />
          </svg>
        </div>
      </main>
    </section>
  );
}
