import type { ReactNode } from "react";
import type { ApiFailure } from "@/lib/api";

/** Inline rendering of an API failure. Never throws, so pages stay up when the API is down. */
export function ApiNotice({ failure }: { failure: ApiFailure }) {
  if (failure.kind === "unreachable") {
    return (
      <div className="notice notice-warn" role="alert">
        <strong>API unreachable at {failure.url}</strong>
        <span className="muted">
          {" "}
          — {failure.message}. Start the API (<code>pnpm dev:api</code>) or set{" "}
          <code>NEXT_PUBLIC_GATE_API_URL</code>.
        </span>
      </div>
    );
  }
  return (
    <div className="notice notice-error" role="alert">
      <strong>{failure.message}</strong>
      <span className="muted">
        {" "}
        ({failure.code}, HTTP {failure.status}){failure.hint ? ` — ${failure.hint}` : ""}
      </span>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="muted empty">{children}</p>;
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
