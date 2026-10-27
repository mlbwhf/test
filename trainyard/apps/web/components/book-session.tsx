"use client";

// The booking page: pick what the session is for, then book a time on that session's Google
// Calendar appointment schedule, shown in place. Google handles free times, time zones, the
// details form, the invite and the Meet link.

import Link from "next/link";
import { useState } from "react";
import { SiteLogo } from "@/components/site-nav";
import "@/app/site.css";

export interface SessionType {
  id: string;
  name: string;
  desc: string;
  mins: number;
  /** The Google Calendar booking page for this type; none means booking by email. */
  url: string | null;
}

/** Google's booking page, made for embedding (gv=true drops its own chrome). */
const embedUrl = (url: string) => {
  const u = new URL(url);
  u.searchParams.set("gv", "true");
  return u.toString();
};

export function BookSession({ types, initial, email }: { types: SessionType[]; initial: string; email: string }) {
  const [id, setId] = useState(initial);
  const type = types.find((t) => t.id === id) ?? types[0]!;
  const pick = (t: SessionType) => {
    setId(t.id);
    history.replaceState(null, "", `?type=${t.id}`);
  };
  const mail = `mailto:${email}?subject=${encodeURIComponent(`${type.name} (${type.mins} min)`)}&body=${encodeURIComponent("Hi,\n\nI'd like to book a " + type.name.toLowerCase() + ". Times that suit me (with my time zone):\n\n- \n- \n\nAnything you should know (team size, tools, a question):\n\n")}`;
  return (
    <div className="bk">
      <nav className="bk-nav">
        <Link href="/" className="bk-brand">
          <SiteLogo size={44} />
          <span>
            Train<span className="bk-pink">yard</span>
          </span>
        </Link>
        <Link href="/" className="bk-back">
          ← Back to site
        </Link>
      </nav>
      <main id="main" className="bk-main">
        <div className="bk-mono bk-pink">BOOK A SESSION</div>
        <h1>Pick a time. We&apos;ll do the rest.</h1>
        <div className="bk-grid">
          <section className="bk-card" aria-labelledby="bk-what">
            <div id="bk-what" className="bk-mono bk-pink">
              1 / WHAT FOR
            </div>
            <div role="radiogroup" aria-label="Session type" className="bk-types">
              {types.map((t) => (
                <button key={t.id} role="radio" aria-checked={t.id === type.id} className={`bk-type${t.id === type.id ? " on" : ""}`} onClick={() => pick(t)}>
                  <span className="bk-dot" />
                  <span className="bk-type-text">
                    <b>{t.name}</b>
                    <span>{t.desc}</span>
                  </span>
                  <span className="bk-mono">{t.mins} min</span>
                </button>
              ))}
            </div>
            <p className="bk-note">
              Times are shown in your own time zone. The calendar invite and the video link come by email; reschedule or cancel from the invite.
            </p>
          </section>
          <section className="bk-paper" aria-labelledby="bk-when">
            <div id="bk-when" className="bk-mono bk-blue">
              2 / WHEN AND DETAILS
            </div>
            {type.url ? (
              <iframe key={type.id} className="bk-frame" src={embedUrl(type.url)} title={`Book a ${type.name.toLowerCase()}`} loading="lazy" />
            ) : (
              <div className="bk-fallback">
                <p>
                  Online booking for a {type.name.toLowerCase()} opens soon. Send us two or three times that suit you and we&apos;ll send the invite.
                </p>
                <a className="bk-cta" href={mail}>
                  Email {email} →
                </a>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
