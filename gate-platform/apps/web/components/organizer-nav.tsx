"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLink = [href: string, label: string];

export function OrganizerNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Primary">
      {links.map(([href, label]) => (
        <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
