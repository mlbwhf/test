"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { COMMON_ZONES, dayLabel, detectedZone, hourIn, timeRange, zoneAbbr, zoneName } from "@/lib/class-time";

type Session = { startsAt: string; endsAt: string };
type ZoneState = { zone: string; setZone: (z: string) => void; detected: string | null };

const ZoneContext = createContext<ZoneState | null>(null);

/**
 * The time zone class times are shown in. The server renders the class's own zone; in the
 * browser it switches to the visitor's zone, and the visitor can pick another.
 */
export function ZoneProvider({ classZone, children }: { classZone: string; children: ReactNode }) {
  const [zone, setZone] = useState(classZone);
  const [detected, setDetected] = useState<string | null>(null);
  useEffect(() => {
    const d = detectedZone();
    if (d) {
      setDetected(d);
      setZone(d);
    }
  }, []);
  const value = useMemo(() => ({ zone, setZone, detected }), [zone, detected]);
  return <ZoneContext.Provider value={value}>{children}</ZoneContext.Provider>;
}

function useZone(fallback: string): ZoneState {
  return useContext(ZoneContext) ?? { zone: fallback, setZone: () => undefined, detected: null };
}

export function Agenda({ sessions, topics, classZone, multiDay }: { sessions: Session[]; topics: string[][]; classZone: string; multiDay: boolean }) {
  const { zone, setZone, detected } = useZone(classZone);
  const zones = [...COMMON_ZONES];
  for (const extra of [detected, classZone]) if (extra && !zones.some((z) => z.id === extra)) zones.unshift({ id: extra, label: zoneName(extra) });
  const late = sessions.some((s) => hourIn(s.endsAt, zone) >= 19 || hourIn(s.endsAt, zone) < hourIn(s.startsAt, zone));
  const early = sessions.some((s) => hourIn(s.startsAt, zone) < 7);
  const days = Math.max(sessions.length, topics.length);

  return (
    <section id="agenda" className="rx-card rx-agenda" aria-labelledby="agenda-title">
      <div className="rx-agenda-head">
        <div>
          <h2 id="agenda-title" className="rx-h2">
            Agenda, in your time
          </h2>
          <p className="rx-muted" style={{ margin: "4px 0 0", fontSize: 15 }}>
            Showing {zoneName(zone)} time{detected === zone ? " (detected)" : ""}. Pick your zone.
          </p>
        </div>
        <div className="rx-zones" role="group" aria-label="Time zone">
          {zones.map((z) => (
            <button key={z.id} type="button" aria-pressed={z.id === zone} onClick={() => setZone(z.id)}>
              {z.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rx-days">
        {Array.from({ length: days }, (_, i) => {
          const s = sessions[i];
          const list = topics[i] ?? [];
          return (
            <div key={i} className="rx-day">
              <header>
                <span>
                  {multiDay ? `Day ${i + 1}` : "Session"}
                  {s ? ` · ${dayLabel(s.startsAt, zone)}` : ""}
                </span>
                <strong>{s ? `${timeRange(s.startsAt, s.endsAt, zone)} ${zoneAbbr(s.startsAt, zone)}` : "Time to be confirmed"}</strong>
              </header>
              {list.length > 0 && (
                <ul>
                  {list.map((t, j) => (
                    <li key={j}>{t}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {(late || early) && (
        <p className="rx-warn">
          {late ? "In this zone the class runs into your evening." : "In this zone the class starts early in your morning."} Every session goes into your calendar, in your own time, after you register.
        </p>
      )}
    </section>
  );
}
