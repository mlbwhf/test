// Formatting helpers. Money is always handled as integer minor units (cents).

const LOCALE = "en-US";

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: string): Intl.NumberFormat {
  const key = currency.toUpperCase();
  let fmt = currencyFormatters.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(LOCALE, { style: "currency", currency: key });
    } catch {
      // Unknown ISO code: fall back to a plain decimal with the code appended.
      fmt = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    currencyFormatters.set(key, fmt);
  }
  return fmt;
}

/** Number of minor-unit digits for a currency (2 for EUR/USD, 0 for JPY, 3 for KWD...). */
export function minorUnitDigits(currency: string): number {
  const digits = currencyFormatter(currency).resolvedOptions().maximumFractionDigits;
  return typeof digits === "number" ? digits : 2;
}

/** Format integer minor units as a localized currency string, e.g. 1250 + "EUR" -> "€12.50". */
export function formatMoney(minor: number, currency: string): string {
  const fmt = currencyFormatter(currency);
  const digits = minorUnitDigits(currency);
  const major = minor / 10 ** digits;
  const out = fmt.format(major);
  return fmt.resolvedOptions().style === "currency" ? out : `${out} ${currency.toUpperCase()}`;
}

/** Convert a major-unit decimal string from a form ("12.50") into integer minor units (1250). */
export function parseMajorToMinor(input: string, currency: string): number | null {
  const trimmed = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const digits = minorUnitDigits(currency);
  const [whole = "0", frac = ""] = trimmed.split(".");
  if (frac.length > digits) return null;
  const minor = Number(whole) * 10 ** digits + Number(frac.padEnd(digits, "0") || "0");
  return Number.isSafeInteger(minor) ? minor : null;
}

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

/** Format an ISO timestamp as a stable, UTC-based date/time string. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${dateTimeFormatter.format(d)} UTC`;
}

/** Shorten long opaque identifiers / secrets for display: "pi_3Nabc…_secret_xyz" -> "pi_3Nabc…". */
export function truncate(value: string, keep = 12): string {
  if (value.length <= keep + 1) return value;
  return `${value.slice(0, keep)}…`;
}
