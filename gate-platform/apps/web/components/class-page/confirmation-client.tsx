"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Ready = { camera?: boolean; connection?: boolean; calendar?: boolean; prework?: boolean };

/** While a card payment is still being confirmed, look again every few seconds (for up to two minutes). */
export function ConfirmPoller() {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (tries >= 40) return;
    const t = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, 3000);
    return () => clearTimeout(t);
  }, [tries, router]);
  return tries >= 40 ? (
    <p style={{ margin: 0 }}>
      This is taking longer than usual. Your confirmation email will arrive as soon as the payment clears; you can close this page.
    </p>
  ) : null;
}

/** "Before day 1": the learner's own checklist, saved to their seat as they tick it. */
export function ReadyList({ api, seatId, email, initial, prework, sessions }: { api: string; seatId: string; email: string; initial: Ready; prework: string | null; sessions: number }) {
  const [ready, setReady] = useState<Ready>(initial);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const items: { id: keyof Ready; name: string; note: string }[] = [
    { id: "camera", name: "Run the device test", note: "Camera and microphone work in your browser" },
    { id: "connection", name: "Check your connection", note: "Wired or strong Wi-Fi for the whole session" },
    { id: "calendar", name: sessions > 1 ? `Block all ${sessions} sessions on your calendar` : "Block the session on your calendar", note: "Use the calendar buttons above" },
    { id: "prework", name: "Do the pre-work", note: prework ? "Arrives by email before class; about 30 minutes" : "Your instructor sends it before class" },
  ];
  const done = items.filter((i) => ready[i.id]).length;

  const toggle = async (id: keyof Ready, on: boolean) => {
    const next = { ...ready, [id]: on };
    setReady(next);
    setSaving(true);
    setFailed(false);
    try {
      const res = await fetch(`${api}/public/v1/seats/${encodeURIComponent(seatId)}/ready`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, readyChecks: { [id]: on } }) });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h2 className="rx-h2" style={{ fontSize: 26 }}>
          Before day 1
        </h2>
        <span style={{ fontSize: 14, fontWeight: 600 }} aria-live="polite">
          {done} of {items.length} done{saving ? " · saving…" : failed ? " · not saved, try again" : ""}
        </span>
      </div>
      <div className="rx-progress" aria-hidden="true">
        <i style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((i) => (
          <label key={i.id} className={`rx-todo${ready[i.id] ? " is-done" : ""}`}>
            <input type="checkbox" checked={Boolean(ready[i.id])} onChange={(e) => void toggle(i.id, e.target.checked)} />
            <span>
              <b>{i.name}</b>
              <em>{i.note}</em>
            </span>
          </label>
        ))}
      </div>
    </>
  );
}
