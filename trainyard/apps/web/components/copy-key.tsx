"use client";

import { useState } from "react";

export function CopyKey({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="row" style={{ flexWrap: "nowrap" }}>
      <code className="mono" style={{ background: "var(--sunken)", padding: "6px 10px", borderRadius: 6, overflowX: "auto", flex: 1, userSelect: "all" }}>
        {value}
      </code>
      <button
        className="btn small"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked: the key is selectable text */
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
