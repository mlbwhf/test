import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import "./fonts.css";
import "./globals.css";
import "./method-fonts.css";
import { apiUrl, inlineJson, siteUrl } from "@/lib/site";
import { locate } from "@/lib/spaces";

export async function generateMetadata(): Promise<Metadata> {
  const base = siteUrl();
  return {
    metadataBase: new URL(base),
    title: { default: "Trainyard: scaled agile planning, PI planning boards and AI portfolio management", template: "%s · Trainyard" },
    description:
      "Open-source planning rooms for SAFe, LeSS, Scrum@Scale, Nexus and Flight Levels. PI planning boards, ROAM, program board and dashboards synced two ways with Jira and Azure DevOps, an AI-native portfolio module, and bring-your-own boards from Miro, Mural, monday.com and Trello.",
    applicationName: "Trainyard",
    keywords: ["PI planning", "SAFe", "scaled agile", "PI planning board", "program board", "PI planning tool comparison", "value stream mapping", "SAFe canvases", "Jira app", "Azure DevOps extension", "Jira", "Azure DevOps", "AI-native SAFe", "lean portfolio management", "open source"],
    openGraph: { type: "website", siteName: "Trainyard", url: base, images: [{ url: "/og.png", width: 1200, height: 630, alt: "Trainyard: a PI planning board in the glass theme" }] },
    twitter: { card: "summary_large_image", images: ["/og.png"] },
    icons: { icon: "/icon.svg" },
    // Search Console and Bing Webmaster Tools ownership, set on the server without a rebuild.
    verification: {
      ...(process.env.TRAINYARD_GOOGLE_VERIFICATION ? { google: process.env.TRAINYARD_GOOGLE_VERIFICATION } : {}),
      ...(process.env.TRAINYARD_BING_VERIFICATION ? { other: { "msvalidate.01": process.env.TRAINYARD_BING_VERIFICATION } } : {}),
    },
    alternates: { canonical: "/", types: { "text/plain": [{ url: "/llms.txt", title: "llms.txt" }] } },
    // App pages override this with noindex in their own layout.
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // The API URL is read when the page is served, not when the image is built, so one web
  // image runs on any domain. The nonce comes from proxy.ts, which also sets the CSP.
  const h = await headers();
  const nonce = h.get("x-nonce") ?? undefined;
  // Signed-in spaces paint in their theme from the first byte (the shell keeps it in step after).
  const theme = h.get("x-embed") === "1" ? undefined : locate(h.get("x-pathname") ?? "")?.space.theme;
  const api = apiUrl();
  return (
    <html lang="en" data-theme={theme}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {api ? <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `window.__TRAINYARD_API__=${inlineJson(api)}` }} /> : null}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: inlineJson([{ "@context": "https://schema.org", "@type": "Organization", name: "Trainyard", url: siteUrl(), logo: `${siteUrl()}/icon.svg`, description: "Open-source planning rooms for scaled agile, an outcome dashboard for executives and boards, and free class boards for SAFe trainers.", sameAs: ["https://github.com/mlbwhf/test"] }, { "@context": "https://schema.org", "@type": "WebSite", name: "Trainyard", url: siteUrl() }]) }} />
        {children}
      </body>
    </html>
  );
}
export const dynamic = "force-dynamic";
