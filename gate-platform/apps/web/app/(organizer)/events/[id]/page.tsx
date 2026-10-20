import Link from "next/link";
import {
  api,
  ATTENDANCE_STATUSES,
  MEETING_PROVIDER_LABELS,
  MEETING_PROVIDERS,
  ROSTER_FORMAT_LABELS,
  ROSTER_FORMATS,
  SEQUENCE_STEP_LABELS,
  type Course,
  type Event,
  type Meeting,
  type Party,
  type RegionalPrices,
  type TicketType,
} from "@/lib/api";
import { formatDateTimeInZone, formatMoney, formatTimeInZone, humanize, minorUnitDigits } from "@/lib/format";
import { MAX_ATTENDEES, MAX_INSTRUCTOR_FEES, REGIONAL_PRICE_ROWS } from "@/lib/forms";
import { ActionForm } from "@/components/action-form";
import { RosterDownload } from "@/components/roster-download";
import { ApiNotice, Empty, Section, StatusBadge } from "@/components/ui";
import {
  cancelCohortAction,
  createMeetingAction,
  createTicketTypeAction,
  issueCertificatesAction,
  recordAttendanceAction,
  runSequencesAction,
  saveInstructorFeesAction,
  sellTestTicketAction,
  syncAttendanceAction,
} from "@/app/actions";

export const dynamic = "force-dynamic";

function RegionalPriceList({ prices }: { prices: RegionalPrices | null }) {
  const entries = Object.entries(prices ?? {});
  if (entries.length === 0) return <span className="muted">—</span>;
  return (
    <>
      {entries.map(([currency, minor], i) => (
        <span key={currency}>
          {i > 0 && <br />}
          {formatMoney(minor, currency)}
        </span>
      ))}
    </>
  );
}

/** Integer minor units as a plain major-unit form value, e.g. 50000 + "CAD" -> "500.00". */
function formatMajor(minor: number, currency: string): string {
  const digits = minorUnitDigits(currency);
  return (minor / 10 ** digits).toFixed(digits);
}

/** Base currency first, then every regional currency across the given ticket types. */
function sellableCurrencies(base: string, ticketTypes: TicketType[]): string[] {
  const set = new Set<string>([base]);
  for (const t of ticketTypes) {
    for (const c of Object.keys(t.prices ?? {})) set.add(c);
    for (const c of Object.keys(t.earlyBird?.prices ?? {})) set.add(c);
  }
  return [...set];
}

function RegionalPriceRows({ prefix }: { prefix: string }) {
  return (
    <div className="fields-row">
      {Array.from({ length: REGIONAL_PRICE_ROWS }, (_, i) => (
        <div key={i} className="fields-row">
          <label>
            Currency {i + 1}
            <input
              name={`${prefix}_${i}_currency`}
              maxLength={3}
              pattern="[A-Za-z]{3}"
              placeholder="USD"
              style={{ textTransform: "uppercase" }}
            />
          </label>
          <label>
            Price {i + 1}
            <input name={`${prefix}_${i}_price`} inputMode="decimal" placeholder="19.00" />
          </label>
        </div>
      ))}
    </div>
  );
}

