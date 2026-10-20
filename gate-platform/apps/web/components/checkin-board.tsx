"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { checkInSeat, type CheckInOutcome } from "@/app/checkin-actions";

export type BoardSeat = { id: string; name: string | null; email: string; company: string | null; code: string; checkedInAt: string | null };
export type BoardEvent = { id: string; name: string; day: number | null; days: number };
export type BoardChoice = { id: string; name: string; when: string };

type Flash = { tone: "ok" | "warn" | "err"; text: string } | null;

// BarcodeDetector is not in TypeScript's DOM types yet.
type Detector = { detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>> };
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => Detector;
  }
}

/** A ticket QR encodes <web>/checkin/<token>; accept the bare token or a door code too. */
function parseScan(raw: string): { token?: string; code?: string } {
  const text = raw.trim();
  const m = text.match(/\/checkin\/([A-Za-z0-9_.-]+)\/?$/);
  if (m) return { token: decodeURIComponent(m[1]!) };
  if (/^EC-?[0-9A-Z]{4}-?[0-9A-Z]{4}$/i.test(text)) return { code: text.toUpperCase() };
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{10,}$/.test(text)) return { token: text };
  return {};
}

function initials(name: string | null, email: string) {
  const w = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (w.length >= 2) return (w[0]![0]! + w[w.length - 1]![0]!).toUpperCase();
  return (w[0] ?? email).slice(0, 2).toUpperCase();
}

function Scanner({ onResult, onClose }: { onResult: (text: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [code, setCode] = useState("");
  useEffect(() => {
    let stream: MediaStream | null = null;
    let stop = false;
    (async () => {
      if (!window.BarcodeDetector) {
        setProblem("This browser can't read QR codes here. Type the code under the QR, or scan with the phone's camera app.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      } catch {
        setProblem("Camera blocked. Allow camera access, or type the code under the QR.");
        return;
      }
      const v = video.current!;
      v.srcObject = stream;
      await v.play().catch(() => undefined);
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      while (!stop) {
        try {
          const found = await detector.detect(v);
          if (found[0]?.rawValue) {
            onResult(found[0].rawValue);
            return;
          }
        } catch {
          // frame not ready yet
        }
        await new Promise((r) => setTimeout(r, 250));
      }
    })();
    return () => {
      stop = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  return (
    <div className="scan-overlay" role="dialog" aria-modal="true" aria-label="Scan ticket">
      <div className="scan-box">
        {problem ? <p className="scan-problem">{problem}</p> : <video ref={video} playsInline muted className="scan-video" />}
        {!problem && <span className="scan-frame" aria-hidden="true" />}
        <form
          className="scan-code"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) onResult(code);
          }}
        >
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="EC-7K2M-94QX" autoCapitalize="characters" autoComplete="off" spellCheck={false} aria-label="Ticket code" />
          <button type="submit">Check in</button>
        </form>
        <button type="button" className="scan-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export function CheckInBoard({ event, seats: initial, choices }: { event: BoardEvent; seats: BoardSeat[]; choices: BoardChoice[] }) {
  const router = useRouter();
  const [seats, setSeats] = useState(initial);
  const [q, setQ] = useState("");
  const [scanning, setScanning] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();

  // Fresh data from the server (other doors checking people in) replaces local state.
  useEffect(() => setSeats(initial), [initial]);
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 15_000);
    return () => clearInterval(t);
  }, [router]);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  const inCount = seats.filter((s) => s.checkedInAt).length;
  const needle = q.trim().toLowerCase();
  const shown = useMemo(
    () => (needle ? seats.filter((s) => [s.name ?? "", s.email, s.company ?? "", s.code].some((x) => x.toLowerCase().includes(needle))) : seats),
    [seats, needle],
  );

  function apply(r: CheckInOutcome, undo: boolean) {
    if (!r.ok) {
      setFlash({ tone: "err", text: r.error });
      return;
    }
    if (r.eventId !== event.id) {
      setFlash({ tone: "warn", text: `${r.name} is booked on another cohort and was checked in there.` });
      return;
    }
    setSeats((list) => list.map((s) => (s.id === r.seatId ? { ...s, checkedInAt: r.checkedInAt } : s)));
    setFlash(undo ? { tone: "warn", text: `Undone: ${r.name}` } : r.alreadyCheckedIn ? { tone: "warn", text: `${r.name} was already checked in` } : { tone: "ok", text: `Checked in: ${r.name}` });
  }

  function toggle(s: BoardSeat) {
    const undo = Boolean(s.checkedInAt);
    setBusy(s.id);
    // Optimistic: flip now, the server answer settles it.
    setSeats((list) => list.map((x) => (x.id === s.id ? { ...x, checkedInAt: undo ? null : new Date().toISOString() } : x)));
    start(async () => {
      const r = await checkInSeat({ eventId: event.id, code: s.code, undo });
      if (!r.ok) setSeats((list) => list.map((x) => (x.id === s.id ? s : x)));
      apply(r, undo);
      setBusy(null);
    });
  }

  // Stable, so the camera isn't restarted on every render.
  const scanned = useCallback((text: string) => {
    setScanning(false);
    const parsed = parseScan(text);
    if (!parsed.token && !parsed.code) {
      setFlash({ tone: "err", text: "That isn't an EnrollClass ticket." });
      return;
    }
    start(async () => apply(await checkInSeat({ eventId: event.id, ...parsed }), false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  return (
    <div className="ci-mode">
      <aside className="ci-side">
        <Link href="/dashboard" className="ci-exit">
          × Exit check-in
        </Link>
        <p className="ci-event">{event.name}</p>
        {event.day && (
          <p className="ci-day">
            DAY {event.day} OF {event.days}
          </p>
        )}
        <p className="ci-big" aria-live="polite">
          {inCount}
          <span> / {seats.length}</span>
        </p>
        <div className="ci-seats" role="img" aria-label={`${inCount} of ${seats.length} checked in`}>
          {seats.slice(0, 80).map((s) => (
            <span key={s.id} className={s.checkedInAt ? "on" : ""} />
          ))}
        </div>
        <button type="button" className="ci-scan" onClick={() => setScanning(true)}>
          Scan next ticket
        </button>
        {choices.length > 1 && (
          <nav className="ci-choices" aria-label="Cohort">
            {choices.map((c) => (
              <Link key={c.id} href={`/checkin?event=${encodeURIComponent(c.id)}`} aria-current={c.id === event.id ? "page" : undefined}>
                {c.name}
                <span>{c.when}</span>
              </Link>
            ))}
          </nav>
        )}
      </aside>

      <section className="ci-main" aria-label="Attendees">
        <input className="ci-find" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, company or code" aria-label="Search attendees" />
        {flash && (
          <p className={`ci-flash ci-flash-${flash.tone}`} role="status">
            {flash.text}
          </p>
        )}
        {shown.length === 0 ? (
          <p className="today-clear">{needle ? "Nobody matches that search." : "No confirmed seats yet."}</p>
        ) : (
          <ul className="ci-cards">
            {shown.map((s) => (
              <li key={s.id}>
                <button type="button" className={`ci-card${s.checkedInAt ? " is-in" : ""}`} aria-pressed={Boolean(s.checkedInAt)} disabled={busy === s.id} onClick={() => toggle(s)}>
                  <span className="ci-avatar" aria-hidden="true">
                    {s.checkedInAt ? "✓" : initials(s.name, s.email)}
                  </span>
                  <span className="ci-who">
                    <strong>{s.name ?? s.email}</strong>
                    <span>{s.company ?? s.code}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {scanning && <Scanner onResult={scanned} onClose={() => setScanning(false)} />}
    </div>
  );
}
