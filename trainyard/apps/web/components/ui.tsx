"use client";

import type { ReactNode } from "react";
import type { ApiFailure } from "@/lib/api";

export function PageHead({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {sub ? <p className="sub">{sub}</p> : null}
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </header>
  );
}

export function Loading({ error, label = "Loading…" }: { error: ApiFailure | null; label?: string }) {
  if (error) {
    return (
      <div className="notice crit">
        <strong>{error.code === "OFFLINE" ? "API not running" : "Something went wrong"}</strong>
        <p>{error.message}</p>
      </div>
    );
  }
  return <div className="skeleton">{label}</div>;
}

export function SourceChip({ system, id }: { system: string; id?: string }) {
  const label = system === "jira" ? "Jira" : system === "ado" ? "ADO" : system === "github" ? "GitHub" : "Native";
  return (
    <span className={`chip ${system}`} title={id ? `${label} ${id}` : label}>
      {label}
      {id ? ` ${id}` : ""}
    </span>
  );
}

export function ErrorList({ title, items }: { title: string; items: { message: string; path?: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="notice crit" role="alert">
      <strong>{title}</strong>
      <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
        {items.map((i, n) => (
          <li key={n}>
            {i.message}
            {i.path ? <span className="mono faint"> ({i.path})</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
