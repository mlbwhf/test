import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { EmbedBar } from "@/components/embed-bar";
import { Nav } from "@/components/nav";
import { WorkspaceBanner } from "@/components/workspace-banner";

// Everything under here is the signed-in application: not for search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Inside the Jira app or the Azure DevOps extension (see proxy.ts): no side navigation.
  if ((await headers()).get("x-embed") === "1") {
    return (
      <div className="shell embed">
        <EmbedBar />
        <main className="main">{children}</main>
      </div>
    );
  }
  return (
    <div className="shell">
      <Nav />
      <main className="main">
        <WorkspaceBanner />
        {children}
      </main>
    </div>
  );
}
