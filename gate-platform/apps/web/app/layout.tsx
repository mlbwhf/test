import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

// Brand type: Bricolage Grotesque for display, Instrument Sans for body, IBM Plex Mono
// for money, dates and labels. next/font self-hosts the files at build time.
const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-display", display: "swap" });
const body = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

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
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
