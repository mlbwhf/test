import { describe, expect, it } from "vitest";
import { certificationBase, cleanAttendee, coursePageSections, isTimeZone, normalizeCoursePage, sameCertification, videoEmbedUrl } from "./class-page.js";
import type { Course } from "./types.js";

describe("class page", () => {
  it("turns YouTube and Vimeo links into privacy-friendly embeds and refuses anything else", () => {
    expect(videoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://vimeo.com/123456789")).toBe("https://player.vimeo.com/video/123456789?dnt=1");
    for (const bad of ["http://youtu.be/dQw4w9WgXcQ", "https://example.com/watch?v=dQw4w9WgXcQ", "https://youtube.com/watch?v=<script>", "javascript:alert(1)", "not a url"]) expect(videoEmbedUrl(bad)).toBeNull();
  });

  it("sections show when there's content, unless the organizer switched them off", () => {
    const course = { id: "c", organizationId: "o", slug: "s", name: "N", createdAt: new Date(), imageUrl: "https://x/y.png", page: { agenda: [["a"]], modules: { banner: false } } } as Course;
    expect(coursePageSections(course, { logo: true, instructors: false })).toEqual({ banner: false, logo: true, badge: false, video: false, agenda: true, included: false, instructor: false, seats: true });
  });

  it("matches language versions of one certification", () => {
    const base = "advanced safe practice consultant";
    for (const n of ["Advanced SAFe® Practice Consultant", "Advanced SAFe Practice Consultant - En Français", "Advanced SAFe® Practice Consultant (French)", "Advanced SAFe Practice Consultant – Español", "Advanced SAFe Practice Consultant en français", "Advanced SAFe Practice Consultant (EN)"]) expect(certificationBase(n)).toBe(base);
    expect(certificationBase("Leading SAFe (SAFe Agilist)")).toBe("leading safe safe agilist");
    expect(certificationBase("SAFe® 6 Practice Consultant (SPC) en français")).toBe(certificationBase("Certified SAFe® 6 Practice Consultant (SPC)"));
    expect(sameCertification({ name: "SPC" }, { name: "Practice Consultant", badge: undefined })).toBe(false);
    const badge = { platform: "credly" as const, name: "Certified SAFe RTE" };
    expect(sameCertification({ name: "RTE class", badge }, { name: "Release Train Engineer (FR)", badge })).toBe(true);
    expect(sameCertification({ name: "Advanced SAFe Practice Consultant" }, { name: "SAFe Practice Consultant" })).toBe(false);
  });

  it("validates page content and learner details", () => {
    expect(() => normalizeCoursePage({ modules: { sidebar: true } as never })).toThrow(/unknown page section/);
    expect(() => normalizeCoursePage({ agenda: Array.from({ length: 15 }, () => ["x"]) })).toThrow(/14 days/);
    expect(isTimeZone("America/Toronto")).toBe(true);
    expect(isTimeZone("Mars/Base")).toBe(false);
    expect(cleanAttendee({ email: " a@b.co ", name: "  Ada ", timeZone: "Nope/Zone", readyChecks: { camera: true, extra: true } as never })).toEqual({ email: "a@b.co", name: "Ada", readyChecks: { camera: true } });
  });
});
