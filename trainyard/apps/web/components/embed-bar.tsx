"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// The compact header for pages shown inside the Jira app or the Azure DevOps extension.
// Links stay on normal paths: navigating inside the frame is still served as embedded.
const LINKS = [
  { href: "/board", label: "Program board" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/value-streams", label: "Value streams" },
  { href: "/canvases", label: "Canvases" },
  { href: "/outcome-planning", label: "Outcome planning" },
  { href: "/dashboards", label: "Dashboards" },
];

function Bar() {
  const path = usePathname();
  const params = useSearchParams();
  const project = params.get("project");
  const active = (href: string) => path === href || path.startsWith(`${href}/`);
  return (
    <nav className="embed-bar" aria-label="Trainyard">
      <b className="embed-brand">Trainyard</b>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="nav" aria-current={active(l.href) ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
      <span style={{ flex: 1 }} />
      {project ? <span className="chip">{project}</span> : null}
      <a className="btn small ghost" href={path} target="_blank" rel="noopener">
        Open full screen
      </a>
    </nav>
  );
}

export function EmbedBar() {
  return (
    <Suspense fallback={<nav className="embed-bar" aria-label="Trainyard" />}>
      <Bar />
    </Suspense>
  );
}
