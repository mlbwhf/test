import Link from "next/link";
import { api, type Home, type HomeLine } from "@/lib/api";
import { getHome, getMe } from "@/lib/console-data";
import { formatMoney } from "@/lib/format";
import { ApiNotice } from "@/components/ui";
import { AttentionList } from "@/components/attention-list";
import { LocalDate } from "@/components/local-date";
import { releaseFundsAction } from "@/app/actions";
import { connectStripeAction } from "@/app/auth-actions";

export const dynamic = "force-dynamic";

const STEP_CTA: Record<Home["setup"]["steps"][number]["key"], { label: string; href: string }> = {
  account: { label: "Finish your account", href: "/onboarding" },
  payments: { label: "Connect Stripe", href: "#attention-title" },
  course: { label: "Add a course", href: "/courses" },
  cohort: { label: "Schedule a cohort", href: "/events/new" },
  registration: { label: "Share your first link", href: "/courses" },
};

function when(line: HomeLine): string {
  const d = new Date(line.startsAt);
  const date = new Intl.DateTimeFormat("en-US", { timeZone: line.timezone, month: "short", day: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: line.timezone, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(d);
  return `${date} · ${time}`;
}

function Kpi({ label, rows, pick, sub, green }: { label: string; rows: NonNullable<Home["money"]>; pick: (r: NonNullable<Home["money"]>[number]) => number; sub: string; green?: boolean }) {
  const [first, ...rest] = rows;
  return (
    <div className="tkpi">
      <p className="tkpi-label">{label}</p>
      <p className={`tkpi-value${green ? " is-green" : ""}`}>{first ? formatMoney(pick(first), first.currency) : "—"}</p>
      {rest.map((r) => (
        <p key={r.currency} className="tkpi-more">
          + {formatMoney(pick(r), r.currency)}
        </p>
      ))}
      <p className="tkpi-sub">{sub}</p>
    </div>
  );
}

function SetupPill({ setup }: { setup: Home["setup"] }) {
  if (setup.done >= setup.total) return null;
  const next = setup.steps.find((s) => !s.done);
  const cta = next ? STEP_CTA[next.key] : null;
  return (
    <div className="setup-pill">
      <span className="setup-label">
        SETUP {setup.done} / {setup.total}
      </span>
      <span className="setup-segs" role="img" aria-label={`${setup.done} of ${setup.total} setup steps done`}>
        {setup.steps.map((s) => (
          <span key={s.key} className={s.done ? "is-done" : ""} />
        ))}
      </span>
      {cta && (
        <Link className="setup-cta" href={cta.href}>
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function LiveCard({ live }: { live: NonNullable<Home["live"]> }) {
  const shown = Math.min(live.confirmed, 60);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: live.timezone, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(live.startsAt));
  return (
    <section className="live-card" aria-label="Running today">
      <div className="live-top">
        <span className="live-chip">
          <span className="live-dot" aria-hidden="true" /> LIVE · DAY {live.day} OF {live.days}
        </span>
        <span className="live-time">{time}</span>
      </div>
      <h2>{live.name}</h2>
      {shown > 0 && (
        <div className="seat-strip" role="img" aria-label={`${live.checkedIn} of ${live.confirmed} checked in`}>
          {Array.from({ length: shown }, (_, i) => (
            <span key={i} className={i < live.checkedIn ? "is-in" : ""} />
          ))}
        </div>
      )}
      <div className="live-foot">
        <span>
          <strong>{live.checkedIn}</strong> of {live.confirmed} checked in
        </span>
        <Link className="live-cta" href={`/checkin?event=${encodeURIComponent(live.eventId)}`}>
          Open check-in
        </Link>
      </div>
    </section>
  );
}

function Week({ week, canCreate }: { week: HomeLine[]; canCreate: boolean }) {
  return (
    <section className="card today-week" aria-labelledby="week-title">
      <h2 id="week-title">Starting this week</h2>
      {week.length === 0 ? (
        <p className="today-clear">
          Nothing starts in the next 7 days.{" "}
          {canCreate && <Link href="/events/new">Schedule a cohort</Link>}
        </p>
      ) : (
        <ul className="week-rows">
          {week.map((l) => (
            <li key={l.eventId}>
              <Link href={`/events/${encodeURIComponent(l.eventId)}`}>
                <span className="week-name">{l.name}</span>
                <span className="week-when">{when(l)}</span>
              </Link>
              <span className="fill" aria-hidden="true">
                <span style={{ width: `${l.capacity ? Math.min(100, (l.sold / l.capacity) * 100) : 0}%` }} />
              </span>
              <span className="week-count">
                {l.sold}/{l.capacity}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function TodayPage() {
  const meRes = await getMe();
  let homeRes = await getHome();
  // Stripe setup still open (or just back from Stripe): ask Stripe for the account's real state.
  if (meRes.ok && meRes.data.organization?.paymentsSetup === "incomplete") {
    const refreshed = await api.refreshPayments();
    if (refreshed.ok && refreshed.data.setup === "ready") homeRes = await api.home();
  }
  if (!homeRes.ok) {
    return (
      <>
        <h1>Today</h1>
        <ApiNotice failure={homeRes.error} />
      </>
    );
  }
  const home = homeRes.data;
  const perms = meRes.ok ? meRes.data.permissions : [];
  const money = home.money;
  const paid = money?.reduce((n, r) => n + r.paidOrders, 0) ?? 0;

  return (
    <div className="today">
      <div className="today-head">
        <h1>
          Today <LocalDate />
        </h1>
        {perms.includes("settings") && <SetupPill setup={home.setup} />}
      </div>

      {money && (
        <div className="tkpis">
          <Kpi label="Gross sales" rows={money} pick={(r) => r.grossMinor} sub={`${paid} paid order${paid === 1 ? "" : "s"}`} />
          <Kpi label="Organizer net" rows={money} pick={(r) => r.netMinor} sub="after platform fees" />
          <Kpi label="Platform fees" rows={money} pick={(r) => r.feesMinor} sub="on paid orders" />
          <Kpi label="Held in ledger" rows={money} pick={(r) => r.heldMinor} sub="releases after delivery" green />
        </div>
      )}

      <div className="today-cols">
        <AttentionList items={home.attention} release={perms.includes("money:write") ? releaseFundsAction : null} connectStripe={perms.includes("settings") ? connectStripeAction : null} />
        <div className="today-side">
          {home.live && <LiveCard live={home.live} />}
          <Week week={home.week} canCreate={perms.includes("classes:write")} />
        </div>
      </div>
    </div>
  );
}
