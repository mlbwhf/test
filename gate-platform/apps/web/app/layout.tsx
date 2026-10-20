import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./fonts.css";
import "./globals.css";

// Brand type: Bricolage Grotesque for display, Instrument Sans for body, IBM Plex Mono for
// money, dates and labels. Served from /fonts (app/fonts.css), so builds need no network.

export const metadata: Metadata = {
  title: { default: "EnrollClass", template: "%s · EnrollClass" },
  description: "Payments and enrollment for professional training businesses",
};

// Bare document shell. The organizer chrome (top bar + nav) lives in
// app/(organizer)/layout.tsx; the learner self-service pages under /my get
// their own header in app/my/layout.tsx and never render dashboard links;
// the public marketing site lives under app/site and is reached through proxy.ts.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