function MeetingCard({ eventId, meeting }: { eventId: string; meeting: Meeting | null }) {
  if (!meeting) {
    return (
      <ActionForm action={createMeetingAction} submitLabel="Create meeting" pendingLabel="Creating…">
        <input type="hidden" name="eventId" value={eventId} />
        <div className="fields">
          <label>
            Provider
            <select name="provider" required defaultValue="zoom">
              {MEETING_PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {MEETING_PROVIDER_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Join URL (required for a manual link)
            <input name="joinUrl" type="url" placeholder="https://…" />
          </label>
          <label>
            Host URL (optional)
            <input name="hostUrl" type="url" placeholder="https://…" />
          </label>
          <label>
            Passcode (optional)
            <input name="passcode" autoComplete="off" />
          </label>
        </div>
        <p className="hint">
          Zoom and Microsoft Teams meetings are created through the provider; leave the link fields blank for those.
          Pick &ldquo;Manual link&rdquo; to paste a meeting you set up yourself.
        </p>
      </ActionForm>
    );
  }

  return (
    <>
      <dl className="kv">
        <dt>Provider</dt>
        <dd>
          <StatusBadge status={meeting.provider} /> <span className="muted">{MEETING_PROVIDER_LABELS[meeting.provider]}</span>
        </dd>
        <dt>Meeting ID</dt>
        <dd>
          <code>{meeting.meetingId}</code>
        </dd>
        <dt>Join link</dt>
        <dd>
          <a href={meeting.joinUrl} target="_blank" rel="noreferrer">
            {meeting.joinUrl}
          </a>
        </dd>
        <dt>Host link</dt>
        <dd>
          {meeting.hostUrl ? (
            <a href={meeting.hostUrl} target="_blank" rel="noreferrer">
              {meeting.hostUrl}
            </a>
          ) : (
            <span className="muted">—</span>
          )}
        </dd>
        <dt>Passcode</dt>
        <dd>{meeting.passcode ? <code>{meeting.passcode}</code> : <span className="muted">—</span>}</dd>
      </dl>
      <p className="hint">Learners receive the link in the day-before and day-of emails.</p>
    </>
  );
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meRes = await api.me();
  const canMoney = meRes.ok && meRes.data.permissions.includes("money:write");
  const isTeam = meRes.ok && meRes.data.organization?.kind !== "individual";
  const [eventRes, ticketTypesRes, seatsRes, attendanceRes, certificatesRes, messagesRes, partiesRes] =
    await Promise.all([
      api.getEvent(id),
      api.listTicketTypes(id),
      api.listSeats(id),
      api.listAttendance(id),
      api.listCertificates(id),
      api.listMessages(id),
      api.listParties(),
    ]);

  if (!eventRes.ok) {
    return (
      <>
        <div className="page-header">
          <h1>Event</h1>
          <Link href="/events">← All events</Link>
        </div>
        <ApiNotice failure={eventRes.error} />
      </>
    );
  }

  const event = eventRes.data;
  const ticketTypes = ticketTypesRes.ok ? ticketTypesRes.data.items : [];
  const seats = seatsRes.ok ? seatsRes.data.items : [];
  const timezone = event.timezone || "UTC";
  const currencies = sellableCurrencies(event.currency, ticketTypes);
  const rosterHref = `/events/${encodeURIComponent(event.id)}/roster.csv`;
  const attendance = attendanceRes.ok ? attendanceRes.data.items : [];
  const certificates = certificatesRes.ok ? certificatesRes.data.items : [];
  const messages = messagesRes.ok ? messagesRes.data.items : [];
  const meeting = event.meeting ?? null;
  const canSync = meeting !== null && meeting.provider !== "manual";
  const cancelled = event.status === "cancelled" || Boolean(event.cancelledAt);
  const instructorFees = event.instructorFees ?? [];
  const parties: Party[] = partiesRes.ok ? partiesRes.data.items : [];
  const instructors = parties.filter((p) => p.kind === "instructor");
  const partyNames = new Map(parties.map((p) => [p.id, p.name]));

  let course: Course | null = null;
  let transferTargets: Event[] = [];
  if (event.courseId) {
    const [courseRes, cohortsRes] = await Promise.all([api.getCourse(event.courseId), api.listCohorts(event.courseId)]);
    if (courseRes.ok) course = courseRes.data;
    if (cohortsRes.ok) transferTargets = cohortsRes.data.items.filter((c) => c.id !== event.id && c.status === "live");
  }

  return (
    <>
      <div className="page-header">
        <h1>{event.name}</h1>
        <StatusBadge status={event.status} />
        {event.atRiskAt && !cancelled && (
          <span className="badge badge-at_risk">At risk since {formatDateTimeInZone(event.atRiskAt, timezone)}</span>
        )}
        <span className="muted">
          {formatDateTimeInZone(event.startsAt, timezone)}
          {event.endsAt ? ` – ${formatDateTimeInZone(event.endsAt, timezone)}` : ""} · {timezone} ·{" "}
          {humanize(event.format)} · {event.currency} · <code>{event.id}</code>
        </span>
        {event.courseId && (
          <Link href={`/courses/${encodeURIComponent(event.courseId)}`}>
            ← Course{course ? `: ${course.name}` : ""}
          </Link>
        )}
        <Link href="/events">← All events</Link>
      </div>

      {cancelled && (
        <div className="notice notice-error" role="alert">
          <strong>
            Cancelled{event.cancelledAt ? ` on ${formatDateTimeInZone(event.cancelledAt, timezone)}` : ""}.
          </strong>
          <span className="muted"> {event.cancelReason ? `Reason: ${event.cancelReason}` : "No reason recorded."}</span>
        </div>
      )}

      <Section title="Sessions">
        {event.sessions.length === 0 ? (
          <Empty>No sessions scheduled. Times shown in {timezone}.</Empty>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Starts ({timezone})</th>
                    <th>Ends</th>
                  </tr>
                </thead>
                <tbody>
                  {event.sessions.map((s, i) => (
                    <tr key={`${s.startsAt}-${i}`}>
                      <td className="num">{i + 1}</td>
                      <td>{s.title ?? <span className="muted">—</span>}</td>
                      <td>{formatDateTimeInZone(s.startsAt, timezone)}</td>
                      <td>{formatTimeInZone(s.endsAt, timezone)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hint">
              {event.minEnrollment !== null ? `Minimum enrollment ${event.minEnrollment}. ` : ""}
              {event.instructorIds.length} instructor{event.instructorIds.length === 1 ? "" : "s"} assigned.
            </p>
          </>
        )}
      </Section>

      <Section title="Delivery">
        <div className="subsection">
          <h3>Meeting</h3>
          <MeetingCard eventId={event.id} meeting={meeting} />
        </div>

        <div className="subsection">
          <h3>Attendance</h3>
          <div className="section-actions">
            {canSync ? (
              <ActionForm action={syncAttendanceAction} submitLabel="Sync from meeting" pendingLabel="Syncing…" inline>
                <input type="hidden" name="eventId" value={event.id} />
              </ActionForm>
            ) : (
              <>
                <button type="button" className="btn btn-primary" disabled>
                  Sync from meeting
                </button>
                <span className="hint">
                  {meeting === null
                    ? "Create a Zoom or Teams meeting first to pull attendance from the provider."
                    : "Manual meeting links have no provider report; mark attendance by hand below."}
                </span>
              </>
            )}
          </div>
          {!attendanceRes.ok ? (
            <ApiNotice failure={attendanceRes.error} />
          ) : attendance.length === 0 ? (
            <Empty>No attendance records yet. Seats appear here once tickets are sold.</Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th className="num">Minutes</th>
                    <th className="num">Sessions</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Override</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a) => (
                    <tr key={a.seatId}>
                      <td>{a.name ?? <span className="muted">—</span>}</td>
                      <td>{a.email}</td>
                      <td className="num">{a.minutes}</td>
                      <td className="num">{a.sessionsAttended}</td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                      <td>{a.source === "none" ? <span className="muted">—</span> : humanize(a.source)}</td>
                      <td>
                        <ActionForm action={recordAttendanceAction} submitLabel="Save" pendingLabel="Saving…" inline>
                          <input type="hidden" name="eventId" value={event.id} />
                          <input type="hidden" name="seatId" value={a.seatId} />
                          <select
                            name="status"
                            aria-label={`Attendance status for ${a.email}`}
                            defaultValue={a.status === "unknown" ? "present" : a.status}
                          >
                            {ATTENDANCE_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {humanize(st)}
                              </option>
                            ))}
                          </select>
                        </ActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="subsection">
          <h3>Certificates</h3>
          {!certificatesRes.ok ? (
            <ApiNotice failure={certificatesRes.error} />
          ) : certificates.length === 0 ? (
            <Empty>No certificates issued yet.</Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Issued</th>
                    <th>Verify code</th>
                    <th>Links</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((c) => (
                    <tr key={c.id}>
                      <td>{c.attendeeName || <span className="muted">—</span>}</td>
                      <td>{c.attendeeEmail}</td>
                      <td>{formatDateTimeInZone(c.issuedAt, timezone)}</td>
                      <td className="mono">{c.verifyCode}</td>
                      <td>
                        <a href={c.verifyUrl} target="_blank" rel="noreferrer">
                          Verify
                        </a>
                        {" · "}
                        <a href={c.viewUrl} target="_blank" rel="noreferrer">
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <ActionForm action={issueCertificatesAction} submitLabel="Issue certificates" pendingLabel="Issuing…">
            <input type="hidden" name="eventId" value={event.id} />
            <label className="label-check">
              <input type="checkbox" name="onlyPresent" defaultChecked />
              Only learners marked present
            </label>
            <p className="hint">
              Learners who already hold a certificate for this cohort are skipped. Each certificate gets a verify
              code and is emailed as the &ldquo;Certificate&rdquo; sequence step.
            </p>
          </ActionForm>
        </div>

        <div className="subsection">
          <h3>Messages</h3>
          {!messagesRes.ok ? (
            <ApiNotice failure={messagesRes.error} />
          ) : messages.length === 0 ? (
            <Empty>No sequence emails sent yet. Steps: pre-work (T-14), reminders (T-7, T-1), day of, survey, certificate.</Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>To</th>
                    <th>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <tr key={m.key}>
                      <td>{SEQUENCE_STEP_LABELS[m.step] ?? humanize(m.step)}</td>
                      <td>{m.to}</td>
                      <td>{formatDateTimeInZone(m.sentAt, timezone)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <ActionForm action={runSequencesAction} submitLabel="Run due messages now" pendingLabel="Sending…">
            <input type="hidden" name="eventId" value={event.id} />
            <p className="hint">Sends every scheduled email that is due across all cohorts, instead of waiting for the next scheduled run.</p>
          </ActionForm>
        </div>

        {canMoney && (
        <div className="subsection">
          <h3>Money</h3>
          {!partiesRes.ok && <ApiNotice failure={partiesRes.error} />}
          {isTeam && (
            <>
              <h4 className="hint">Instructor pay</h4>
              <p className="hint">
                What you pay the instructors for teaching this cohort. It is subtracted from the cohort&apos;s profit on the Money page and recorded as owed to
                them until you record the payout. Learners never see it and ticket prices don&apos;t change.
              </p>
              {instructorFees.length > 0 && (
                <ul className="fees-list">
                  {instructorFees.map((f) => (
                    <li key={f.partyId}>
                      {partyNames.get(f.partyId) ?? <code>{f.partyId}</code>}: {formatMoney(f.amountMinor, event.currency)}
                    </li>
                  ))}
                </ul>
              )}
              {instructors.length === 0 ? (
                <p className="hint">
                  No instructors yet. <Link href="/instructors">Add one</Link>, or invite them from <Link href="/team">Team</Link>.
                </p>
              ) : (
                <ActionForm action={saveInstructorFeesAction} submitLabel="Save instructor pay" pendingLabel="Saving…" wide>
                  <input type="hidden" name="eventId" value={event.id} />
                  <input type="hidden" name="currency" value={event.currency} />
                  {Array.from({ length: Math.min(instructorFees.length + 1, MAX_INSTRUCTOR_FEES) }, (_, i) => {
                    const existing = instructorFees[i];
                    return (
                      <div key={i} className="fields-row">
                        <label>
                          Instructor
                          <select name={`fee_${i}_partyId`} defaultValue={existing?.partyId ?? ""}>
                            <option value="">Choose…</option>
                            {instructors.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Amount ({event.currency})
                          <input name={`fee_${i}_amount`} inputMode="decimal" placeholder="e.g. 500" defaultValue={existing ? formatMajor(existing.amountMinor, event.currency) : ""} />
                        </label>
                      </div>
                    );
                  })}
                  <p className="hint">To remove someone&apos;s pay, clear the amount and save. Up to {MAX_INSTRUCTOR_FEES} instructors per cohort.</p>
                </ActionForm>
              )}
            </>
          )}

          <h4 className="hint">Cancel cohort</h4>
          {cancelled ? (
            <Empty>This cohort is cancelled.</Empty>
          ) : (
            <ActionForm action={cancelCohortAction} submitLabel="Cancel cohort" pendingLabel="Cancelling…" variant="danger" wide>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="courseId" value={event.courseId ?? ""} />
              <label>
                Reason (shared with learners)
                <textarea name="reason" rows={3} required placeholder="Instructor unavailable; the cohort will not run." />
              </label>
              <label>
                Transfer learners to (optional)
                {transferTargets.length === 0 ? (
                  <span className="hint">
                    {event.courseId
                      ? "No other live cohort of this course; paid seats are refunded."
                      : "Not linked to a course; paid seats are refunded."}
                  </span>
                ) : (
                  <select name="transferToEventId" defaultValue="">
                    <option value="">— refund instead —</option>
                    {transferTargets.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {formatDateTimeInZone(c.startsAt, c.timezone)}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <label className="label-check">
                <input type="checkbox" name="confirm" />I understand this cancels the cohort and refunds or moves every
                paid seat.
              </label>
              <p className="hint">
                Learners are moved to the chosen cohort when one is picked; otherwise their orders are refunded. Unpaid
                seats are voided.
              </p>
            </ActionForm>
          )}
        </div>
        )}
      </Section>

      <Section title="Ticket types" id="tickets">
        {!ticketTypesRes.ok ? (
          <ApiNotice failure={ticketTypesRes.error} />
        ) : ticketTypes.length === 0 ? (
          <Empty>No ticket types yet. Add one below.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="num">Base price</th>
                  <th className="num">Regional</th>
                  <th>Early bird</th>
                  <th className="num">Quantity</th>
                  <th className="num">Sold</th>
                  <th className="num">Remaining</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {ticketTypes.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td className="num">{formatMoney(t.priceMinor, event.currency)}</td>
                    <td className="num">
                      <RegionalPriceList prices={t.prices} />
                    </td>
                    <td>
                      {t.earlyBird ? (
                        <>
                          {formatMoney(t.earlyBird.priceMinor, event.currency)}
                          {t.earlyBird.prices && Object.keys(t.earlyBird.prices).length > 0 && (
                            <>
                              {" "}
                              (
                              {Object.entries(t.earlyBird.prices)
                                .map(([c, m]) => formatMoney(m, c))
                                .join(", ")}
                              )
                            </>
                          )}
                          <br />
                          <span className="muted">until {formatDateTimeInZone(t.earlyBird.until, timezone)}</span>
                        </>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="num">{t.quantity}</td>
                    <td className="num">{t.sold}</td>
                    <td className="num">{t.quantity - t.sold}</td>
                    <td className="mono">{t.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Create ticket type">
        <ActionForm action={createTicketTypeAction} submitLabel="Create ticket type" pendingLabel="Creating…" wide>
          <input type="hidden" name="eventId" value={event.id} />
          <input type="hidden" name="currency" value={event.currency} />
          <input type="hidden" name="timezone" value={timezone} />
          <div className="fields">
            <label>
              Name
              <input name="name" required placeholder="General admission" />
            </label>
            <label>
              Price ({event.currency})
              <input name="price" required inputMode="decimal" placeholder="25.00" />
            </label>
            <label>
              Quantity
              <input name="quantity" type="number" min={1} step={1} required defaultValue={100} />
            </label>
          </div>

          <fieldset>
            <legend>Regional prices (optional)</legend>
            <p className="hint">Fixed prices in other currencies, in major units. Leave blank to sell only in {event.currency}.</p>
            <RegionalPriceRows prefix="regional" />
          </fieldset>

          <fieldset>
            <legend>Early bird (optional)</legend>
            <div className="fields">
              <label>
                Until (end of day, {timezone})
                <input name="earlyBirdUntil" type="date" />
              </label>
              <label>
                Early-bird price ({event.currency})
                <input name="earlyBirdPrice" inputMode="decimal" placeholder="19.00" />
              </label>
            </div>
            <p className="hint">Optional early-bird regional prices:</p>
            <RegionalPriceRows prefix="eb_regional" />
          </fieldset>
        </ActionForm>
      </Section>

      <Section title="Roster">
        <div className="section-actions">
          <span className="muted">
            {seatsRes.ok
              ? `${seats.length} seat${seats.length === 1 ? "" : "s"}`
              : "Seats unavailable"}
          </span>
          <RosterDownload
            href={rosterHref}
            defaultFormat="default"
            formats={ROSTER_FORMATS.map((f) => ({ value: f, label: ROSTER_FORMAT_LABELS[f] }))}
          />
          <span className="hint">Column layout follows the chosen format (SAFe Studio and Scrum.org match their import templates).</span>
        </div>
        {!seatsRes.ok ? (
          <ApiNotice failure={seatsRes.error} />
        ) : seats.length === 0 ? (
          <Empty>No seats yet. Sell a ticket below to add attendees to the roster.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Order</th>
                </tr>
              </thead>
              <tbody>
                {seats.map((s) => (
                  <tr key={s.id}>
                    <td>{s.attendee.name ?? <span className="muted">—</span>}</td>
                    <td>{s.attendee.email}</td>
                    <td>{s.attendee.company ?? <span className="muted">—</span>}</td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="mono">{s.orderId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Sell test ticket">
        {ticketTypes.length === 0 ? (
          <Empty>Create a ticket type first.</Empty>
        ) : (
          <ActionForm action={sellTestTicketAction} submitLabel="Create order" pendingLabel="Creating order…" wide>
            <input type="hidden" name="eventId" value={event.id} />
            <div className="fields">
              <label>
                Ticket type
                <select name="ticketTypeId" required defaultValue={ticketTypes[0]?.id}>
                  {ticketTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {formatMoney(t.priceMinor, event.currency)}
                      {t.prices && Object.keys(t.prices).length > 0 ? ` (+${Object.keys(t.prices).join(", ")})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Currency
                <select name="currency" required defaultValue={event.currency}>
                  {currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                      {c === event.currency ? " (base)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity (1–{MAX_ATTENDEES})
                <input name="quantity" type="number" min={1} max={MAX_ATTENDEES} step={1} required defaultValue={1} />
              </label>
              <label>
                Buyer email
                <input name="buyerEmail" type="email" required placeholder="buyer@example.com" />
              </label>
            </div>

            <fieldset>
              <legend>Attendees</legend>
              <p className="hint">
                One row per seat; only the first <em>quantity</em> rows with an email are sent. A regional currency
                is only accepted when the chosen ticket type has a price in it.
              </p>
              {Array.from({ length: MAX_ATTENDEES }, (_, i) => (
                <div key={i} className="fields-row">
                  <label>
                    Attendee {i + 1} email
                    <input name={`attendee_${i}_email`} type="email" placeholder="attendee@example.com" />
                  </label>
                  <label>
                    Attendee {i + 1} name
                    <input name={`attendee_${i}_name`} placeholder="Full name" />
                  </label>
                </div>
              ))}
            </fieldset>
          </ActionForm>
        )}
      </Section>
    </>
  );
}
