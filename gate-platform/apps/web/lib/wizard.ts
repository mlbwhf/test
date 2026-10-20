/** Session dates: `days` dates from `startDate` (YYYY-MM-DD), skipping Saturday and Sunday when asked. */
export function sessionDates(startDate: string, days: number, weekdaysOnly: boolean): string[] {
  const out: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return out;
  const d = new Date(`${startDate}T12:00:00Z`);
  while (out.length < days && out.length < 60) {
    const dow = d.getUTCDay();
    if (!weekdaysOnly || (dow !== 0 && dow !== 6)) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}
