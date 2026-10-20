import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { Logo } from "@/components/brand";
import { SESSION_COOKIE } from "@/lib/session";

export const metadata = { title: { default: "Help", template: "%s · EnrollClass Help" }, description: "Guides for organizers, instructors, finance and learners using EnrollClass." };

export default async function HelpLayout({ children }: { children: ReactNode }) {
  const signedIn = Boolean((await cookies()).get(SESSION_COOKIE)?.value);
  return (
    <div className="help">
      <header className="help-top">
        <Logo href="/help" context="Help" />
        <nav>
          {signedIn ? (
            <Link className="pill-btn" href="/dashboard">
              Back to console
            </Link>
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link className="pill-btn" href="/login?mode=signup">
                Start free
              </Link>
            </>
          )}
        </nav>
      </header>
      {children}
      <footer className="help-foot">
        <span>EnrollClass</span>
        <Link href="/help">Help center</Link>
        <a href="https://api.enrollclass.com/docs" target="_blank" rel="noreferrer">
          API reference
        </a>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
      </footer>
    </div>
  );
}
