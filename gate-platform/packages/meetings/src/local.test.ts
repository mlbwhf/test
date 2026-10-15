import { describe, expect, it } from "vitest";
import { ManualMeetings } from "./manual.js";
import { InMemoryMeetings } from "./memory.js";

const req = {
  topic: "Cohort 1 – Day 1",
  startsAt: new Date("2026-11-20T09:00:00Z"),
  durationMinutes: 240,
  timezone: "Europe/London",
  externalId: "cohort-1-day-1",
};

describe("ManualMeetings", () => {
  it("wraps a pasted link and tracks no attendance", async () => {
    const manual = new ManualMeetings();
    const meeting = await manual.createMeeting(req, { joinUrl: "https://meet.example/abc", passcode: "1234" });
    expect(meeting).toEqual({ provider: "manual", meetingId: "cohort-1-day-1", joinUrl: "https://meet.example/abc", passcode: "1234" });
    await expect(manual.updateMeeting(meeting.meetingId, { topic: "x" })).resolves.toBeUndefined();
    await expect(manual.deleteMeeting(meeting.meetingId)).resolves.toBeUndefined();
    await expect(manual.getParticipants(meeting.meetingId)).resolves.toEqual([]);
  });

  it("refuses to create a meeting without a joinUrl", async () => {
    const manual = new ManualMeetings();
    await expect(manual.createMeeting(req)).rejects.toThrow("manual provider needs a joinUrl");
    await expect(manual.createMeeting(req, { joinUrl: "" })).rejects.toThrow("manual provider needs a joinUrl");
  });
});

describe("InMemoryMeetings", () => {
  it("creates sequential meetings and dedupes on externalId", async () => {
    const mem = new InMemoryMeetings();
    const a = await mem.createMeeting(req);
    const b = await mem.createMeeting({ ...req, externalId: "cohort-1-day-2" });
    const again = await mem.createMeeting(req);
    expect(a.meetingId).toBe("mtg_1");
    expect(a.joinUrl).toBe("https://meet.test/mtg_1");
    expect(b.meetingId).toBe("mtg_2");
    expect(again.meetingId).toBe("mtg_1");
    expect(mem.meetings.size).toBe(2);
  });

  it("updates, deletes and serves participants set by the test helper", async () => {
    const mem = new InMemoryMeetings();
    const m = await mem.createMeeting(req);
    await mem.updateMeeting(m.meetingId, { topic: "Renamed", agenda: undefined });
    expect(mem.meetings.get(m.meetingId)!.request.topic).toBe("Renamed");
    expect(mem.meetings.get(m.meetingId)!.request.durationMinutes).toBe(240);
    await expect(mem.updateMeeting("nope", { topic: "x" })).rejects.toThrow("unknown meeting nope");

    expect(await mem.getParticipants(m.meetingId)).toEqual([]);
    const records = [{ email: "a@x.com", joinedAt: new Date("2026-11-20T09:00:00Z"), leftAt: new Date("2026-11-20T10:00:00Z"), durationMinutes: 60 }];
    mem.setParticipants(m.meetingId, records);
    expect(await mem.getParticipants(m.meetingId)).toEqual(records);

    await mem.deleteMeeting(m.meetingId);
    expect(mem.meetings.has(m.meetingId)).toBe(false);
    expect(await mem.getParticipants(m.meetingId)).toEqual([]);
  });
});
