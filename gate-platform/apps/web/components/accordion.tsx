import type { ReactNode } from "react";

export type AccTone = "green" | "amber" | "coral";

/**
 * One expanding section of a manage page (native <details>, so any number can be open and it
 * works without JavaScript). The numbered badge alternates square/circle; its colour is the status.
 */
export function AccSection({ id, n, title, summary, chip, tone = "green", open = false, children }: { id: string; n: number; title: string; summary: ReactNode; chip: string; tone?: AccTone; open?: boolean; children: ReactNode }) {
  return (
    <details className={`acc acc-${tone}`} id={id} open={open}>
      <summary>
        <span className={`acc-n${n % 2 === 1 ? " acc-n-sq" : ""}`} aria-hidden="true">
          {n}
        </span>
        <span className="acc-head">
          <span className="acc-title">{title}</span>
          <span className="acc-summary">{summary}</span>
        </span>
        <span className="acc-chip">{chip}</span>
        <span className="acc-chev" aria-hidden="true">
          ▾
        </span>
      </summary>
      <div className="acc-body">{children}</div>
    </details>
  );
}
