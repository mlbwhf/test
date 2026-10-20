import { redirect } from "next/navigation";
import { api, ROLE_HINTS, ROLE_LABELS, ROLES, type Role } from "@/lib/api";
import { ActionForm } from "@/components/action-form";
import { ApiNotice, Empty, Section } from "@/components/ui";
import { changeRoleAction, inviteAction, removeMemberAction, revokeInvitationAction } from "@/app/auth-actions";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const me = await api.me();
  if (!me.ok) redirect("/auth/signout?expired=1");
  if (!me.data.permissions.includes("team")) redirect("/dashboard");
  const res = await api.listMembers();
  const isOwner = me.data.role === "owner";
  const assignable: Role[] = isOwner ? ROLES : ROLES.filter((r) => r !== "owner");

  return (
    <>
      <div className="page-header">
        <h1>Team</h1>
        <span className="muted">Who can sign in to {me.data.organization?.name}, and what each person can do.</span>
      </div>

      <Section title="Invite someone">
        <ActionForm action={inviteAction} submitLabel="Send invitation" pendingLabel="Sending…" wide>
          <div className="fields-row">
            <label>
              Email
              <input name="email" type="email" required placeholder="name@company.com" />
            </label>
            <label>
              Role
              <select name="role" defaultValue="instructor">
                {assignable.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}: {ROLE_HINTS[r]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="hint">They sign in with Google, Microsoft, LinkedIn or a link to that email. Invitations expire after 14 days.</p>
        </ActionForm>
      </Section>

      {!res.ok ? (
        <ApiNotice failure={res.error} />
      ) : (
        <>
          <Section title={`Members · ${res.data.members.length}`}>
            <ul className="team-list">
              {res.data.members.map((m) => {
                const self = m.userId === me.data.user.id;
                const locked = (m.role === "owner" && !isOwner) || self;
                return (
                  <li key={m.userId}>
                    <div className="team-who">
                      <span className="team-avatar" aria-hidden="true">
                        {(m.name ?? m.email)[0]!.toUpperCase()}
                      </span>
                      <div>
                        <div className="team-name">
                          {m.name ?? m.email}
                          {self && <span className="muted"> (you)</span>}
                        </div>
                        <div className="team-email">{m.email}</div>
                      </div>
                    </div>
                    {locked ? (
                      <span className="badge">{ROLE_LABELS[m.role]}</span>
                    ) : (
                      <div className="team-actions">
                        <ActionForm action={changeRoleAction} submitLabel="Save" pendingLabel="…" inline>
                          <input type="hidden" name="userId" value={m.userId} />
                          <select name="role" defaultValue={m.role} aria-label={`Role for ${m.email}`}>
                            {assignable.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        </ActionForm>
                        <ActionForm action={removeMemberAction} submitLabel="Remove" pendingLabel="…" variant="danger" inline>
                          <input type="hidden" name="userId" value={m.userId} />
                        </ActionForm>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>

          <Section title="Pending invitations">
            {res.data.invitations.length === 0 ? (
              <Empty>None.</Empty>
            ) : (
              <ul className="team-list">
                {res.data.invitations.map((i) => (
                  <li key={i.id}>
                    <div>
                      <div className="team-name">{i.email}</div>
                      <div className="team-email">
                        {ROLE_LABELS[i.role]} · expires {new Date(i.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <ActionForm action={revokeInvitationAction} submitLabel="Withdraw" pendingLabel="…" variant="danger" inline>
                      <input type="hidden" name="id" value={i.id} />
                    </ActionForm>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="What each role can do">
            <dl className="kv">
              {ROLES.map((r) => (
                <div key={r} style={{ display: "contents" }}>
                  <dt>{ROLE_LABELS[r]}</dt>
                  <dd>{ROLE_HINTS[r]}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </>
      )}
    </>
  );
}
