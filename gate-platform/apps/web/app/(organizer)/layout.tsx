import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { OrganizerNav } from "@/components/organizer-nav";

export default function OrganizerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="topbar">
        <Logo href="/dashboard" />
        <OrganizerNav />
        <Link href="/events#create" className="topbar-cta">
          Create event
        </Link>
      </header>
      <main>{children}</main>
    </>
  );
}
