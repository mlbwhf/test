"use server";

import { api, describeFailure } from "@/lib/api";

export type CheckInOutcome =
  | { ok: true; seatId: string; eventId: string; name: string; checkedInAt: string | null; alreadyCheckedIn: boolean }
  | { ok: false; error: string };

/** Check-in mode: toggle by door code, or check in from a scanned ticket QR (token). */
export async function checkInSeat(input: { eventId: string; code?: string; token?: string; undo?: boolean }): Promise<CheckInOutcome> {
  if (!input.token && !input.code) return { ok: false, error: "Scan a ticket or type its code, e.g. EC-7K2M-94QX." };
  const r = await api.checkIn(input.token ? { token: input.token, undo: Boolean(input.undo) } : { code: input.code!, eventId: input.eventId, undo: Boolean(input.undo) });
  if (!r.ok) return { ok: false, error: describeFailure(r.error) };
  return {
    ok: true,
    seatId: r.data.seat.id,
    eventId: r.data.event.id,
    name: r.data.seat.attendee.name ?? r.data.seat.attendee.email,
    checkedInAt: r.data.seat.checkedInAt,
    alreadyCheckedIn: r.data.alreadyCheckedIn,
  };
}
