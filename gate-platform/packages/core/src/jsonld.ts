import type { Course, Event, Organization } from "./types.js";

/**
 * schema.org Course + hasCourseInstance for a course page. One canonical
 * URL, many dated cohorts, which is what Google's education rich results
 * expect (see course-dates-architecture.md in the agile-agilist repo).
 */
export function courseJsonLd(input: {
  organization: Pick<Organization, "name">;
  organizationUrl?: string | undefined;
  course: Course;
  pageUrl: string;
  cohorts: Array<{ event: Event; priceMinor: number | undefined; currency: string; remaining: number }>;
}): Record<string, unknown> {
  const modeFor = (f: Event["format"]) => (f === "in_person" ? "onsite" : f === "hybrid" ? "blended" : "online");
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.course.name,
    ...(input.course.imageUrl ? { image: input.course.imageUrl } : {}),
    ...(input.course.description ? { description: input.course.description } : {}),
    provider: { "@type": "Organization", name: input.organization.name, ...(input.organizationUrl ? { url: input.organizationUrl } : {}) },
    url: input.pageUrl,
    hasCourseInstance: input.cohorts.map(({ event, priceMinor, currency, remaining }) => ({
      "@type": "CourseInstance",
      name: event.name,
      courseMode: modeFor(event.format),
      startDate: event.startsAt.toISOString(),
      ...(event.endsAt ? { endDate: event.endsAt.toISOString() } : {}),
      ...(event.format === "in_person" ? {} : { location: { "@type": "VirtualLocation", url: input.pageUrl } }),
      ...(event.sessions.length
        ? { courseSchedule: { "@type": "Schedule", repeatCount: event.sessions.length, startDate: event.sessions[0]!.startsAt.toISOString(), endDate: event.sessions[event.sessions.length - 1]!.endsAt.toISOString(), scheduleTimezone: event.timezone } }
        : {}),
      ...(priceMinor !== undefined
        ? {
            offers: {
              "@type": "Offer",
              price: (priceMinor / 100).toFixed(2),
              priceCurrency: currency,
              availability: remaining > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
              url: input.pageUrl,
            },
          }
        : {}),
    })),
  };
}
