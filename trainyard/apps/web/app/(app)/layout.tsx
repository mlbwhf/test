import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nav } from "@/components/nav";

// Everything under here is the signed-in application: not for search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <Nav />
      <main className="main">{children}</main>
    </div>
  );
}
