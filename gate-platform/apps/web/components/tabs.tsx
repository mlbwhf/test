"use client";

import { useId, useState, type ReactNode } from "react";

/** Segmented tabs over server-rendered panels; panels stay mounted so form input survives switching. */
export function Tabs({ tabs, panels, initial = 0 }: { tabs: string[]; panels: ReactNode[]; initial?: number }) {
  const [active, setActive] = useState(initial);
  const id = useId();
  return (
    <div className="tabs">
      <div className="seg" role="tablist">
        {tabs.map((t, i) => (
          <button key={t} type="button" role="tab" id={`${id}-t${i}`} aria-selected={active === i} aria-controls={`${id}-p${i}`} onClick={() => setActive(i)}>
            {t}
          </button>
        ))}
      </div>
      {panels.map((p, i) => (
        <div key={i} role="tabpanel" id={`${id}-p${i}`} aria-labelledby={`${id}-t${i}`} hidden={active !== i} className="tab-panel">
          {p}
        </div>
      ))}
    </div>
  );
}
