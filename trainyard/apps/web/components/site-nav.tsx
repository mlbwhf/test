"use client";

// The public site's navigation and footer (design handoff "TrainyardNav"): the animated mixed
// logo, Modules and Integrations mega-menus (hover or click; Esc, a click outside or leaving the
// bar closes them), Pricing, FAQ, Sign in and Register. Shared by the home page and every public page.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { REPO_URL } from "@/lib/site";

export function SiteLogo({ size = 58 }: { size?: number }) {
  return (
    <svg className="sl-logo" width={size} height={size} viewBox="0 0 240 240" aria-hidden="true">
      <g className="sl-out">
        <g className="sl-bub">
          <path d="M52 16h136a32 32 0 0 1 32 32v100a32 32 0 0 1-32 32H96l-46 38v-38h2A32 32 0 0 1 20 148V48a32 32 0 0 1 32-32z" fill="#4a5fe8" transform="translate(0 2)" />
        </g>
        <circle cx="120" cy="98" r="58" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="10" />
        <circle className="sl-ring" cx="120" cy="98" r="58" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeDasharray="365" transform="rotate(-90 120 98)" />
        <g className="sl-bob">
          <rect className="sl-bar" x="92" y="72" width="56" height="16" rx="5" fill="#fff" />
          <rect className="sl-post" x="112" y="88" width="16" height="42" rx="5" fill="#fff" />
        </g>
        <rect className="sl-p1" x="70" y="100" width="17" height="17" rx="4" fill="#ffe27a" />
        <rect className="sl-p2" x="152" y="96" width="17" height="17" rx="4" fill="#ff9fc6" />
        <rect className="sl-p3" x="152" y="118" width="17" height="17" rx="4" fill="#5ff0e0" />
        <g className="sl-join">
          <rect x="186" y="170" width="44" height="34" rx="12" fill="#ff3d8f" stroke="#f4f1ea" strokeWidth="5" />
          <circle cx="198" cy="187" r="3.5" fill="#fff" />
          <circle className="sl-dot" cx="208" cy="187" r="3.5" fill="#fff" />
          <circle className="sl-dot sl-dot2" cx="218" cy="187" r="3.5" fill="#fff" />
        </g>
      </g>
    </svg>
  );
}

const MODULES = [
  { tag: "CLASSES · TRAINER", t: "Classes", href: "/classes", bg: "#ffe27a", fg: "#14123a", d: "Class boards for SAFe trainers, one per cohort.", items: [["Leading SAFe", "/classes/leading-safe"], ["SPC", "/classes/spc"], ["Advanced SPC", "/classes/aspc"], ["POPM", "/classes/popm"], ["RTE", "/classes/rte"]] },
  { tag: "TEMPLATES · ANY METHOD", t: "Templates", href: "/methods", bg: "#4a5fe8", fg: "#fff", d: "Pick a method and the whole board changes shape.", items: [["SAFe", "/methods#safe"], ["Scrum", "/methods#scrum"], ["Kanban", "/methods#kanban"], ["Lean", "/methods#lean"], ["Six Sigma", "/methods#six-sigma"], ["Manufacturing", "/methods#manufacturing"], ["General", "/methods#general"]] },
  { tag: "OKRs · INSIGHTS", t: "OKRs", href: "/insights", bg: "#ff9fc6", fg: "#14123a", d: "Outcomes, KPIs and funding for executives.", items: [["Dashboard", "/insights#dashboard"], ["Alignment", "/insights#alignment"], ["Check-in", "/insights#checkin"], ["One-pagers", "/insights#onepager"], ["Live example", "/examples/okrs-kpis"]] },
] as const;

