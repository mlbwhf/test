import Link from "next/link";
import { redirect } from "next/navigation";
import {
  api,
  PAYOUT_METHOD_LABELS,
  PAYOUT_METHODS,
  RELEASE_POLICIES,
  RELEASE_POLICY_LABELS,
  type ApiFailure,
  type Party,
  type RevenueCohort,
  type RevenueTotals, FX_ROUNDINGS, FX_ROUNDING_LABELS } from "@/lib/api";
import { formatDateTime, formatMoney, humanize } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { ApiNotice, Empty, Section, StatusBadge } from "@/components/ui";
import { getMe } from "@/lib/console-data";
import { MoneyKpis, OrdersTab, SettingsRows } from "./parts";
import { recordPayoutAction, refreshFxRatesAction, releaseFundsAction, updateOrganizationSettingsAction, updatePricingAction } from "@/app/actions";
import { HelpLink } from "@/components/help-link";
import { PaymentModeCard } from "@/components/payment-mode";
import { publicApi } from "@/lib/public-api";
import { FALLBACK_USD_FEES } from "@/lib/fees";

export const dynamic = "force-dynamic";

type SearchParams = { from?: string | string[]; to?: string | string[]; tab?: string | string[]; edit?: string | string[] };

const TABS = [
  ["orders", "Orders"],
  ["payouts", "Payouts"],
  ["revenue", "Revenue"],
  ["settings", "Settings"],
] as const;
type Tab = (typeof TABS)[number][0];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** A UTC instant as a "YYYY-MM-DD" form value. */
function toDateInput(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** Default report window: first day of the current month through the last day of next month. */
function defaultRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return {
    from: toDateInput(new Date(Date.UTC(y, m, 1))),
    to: toDateInput(new Date(Date.UTC(y, m + 2, 0))),
  };
}

/** Accepts a well-formed "YYYY-MM-DD" that names a real day; anything else yields null. */
function dateParam(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !DATE_RE.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) || toDateInput(d) !== value ? null : value;
}

