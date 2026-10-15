"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Shape every server action in app/actions.ts resolves to. */
export type ActionState = {
  status: "idle" | "ok" | "error";
  message?: string;
  /** Optional key/value rows rendered under the message (e.g. a pricing breakdown). */
  details?: { label: string; value: string }[];
};

export const idleState: ActionState = { status: "idle" };

type ServerAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

type Props = {
  action: ServerAction;
  children?: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  variant?: "primary" | "danger";
  /** Compact layout for buttons embedded in table rows. */
  inline?: boolean;
  /** Wider layout for forms with repeated row groups (sessions, regional prices). */
  wide?: boolean;
};

function SubmitButton({ label, pendingLabel, variant }: { label: string; pendingLabel: string; variant: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn btn-${variant}`} disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel,
  variant = "primary",
  inline = false,
  wide = false,
}: Props) {
  const [state, formAction] = useActionState(action, idleState);
  const className = ["action-form", inline && "action-form-inline", wide && "action-form-wide"]
    .filter(Boolean)
    .join(" ");

  return (
    <form action={formAction} className={className}>
      {children}
      <SubmitButton label={submitLabel} pendingLabel={pendingLabel ?? `${submitLabel}…`} variant={variant} />
      {state.status !== "idle" && (
        <div className={`result result-${state.status}`} role={state.status === "error" ? "alert" : "status"}>
          {state.message && <p className="result-message">{state.message}</p>}
          {state.details && state.details.length > 0 && (
            <dl className="result-details">
              {state.details.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </form>
  );
}
