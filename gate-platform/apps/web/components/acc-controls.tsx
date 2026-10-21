"use client";

import { useEffect } from "react";

/** "Expand all / Collapse all" for the accordion inside `scope`; opens the section named in the URL hash. */
export function AccControls({ scope }: { scope: string }) {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView({ block: "start" });
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  const all = (value: boolean) => document.querySelectorAll<HTMLDetailsElement>(`#${scope} details.acc`).forEach((d) => (d.open = value));
  return (
    <span className="acc-controls">
      <button type="button" onClick={() => all(true)}>
        Expand all
      </button>
      <button type="button" onClick={() => all(false)}>
        Collapse all
      </button>
    </span>
  );
}
