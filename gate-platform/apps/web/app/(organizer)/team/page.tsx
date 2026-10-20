import { redirect } from "next/navigation";
import { api, ROLE_HINTS, ROLE_LABELS, ROLES, type Role } from "@/lib/api";
import { ActionForm } from "@/components/action-form";
import { ApiNotice } from "@/components/ui";
import { InvitePill } from "@/components/invite-pill";
import { changeRoleAction, inviteAction, removeMemberAction, revokeInvitationAction } from "@/app/auth-actions";
import { updateInstructorAccessAction } from "@/app/instructor-actions";
import { HelpLink } from "@/components/help-link";

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
  const [res, orgRes] = await Promise.all([api.listMembers(), api.getOrganization()]);
  const access = orgRes.ok ? orgRes.data.instructorAccess : null;
  const isOwner = me.data.role === "owner";
  const assignable: Role[] = isOwner ? ROLES : ROLES.filter((r) => r !== "owner");

  return (
    <div className="team">
      <div className="page-header">
        <h1>
          Team <HelpLink slug="roles" />
        </h1>
        <span className="today-date">Instructors, admins and finance in one place</span>
      </div>

      <InvitePill roles={assignable.map((r) => ({ value: r, label: ROLE_LABELS[r], hint: ROLE_HINTS[r] }))} action={inviteAction} />

      {access && me.data.permissions.includes("settings") && me.data.organization?.kind !== "individual" && (
        <section className="card access-card" aria-labelledby="access-title">
          <h2 id="access-title">Instructor access</h2>
          <ActionForm action={updateInstructorAccessAction} submitLabel="Save" pendingLabel="Saving…" wide>
            <fieldset className="access-row">
              <legend>Instructors see</legend>
              <label>
                <input type="radio" name="scope" value="own" defaultChecked={access.scope === "own"} /> <strong>Only the classes they teach</strong>
                <span>Their Home, Events, attendees and check-in show their own classes.</span>
              </label>
              <label>
                <input type="radio" name="scope" value="all" defaultChecked={access.scope === "all"} /> <strong>All classes</strong>
                <span>Useful when instructors cover for each other.</span>
              </label>
            </fieldset>
            <fieldset className="access-row">
              <legend>Classes an instructor creates</legend>
              <label>
                <input type="radio" name="publish" value="direct" defaultChecked={access.publish === "direct"} /> <strong>Go live right away</strong>
                <span>Registration opens as soon as they publish.</span>
              </label>
              <label>
                <input type="radio" name="publish" value="approval" defaultChecked={access.publish === "approval"} /> <strong>Wait for approval</strong>
                <span>They stay drafts until an owner or admin publishes them from Home or Events.</span>
              </label>
            </fieldset>
          </ActionForm>
          <p className="hint">Instructors never see money, payouts or team settings. Owners and admins choose who teaches each class from Events.</p>
        </section>
      )}

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
