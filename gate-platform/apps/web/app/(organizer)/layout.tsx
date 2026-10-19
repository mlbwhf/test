import type { ReactNode } from "react";
import { Logo } from "@/components/brand";
import { OrganizerNav } from "@/components/organizer-nav";

export default function OrganizerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="topbar">
        <Logo href="/dashboard" />
        <OrganizerNav />
      </header>
      <main>{children}</main>
    </>
  );
}
