"use client";

import { useMemo, useState } from "react";
import { rxMoney } from "@/components/class-page/shared";
import { dateRange, zoneAbbr } from "@/lib/class-time";

type ClassItem = { courseSlug: string; courseName: string; topic: string; dateSlug: string; startsAt: string; endsAt: string | null; timezone: string; format: string; currency: string; priceMinor: number | null; capacity: number; seatsLeft: number; href: string };
type Format = "all" | "online" | "in_person";

const online = (f: string) => f === "live_virtual" || f === "self_paced";
const startTime = (iso: string, tz: string) => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz }).format(new Date(iso));
const cityOf = (tz: string) => (tz.split("/").pop() ?? tz).replace(/_/g, " ");

/** Upcoming classes on the profile, filtered by topic (with counts) and by online / in person. */
export function ProfileClasses({ classes, topics }: { classes: ClassItem[]; topics: { id: string; label: string }[] }) {
  const [format, setFormat] = useState<Format>("all");
  const [topic, setTopic] = useState<string>("all");
  const byFormat = classes.filter((c) => format === "all" || (format === "online" ? online(c.format) : !online(c.format)));
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of byFormat) m.set(c.topic, (m.get(c.topic) ?? 0) + 1);
    return m;
  }, [byFormat]);
  const shown = byFormat.filter((c) => topic === "all" || c.topic === topic);
  const label = (id: string) => topics.find((t) => t.id === id)?.label ?? id;
  const used = [...new Set(classes.map((c) => c.topic))];

  return (
    <>
      <div className="rx-filter-row">
        <h2 className="rx-h2">Upcoming classes</h2>
        <div className="rx-seg" role="group" aria-label="Format">
          {(
            [
              ["all", "All"],
              ["online", "Online"],
              ["in_person", "In person"],
            ] as [Format, string][]
          ).map(([id, name]) => (
            <button key={id} type="button" aria-pressed={format === id} onClick={() => setFormat(id)}>
              {name}
            </button>
          ))}
        </div>
      </div>
      {used.length > 1 && (
        <div className="rx-chips" role="group" aria-label="Topics">
          <button type="button" aria-pressed={topic === "all"} onClick={() => setTopic("all")}>
            All <span>{byFormat.length}</span>
          </button>
          {used.map((t) => (
            <button key={t} type="button" aria-pressed={topic === t} onClick={() => setTopic(t)}>
              {label(t)} <span>{counts.get(t) ?? 0}</span>
            </button>
          ))}
        </div>
      )}
      <div className="rx-class-list">
        {shown.map((c) => {
          const end = c.endsAt ?? c.startsAt;
          const mon = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: c.timezone }).format(new Date(c.startsAt)).toUpperCase();
          const day = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: c.timezone }).format(new Date(c.startsAt));
          return (
            <a key={`${c.courseSlug}/${c.dateSlug}`} className="rx-class" href={c.href}>
              <div className="rx-cal-chip" aria-hidden="true">
                <span>{mon}</span>
                <strong>{day}</strong>
              </div>
              <div className="rx-class-body">
                <div className="rx-class-tags">
                  <span>{label(c.topic)}</span>
                  <span>·</span>
                  <span>{online(c.format) ? "Online" : cityOf(c.timezone)}</span>
                </div>
                <div className="rx-class-title">{c.courseName}</div>
                <div className="rx-class-when">
                  {dateRange(c.startsAt, end, c.timezone)} · starts {startTime(c.startsAt, c.timezone)} {zoneAbbr(c.startsAt, c.timezone)}
                </div>
              </div>
              <div className="rx-class-end">
                <strong>{c.priceMinor === null ? "—" : c.priceMinor === 0 ? "Free" : rxMoney(c.priceMinor, c.currency)}</strong>
                <span className={c.capacity > 0 && c.seatsLeft > 0 && c.seatsLeft <= 5 ? "is-low" : undefined}>{c.seatsLeft > 0 ? (c.capacity > 0 ? `${c.seatsLeft} of ${c.capacity} seats left` : "Seats available") : "Full · waitlist"}</span>
              </div>
            </a>
          );
        })}
        {shown.length === 0 && <div className="rx-empty">{classes.length ? "No classes match these filters." : "No upcoming classes right now. Check back soon."}</div>}
      </div>
    </>
  );
}
