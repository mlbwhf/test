import { describe, expect, it } from "vitest";
import { MeetingProviderError } from "./http.js";
import { TeamsMeetings } from "./teams.js";

interface Call {
  method: string;
  url: string;
  headers: Record<string, string>;
  rawBody: string | undefined;
  body: unknown;
}

type Handler = (call: Call) => Response | undefined;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function fakeFetch(handler: Handler): { fetch: typeof fetch; calls: Call[] } {
  const calls: Call[] = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries((init?.headers as Record<string, string>) ?? {})) headers[k.toLowerCase()] = v;
    const rawBody = typeof init?.body === "string" ? init.body : undefined;
    let body: unknown;
    if (rawBody !== undefined) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = rawBody;
      }
    }
    const call: Call = { method: init?.method ?? "GET", url, headers, rawBody, body };
    calls.push(call);
    const res = handler(call);
    if (!res) throw new Error(`unexpected request ${call.method} ${call.url}`);
    return res;
  }) as typeof fetch;
  return { fetch: fetchImpl, calls };
}

const LOGIN = "https://login.test";
const BASE = "https://graph.test/v1.0";
const ORG = "org-user-id";
const MEETINGS = `${BASE}/users/${ORG}/onlineMeetings`;

function makeTeams(handler: Handler) {
  const sleeps: number[] = [];
  const ff = fakeFetch((c) => {
    if (c.url.startsWith(LOGIN)) return json({ token_type: "Bearer", expires_in: 3599, access_token: "gtok" });
    return handler(c);
  });
  const teams = new TeamsMeetings({
    tenantId: "tenant-1",
    clientId: "app-id",
    clientSecret: "app-secret",
    organizerUserId: ORG,
    baseUrl: BASE,
    loginUrl: LOGIN,
    fetch: ff.fetch,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
  });
  return { teams, calls: ff.calls, sleeps };
}

const req = {
  topic: "Product Owner Cohort 3 – Day 2",
  startsAt: new Date("2026-12-01T09:00:00.000Z"),
  durationMinutes: 180,
  timezone: "Europe/Berlin",
  externalId: "cohort-3-day-2",
};

