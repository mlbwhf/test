import Link from "next/link";
import { api, type ApiFailure, type ApiResult, type Order } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { ApiNotice, Empty, Section, StatusBadge } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { connectStripeAction } from "@/app/auth-actions";

export const dynamic = "force-dynamic";

type Totals = Record<string, { gross: number; net: number; fees: number; count: number }>;

function summarizePaid(orders: Order[]): Totals {
  const totals: Totals = {};
  for (const order of orders) {
    if (order.status !== "paid") continue;
    const t = (totals[order.currency] ??= { gross: 0, net: 0, fees: 0, count: 0 });
    t.gross += order.pricing.totalMinor;
    t.net += order.pricing.organizerNetMinor;
    t.fees += order.pricing.platformFeeMinor + order.pricing.attendeeFeeMinor;
    t.count += 1;
  }
  return totals;
}

function Tile({
  label,
  totals,
  pick,
  fallbackCurrency,
  sub,
}: {
  label: string;
  totals: Totals;
  pick: (t: Totals[string]) => number;
  fallbackCurrency: string;
  sub: string;
}) {
  const currencies = Object.keys(totals);
  return (
    <div className="tile">
      <p className="tile-label">{label}</p>
      {currencies.length === 0 ? (
        <p className="tile-value">{formatMoney(0, fallbackCurrency)}</p>
      ) : (
        currencies.map((c) => (
          <p className="tile-value" key={c}>
            {formatMoney(pick(totals[c]!), c)}
          </p>
        ))
      )}
      <p className="tile-sub">{sub}</p>
    </div>
  );
}

