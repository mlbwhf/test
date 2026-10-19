import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "EnrollClass Dashboard",
  description: "Organizer dashboard for EnrollClass, payments and enrollment for training businesses",
};

// Bare document shell. The organizer chrome (top bar + nav) lives in
// app/(organizer)/layout.tsx; the learner self-service pages under /my get
// their own header in app/my/layout.tsx and never render dashboard links.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
