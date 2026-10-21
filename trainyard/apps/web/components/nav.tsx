"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { setApiKey, useMe } from "@/lib/api";

const LINKS: { href: string; label: string; section?: string }[] = [
  { href: "/", label: "Dashboards", section: "Plan" },
  { href: "/board", label: "Program board" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/ai", label: "AI portfolio", section: "AI" },
  { href: "/agents", label: "AI agents" },
  { href: "/model", label: "Operating model", section: "Setup" },
  { href: "/sync", label: "Jira & Azure DevOps" },
  { href: "/users", label: "Users" },
];

function Mark() {
  // Two rails converging on a switch: the train yard where every team's work meets.
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 20 L12 4 L21 20" stroke="#f0b43a" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7 13h10M5.3 16.5h13.4" stroke="#dfe5ea" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Nav() {
  const path = usePathname();
  const me = useMe();
  // Signing in or out happens on another route; refetch so the footer follows it.
  useEffect(() => {
    void me.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <nav className="rail" aria-label="Main">
      <Link href="/" className="brand">
        <Mark />
        Trainyard
      </Link>
      {LINKS.map((l) => (
        <div key={l.href} style={{ display: "contents" }}>
          {l.section ? <div className="section">{l.section}</div> : null}
          <Link href={l.href} className="nav" aria-current={active(l.href) ? "page" : undefined}>
            {l.label}
          </Link>
        </div>
      ))}
      <div className="foot stack" style={{ gap: 4 }}>
        <span>Northwind Digital</span>
        {me.data ? (
          <span className="row" style={{ gap: 6 }}>
            {me.data.open ? "Open mode" : `${me.data.principal.name} · ${me.data.principal.role}`}
            {!me.data.open ? (
              <button className="btn ghost small" style={{ color: "inherit" }} onClick={() => (setApiKey(null), window.location.assign("/login"))}>
                Sign out
              </button>
            ) : null}
          </span>
        ) : null}
      </div>
    </nav>
  );
}
