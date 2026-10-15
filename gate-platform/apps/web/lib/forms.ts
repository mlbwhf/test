// Row counts shared between the server-rendered forms and the server actions
// that parse them. Kept outside app/actions.ts because a "use server" module
// may only export async functions.

/** Number of session rows rendered on the "Add cohort" form. */
export const MAX_SESSIONS = 5;
/** Number of regional price rows rendered on the ticket-type form (base and early-bird each). */
export const REGIONAL_PRICE_ROWS = 3;
/** Number of attendee rows rendered on the "Sell test ticket" form (= max test quantity). */
export const MAX_ATTENDEES = 5;

export const DEFAULT_TIMEZONE = "America/Toronto";
