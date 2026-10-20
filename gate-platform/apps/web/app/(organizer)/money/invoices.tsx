import { api, INVOICE_PAYMENT_METHOD_LABELS, INVOICE_PAYMENT_METHODS, type CorporateAccount, type Invoice } from "@/lib/api";
import { formatDateTime, formatMoney, minorUnitDigits } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { CopyButton } from "@/components/copy-button";
import { ApiNotice, Empty, Section, StatusBadge } from "@/components/ui";
import { HelpLink } from "@/components/help-link";
import { createCorporateAccountAction, recordInvoicePaymentAction, voidInvoiceAction } from "./invoice-actions";

const OPEN = new Set(["issued", "partially_paid"]);

function dueLabel(inv: Invoice, now: number): string {
  if (!OPEN.has(inv.status)) return formatDateTime(inv.dueAt);
  const days = Math.floor((now - new Date(inv.dueAt).getTime()) / 86_400_000);
  return days > 0 ? `${formatDateTime(inv.dueAt)} · ${days} day${days === 1 ? "" : "s"} overdue` : formatDateTime(inv.dueAt);
}

export async function InvoicesTab({ canWrite, now }: { canWrite: boolean; now: number }) {
  const [invoicesRes, accountsRes] = await Promise.all([api.listInvoices(), api.listCorporateAccounts()]);
  if (!invoicesRes.ok) return <Section title="Invoices"><ApiNotice failure={invoicesRes.error} /></Section>;
  const invoices = invoicesRes.data.items;
  const accounts: CorporateAccount[] = accountsRes.ok ? accountsRes.data.items : [];
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const open = invoices.filter((i) => OPEN.has(i.status));
  // Pay links are signed per invoice; only open invoices need one.
  const links = new Map(
    await Promise.all(open.slice(0, 50).map(async (i) => [i.id, await api.invoicePayLink(i.id)] as const)),
  );
  const outstanding = open.reduce<Record<string, number>>((acc, i) => ({ ...acc, [i.currency]: (acc[i.currency] ?? 0) + i.totalMinor - i.paidMinor }), {});

  return (
    <>
      <Section title="Invoices">
        <p className="hint">
          Companies get the invoice by email with a link to pay by card, and reminders before and after the due date
          (3 days before, on the day, then 7, 14 and 30 days late). Bank transfers you record here.{" "}
          <HelpLink slug="corporate-invoices" />
        </p>
        {Object.keys(outstanding).length > 0 && (
          <p>
            <strong>Outstanding:</strong> {Object.entries(outstanding).map(([c, m]) => formatMoney(m, c)).join(" · ")}
          </p>
        )}
        {invoices.length === 0 ? (
          <Empty>No invoices yet. Add a company below, then use “Invoice a company” on an event.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Company</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const link = links.get(inv.id);
                  const balance = inv.totalMinor - inv.paidMinor;
                  return (
                    <tr key={inv.id}>
                      <td className="mono">
                        {inv.number}
                        {inv.poNumber && <div className="hint">PO {inv.poNumber}</div>}
                      </td>
                      <td>{inv.corporateAccountId ? byId.get(inv.corporateAccountId)?.name ?? "—" : "—"}</td>
                      <td>{formatMoney(inv.totalMinor, inv.currency)}</td>
                      <td>{formatMoney(inv.paidMinor, inv.currency)}</td>
                      <td>{dueLabel(inv, now)}</td>
                      <td>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="invoice-row-actions">
                        {link?.ok && <CopyButton text={link.data.url} label="Copy pay link" />}
                        {canWrite && OPEN.has(inv.status) && (
                          <details className="row-details">
                            <summary>Record payment</summary>
                            <ActionForm action={recordInvoicePaymentAction} submitLabel="Record" pendingLabel="Recording…">
                              <input type="hidden" name="invoiceId" value={inv.id} />
                              <input type="hidden" name="currency" value={inv.currency} />
                              <div className="fields">
                                <label>
                                  Amount ({inv.currency})
                                  <input name="amount" inputMode="decimal" required defaultValue={(balance / 10 ** minorUnitDigits(inv.currency)).toFixed(minorUnitDigits(inv.currency))} />
                                </label>
                                <label>
                                  Method
                                  <select name="method" defaultValue="bank_transfer">
                                    {INVOICE_PAYMENT_METHODS.map((m) => (
                                      <option key={m} value={m}>{INVOICE_PAYMENT_METHOD_LABELS[m]}</option>
                                    ))}
                                  </select>
                                </label>
                                <label>
                                  Reference
                                  <input name="reference" placeholder="Bank reference" />
                                </label>
                              </div>
                            </ActionForm>
                          </details>
                        )}
                        {canWrite && OPEN.has(inv.status) && inv.paidMinor === 0 && (
                          <details className="row-details">
                            <summary>Void</summary>
                            <ActionForm action={voidInvoiceAction} submitLabel="Void invoice" pendingLabel="Voiding…" variant="danger">
                              <input type="hidden" name="invoiceId" value={inv.id} />
                              <label>
                                Reason
                                <input name="reason" required placeholder="Company cancelled the booking" />
                              </label>
                              <p className="hint">The unpaid seats are released and go back on sale.</p>
                            </ActionForm>
                          </details>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Companies">
        {accounts.length === 0 ? (
          <Empty>No companies yet.</Empty>
        ) : (
          <ul className="invoice-companies">
            {accounts.map((a) => (
              <li key={a.id}>
                <strong>{a.name}</strong> · {a.billingEmail} · net {a.netTermsDays} days · {a.currency}
                {a.poRequired ? " · PO required" : ""}
              </li>
            ))}
          </ul>
        )}
        {canWrite && (
          <details className="row-details">
            <summary>Add a company</summary>
            <ActionForm action={createCorporateAccountAction} submitLabel="Add company" pendingLabel="Adding…" wide>
              <div className="fields">
                <label>
                  Company name
                  <input name="name" required />
                </label>
                <label>
                  Billing email
                  <input name="billingEmail" type="email" required placeholder="accounts@company.com" />
                </label>
                <label>
                  Country (2 letters)
                  <input name="country" required maxLength={2} placeholder="US" />
                </label>
                <label>
                  Address
                  <input name="line1" />
                </label>
                <label>
                  City
                  <input name="city" />
                </label>
                <label>
                  Postal code
                  <input name="postalCode" />
                </label>
                <label>
                  Tax ID (VAT, GST…)
                  <input name="taxId" />
                </label>
                <label>
                  Currency
                  <input name="currency" maxLength={3} placeholder="Your default" />
                </label>
                <label>
                  Payment terms (days)
                  <input name="netTermsDays" type="number" min={0} max={180} defaultValue={30} />
                </label>
                <label className="label-check">
                  <input type="checkbox" name="poRequired" /> Needs a PO number on every invoice
                </label>
              </div>
            </ActionForm>
          </details>
        )}
      </Section>
    </>
  );
}