function Tile({
  label,
  totals,
  pick,
  fallbackCurrency,
  sub,
}: {
  label: string;
  totals: Record<string, RevenueTotals>;
  pick: (t: RevenueTotals) => number;
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

/** Held funds can be released by hand once the cohort has been delivered. */
function canRelease(c: RevenueCohort, now: number): boolean {
  if (c.fundsStatus !== "held" && c.fundsStatus !== "mixed") return false;
  if (!c.endsAt) return false;
  const ends = new Date(c.endsAt).getTime();
  return !Number.isNaN(ends) && ends < now;
}

export default async function MoneyPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const defaults = defaultRange();
  const from = dateParam(query.from) ?? defaults.from;
  const to = dateParam(query.to) ?? defaults.to;
  const rangeInverted = from > to;
  // The form carries calendar days; the API takes instants covering those whole days (UTC).
  const fromIso = `${from}T00:00:00.000Z`;
  const toIso = `${to}T23:59:59.999Z`;

  const tabRaw = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  const tab: Tab = TABS.some(([k]) => k === tabRaw) ? (tabRaw as Tab) : "orders";
  const [ordersRes, linesRes, meRes] = await Promise.all([api.listOrders(), api.eventLines(), getMe()]);
  const perms = meRes.ok ? meRes.data.permissions : [];
  if (!perms.includes("money:read")) redirect("/dashboard");
  const [orgRes, reportRes, payablesRes, payoutsRes, partiesRes] = await Promise.all([
    api.getOrganization(),
    rangeInverted ? Promise.resolve(null) : api.getRevenueReport(fromIso, toIso),
    api.listPayables(),
    api.listPayouts(),
    api.listParties(),
  ]);

  const unreachable: ApiFailure | undefined = [orgRes, reportRes, payablesRes, payoutsRes, partiesRes]
    .map((r) => (r === null || r.ok ? null : r.error))
    .find((e): e is ApiFailure => e !== null && e.kind === "unreachable");

  const org = orgRes.ok ? orgRes.data : null;
  const fallbackCurrency = org?.currency ?? "USD";
  // How you get paid: the mode, each mode's Stripe account, and the published fees.
  const [paymentsRes, feesRes] = tab === "settings" && perms.includes("settings") ? await Promise.all([api.refreshPayments(), publicApi.getFees()]) : [null, null];
  const fees = (feesRes?.ok ? feesRes.data.currencies[fallbackCurrency] ?? feesRes.data.currencies.USD : undefined) ?? FALLBACK_USD_FEES;
  const feeCurrency = feesRes?.ok && feesRes.data.currencies[fallbackCurrency] ? fallbackCurrency : "USD";
  const report = reportRes && reportRes.ok ? reportRes.data : null;
  const cohorts = report?.cohorts ?? [];
  const payables = payablesRes.ok ? payablesRes.data.items : [];
  const payouts = payoutsRes.ok ? payoutsRes.data.items : [];
  const parties: Party[] = partiesRes.ok ? partiesRes.data.items : [];
  const partyNames = new Map(parties.map((p) => [p.id, p.name]));
  const now = Date.now();
  const orders = ordersRes.ok ? ordersRes.data.items : [];
  const lines = linesRes.ok ? linesRes.data.items : [];

  // Currencies offered on the payout form: the organization's, then every currency with a payable.
  const payoutCurrencies = [...new Set<string>([fallbackCurrency, ...payables.map((p) => p.currency)])];

  return (
    <>
      <div className="money-head">
        <h1>
          Money <HelpLink slug="how-payments-work" />
        </h1>
        <nav className="money-tabs" aria-label="Money">
          {TABS.map(([k, label]) => (
            <Link key={k} href={k === "orders" ? "/money" : `/money?tab=${k}`} aria-current={tab === k ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <MoneyKpis orders={orders} currency={fallbackCurrency} />

      {unreachable && <ApiNotice failure={unreachable} />}
      {!unreachable && !orgRes.ok && <ApiNotice failure={orgRes.error} />}

      {tab === "revenue" && (
      <Section title="Revenue">
        <form method="get" action="/money" className="range-form">
          <input type="hidden" name="tab" value="revenue" />
          <label className="label-inline">
            From
            <input type="date" name="from" defaultValue={from} required />
          </label>
          <label className="label-inline">
            To
            <input type="date" name="to" defaultValue={to} required />
          </label>
          <button type="submit" className="btn btn-primary">
            Apply
          </button>
          <span className="hint">
            Revenue is recognized for cohorts that end inside the range; paid cohorts ending after the range are deferred.
          </span>
        </form>

        {rangeInverted ? (
          <div className="notice notice-warn" role="alert">
            <strong>The &ldquo;from&rdquo; date is after the &ldquo;to&rdquo; date.</strong>
            <span className="muted"> Pick a range that starts before it ends.</span>
          </div>
        ) : reportRes && !reportRes.ok ? (
          reportRes.error.kind === "unreachable" ? (
            <Empty>Revenue report unavailable while the API is unreachable.</Empty>
          ) : (
            <ApiNotice failure={reportRes.error} />
          )
        ) : (
          <>
            <div className="tiles" style={{ marginTop: 16 }}>
              <Tile
                label="Recognized"
                totals={report?.byCurrency ?? {}}
                pick={(t) => t.recognizedMinor}
                fallbackCurrency={fallbackCurrency}
                sub={`cohorts ended ${from} – ${to}`}
              />
              <Tile
                label="Deferred"
                totals={report?.byCurrency ?? {}}
                pick={(t) => t.deferredMinor}
                fallbackCurrency={fallbackCurrency}
                sub={`paid, ending after ${to}`}
              />
              <Tile
                label="Refunded"
                totals={report?.byCurrency ?? {}}
                pick={(t) => t.refundedMinor}
                fallbackCurrency={fallbackCurrency}
                sub="refunds in the range"
              />
            </div>

            <div className="subsection">
              <h3>Cohorts</h3>
              {cohorts.length === 0 ? (
                <Empty>No cohorts with activity in this range.</Empty>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Cohort</th>
                        <th>Course</th>
                        <th>Dates</th>
                        <th>Status</th>
                        <th className="num">Seats</th>
                        <th className="num">Gross</th>
                        <th className="num">Fees</th>
                        <th className="num">Tax</th>
                        <th className="num">Instructor fees</th>
                        <th className="num">Margin</th>
                        <th>Funds</th>
                        <th>Recognized</th>
                        <th>Release</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohorts.map((c) => (
                        <tr key={c.eventId}>
                          <td>
                            <Link href={`/events/${encodeURIComponent(c.eventId)}`}>{c.name}</Link>
                          </td>
                          <td>{c.courseName ?? <span className="muted">—</span>}</td>
                          <td>
                            {formatDateTime(c.startsAt)}
                            {c.endsAt ? (
                              <>
                                <br />
                                <span className="muted">to {formatDateTime(c.endsAt)}</span>
                              </>
                            ) : null}
                          </td>
                          <td>
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="num">{c.seats}</td>
                          <td className="num">{formatMoney(c.grossMinor, c.currency)}</td>
                          <td className="num">
                            {formatMoney(c.platformFeeMinor, c.currency)}
                            {c.refundedMinor > 0 && (
                              <>
                                <br />
                                <span className="muted">refunded {formatMoney(c.refundedMinor, c.currency)}</span>
                              </>
                            )}
                          </td>
                          <td className="num">{formatMoney(c.taxMinor, c.currency)}</td>
                          <td className="num">{formatMoney(c.instructorFeesMinor, c.currency)}</td>
                          <td className="num">{formatMoney(c.marginMinor, c.currency)}</td>
                          <td>
                            <StatusBadge status={c.fundsStatus} />
                          </td>
                          <td aria-label={c.recognized ? "Recognized" : "Deferred"}>
                            {c.recognized ? "✓" : <span className="muted">—</span>}
                          </td>
                          <td>
                            {canRelease(c, now) ? (
                              <ActionForm action={releaseFundsAction} submitLabel="Release funds" pendingLabel="Releasing…" inline>
                                <input type="hidden" name="eventId" value={c.eventId} />
                                <input type="hidden" name="currency" value={c.currency} />
                              </ActionForm>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="hint">
                Fees are platform fees; margin is organizer net less refunds and instructor fees. &ldquo;Release funds&rdquo;
                appears for delivered cohorts whose funds are still held.
              </p>
            </div>
          </>
        )}
      </Section>
      )}

      {tab === "orders" && <OrdersTab orders={orders} lines={lines} canWrite={perms.includes("money:write")} now={now} />}

      {tab === "payouts" && (
      <Section title="Payables">
        {!payablesRes.ok ? (
          payablesRes.error.kind === "unreachable" ? (
            <Empty>Payables unavailable while the API is unreachable.</Empty>
          ) : (
            <ApiNotice failure={payablesRes.error} />
          )
        ) : payables.length === 0 ? (
          <Empty>Nothing payable yet. Payables appear once orders are paid and funds are released.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Party</th>
                  <th>Kind</th>
                  <th>Currency</th>
                  <th className="num">Payable</th>
                  <th className="num">Held</th>
                </tr>
              </thead>
              <tbody>
                {payables.map((p) => (
                  <tr key={`${p.partyId ?? "organizer"}-${p.currency}`}>
                    <td>{p.partyId === null ? <strong>{p.name || "Organizer"}</strong> : p.name}</td>
                    <td>{p.kind ? humanize(p.kind) : <span className="muted">Organizer</span>}</td>
                    <td>{p.currency}</td>
                    <td className="num">{formatMoney(p.payableMinor, p.currency)}</td>
                    <td className="num">{formatMoney(p.heldMinor, p.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="subsection">
          <h3>Record payout</h3>
          {!partiesRes.ok && partiesRes.error.kind !== "unreachable" && <ApiNotice failure={partiesRes.error} />}
          <ActionForm action={recordPayoutAction} submitLabel="Record payout" pendingLabel="Recording…" wide>
            <div className="fields">
              <label>
                Pay to
                <select name="partyId" defaultValue="">
                  <option value="">Organizer{org ? ` (${org.name})` : ""}</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {humanize(p.kind)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Currency
                <select name="currency" required defaultValue={fallbackCurrency}>
                  {payoutCurrencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Amount (major units)
                <input name="amount" required inputMode="decimal" placeholder="250.00" />
              </label>
              <label>
                Method
                <select name="method" required defaultValue="bank_transfer">
                  {PAYOUT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {PAYOUT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Reference (optional)
                <input name="reference" placeholder="Bank reference, cheque number or invoice number" />
              </label>
            </div>
            <p className="hint">
              Records a payout you made outside the platform; it reduces the party&apos;s payable balance by the amount
              entered.
            </p>
          </ActionForm>
        </div>

        <div className="subsection">
          <h3>Recent payouts</h3>
          {!payoutsRes.ok ? (
            payoutsRes.error.kind === "unreachable" ? (
              <Empty>Payouts unavailable while the API is unreachable.</Empty>
            ) : (
              <ApiNotice failure={payoutsRes.error} />
            )
          ) : payouts.length === 0 ? (
            <Empty>No payouts recorded yet.</Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Payout</th>
                    <th>To</th>
                    <th className="num">Amount</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.slice(0, 20).map((p) => (
                    <tr key={p.id}>
                      <td className="mono">{p.id}</td>
                      <td>{p.partyId === null ? <strong>Organizer</strong> : (partyNames.get(p.partyId) ?? p.partyId)}</td>
                      <td className="num">{formatMoney(p.amountMinor, p.currency)}</td>
                      <td>{PAYOUT_METHOD_LABELS[p.method] ?? humanize(p.method)}</td>
                      <td>{p.reference ?? <span className="muted">—</span>}</td>
                      <td>{formatDateTime(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Section>
      )}

      {tab === "settings" && paymentsRes?.ok && <PaymentModeCard state={paymentsRes.data} fees={fees} currency={feeCurrency} canEdit={perms.includes("settings")} />}
      {tab === "settings" && org && <SettingsRows org={org} canEdit={perms.includes("settings")} paymentsSetup={meRes.ok ? meRes.data.organization?.paymentsSetup ?? null : null} showPayments={!paymentsRes?.ok} />}

      {tab === "settings" && perms.includes("settings") && (
      <details className="card edit-block" id="pricing" open={query.edit === "pricing"}>
        <summary>Edit currencies and localized pricing</summary>
        {!orgRes.ok || !org ? (
          <Empty>Pricing settings unavailable.</Empty>
        ) : (
          <>
            <p className="hint">
              Your base currency is <strong>{org.currency}</strong>. Add the currencies learners may pay in. A ticket uses its explicit price in that currency when you set one; otherwise, with conversion on, the base price is converted at the stored rate and rounded. Buyers see which prices are converted, and are charged in the currency they chose.
            </p>
            <ActionForm action={updatePricingAction} submitLabel="Save pricing" pendingLabel="Saving…" wide>
              <div className="fields-row">
                <label>
                  Extra currencies (codes, comma-separated)
                  <input name="currencies" defaultValue={org.pricing.currencies.join(", ")} placeholder="CAD, EUR, GBP" />
                </label>
                <label>
                  Rounding for converted prices
                  <select name="rounding" defaultValue={org.pricing.rounding}>
                    {FX_ROUNDINGS.map((r) => (
                      <option key={r} value={r}>
                        {FX_ROUNDING_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="label-check">
                <input type="checkbox" name="fxFallback" defaultChecked={org.pricing.fxFallback} /> Convert the base price for currencies without an explicit price
              </label>
              {org.pricing.currencies.length > 0 && (
                <fieldset>
                  <legend>Rates (units per 1 {org.currency}); leave blank to keep the stored rate</legend>
                  <div className="fields-row">
                    {org.pricing.currencies.map((c) => (
                      <label key={c}>
                        {c}
                        <input name={`rate_${c}`} inputMode="decimal" placeholder={org.pricing.rates[c] ? String(org.pricing.rates[c]) : "not set"} />
                      </label>
                    ))}
                  </div>
                  <p className="hint">
                    {org.pricing.ratesUpdatedAt
                      ? `Stored rates updated ${formatDateTime(org.pricing.ratesUpdatedAt)} (${org.pricing.ratesSource === "ecb" ? "ECB reference rates" : "entered by hand"}).`
                      : "No rates stored yet: fetch ECB reference rates below or type them in."}
                  </p>
                </fieldset>
              )}
            </ActionForm>
            {org.pricing.currencies.length > 0 && (
              <ActionForm action={refreshFxRatesAction} submitLabel="Fetch today's ECB rates" pendingLabel="Fetching…" inline>
                <span className="hint">European Central Bank reference rates via frankfurter.app; about 30 major currencies.</span>
              </ActionForm>
            )}
          </>
        )}
      </details>
      )}

      {tab === "settings" && perms.includes("settings") && (
      <details className="card edit-block" id="rules" open={query.edit === "rules"}>
        <summary>Edit release and enrolment rules</summary>
        {!orgRes.ok ? (
          <Empty>Organization settings unavailable.</Empty>
        ) : (
          <ActionForm action={updateOrganizationSettingsAction} submitLabel="Save settings" pendingLabel="Saving…" wide>
            <div className="fields">
              <label>
                Release policy
                <select name="releasePolicy" required defaultValue={org?.releasePolicy ?? "on_delivery"}>
                  {RELEASE_POLICIES.map((p) => (
                    <option key={p} value={p}>
                      {RELEASE_POLICY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Release grace (hours after the cohort ends)
                <input
                  name="releaseGraceHours"
                  type="number"
                  min={0}
                  step={1}
                  required
                  defaultValue={org?.releaseGraceHours ?? 0}
                />
              </label>
              <label>
                Minimum-enrolment decision (days before start)
                <input
                  name="minEnrollmentDecisionDays"
                  type="number"
                  min={0}
                  step={1}
                  required
                  defaultValue={org?.minEnrollmentDecisionDays ?? 0}
                />
              </label>
            </div>
            <p className="hint">
              Under &ldquo;on delivery&rdquo;, organizer funds stay held until the grace period after a cohort ends.
              A cohort still below its minimum enrollment this many days before its first session is flagged at risk.
            </p>
          </ActionForm>
        )}
      </details>
      )}
    </>
  );
}
