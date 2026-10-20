import { redirect } from "next/navigation";
import { api, ROLE_HINTS, ROLE_LABELS, ROLES, type Role } from "@/lib/api";
import { ActionForm } from "@/components/action-form";
import { ApiNotice } from "@/components/ui";
import { InvitePill } from "@/components/invite-pill";
import { changeRoleAction, inviteAction, removeMemberAction, revokeInvitationAction } from "@/app/auth-actions";

export const dynamic = "force-dynamic";

function initials(name: string | null, email: string): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
  return (words[0] ?? email).slice(0, 2).toUpperCase();
}

const since = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });

export default async function TeamPage() {
  const me = await api.me();
  if (!me.ok) redirect("/auth/signout?expired=1");
  if (!me.data.permissions.includes("team")) redirect("/dashboard");
  const res = await api.listMembers();
  const isOwner = me.data.role === "owner";
  const assignable: Role[] = isOwner ? ROLES : ROLES.filter((r) => r !== "owner");

  return (
    <div className="team">
      <div className="page-header">
        <h1>Team</h1>
        <span className="today-date">Instructors, admins and finance in one place</span>
      </div>

      <InvitePill roles={assignable.map((r) => ({ value: r, label: ROLE_LABELS[r], hint: ROLE_HINTS[r] }))} action={inviteAction} />

      {!res.ok ? (
        <ApiNotice failure={res.error} />
      ) : (
        <section className="card team-card" aria-label="Members">
          <ul className="people">
            {res.data.members.map((m) => {
              const self = m.userId === me.data.user.id;
              const locked = (m.role === "owner" && !isOwner) || self;
              return (
                <li key={m.userId}>
                  <span className="person-avatar" aria-hidden="true">
                    {initials(m.name, m.email)}
                  </span>
                  <div className="person-who">
                    <strong>
                      {m.name ?? m.email}
                      {self && " (you)"}
                    </strong>
                    <span>{m.name ? m.email : `${ROLE_LABELS[m.role]} since ${since(m.joinedAt)}`}</span>
                  </div>
                  <span className={`chip role-${m.role}`}>{ROLE_LABELS[m.role]}</span>
                  {locked ? (
                    <span className="person-menu-spacer" />
                  ) : (
                    <details className="person-menu">
                      <summary aria-label={`Change ${m.email}`}>⋯</summary>
                      <div className="person-menu-body">
                        <ActionForm action={changeRoleAction} submitLabel="Save role" pendingLabel="…" inline>
                          <input type="hidden" name="userId" value={m.userId} />
                          <select name="role" defaultValue={m.role} aria-label={`Role for ${m.email}`}>
                            {assignable.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        </ActionForm>
                        <ActionForm action={removeMemberAction} submitLabel="Remove from team" pendingLabel="…" variant="danger" inline>
                          <input type="hidden" name="userId" value={m.userId} />
                        </ActionForm>
                      </div>
                    </details>
                  )}
                </li>
              );
            })}
            {res.data.invitations.map((i) => (
              <li key={i.id} className="is-invited">
                <span className="person-avatar" aria-hidden="true">
                  {initials(null, i.email)}
                </span>
                <div className="person-who">
                  <strong>{i.email}</strong>
                  <span>Invited · expires {new Date(i.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
                <span className={`chip role-${i.role}`}>{ROLE_LABELS[i.role]}</span>
                <ActionForm action={revokeInvitationAction} submitLabel="Withdraw" pendingLabel="…" variant="danger" inline>
                  <input type="hidden" name="id" value={i.id} />
                </ActionForm>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
