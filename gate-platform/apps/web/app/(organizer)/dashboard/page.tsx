import { api, type ApiFailure, type Order } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { ApiNotice, Empty, Section, StatusBadge } from "@/components/ui";

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

export default async function DashboardPage() {
  const [orgRes, ordersRes, balancesRes] = await Promise.all([
    api.getOrganization(),
    api.listOrders(),
    api.getBalances(),
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
  );
}