export const INTEGRATIONS = [
  { t: "TRACKERS", items: [["Jira", "Jira app (Atlassian Forge) with two-way sync"], ["Azure DevOps", "Extension with sync"]] },
  { t: "BRING YOUR BOARDS", items: [["Miro, Mural, Trello, monday.com, iObeya", "Connect or upload; boards arrive as they are"], ["Any spreadsheet", "CSV from Excel, Sheets, Airtable or Jira"]] },
  { t: "DATA FOR OKRs", items: [["CSV", "Any system that exports a table"], ["CRM, finance, surveys", "Learning platform, vendors, Jira"]] },
  { t: "AI", items: [["AI co-trainer", "Bring your own key. You approve everything."], ["Open source", "Apache-2.0, self-host with every feature"]] },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState<"mod" | "int" | null>(null);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const click = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(null);
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", click);
    return () => (window.removeEventListener("keydown", key), window.removeEventListener("pointerdown", click));
  }, []);
  // Hover opens a menu only with a real pointer; touch taps toggle it.
  const hover = (m: "mod" | "int" | null) => () => window.matchMedia("(hover: hover)").matches && setOpen(m);
  return (
    <nav className="ly-nav sl-nav" aria-label="Site" ref={ref} onMouseLeave={hover(null)}>
      <Link href="/" className="brand" onMouseEnter={hover(null)}>
        <SiteLogo />
        <span className="word">
          Train<b>yard</b>
        </span>
      </Link>
      <div className="links">
        <button className="sl-menu" aria-expanded={open === "mod"} aria-controls="sl-mod" onClick={() => setOpen(open === "mod" ? null : "mod")} onMouseEnter={hover("mod")}>
          Modules <span aria-hidden="true">▾</span>
        </button>
        <button className="sl-menu" aria-expanded={open === "int"} aria-controls="sl-int" onClick={() => setOpen(open === "int" ? null : "int")} onMouseEnter={hover("int")}>
          Integrations <span aria-hidden="true">▾</span>
        </button>
        <Link href="/pricing" onMouseEnter={hover(null)}>
          Pricing
        </Link>
        <Link href="/#faq" onMouseEnter={hover(null)}>
          FAQ
        </Link>
        <Link href="/guides" onMouseEnter={hover(null)}>
          Guides
        </Link>
        <Link href="/login" className="pill">
          Sign in
        </Link>
        <Link href="/#join" className="pill navy">
          Register →
        </Link>
      </div>
      {open === "mod" ? (
        <div id="sl-mod" className="sl-panel sl-mods">
          {MODULES.map((c) => (
            <div key={c.t} className="sl-col" style={{ background: c.bg, color: c.fg }}>
              <div className="tag">{c.tag}</div>
              <Link href={c.href} className="sl-col-t" style={{ color: c.fg }} onClick={() => setOpen(null)}>
                {c.t} →
              </Link>
              <p>{c.d}</p>
              <div className="sl-items">
                {c.items.map(([l, h]) => (
                  <Link key={l} href={h} onClick={() => setOpen(null)}>
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {open === "int" ? (
        <div id="sl-int" className="sl-panel sl-ints">
          {INTEGRATIONS.map((g) => (
            <div key={g.t} className="sl-group">
              <div className="tag">{g.t}</div>
              {g.items.map(([n, d]) => (
                <Link key={n} href="/#integrations" onClick={() => setOpen(null)}>
                  <b>{n}</b>
                  <span>{d}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </nav>
  );
}

/** "Follow along" stickers. Only channels that exist are listed; more appear when they do. */
export function FollowAlong() {
  return (
    <div className="sl-follow">
      <span>FOLLOW ALONG</span>
      <a href={REPO_URL} rel="noopener" aria-label="Trainyard source on GitHub" style={{ background: "#b9c6ff" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14123a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 6 2 12l6 6M16 6l6 6-6 6" />
        </svg>
      </a>
    </div>
  );
}

export function SiteFooter({ giant = true }: { giant?: boolean }) {
  return (
    <footer className="ly-foot">
      {giant ? <div className="giant">Class dismissed.</div> : null}
      <div className="meta">
        <span>Trainyard · Apache-2.0 · built by Agile Agilist</span>
        <span>
          <Link href="/classes">Classes</Link> · <Link href="/methods">Templates</Link> · <Link href="/insights">OKRs</Link> · <Link href="/pricing">Pricing</Link> · <Link href="/guides">Guides</Link> · <Link href="/compare">Compare</Link> · <a href="/llms.txt">llms.txt</a> · <Link href="/login">Sign in</Link> ·{" "}
          <a href={REPO_URL} rel="noopener">
            Source
          </a>
        </span>
      </div>
      <FollowAlong />
      <p className="legal">SAFe® and Scaled Agile Framework® are registered trademarks of Scaled Agile, Inc. Jira is a trademark of Atlassian. Azure DevOps is a trademark of Microsoft. Other product names belong to their owners. Trainyard is not affiliated with them.</p>
    </footer>
  );
}
