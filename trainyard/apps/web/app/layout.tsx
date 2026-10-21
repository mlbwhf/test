import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./fonts.css";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: { default: "Trainyard", template: "%s · Trainyard" },
  description: "Scaled agile planning and AI portfolio management across Jira and Azure DevOps",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // The API URL is read when the page is served, not when the image is built, so one
  // web image runs on any domain. Falls back to the build-time value, then localhost.
  const apiUrl = process.env.TRAINYARD_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_TRAINYARD_API_URL ?? "";
  return (
    <html lang="en">
      <body>
        {apiUrl ? <script dangerouslySetInnerHTML={{ __html: `window.__TRAINYARD_API__=${JSON.stringify(apiUrl)}` }} /> : null}
        <div className="shell">
          <Nav />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
export const dynamic = "force-dynamic";