describe("TeamsMeetings", () => {
  it("obtains a client-credentials token with a form body and the Graph default scope", async () => {
    const { teams, calls } = makeTeams((c) => {
      if (c.method === "POST" && c.url === MEETINGS) return json({ id: "MSo", joinWebUrl: "https://teams.microsoft.com/l/meetup-join/x" });
      return undefined;
    });
    await teams.createMeeting(req);
    const tok = calls.find((c) => c.url.startsWith(LOGIN))!;
    expect(tok.url).toBe(`${LOGIN}/tenant-1/oauth2/v2.0/token`);
    expect(tok.method).toBe("POST");
    expect(tok.headers["content-type"]).toBe("application/x-www-form-urlencoded");
    const form = new URLSearchParams(tok.rawBody ?? "");
    expect(form.get("grant_type")).toBe("client_credentials");
    expect(form.get("client_id")).toBe("app-id");
    expect(form.get("client_secret")).toBe("app-secret");
    expect(form.get("scope")).toBe("https://graph.microsoft.com/.default");
    expect(calls.filter((c) => c.url.startsWith(LOGIN))).toHaveLength(1);
  });

  it("creates an online meeting and maps joinWebUrl", async () => {
    const { teams, calls } = makeTeams((c) => {
      if (c.method === "POST" && c.url === MEETINGS) return json({ id: "MSpiZDA", joinWebUrl: "https://teams.microsoft.com/l/meetup-join/abc" });
      return undefined;
    });
    const meeting = await teams.createMeeting(req);
    expect(meeting).toEqual({ provider: "teams", meetingId: "MSpiZDA", joinUrl: "https://teams.microsoft.com/l/meetup-join/abc" });
    expect(meeting.passcode).toBeUndefined();
    const create = calls.find((c) => c.url === MEETINGS)!;
    expect(create.headers["authorization"]).toBe("Bearer gtok");
    expect(create.body).toEqual({
      subject: req.topic,
      startDateTime: "2026-12-01T09:00:00.000Z",
      endDateTime: "2026-12-01T12:00:00.000Z",
      externalId: "cohort-3-day-2",
    });
  });

  it("patches subject/start/end and tolerates 404 on delete", async () => {
    const { teams, calls } = makeTeams((c) => {
      if (c.method === "PATCH" && c.url === `${MEETINGS}/m1`) return json({ id: "m1" });
      if (c.method === "DELETE" && c.url === `${MEETINGS}/m1`) return json({ error: { code: "NotFound", message: "gone" } }, 404);
      return undefined;
    });
    await teams.updateMeeting("m1", { topic: "New title", startsAt: new Date("2026-12-02T09:00:00Z"), durationMinutes: 60 });
    await expect(teams.deleteMeeting("m1")).resolves.toBeUndefined();
    const patch = calls.find((c) => c.method === "PATCH")!;
    expect(patch.body).toEqual({ subject: "New title", startDateTime: "2026-12-02T09:00:00.000Z", endDateTime: "2026-12-02T10:00:00.000Z" });
  });

  it("reads attendance reports and merges records by email across reports", async () => {
    const reportsUrl = `${MEETINGS}/m9/attendanceReports`;
    const { teams } = makeTeams((c) => {
      if (c.method !== "GET") return undefined;
      if (c.url === reportsUrl) return json({ value: [{ id: "r1" }, { id: "r2" }] });
      if (c.url === `${reportsUrl}/r1/attendanceRecords`) {
        return json({
          value: [
            {
              emailAddress: "Ada@Example.com",
              identity: { displayName: "Ada Lovelace" },
              totalAttendanceInSeconds: 5400,
              attendanceIntervals: [
                { joinDateTime: "2026-12-01T09:02:00Z", leaveDateTime: "2026-12-01T10:00:00Z", durationInSeconds: 3480 },
                { joinDateTime: "2026-12-01T10:05:00Z", leaveDateTime: "2026-12-01T10:37:00Z", durationInSeconds: 1920 },
              ],
            },
            {
              emailAddress: null,
              identity: { displayName: "Guest" },
              totalAttendanceInSeconds: 61,
              attendanceIntervals: [{ joinDateTime: "2026-12-01T09:10:00Z", leaveDateTime: "2026-12-01T09:11:01Z", durationInSeconds: 61 }],
            },
          ],
        });
      }
      if (c.url === `${reportsUrl}/r2/attendanceRecords`) {
        return json({
          value: [
            {
              emailAddress: "ada@example.com",
              identity: { displayName: "Ada Lovelace" },
              totalAttendanceInSeconds: 1800,
              attendanceIntervals: [{ joinDateTime: "2026-12-01T11:00:00Z", leaveDateTime: "2026-12-01T11:30:00Z", durationInSeconds: 1800 }],
            },
          ],
        });
      }
      return undefined;
    });
    const records = await teams.getParticipants("m9");
    expect(records).toHaveLength(2);
    const ada = records.find((r) => r.email === "ada@example.com")!;
    expect(ada.name).toBe("Ada Lovelace");
    expect(ada.durationMinutes).toBe(120);
    expect(ada.joinedAt.toISOString()).toBe("2026-12-01T09:02:00.000Z");
    expect(ada.leftAt.toISOString()).toBe("2026-12-01T11:30:00.000Z");
    const guest = records.find((r) => r.email === undefined)!;
    expect(guest.name).toBe("Guest");
    expect(guest.durationMinutes).toBe(2);
  });

  it("retries 5xx and throws MeetingProviderError on non-retryable failures", async () => {
    let attempts = 0;
    const { teams, sleeps } = makeTeams((c) => {
      if (c.method === "DELETE") {
        attempts++;
        return attempts < 2 ? json({ error: { code: "ServiceUnavailable", message: "try later" } }, 503) : new Response(null, { status: 204 });
      }
      if (c.method === "POST") return json({ error: { code: "Forbidden", message: "Insufficient privileges" } }, 403);
      return undefined;
    });
    await teams.deleteMeeting("m1");
    expect(attempts).toBe(2);
    expect(sleeps).toEqual([100]);
    const err = await teams.createMeeting(req).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MeetingProviderError);
    expect(err).toMatchObject({ provider: "teams", status: 403 });
    expect((err as Error).message).toContain("Insufficient privileges");
    expect((err as Error).message).not.toContain("app-secret");
  });
});
