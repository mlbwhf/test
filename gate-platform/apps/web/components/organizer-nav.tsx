"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: Array<[href: string, label: string]> = [
  ["/dashboard", "Dashboard"],
  ["/events", "Events"],
  ["/courses", "Courses"],
  ["/instructors", "Instructors"],
  ["/orders", "Orders"],
  ["/money", "Money"],
  ["/import", "Import"],
];

export function OrganizerNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Primary">
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