const skipped = <T,>(): Promise<ApiResult<T>> => Promise.resolve({ ok: false, error: { kind: "api", status: 403, code: "FORBIDDEN", message: "not shown for your role" } });

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const meRes = await api.me();
  const perms = meRes.ok ? meRes.data.permissions : [];
  const seesMoney = perms.includes("money:read");
  const [orgRes, ordersRes, balancesRes, coursesRes, eventsRes] = await Promise.all([
    api.getOrganization(),
    seesMoney ? api.listOrders() : skipped<{ items: Order[] }>(),
    seesMoney ? api.getBalances() : skipped<Awaited<ReturnType<typeof api.getBalances>> extends ApiResult<infer B> ? B : never>(),
    api.listCourses(),
    api.listEvents(),
  ]);

  const unreachable: ApiFailure | undefined = [orgRes, ordersRes, balancesRes]
    .map((r) => (r.ok ? null : r.error))
    .find((e): e is ApiFailure => e !== null && e.kind === "unreachable");

  const org = orgRes.ok ? orgRes.data : null;
  const orders = ordersRes.ok ? ordersRes.data.items : [];
  const totals = summarizePaid(orders);
  const fallbackCurrency = org?.currency ?? "USD";
  const paidCount = Object.values(totals).reduce((n, t) => n + t.count, 0);

  return (
    <>
      <div className="page-header">
        <h1>{org ? org.name : "Dashboard"}</h1>
        {org && (
          <span className="muted">
            {org.country} · {org.currency} · payouts to {org.payoutDestination.replace("_", " ")}
          </span>
        )}
      </div>

      {unreachable && <ApiNotice failure={unreachable} />}
      {!unreachable && !orgRes.ok && <ApiNotice failure={orgRes.error} />}

      {meRes.ok && (
        <GettingStarted
          welcome={sp.welcome === "1"}
          canSettings={perms.includes("settings")}
          canClasses={perms.includes("classes:write")}
          paymentsConnected={meRes.data.organization?.paymentsConnected ?? false}
          individual={meRes.data.organization?.kind === "individual"}
          courses={coursesRes.ok ? coursesRes.data.items.length : 0}
          cohorts={eventsRes.ok ? eventsRes.data.items.length : 0}
          paid={paidCount}
          firstCourseId={coursesRes.ok ? coursesRes.data.items[0]?.id : undefined}
        />
      )}

      {seesMoney && (
      <>
      <div className="tiles">
        <Tile
          label="Gross sales"
          totals={totals}
          pick={(t) => t.gross}
          fallbackCurrency={fallbackCurrency}
          sub={`${paidCount} paid order${paidCount === 1 ? "" : "s"}`}
        />
        <Tile
          label="Organizer net"
          totals={totals}
          pick={(t) => t.net}
          fallbackCurrency={fallbackCurrency}
          sub="after platform fees"
        />
        <Tile
          label="Platform fees"
          totals={totals}
          pick={(t) => t.fees}
          fallbackCurrency={fallbackCurrency}
          sub="platform + attendee fees on paid orders"
        />
      </div>

      <Section title="Ledger balances">
        {!balancesRes.ok ? (
          balancesRes.error.kind === "unreachable" ? (
            <Empty>Balances unavailable while the API is unreachable.</Empty>
          ) : (
            <ApiNotice failure={balancesRes.error} />
          )
        ) : balancesRes.data.accounts.length === 0 ? (
          <Empty>No ledger accounts yet.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Currency</th>
                  <th className="num">Balance</th>
                </tr>
              </thead>
              <tbody>
                {balancesRes.data.accounts.map((a) => (
                  <tr key={`${a.code}-${a.currency}`}>
                    <td className="mono">{a.code}</td>
                    <td>{a.name}</td>
                    <td>{a.type}</td>
                    <td>{a.currency}</td>
                    <td className="num">{formatMoney(a.balanceMinor, a.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Recent orders">
        {!ordersRes.ok ? (
          ordersRes.error.kind === "unreachable" ? (
            <Empty>Orders unavailable while the API is unreachable.</Empty>
          ) : (
            <ApiNotice failure={ordersRes.error} />
          )
        ) : orders.length === 0 ? (
          <Empty>No orders yet. Sell a test ticket from an event page.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Buyer</th>
                  <th className="num">Qty</th>
                  <th className="num">Total</th>
                  <th className="num">Organizer net</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((o) => (
                  <tr key={o.id}>
                    <td className="mono">{o.id}</td>
                    <td>{o.buyerEmail}</td>
                    <td className="num">{o.quantity}</td>
                    <td className="num">{formatMoney(o.pricing.totalMinor, o.currency)}</td>
                    <td className="num">{formatMoney(o.pricing.organizerNetMinor, o.currency)}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
      </>
      )}
    </>
  );
}

function GettingStarted(p: { welcome: boolean; canSettings: boolean; canClasses: boolean; paymentsConnected: boolean; individual: boolean; courses: number; cohorts: number; paid: number; firstCourseId: string | undefined }) {
  const steps = [
    { done: true, title: "Create your account", body: p.individual ? "Your practice is set up with you as its instructor." : "Invite instructors, admins and finance from Team." },
    { done: p.paymentsConnected, title: "Connect Stripe to get paid", body: "Payments go to your own Stripe account; EnrollClass holds them until the course is delivered.", action: p.canSettings && !p.paymentsConnected ? "stripe" : undefined },
    { done: p.courses > 0, title: "Add a course", body: "The course is what you teach: name, description, cover image.", href: "/courses" },
    { done: p.cohorts > 0, title: "Schedule a cohort and set ticket prices", body: "A cohort is one run of the course with dates, seats and prices.", href: p.firstCourseId ? `/courses/${p.firstCourseId}` : "/courses" },
    { done: p.paid > 0, title: "Share it and take your first registration", body: "Embed the registration widget on your site or send the course link.", href: p.firstCourseId ? `/courses/${p.firstCourseId}` : "/courses" },
  ];
  const left = steps.filter((s) => !s.done).length;
  if (left === 0 && !p.welcome) return null;
  return (
    <section className="card start">
      <div className="start-head">
        <div>
          <p className="eyebrow-mono">{left === 0 ? "ALL SET" : `GETTING STARTED · ${steps.length - left} OF ${steps.length}`}</p>
          <h2>{left === 0 ? "You're live" : p.welcome ? "Welcome! Five steps to your first registration" : "Finish setting up"}</h2>
        </div>
        <div className="start-bar" aria-hidden="true">
          <div style={{ width: `${((steps.length - left) / steps.length) * 100}%` }} />
        </div>
      </div>
      <ol className="start-steps">
        {steps.map((s, i) => (
          <li key={s.title} className={s.done ? "is-done" : ""}>
            <span className="start-dot" aria-hidden="true">{s.done ? "✓" : i + 1}</span>
            <div>
              <div className="start-title">{s.title}</div>
              <div className="start-body">{s.body}</div>
            </div>
            {!s.done && s.action === "stripe" && (
              <ActionForm action={connectStripeAction} submitLabel="Connect Stripe" pendingLabel="Opening Stripe…" inline>
                <span />
              </ActionForm>
            )}
            {!s.done && s.href && p.canClasses && (
              <Link className="btn" href={s.href}>
                Open
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
