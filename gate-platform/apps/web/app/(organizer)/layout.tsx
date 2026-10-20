import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLE_LABELS, type Me, type Permission } from "@/lib/api";
import { getHome, getMe } from "@/lib/console-data";
import { Logo } from "@/components/brand";
import { ApiNotice } from "@/components/ui";
import { ConsoleNav, MobileTabs, SectionTabs, type Section } from "@/components/organizer-nav";
import { switchOrganizationAction } from "@/app/auth-actions";

export const dynamic = "force-dynamic";

// Four areas instead of nine pages. Each page shows only to roles that can use it (the API
// enforces the same rules); an area with no visible pages disappears.
const AREAS: Array<{ key: string; label: string; pages: Array<[href: string, label: string, needs: Permission]> }> = [
  { key: "home", label: "Home", pages: [["/dashboard", "Home", "classes:read"]] },
  {
    key: "events",
    label: "Events",
    pages: [
      ["/events", "Events", "classes:read"],
      ["/courses", "Courses", "classes:read"],
      ["/checkin", "Check-in", "classes:write"],
      ["/import", "Import", "classes:write"],
    ],
  },
  {
    key: "money",
    label: "Money",
    pages: [["/money", "Money", "money:read"]],
  },
  {
    key: "team",
    label: "Team",
    pages: [
      ["/team", "Team", "team"],
      ["/instructors", "Instructors", "settings"],
      ["/integrations", "Integrations", "settings"],
    ],
  },
];

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? words[0]?.[1] ?? "")).toUpperCase() || "?";
}

function AccountMenu({ me, placement }: { me: Me & { organization: NonNullable<Me["organization"]> }; placement: "up" | "down" }) {
  const { user, organization, role, memberships } = me;
  return (
    <details className={`account account-${placement}`}>
      <summary aria-label="Account and organization menu">
        <span className="account-avatar" aria-hidden="true">
          {initials(organization.name)}
        </span>
        <span className="account-org">
          <strong>{organization.name}</strong>
          <span>
            {organization.country} · {organization.currency}
          </span>
        </span>
      </summary>
      <div className="account-menu">
        <div className="account-who">
          <strong>{user.name ?? user.email}</strong>
          {user.name && <span>{user.email}</span>}
          {role && <span className="badge">{ROLE_LABELS[role]}</span>}
        </div>
        {memberships.length > 1 && (
          <div className="account-orgs">
            <span className="account-label">Switch organization</span>
            {memberships.map((m) => (
              <form key={m.organizationId} action={switchOrganizationAction}>
                <input type="hidden" name="organizationId" value={m.organizationId} />
                <button type="submit" className={m.organizationId === organization.id ? "is-current" : ""} disabled={m.organizationId === organization.id}>
                  {m.organizationName} <span>{ROLE_LABELS[m.role]}</span>
                </button>
              </form>
            ))}
          </div>
        )}
        {me.permissions.includes("team") && (
          <Link href="/team" className="account-mobile-only">
            Team
          </Link>
        )}
        <Link href="/help" target="_blank" rel="noopener">
          Help &amp; guides
        </Link>
        <Link href="/onboarding?new=1">Create another organization</Link>
        <form action="/auth/signout" method="post">
          <button type="submit">Sign out</button>
        </form>
      </div>
    </details>
  );
}

export default async function OrganizerLayout({ children }: { children: ReactNode }) {
  const [meRes, homeRes] = await Promise.all([getMe(), getHome()]);
  if (!meRes.ok) {
    if (meRes.error.kind === "api" && meRes.error.status === 401) redirect("/auth/signout?expired=1");
    return (
      <main>
        <ApiNotice failure={meRes.error} />
      </main>
    );
  }
  const me = meRes.data;
  if (!me.organization) redirect("/onboarding");
  const signedIn = me as Me & { organization: NonNullable<Me["organization"]> };
  const can = (p: Permission) => me.permissions.includes(p);

  const sections: Section[] = AREAS.map((a) => ({ key: a.key, label: a.label, pages: a.pages.filter(([, , needs]) => can(needs)).map(([h, l]) => [h, l] as [string, string]) })).filter((s) => s.pages.length > 0);
  const createHref = can("classes:write") ? "/events/new" : null;
  const attentionIds = homeRes.ok ? homeRes.data.attention.map((a) => a.id) : [];
  const mobileTabs = [
    { href: "/dashboard", label: "Home" },
    { href: "/events", label: "Events", also: ["/courses", "/import"] },
    ...(can("classes:write") ? [{ href: "/checkin", label: "Check-in" }] : []),
    ...(can("money:read") ? [{ href: "/money", label: "Money", also: ["/orders"] }] : []),
  ];

  return (
    <div className="console">
      <aside className="console-side">
        <Logo href="/dashboard" />
        {createHref && (
          <Link href={createHref} className="console-create">
            + Create event
          </Link>
        )}
        <ConsoleNav sections={sections} attentionIds={attentionIds} />
        <div className="console-spacer" />
        <Link href="/help" className="console-help" target="_blank" rel="noopener">
          <span aria-hidden="true">?</span> Help &amp; guides
        </Link>
        <AccountMenu me={signedIn} placement="up" />
      </aside>
      <div className="console-main">
        <header className="console-mobilebar">
          <Logo href="/dashboard" />
          <AccountMenu me={signedIn} placement="down" />
        </header>
        <SectionTabs sections={sections} />
        <main>{children}</main>
      </div>
      <MobileTabs tabs={mobileTabs} createHref={createHref} />
    </div>
  );
}
