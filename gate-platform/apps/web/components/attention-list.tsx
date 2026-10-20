"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { HomeAttention } from "@/lib/api";
import { idleState, type ActionState } from "@/components/action-form";
import { DISMISSED_EVENT, dismiss, readDismissed } from "@/lib/dismissed";

type ServerAction = (prev: ActionState, data: FormData) => Promise<ActionState>;

function Pill({ label, pending }: { label: string; pending: string }) {
  const { pending: busy } = useFormStatus();
  return (
    <button type="submit" className="pill-btn" disabled={busy} aria-busy={busy}>
      {busy ? pending : label}
    </button>
  );
}

function ActionPill({ item, release, connectStripe }: { item: HomeAttention; release: ServerAction | null; connectStripe: ServerAction | null }) {
  const a = item.action;
  const server = a.kind === "release" ? release : a.kind === "stripe" ? connectStripe : null;
  const [state, formAction] = useActionState(server ?? (async () => idleState), idleState);
  if (a.kind === "link") {
    return (
      <Link className="pill-btn" href={a.href}>
        {a.label}
      </Link>
    );
  }
  if (!server) return null;
  return (
    <form action={formAction} className="attention-act">
      {a.kind === "release" && <input type="hidden" name="eventId" value={a.eventId} />}
      <Pill label={a.label} pending={a.kind === "stripe" ? "Opening Stripe…" : `${a.label}…`} />
      {state.status !== "idle" && (
        <p className={`attention-result result-${state.status}`} role={state.status === "error" ? "alert" : "status"}>
          {state.message}
        </p>
      )}
    </form>
  );
}

export function AttentionList({ items, release, connectStripe }: { items: HomeAttention[]; release: ServerAction | null; connectStripe: ServerAction | null }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  useEffect(() => {
    const sync = () => setHidden(readDismissed());
    sync();
    window.addEventListener(DISMISSED_EVENT, sync);
    return () => window.removeEventListener(DISMISSED_EVENT, sync);
  }, []);
  const open = items.filter((i) => !hidden.has(i.id));
  const ids = items.map((i) => i.id);

  return (
    <section className="card today-attention" aria-labelledby="attention-title">
      <div className="today-card-head">
        <h2 id="attention-title">Needs your attention</h2>
        {open.length > 0 && <span className="chip chip-warn">{open.length} open</span>}
      </div>
      {open.length === 0 ? (
        <p className="today-clear">
          <strong>All clear.</strong> Nothing needs you right now.
        </p>
      ) : (
        <ul className="attention-rows">
          {open.map((item) => (
            <li key={item.id}>
              <span className={`dot dot-${item.tone}`} aria-hidden="true" />
              <div className="attention-text">
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
              <ActionPill item={item} release={release} connectStripe={connectStripe} />
              <button type="button" className="attention-dismiss" aria-label={`Dismiss: ${item.title}`} onClick={() => dismiss(item.id, ids)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
