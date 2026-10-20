import Link from "next/link";
import { publicApi } from "@/lib/public-api";
import { ActionForm } from "@/components/action-form";
import { ApiNotice } from "@/components/ui";
import { checkInAction } from "@/app/actions";

export const dynamic = "force-dynamic";

// Opened by scanning a ticket QR with the phone camera. Shows who it is and asks for a
// tap to confirm, so a page refresh or a link preview never checks anyone in.
export default async function ScanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const res = await publicApi.getTicket(token);
  if (!res.ok) {
    return (
      <>
        <h1>Ticket not recognised</h1>
        <ApiNotice failure={res.error} />
        <Link href="/checkin">← Check-in</Link>
      </>
    );
  }
  const { ticket: t, event, course } = res.data;
  const ok = t.status === "valid" || t.status === "checked_in";
  const statusText: Record<string, string> = {
    valid: "Valid ticket",
    checked_in: "Checked in ✓",
    pending: "Not paid yet",
    cancelled: "Cancelled",
    transferred: "Moved to another cohort",
  };

  return (
    <div className="ci-scan">
      <Link href={`/checkin?event=${encodeURIComponent(event.id)}`}>← {event.name}</Link>
      <div className={`ci-card ${ok ? (t.status === "checked_in" ? "is-in" : "is-ok") : "is-bad"}`}>
        <p className="ci-label">{statusText[t.status]}</p>
        <h1>{t.attendee.name ?? t.attendee.email}</h1>
        <p className="muted">
          {t.attendee.company ? `${t.attendee.company} · ` : ""}
          {t.attendee.email}
        </p>
        <dl className="kv">
          <dt>Course</dt>
          <dd>{course?.name ?? event.name}</dd>
          <dt>Cohort</dt>
          <dd>{event.name}</dd>
          <dt>Ticket</dt>
          <dd>{t.ticketTypeName}</dd>
          <dt>Code</dt>
          <dd className="mono">{t.code}</dd>
          {t.checkedInAt && (
            <>
              <dt>Checked in</dt>
              <dd>{new Intl.DateTimeFormat("en-US", { timeZone: event.timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(t.checkedInAt))}</dd>
            </>
          )}
        </dl>
      </div>
      {t.status === "valid" && (
        <ActionForm action={checkInAction} submitLabel="Check in" pendingLabel="Checking in…">
          <input type="hidden" name="token" value={token} />
        </ActionForm>
      )}
      {t.status === "checked_in" && (
        <ActionForm action={checkInAction} submitLabel="Undo check-in" pendingLabel="Undoing…" variant="danger">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="undo" value="1" />
        </ActionForm>
      )}
    </div>
  );
}
