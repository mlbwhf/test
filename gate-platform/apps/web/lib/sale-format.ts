// Sale dates for any page (client or server).

/**
 * The last day a sale step covers. Steps end at midnight in the organizer's zone (the start of the
 * next day), so stepping back 12 hours lands on the right calendar day for any zone from UTC-12 to UTC+11.
 */
export const lastDay = (iso: string, o: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...o }).format(new Date(Date.parse(iso) - 12 * 3_600_000));
