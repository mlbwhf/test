"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Role } from "@/lib/api";
import { idleState, type ActionState } from "@/components/action-form";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="invite-send" disabled={pending} aria-busy={pending}>
      {pending ? "Sending…" : "Invite"}
    </button>
  );
}

type RoleOption = { value: Role; label: string; hint: string };

export function InvitePill({ roles, action }: { roles: RoleOption[]; action: (prev: ActionState, data: FormData) => Promise<ActionState> }) {
  const [state, formAction] = useActionState(action, idleState);
  const [role, setRole] = useState<Role>(roles.some((r) => r.value === "instructor") ? "instructor" : roles[0]!.value);
  const current = roles.find((r) => r.value === role)!;
  return (
    <form action={formAction} className="invite">
      <div className="invite-pill">
        <input name="email" type="email" required placeholder="name@company.com" aria-label="Email to invite" />
        <input type="hidden" name="role" value={role} />
        <div className="invite-roles" role="radiogroup" aria-label="Role">
          {roles.map((r) => (
            <button key={r.value} type="button" role="radio" aria-checked={role === r.value} onClick={() => setRole(r.value)}>
              {r.label}
            </button>
          ))}
        </div>
        <Submit />
      </div>
      <p className="invite-hint">
        {current.label}: {current.hint}. They sign in with Google, Microsoft, LinkedIn or a link to that email.
      </p>
      {state.status !== "idle" && (
        <div className={`result result-${state.status}`} role={state.status === "error" ? "alert" : "status"}>
          <p className="result-message">{state.message}</p>
          {state.details?.map((d) => (
            <p key={d.label} className="mono" style={{ overflowWrap: "anywhere", margin: 0 }}>
              {d.value}
            </p>
          ))}
        </div>
      )}
    </form>
  );
}
