import { describe, expect, it } from "vitest";
import { MeetingProviderError } from "./http.js";
import { ZoomMeetings } from "./zoom.js";

interface Call {
  method: string;
  url: string;
  headers: Record<string, string>;
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
    let body: unknown;
    if (typeof init?.body === "string") {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }
    const call: Call = { method: init?.method ?? "GET", url, headers, body };
    calls.push(call);
    const res = handler(call);
    if (!res) throw new Error(`unexpected request ${call.method} ${call.url}`);
    return res;
  }) as typeof fetch;
  return { fetch: fetchImpl, calls };
}

const TOKEN_URL = "https://zoom.test/oauth/token";
const BASE = "https://api.zoom.test/v2";

function tokenHandler(call: Call): Response | undefined {
  if (call.url.startsWith(TOKEN_URL)) return json({ access_token: "tok_1", token_type: "bearer", expires_in: 3600 });
  return undefined;
}

function makeZoom(handler: Handler, extra: Partial<ConstructorParameters<typeof ZoomMeetings>[0]> = {}) {
  const sleeps: number[] = [];
  const ff = fakeFetch((c) => tokenHandler(c) ?? handler(c));
  const zoom = new ZoomMeetings({
    accountId: "acc_1",
    clientId: "cid",
    clientSecret: "sec",
    baseUrl: BASE,
    oauthUrl: TOKEN_URL,
    fetch: ff.fetch,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
    ...extra,
  });
  return { zoom, calls: ff.calls, sleeps };
}

const req = {
  topic: "Scrum Master Cohort 12 – Day 1",
  startsAt: new Date("2026-11-20T14:00:00.000Z"),
  durationMinutes: 240,
  timezone: "Europe/London",
  agenda: "Day 1 agenda",
  externalId: "cohort-12-day-1",
};

