"use client";

import { useActionState } from "react";
import { verifyBadgeAction, type VerifyState } from "@/app/verify/actions";

export function VerifyBadgeForm() {
  const [state, action, pending] = useActionState<VerifyState, FormData>(verifyBadgeAction, null);
  return (
    <>
      <form action={action} className="action-form">
        <label>
          Badge image (PNG)
          <input name="png" type="file" accept="image/png" />
        </label>
        <label>
          Or paste the credential
          <textarea name="jwt" placeholder="eyJhbGciOiJFZERTQSIs…" spellCheck={false} />
        </label>
        <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
          {pending ? "Checking…" : "Verify"}
        </button>
      </form>
      {state && (
        <div className={`verify-result ${state.valid ? "is-valid" : "is-invalid"}`} role="status">
          <strong>{state.valid ? "✓ Valid badge" : "✗ Not valid"}</strong>
          {state.valid ? (
            <dl>
              <dt>Badge</dt>
              <dd>{state.achievement}</dd>
              <dt>Earned by</dt>
              <dd>{state.learner}</dd>
              <dt>Issued by</dt>
              <dd>{state.issuer}</dd>
              <dt>Issued on</dt>
              <dd>{state.issuedAt ? new Date(state.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}</dd>
              {state.certificateUrl && (
                <>
                  <dt>Certificate</dt>
                  <dd>
                    <a href={state.certificateUrl}>View certificate</a>
                  </dd>
                </>
              )}
            </dl>
          ) : (
            <p>{state.reason}</p>
          )}
        </div>
      )}
    </>
  );
}
