"use client";

import { useEffect, useState } from "react";

const CAP = 20;
const START = 11;
const PRICE = 900;
const NAMES = ["Maria · Toronto", "Dev · London", "Aisha · Dubai", "Tom · Austin", "Lena · Berlin", "Kofi · Accra", "Sofia · Madrid", "Ravi · Pune", "Chen · Vancouver"];

/** Hero card: a cohort filling up live. Seats book one by one, money is held, then it starts over. */
export function LiveCohort() {
  const [filled, setFilled] = useState(14);
  const [who, setWho] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setFilled(START);
    let n = START;
    let i = 0;
    const tick = setInterval(() => {
      n = n >= CAP ? START : n + 1;
      setFilled(n);
      setWho(n === START ? null : NAMES[i++ % NAMES.length]!);
    }, 1600);
    return () => clearInterval(tick);
  }, []);

  const full = filled >= CAP;
  return (
    <div className="cohort-card" aria-label="Example cohort filling up">
      <div>
        <p className="mono dim">COHORT · 12 NOV – 14 DEC</p>
        <p className="cohort-card-title">Project Management Certification</p>
      </div>
      <div className="seat-grid" aria-hidden="true">
        {Array.from({ length: CAP }, (_, i) => (
          <span key={i} className={`seat ${i < filled ? "seat-filled" : i === filled ? "seat-next" : "seat-empty"}${i === filled - 1 && who ? " seat-just" : ""}`} style={{ animationDelay: `${i * 45}ms` }} />
        ))}
      </div>
      <div className="row">
        <span>
          {filled} of {CAP} seats filled
        </span>
        <span className="mono green" key={filled}>
          <span className="tick">${(filled * PRICE).toLocaleString("en-US")} held</span>
        </span>
      </div>
      <p className={`cohort-toast${who ? " is-on" : ""}`} aria-live="off" key={who ?? "none"}>
        {who ? (
          <>
            <span className="live-dot" aria-hidden="true" /> New registration: {who}
          </>
        ) : (
          "\u00a0"
        )}
      </p>
      <div className="row cohort-card-foot">
        <span>{full ? "Full. Releases to Stripe after delivery" : "Releases to Stripe after delivery"}</span>
        <span className="mono">19 Dec</span>
      </div>
    </div>
  );
}
