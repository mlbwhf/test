import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gate Dashboard",
  description: "Organizer dashboard for the Gate payments platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/dashboard" className="brand">
            Gate
          </Link>
          <nav aria-label="Primary">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/events">Events</Link>
            <Link href="/orders">Orders</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
