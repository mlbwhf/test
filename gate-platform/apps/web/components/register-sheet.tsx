"use client";

import { useEffect, useState } from "react";

type Props = {
  api: string;
  org: string;
  course: string;
  event: string;
  currency: string;
  stripePk: string | null;
  priceLabel: string;
  dateLabel: string;
  disabled: boolean;
};

declare global {
  interface Window {
    GateWidget?: { init: (root?: ParentNode) => unknown };
  }
}

/** Sticky price bar; Register opens the checkout (the embeddable widget) in a sheet for the chosen date. */
export function RegisterSheet(p: Props) {
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [fromFinder, setFromFinder] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    // Waitlist offer links land here with ?gate_waitlist=…: open checkout straight away.
    if (q.has("gate_waitlist")) {
      setClaiming(true);
      setOpen(true);
    }
    // Back from Klarna, Affirm or a bank redirect: reopen checkout so it can show the result.
    if (q.has("redirect_status")) setOpen(true);
    // Visitors from EnrollClass's class finder (?via=enrollclass), remembered while they browse dates.
    const key = `ec-via:${p.org}/${p.course}`;
    try {
      if (q.get("via") === "enrollclass") window.sessionStorage.setItem(key, "marketplace");
      setFromFinder(window.sessionStorage.getItem(key) === "marketplace");
    } catch {
      setFromFinder(q.get("via") === "enrollclass");
    }
  }, [p.org, p.course]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const src = `${p.api}/widget/v1/gate-widget.js`;
    if (window.GateWidget) window.GateWidget.init();
    else if (!document.querySelector(`script[src="${src}"]`)) {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      document.body.append(s);
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, p.api, p.event]);

  return (
    <>
      <div className="ep-bar">
        <div>
          <strong>{p.priceLabel}</strong>
          <span>{p.dateLabel}</span>
        </div>
        <button type="button" className="ep-register" disabled={p.disabled} onClick={() => setOpen(true)}>
          {p.disabled ? "Sold out" : "Register"}
        </button>
      </div>
      {open && (
        <div className="ep-sheet" role="dialog" aria-modal="true" aria-label="Register">
          <button type="button" className="ep-sheet-scrim" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="ep-sheet-body">
            <div className="ep-sheet-head">
              <strong>Register</strong>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div
              key={`${p.event}-${claiming}`}
              data-gate-widget=""
              data-gate-api={p.api}
              data-gate-org={p.org}
              data-gate-course={p.course}
              data-gate-currency={p.currency}
              {...(claiming ? {} : { "data-gate-event": p.event })}
              {...(p.stripePk ? { "data-gate-stripe-pk": p.stripePk } : {})}
              {...(fromFinder ? { "data-gate-source": "marketplace" } : {})}
            />
          </div>
        </div>
      )}
    </>
  );
}
