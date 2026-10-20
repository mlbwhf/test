"use client";

import { useState, type ReactNode } from "react";

/** A <details> whose open state belongs to the viewer: a server refresh never snaps it shut. */
export function Disclosure({ summary, defaultOpen = false, className, children }: { summary: ReactNode; defaultOpen?: boolean; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details className={className} open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>{summary}</summary>
      {children}
    </details>
  );
}
