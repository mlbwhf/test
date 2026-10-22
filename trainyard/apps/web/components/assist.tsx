"use client";

import { useState, type ReactNode } from "react";
import { api, useApi, type ApiFailure } from "@/lib/api";

interface AssistStatus {
  enabled: boolean;
  provider: string | null;
}

/**
 * One button that calls an assist route and shows the draft under it. The draft is for a
 * person to read and act on; nothing is written until they click an explicit action.
 */
export function AssistButton<T>({
  label,
  path,
  body,
  render,
  small,
}: {
  label: string;
  path: string;
  body?: unknown;
  render: (data: T, close: () => void) => ReactNode;
  small?: boolean;
}) {
  const status = useApi<AssistStatus>("/v1/assist");
  const [state, setState] = useState<{ kind: "idle" } | { kind: "loading" } | { kind: "done"; data: T; model: string } | { kind: "error"; message: string }>({ kind: "idle" });
  const enabled = status.data?.enabled ?? false;

  const run = async () => {
    setState({ kind: "loading" });
    try {
      const res = await api<Record<string, unknown> & { model: string }>("POST", path, body ?? {});
      const { model, ...rest } = res;
      const data = Object.values(rest)[0] as T;
      setState({ kind: "done", data, model });
    } catch (e) {
      setState({ kind: "error", message: (e as ApiFailure).message });
    }
  };

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row">
        <button className={`btn ${small ? "small" : ""}`} onClick={run} disabled={!enabled || state.kind === "loading"} title={enabled ? `Ask ${status.data?.provider}` : "Set ANTHROPIC_API_KEY on the API server to turn AI assistance on."}>
          <Spark /> {state.kind === "loading" ? "Thinking…" : label}
        </button>
        {!enabled && status.data ? <span className="faint" style={{ fontSize: "0.78rem" }}>AI assistance is off</span> : null}
      </div>
      {state.kind === "error" ? <div className="notice crit">{state.message}</div> : null}
      {state.kind === "done" ? (
        <div className="panel" style={{ borderColor: "var(--ai)", background: "var(--ai-soft)" }}>
          <div className="panel-head" style={{ borderBottomColor: "var(--ai)" }}>
            <span className="eyebrow" style={{ color: "var(--ai)" }}>
              Draft from {state.model}. Read it; nothing is saved until you act.
            </span>
            <button className="btn ghost small" onClick={() => setState({ kind: "idle" })}>
              Dismiss
            </button>
          </div>
          <div className="panel-body stack">{render(state.data, () => setState({ kind: "idle" }))}</div>
        </div>
      ) : null}
    </div>
  );
}

function Spark() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
