import type { ReactNode } from "react";
import Link from "next/link";

export default function OrganizerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="topbar">
        <Link href="/dashboard" className="brand">
          EnrollClass
        </Link>
        <nav aria-label="Primary">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/events">Events</Link>
          <Link href="/courses">Courses</Link>
          <Link href="/instructors">Instructors</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/money">Money</Link>
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
}