describe("ZoomMeetings", () => {
  it("requests a token once with Basic auth and reuses it across API calls", async () => {
    const { zoom, calls } = makeZoom((c) => {
      if (c.method === "POST" && c.url === `${BASE}/users/me/meetings`) {
        return json({ id: 123, join_url: "https://zoom.us/j/123", start_url: "https://zoom.us/s/123", password: "pw" });
      }
      if (c.method === "DELETE") return new Response(null, { status: 204 });
      return undefined;
    });
    await zoom.createMeeting(req);
    await zoom.deleteMeeting("123");

    const tokenCalls = calls.filter((c) => c.url.startsWith(TOKEN_URL));
    expect(tokenCalls).toHaveLength(1);
    const t = tokenCalls[0]!;
    expect(t.method).toBe("POST");
    expect(new URL(t.url).searchParams.get("grant_type")).toBe("account_credentials");
    expect(new URL(t.url).searchParams.get("account_id")).toBe("acc_1");
    expect(t.headers["authorization"]).toBe(`Basic ${Buffer.from("cid:sec").toString("base64")}`);

    const apiCalls = calls.filter((c) => !c.url.startsWith(TOKEN_URL));
    expect(apiCalls).toHaveLength(2);
    for (const c of apiCalls) expect(c.headers["authorization"]).toBe("Bearer tok_1");
  });

  it("refreshes the token once it is within 60s of expiry", async () => {
    let now = new Date("2026-01-01T00:00:00Z");
    let tokenNo = 0;
    const ff = fakeFetch((c) => {
      if (c.url.startsWith(TOKEN_URL)) return json({ access_token: `tok_${++tokenNo}`, expires_in: 3600 });
      return new Response(null, { status: 204 });
    });
    const zoom = new ZoomMeetings({ accountId: "a", clientId: "c", clientSecret: "s", baseUrl: BASE, oauthUrl: TOKEN_URL, fetch: ff.fetch, now: () => now });
    await zoom.deleteMeeting("1");
    now = new Date(now.getTime() + 3600_000 - 61_000);
    await zoom.deleteMeeting("1");
    expect(tokenNo).toBe(1);
    now = new Date(now.getTime() + 2_000);
    await zoom.deleteMeeting("1");
    expect(tokenNo).toBe(2);
    const last = ff.calls[ff.calls.length - 1]!;
    expect(last.headers["authorization"]).toBe("Bearer tok_2");
  });

  it("creates a scheduled meeting with UTC start_time and maps the response", async () => {
    const { zoom, calls } = makeZoom((c) => {
      if (c.method === "POST" && c.url === `${BASE}/users/trainer%40example.com/meetings`) {
        return json({ id: 98765, join_url: "https://zoom.us/j/98765", start_url: "https://zoom.us/s/98765?zak=x", password: "482913" });
      }
      return undefined;
    }, { userId: "trainer@example.com" });
    const meeting = await zoom.createMeeting(req);
    expect(meeting).toEqual({
      provider: "zoom",
      meetingId: "98765",
      joinUrl: "https://zoom.us/j/98765",
      hostUrl: "https://zoom.us/s/98765?zak=x",
      passcode: "482913",
    });
    const create = calls.find((c) => c.url.endsWith("/meetings"))!;
    expect(create.headers["content-type"]).toBe("application/json");
    expect(create.body).toEqual({
      topic: req.topic,
      type: 2,
      start_time: "2026-11-20T14:00:00Z",
      duration: 240,
      timezone: "Europe/London",
      agenda: "Day 1 agenda",
      settings: {
        join_before_host: false,
        waiting_room: true,
        approval_type: 2,
        registrants_email_notification: false,
        auto_recording: "cloud",
      },
    });
  });

  it("updates via PATCH and treats 404 on delete as success", async () => {
    const { zoom, calls } = makeZoom((c) => {
      if (c.method === "PATCH" && c.url === `${BASE}/meetings/55`) return new Response(null, { status: 204 });
      if (c.method === "DELETE" && c.url === `${BASE}/meetings/55`) return json({ code: 3001, message: "Meeting does not exist" }, 404);
      return undefined;
    });
    await zoom.updateMeeting("55", { topic: "Renamed", startsAt: new Date("2026-11-21T09:30:00.250Z") });
    await expect(zoom.deleteMeeting("55")).resolves.toBeUndefined();
    const patch = calls.find((c) => c.method === "PATCH")!;
    expect(patch.body).toEqual({ topic: "Renamed", start_time: "2026-11-21T09:30:00Z" });
  });

  it("pages through participant reports and merges records by email", async () => {
    const { zoom, calls } = makeZoom((c) => {
      if (c.method !== "GET" || !c.url.startsWith(`${BASE}/report/meetings/77/participants`)) return undefined;
      const u = new URL(c.url);
      expect(u.searchParams.get("page_size")).toBe("300");
      if (!u.searchParams.get("next_page_token")) {
        return json({
          participants: [
            { user_email: "Ada@Example.com", name: "Ada", join_time: "2026-11-20T14:00:00Z", leave_time: "2026-11-20T15:00:00Z", duration: 3600 },
            { user_email: "bob@example.com", name: "Bob", join_time: "2026-11-20T14:05:00Z", leave_time: "2026-11-20T14:35:30Z", duration: 1830 },
            { name: "Phone caller", join_time: "2026-11-20T14:10:00Z", leave_time: "2026-11-20T14:20:00Z", duration: 600 },
          ],
          next_page_token: "p2",
        });
      }
      expect(u.searchParams.get("next_page_token")).toBe("p2");
      return json({
        participants: [
          { user_email: "ada@example.com", name: "Ada (rejoined)", join_time: "2026-11-20T15:10:00Z", leave_time: "2026-11-20T16:00:00Z", duration: 3000 },
        ],
        next_page_token: "",
      });
    });
    const records = await zoom.getParticipants("77");
    expect(calls.filter((c) => c.url.includes("/participants"))).toHaveLength(2);
    expect(records).toHaveLength(3);
    const ada = records.find((r) => r.email === "ada@example.com")!;
    expect(ada.name).toBe("Ada");
    expect(ada.durationMinutes).toBe(110);
    expect(ada.joinedAt.toISOString()).toBe("2026-11-20T14:00:00.000Z");
    expect(ada.leftAt.toISOString()).toBe("2026-11-20T16:00:00.000Z");
    const bob = records.find((r) => r.email === "bob@example.com")!;
    expect(bob.durationMinutes).toBe(31); // 1830s rounds up
    const caller = records.find((r) => r.email === undefined)!;
    expect(caller.name).toBe("Phone caller");
    expect(caller.durationMinutes).toBe(10);
  });

  it("retries on 429 with backoff and then succeeds", async () => {
    let attempts = 0;
    const { zoom, sleeps } = makeZoom((c) => {
      if (c.method === "DELETE") {
        attempts++;
        if (attempts < 3) return json({ message: "Too many requests" }, 429);
        return new Response(null, { status: 204 });
      }
      return undefined;
    });
    await zoom.deleteMeeting("1");
    expect(attempts).toBe(3);
    expect(sleeps).toEqual([100, 200]);
  });

  it("gives up after three retryable failures", async () => {
    const { zoom } = makeZoom((c) => (c.method === "DELETE" ? json({ message: "boom" }, 503) : undefined));
    await expect(zoom.deleteMeeting("1")).rejects.toMatchObject({ name: "MeetingProviderError", provider: "zoom", status: 503 });
  });

  it("throws MeetingProviderError on 401 without retrying or leaking credentials", async () => {
    let attempts = 0;
    const { zoom } = makeZoom((c) => {
      if (c.method === "POST") {
        attempts++;
        return json({ code: 124, message: "Invalid access token." }, 401);
      }
      return undefined;
    });
    const err = await zoom.createMeeting(req).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MeetingProviderError);
    const e = err as MeetingProviderError;
    expect(e.provider).toBe("zoom");
    expect(e.status).toBe(401);
    expect(e.message).toContain("401");
    expect(e.message).toContain("Invalid access token.");
    expect(e.message).not.toContain("sec");
    expect(e.message).not.toContain("tok_1");
    expect(attempts).toBe(1);
  });

  it("surfaces token endpoint failures as MeetingProviderError", async () => {
    const ff = fakeFetch((c) => (c.url.startsWith(TOKEN_URL) ? json({ reason: "Invalid client", error: "invalid_client" }, 400) : undefined));
    const zoom = new ZoomMeetings({ accountId: "a", clientId: "c", clientSecret: "s", baseUrl: BASE, oauthUrl: TOKEN_URL, fetch: ff.fetch });
    await expect(zoom.deleteMeeting("1")).rejects.toMatchObject({ provider: "zoom", status: 400 });
  });
});
