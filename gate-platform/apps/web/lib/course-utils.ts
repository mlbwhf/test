/** Languages offered in course forms and filters (ISO 639-1). */
export const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "it", label: "Italian" },
  { code: "nl", label: "Dutch" },
  { code: "ar", label: "Arabic" },
];

/** The course's language, or a guess from its name ("… en Español", "(En Français)"), defaulting to English. */
export function courseLanguage(c: { language: string | null; name: string }): string {
  if (c.language) return c.language;
  const n = c.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/\b(en espanol|espanol|spanish|certificacion|liderazgo)\b/.test(n)) return "es";
  if (/\b(en francais|francais|french)\b/.test(n)) return "fr";
  if (/\b(auf deutsch|deutsch|german)\b/.test(n)) return "de";
  if (/\b(em portugues|portugues|portuguese)\b/.test(n)) return "pt";
  return "en";
}

/** URL slug from a course name: lowercase, accents stripped, ® and ™ removed, other characters to hyphens. */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[®™©]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "?") + (words[1]?.[0] ?? "")).toUpperCase();
}
