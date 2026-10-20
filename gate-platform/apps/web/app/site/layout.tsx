import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Logo, SeatMark } from "@/components/brand";

export const metadata: Metadata = {
  title: { default: "EnrollClass: payments and enrollment for training businesses", template: "%s · EnrollClass" },
  description: "Publish cohorts, take registrations by card or invoice, and receive funds in your Stripe account once the course is delivered.",
};

const APP = `https://app.${process.env.GATE_DOMAIN ?? "enrollclass.com"}`;

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site">
      <header className="site-nav">
        <Logo href="/" size={12} />
        <nav aria-label="Site">
          <Link href="/#how">How it works</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#start">For instructors</Link>
          <Link href="/classes">Find a class</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/help">Help</Link>
        </nav>
        <div className="site-nav-actions">
          <a href={`${APP}/login`} className="site-link">
            Log in
          </a>
          <a href={`${APP}/login?mode=signup`} className="pill pill-ink">
            Sign up free
          </a>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div className="site-footer-brand">
          <SeatMark size={12} ink="var(--paper)" />
          <span className="wordmark">enrollclass</span>
        </div>
        <nav aria-label="Legal">
          <Link href="/classes">Find a class</Link>
          <Link href="/help">Help center</Link>
          <Link href="/faq">FAQ</Link>
          <a href={`${process.env.GATE_PUBLIC_API_URL ?? `https://api.${process.env.GATE_DOMAIN ?? "enrollclass.com"}`}/docs`}>API reference</a>
          <Link href="/terms">Terms of service</Link>
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/refunds">Refunds and cancellations</Link>
          <a href="mailto:support@enrollclass.com">support@enrollclass.com</a>
        </nav>
        <p className="mono">© {new Date().getFullYear()} EnrollClass. Payments processed by Stripe.</p>
      </footer>
    </div>
  );
}
