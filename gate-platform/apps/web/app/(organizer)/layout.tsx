import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { api, ROLE_LABELS, type Permission } from "@/lib/api";
import { Logo } from "@/components/brand";
import { ApiNotice } from "@/components/ui";
import { OrganizerNav, type NavLink } from "@/components/organizer-nav";
import { switchOrganizationAction } from "@/app/auth-actions";

export const dynamic = "force-dynamic";

// Each link shows only to roles that can use it; the API enforces the same rules.
const LINKS: Array<[href: string, label: string, needs: Permission]> = [
  ["/dashboard", "Dashboard", "classes:read"],
  ["/events", "Events", "classes:read"],
  ["/courses", "Courses", "classes:read"],
  ["/instructors", "Instructors", "settings"],
  ["/orders", "Orders", "money:read"],
  ["/money", "Money", "money:read"],
  ["/checkin", "Check-in", "classes:write"],
  ["/import", "Import", "classes:write"],
  ["/team", "Team", "team"],
];

export default async function OrganizerLayout({ children }: { children: ReactNode }) {
  const me = await api.me();
  if (!me.ok) {
    if (me.error.kind === "api" && me.error.status === 401) redirect("/auth/signout?expired=1");
    return (
      <main>
        <ApiNotice failure={me.error} />
      </main>
    );
  }
  const { user, organization, role, permissions, memberships } = me.data;
  if (!organization) redirect("/onboarding");
  const links: NavLink[] = LINKS.filter(([, , needs]) => permissions.includes(needs)).map(([h, l]) => [h, l]);
  const initial = (user.name ?? user.email)[0]!.toUpperCase();

  return (
    <>
      <header className="topbar">
        <Logo href="/dashboard" />
        <OrganizerNav links={links} />
        {permissions.includes("classes:write") && (
          <Link href="/events#create" className="topbar-cta">
            Create event
          </Link>
        )}
        <details className="account">
          <summary aria-label="Account menu">
            <span className="account-avatar" aria-hidden="true">
              {initial}
            </span>
            <span className="account-org">{organization.name}</span>
          </summary>
          <div className="account-menu">
            <div className="account-who">
              <strong>{user.name ?? user.email}</strong>
              {user.name && <span>{user.email}</span>}
              <span>{organization.name}</span>
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
            <Link href="/onboarding?new=1">Create another organization</Link>
            <form action="/auth/signout" method="post">
              <button type="submit">Sign out</button>
            </form>
          </div>
        </details>
      </header>
      <main>{children}</main>
    </>
  );
}
