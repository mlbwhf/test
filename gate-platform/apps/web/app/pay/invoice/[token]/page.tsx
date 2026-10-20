import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/public-api";
import { formatMoney } from "@/lib/format";
import { InvoicePay } from "@/components/invoice-pay";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoice", robots: { index: false } };

const STATUS = { issued: "Open", partially_paid: "Partly paid", paid: "Paid", void: "Void" } as const;

/** The billing contact's page for a corporate invoice: the signed link from the invoice email. */
export default async function InvoicePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ redirect_status?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const res = await publicApi.getInvoice(token);
  if (!res.ok) notFound();
  const i = res.data;
  const due = i.totalMinor - i.paidMinor;
  const day = (iso: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(iso));
  const overdue = i.status !== "paid" && i.status !== "void" && new Date(i.dueAt) < new Date();
  const pk = process.env.STRIPE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null;
  return (
    <main className="invoice-page">
      <p className="eyebrow-mono">INVOICE · {i.organization.toUpperCase()}</p>
      <h1>{i.number}</h1>
      <p className={`chip ${i.status === "paid" ? "chip-ok" : overdue ? "chip-err" : "chip-warn"}`}>{overdue ? "Overdue" : STATUS[i.status]}</p>
      <dl className="invoice-facts">
        {i.account && (
          <>
            <dt>Billed to</dt>
            <dd>{i.account}</dd>
          </>
        )}
        {i.poNumber && (
          <>
            <dt>Purchase order</dt>
            <dd>{i.poNumber}</dd>
          </>
        )}
        <dt>For</dt>
        <dd>
          {i.course && !i.cohort.startsWith(i.course) ? `${i.course}: ` : ""}
          {i.cohort} · {i.seats} seat{i.seats === 1 ? "" : "s"}, starting {day(i.startsAt)}
        </dd>
        <dt>Issued</dt>
        <dd>{day(i.issuedAt)}</dd>
        <dt>Due</dt>
        <dd>{day(i.dueAt)}</dd>
        <dt>Total</dt>
        <dd>
          {formatMoney(i.totalMinor, i.currency)}
          {i.taxMinor ? ` (incl. ${formatMoney(i.taxMinor, i.currency)} tax)` : ""}
        </dd>
        {i.paidMinor > 0 && (
          <>
            <dt>Paid</dt>
            <dd>{formatMoney(i.paidMinor, i.currency)}</dd>
          </>
        )}
      </dl>
      {i.status === "paid" || sp.redirect_status === "succeeded" ? (
        <p className="notice notice-info">{i.status === "paid" ? "This invoice is paid. Thank you." : "Payment received. It can take a minute to show as paid."}</p>
      ) : i.status === "void" ? (
        <p className="notice notice-warn">This invoice was cancelled. Contact {i.organization} if you have questions.</p>
      ) : (
        <section className="invoice-pay" aria-labelledby="pay-title">
          <h2 id="pay-title">Pay {formatMoney(due, i.currency)}</h2>
          {pk ? <InvoicePay token={token} publishableKey={pk} amountLabel={formatMoney(due, i.currency)} /> : <p className="muted">Card payment isn&apos;t available here right now.</p>}
          <p className="hint">Or pay by bank transfer quoting {i.number}; {i.organization} records it when it arrives.</p>
        </section>
      )}
    </main>
  );
}
