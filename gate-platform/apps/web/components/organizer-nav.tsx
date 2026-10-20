"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DISMISSED_EVENT, readDismissed } from "@/lib/dismissed";

/** A top-level area of the console and the pages it groups (first one is the area's home). */
export type Section = { key: string; label: string; pages: Array<[href: string, label: string]> };

const matches = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
const sectionOf = (sections: Section[], pathname: string) => sections.find((s) => s.pages.some(([href]) => matches(pathname, href)));

/** Open attention items not dismissed on this device. */
function useOpenCount(ids: string[]): number {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  useEffect(() => {
    const sync = () => setHidden(readDismissed());
    sync();
    window.addEventListener(DISMISSED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DISMISSED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return ids.filter((id) => !hidden.has(id)).length;
}

export function ConsoleNav({ sections, attentionIds }: { sections: Section[]; attentionIds: string[] }) {
  const pathname = usePathname() ?? "";
  const current = sectionOf(sections, pathname);
  const open = useOpenCount(attentionIds);
  return (
    <nav aria-label="Primary" className="console-nav">
      {sections.map((s) => (
        <Link key={s.key} href={s.pages[0]![0]} aria-current={current?.key === s.key ? "page" : undefined}>
          {s.label}
          {s.key === "home" && open > 0 && (
            <span className="console-badge" aria-label={`${open} open task${open === 1 ? "" : "s"}`}>
              {open}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

/** Pages inside the current area (Events · Courses · Check-in · Import, Money · Orders…). */
export function SectionTabs({ sections }: { sections: Section[] }) {
  const pathname = usePathname() ?? "";
  const current = sectionOf(sections, pathname);
  if (!current || current.pages.length < 2) return null;
  return (
    <nav aria-label={current.label} className="section-tabs">
      {current.pages.map(([href, label]) => (
        <Link key={href} href={href} aria-current={matches(pathname, href) ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Phone: floating tab bar with Home · Events · Check-in · Money and a green "+". */
export function MobileTabs({ tabs, createHref }: { tabs: Array<{ href: string; label: string; also?: string[] }>; createHref: string | null }) {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Primary" className="mobile-tabs">
      {tabs.map(({ href, label, also = [] }) => (
        <Link key={href} href={href} aria-current={[href, ...also].some((h) => matches(pathname, h)) ? "page" : undefined}>
          {label}
        </Link>
      ))}
      {createHref && (
        <Link href={createHref} className="mobile-create" aria-label="Create event">
          +
        </Link>
      )}
    </nav>
  );
}
