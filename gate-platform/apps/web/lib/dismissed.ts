// Attention items a person has dismissed on this device. Ids encode the situation
// (e.g. "low:evt_1:3" changes when another seat sells), so a dismissal lapses on its own
// once things change. Browser storage can be missing or blocked; then nothing is hidden.

const KEY = "ec:dismissed";
export const DISMISSED_EVENT = "ec:dismissed";

export function readDismissed(): Set<string> {
  try {
    const raw = window.localStorage.getItem(KEY);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

export function dismiss(id: string, current: string[]): void {
  // Keep only ids still on screen so the list can't grow forever.
  const next = [...readDismissed()].filter((x) => current.includes(x));
  next.push(id);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable: the row still hides for this page view
  }
  window.dispatchEvent(new Event(DISMISSED_EVENT));
}
