"use client";

// The signed-in workspace: a top bar with the spaces (OKRs, Classes, Templates, Plan) and a
// second row with the current space's sub-views. Each space sets its theme on <html>, which the
// existing pages read through their CSS variables; a page can pick another theme (the template
// gallery switches to the selected method's) with useTheme().

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { api, setApiKey, setSupportWorkspace, useMe } from "@/lib/api";
import { GlobalSearch } from "@/components/global-search";
import { SPACES, locate, type Space } from "@/lib/spaces";
import type { ThemeId } from "@/lib/themes";

const useIsoLayout = typeof window === "undefined" ? useEffect : useLayoutEffect;

const ThemeCtx = createContext<(t: ThemeId | null) => void>(() => undefined);

/** Let a page override the space theme while it is mounted (null goes back to the space's). */
export function useTheme(theme: ThemeId | null) {
  const set = useContext(ThemeCtx);
  useIsoLayout(() => {
    set(theme);
    return () => set(null);
  }, [theme, set]);
}

export function Logo({ size = 34 }: { size?: number }) {
  // The mixed mark from the handoff: speech bubble, timebox ring, sticky-note T and a joining chat bubble.
  return (
    <svg className="ws-logo" width={size} height={size} viewBox="0 0 240 240" aria-hidden="true">
      <path d="M52 18h136a32 32 0 0 1 32 32v100a32 32 0 0 1-32 32H96l-46 38v-38h2A32 32 0 0 1 20 150V50a32 32 0 0 1 32-32z" fill="#4a5fe8" />
      <circle cx="120" cy="98" r="58" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="10" />
      <circle className="ws-ring" cx="120" cy="98" r="58" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeDasharray="365" transform="rotate(-90 120 98)" />
      <rect x="92" y="72" width="56" height="16" rx="5" fill="#fff" />
      <rect x="112" y="88" width="16" height="42" rx="5" fill="#fff" />
      <rect x="70" y="100" width="17" height="17" rx="4" fill="#ffe27a" />
      <rect x="152" y="96" width="17" height="17" rx="4" fill="#ff9fc6" />
      <rect x="152" y="118" width="17" height="17" rx="4" fill="#5ff0e0" />
      <rect x="186" y="170" width="44" height="34" rx="12" fill="#ff3d8f" stroke="var(--th-chrome, #f4f1ea)" strokeWidth="5" />
      <circle cx="198" cy="187" r="3.5" fill="#fff" />
      <circle cx="208" cy="187" r="3.5" fill="#fff" />
      <circle cx="218" cy="187" r="3.5" fill="#fff" />
    </svg>
  );
}

function Account() {
  const me = useMe();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);
  const setup = SPACES.find((s) => s.id === "setup")!;
  const subs = setup.subs.filter((l) => (l.href !== "/billing" || (me.data && !me.data.workspace.platform)) && (l.href !== "/admin" || me.data?.principal.platformAdmin));
  return (
    <div className="ws-account" ref={ref}>
      <button className="ws-btn" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>
        {me.data ? (me.data.open ? "Open mode" : me.data.principal.name.split(" ")[0]) : "Account"} ▾
      </button>
      {open ? (
        <div className="ws-menu" role="menu">
          <div className="ws-menu-head">
            <b title={me.data?.workspace.id}>{me.data?.workspace.name ?? "Trainyard"}</b>
            <span>
              {me.data && !me.data.workspace.platform ? `${me.data.workspace.plan} plan` : ""}
              {me.data && !me.data.open ? ` · ${me.data.principal.role}` : ""}
            </span>
          </div>
          <div className="ws-menu-label">Setup</div>
          {subs.map((l) => (
            <Link key={l.href} role="menuitem" href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          {me.data?.principal.support ? (
            <button role="menuitem" onClick={() => (setSupportWorkspace(null), window.location.assign("/admin"))}>
              Leave support view
            </button>
          ) : null}
          {me.data && !me.data.open ? (
            <button role="menuitem" onClick={() => void api("POST", "/v1/auth/logout").catch(() => undefined).finally(() => (setApiKey(null), window.location.assign("/login")))}>
              Sign out
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SubRow({ space, current }: { space: Space; current: string | undefined }) {
  return (
    <div className="ws-subrow">
      <span className="ws-eyebrow">{space.eyebrow}</span>
      <nav className="ws-chips" aria-label={`${space.label} views`}>
        {space.subs.map((s) => (
          <Link key={s.href} href={s.href} className="ws-chip" aria-current={current === s.href ? "page" : undefined}>
            {s.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const me = useMe();
  const here = locate(path);
  const [override, setOverride] = useState<ThemeId | null>(null);
  const theme = override ?? here?.space.theme ?? null;
  useEffect(() => {
    void me.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  useIsoLayout(() => {
    const root = document.documentElement;
    if (theme) root.dataset.theme = theme;
    else delete root.dataset.theme;
  }, [theme]);
  useEffect(() => () => void delete document.documentElement.dataset.theme, []);
  const top = SPACES.filter((s) => s.id !== "setup");
  return (
    <ThemeCtx.Provider value={setOverride}>
      <div className="ws">
        <header className="ws-top">
          <Link href="/okrs" className="ws-brand" aria-label="Trainyard home">
            <Logo />
            <span>Trainyard</span>
          </Link>
          <nav className="ws-spaces" aria-label="Spaces">
            {top.map((s) => (
              <Link key={s.id} href={s.subs[0]!.href} className="ws-space" aria-current={here?.space.id === s.id ? "page" : undefined}>
                {s.label}
              </Link>
            ))}
          </nav>
          <div className="ws-grow" />
          <div className="ws-search">
            <GlobalSearch />
          </div>
          <Account />
        </header>
        {here ? <SubRow space={here.space} current={here.sub?.href} /> : null}
        <main className="main ws-main">{children}</main>
      </div>
    </ThemeCtx.Provider>
  );
}
