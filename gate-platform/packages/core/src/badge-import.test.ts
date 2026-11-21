import { describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";
import { parseEarners, parseIssued } from "./badge-import.js";
import type { BadgeAward } from "./types.js";

const CREDLY = `Badge Template Name,Recipient First Name,Recipient Last Name,Recipient Email,Issued At,Expires At,State
SAFe Agilist,Ada,Lovelace,ADA@example.com,2024-03-05 14:02:11 UTC,,accepted
SAFe Agilist,"O'Brien, Jr.",Pat,pat@example.com,2023-11-20 09:00:00 UTC,,pending
SAFe Agilist,No,Email,,2023-01-01 00:00:00 UTC,,accepted
SAFe Agilist,Ada,Again,ada@example.com,2024-03-05 14:02:11 UTC,,accepted`;
const ACCREDIBLE = `Recipient Name,Recipient Email,Issued On,Group
Grace Hopper,grace@example.com,03/15/2022,Cohort 4`;
const BADGR = `﻿Recipient identifier;Issued on;Narrative
alan@example.com;2021-06-01T10:00:00Z;Built the machine`;

describe("earner exports from other badge platforms", () => {
  it("reads Credly, Accredible and Badgr columns, skipping unusable rows", () => {
    const c = parseEarners(CREDLY);
    expect(c.rows).toEqual([
      { name: "Ada Lovelace", email: "ada@example.com", issuedAt: new Date("2024-03-05T14:02:11Z") },
      { name: "O'Brien, Jr. Pat", email: "pat@example.com", issuedAt: new Date("2023-11-20T09:00:00Z") },
    ]);
    expect(c.skipped).toEqual([{ line: 4, reason: "no email" }, { line: 5, reason: "ada@example.com appears more than once" }]);
    expect(c.columns).toMatchObject({ email: "Recipient Email", issued: "Issued At" });
    expect(parseEarners(ACCREDIBLE).rows).toEqual([{ name: "Grace Hopper", email: "grace@example.com", issuedAt: new Date(Date.UTC(2022, 2, 15)) }]);
    expect(parseEarners(BADGR).rows).toEqual([{ name: "alan", email: "alan@example.com", issuedAt: new Date("2021-06-01T10:00:00Z") }]);
    expect(() => parseEarners("Name,Date\nA,2024-01-01")).toThrow(/no email column/);
    expect(parseIssued("not a date")).toBeUndefined();
    const suffixed = parseEarners("Recipient First Name,Recipient Last Name,Recipient Email (required),Issued At (UTC)\nAda,Lovelace,ada@example.com,2024-03-15 10:00:00 UTC\n");
    expect(suffixed.columns).toMatchObject({ email: "Recipient Email (required)", issued: "Issued At (UTC)" });
    expect(suffixed.rows[0]!.issuedAt).toEqual(new Date("2024-03-15T10:00:00Z"));
  });
});

describe("badges issued outside classes", () => {
  async function setup() {
    const sent: BadgeAward[] = [];
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter(), hooks: [{ badgeAwarded: async ({ award }) => void sent.push(award) }] });
    const { organization: org } = await core.createOrganization({ name: "Agile Agilist", country: "CA", currency: "CAD" });
    const course = await core.createCourse(org.id, { slug: "innovation", name: "Innovation Framework Practitioner" });
    return { core, org, course, sent };
  }

  it("moves earners from Credly with their original dates, free, and they verify like class badges", async () => {
    const { core, org, course, sent } = await setup();
    await expect(core.importBadgeEarners(org.id, course.id, { csv: CREDLY, platform: "credly" })).rejects.toMatchObject({ code: "INVALID_STATE" });
    await core.updateCourse(org.id, course.id, { badge: { platform: "own", name: "Innovation Framework Practitioner", imageUrl: "https://x.test/b.png" } });

    const preview = await core.importBadgeEarners(org.id, course.id, { csv: CREDLY, platform: "credly", dryRun: true });
    expect(preview).toMatchObject({ imported: 2, already: 0, skipped: [{ line: 4 }, { line: 5 }] });
    expect(await core.listBadgeAwards(org.id, course.id)).toEqual([]);

    const done = await core.importBadgeEarners(org.id, course.id, { csv: CREDLY, platform: "Credly", notify: true });
    expect(done.imported).toBe(2);
    const awards = await core.listBadgeAwards(org.id, course.id);
    expect(awards.map((a) => [a.recipientEmail, a.issuedAt.toISOString(), a.source, a.importedFrom, a.billable, Boolean(a.notifiedAt)])).toEqual([
      ["pat@example.com", "2023-11-20T09:00:00.000Z", "import", "credly", false, true],
      ["ada@example.com", "2024-03-05T14:02:11.000Z", "import", "credly", false, true],
    ]);
    expect(sent.map((a) => a.recipientEmail).sort()).toEqual(["ada@example.com", "pat@example.com"]);

    // Importing the same export again adds nobody.
    expect((await core.importBadgeEarners(org.id, course.id, { csv: CREDLY, platform: "credly" })).imported).toBe(0);

    const v = await core.verifyCertificate(awards[1]!.verifyCode);
    expect(v).toMatchObject({ valid: true, organizationName: "Agile Agilist", certificate: { attendeeName: "Ada Lovelace", badge: { name: "Innovation Framework Practitioner" } } });
    expect(v.cohort).toBeUndefined();
    expect((await core.verifyCertificate("nope")).valid).toBe(false);
  });

  it("issues badges directly, billable, and counts them for the month", async () => {
    const { core, org, course, sent } = await setup();
    await core.updateCourse(org.id, course.id, { badge: { platform: "own", name: "Innovation", imageUrl: "https://x.test/b.png" } });
    await core.importBadgeEarners(org.id, course.id, { csv: ACCREDIBLE, platform: "accredible" });
    const r = await core.issueBadges(org.id, course.id, { recipients: [{ name: "Linus", email: "linus@example.com" }, { name: "Grace", email: "GRACE@example.com" }] });
    expect(r).toEqual({ issued: 1, already: ["grace@example.com"] });
    expect(sent.map((a) => a.recipientEmail)).toEqual(["linus@example.com"]);
    await expect(core.issueBadges(org.id, course.id, { recipients: [{ name: "x", email: "not-an-email" }] })).rejects.toMatchObject({ code: "VALIDATION" });
    expect(await core.badgeUsage(org.id)).toMatchObject({ billable: 1, imported: 1 });
  });
});
