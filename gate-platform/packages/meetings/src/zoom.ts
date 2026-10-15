import { mergeParticipantsByEmail } from "./attendance.js";
import {
  MeetingProviderError,
  TokenCache,
  defaultSleep,
  requestJson,
  secondsToMinutesUp,
  toIsoSeconds,
  type HttpContext,
  type IssuedToken,
  type Sleep,
} from "./http.js";
import type { Meeting, MeetingPort, MeetingRequest, ParticipantRecord } from "./types.js";

export const DEFAULT_ZOOM_BASE_URL = "https://api.zoom.us/v2";
export const DEFAULT_ZOOM_OAUTH_URL = "https://zoom.us/oauth/token";
export const ZOOM_PARTICIPANTS_PAGE_SIZE = 300;

export interface ZoomMeetingsOptions {
  /** Server-to-Server OAuth app credentials. Never logged. */
  accountId: string;
  clientId: string;
  clientSecret: string;
  /** Zoom user that owns created meetings; defaults to "me" (the app's account owner). */
  userId?: string | undefined;
  baseUrl?: string | undefined;
  oauthUrl?: string | undefined;
  fetch?: typeof fetch | undefined;
  now?: (() => Date) | undefined;
  /** Injectable for tests; defaults to setTimeout-based sleep. */
  sleep?: Sleep | undefined;
}

interface ZoomTokenResponse {
  access_token: string;
  expires_in: number;
}

interface ZoomMeetingResponse {
  id: number | string;
  join_url: string;
  start_url?: string;
  password?: string;
}

interface ZoomParticipant {
  user_email?: string | null;
  name?: string | null;
  join_time: string;
  leave_time?: string;
  duration?: number;
}

interface ZoomParticipantsPage {
  participants?: ZoomParticipant[];
  next_page_token?: string;
}

/** Fixed meeting settings for live-virtual training cohorts. */
export const ZOOM_MEETING_SETTINGS = {
  join_before_host: false,
  waiting_room: true,
  approval_type: 2,
  registrants_email_notification: false,
  auto_recording: "cloud",
} as const;

/** MeetingPort backed by the Zoom REST API v2 using a Server-to-Server OAuth app. */
export class ZoomMeetings implements MeetingPort {
  readonly provider = "zoom";
  private readonly accountId: string;
  private readonly basicAuth: string;
  private readonly userId: string;
  private readonly baseUrl: string;
  private readonly oauthUrl: string;
  private readonly ctx: HttpContext;
  private readonly tokens: TokenCache;

  constructor(opts: ZoomMeetingsOptions) {
    if (!opts.accountId) throw new Error("ZoomMeetings: accountId is required");
    if (!opts.clientId) throw new Error("ZoomMeetings: clientId is required");
    if (!opts.clientSecret) throw new Error("ZoomMeetings: clientSecret is required");
    this.accountId = opts.accountId;
    this.basicAuth = Buffer.from(`${opts.clientId}:${opts.clientSecret}`, "utf8").toString("base64");
    this.userId = opts.userId ?? "me";
    this.baseUrl = (opts.baseUrl ?? DEFAULT_ZOOM_BASE_URL).replace(/\/+$/, "");
    this.oauthUrl = opts.oauthUrl ?? DEFAULT_ZOOM_OAUTH_URL;
    this.ctx = { provider: "zoom", fetchImpl: opts.fetch ?? globalThis.fetch, sleep: opts.sleep ?? defaultSleep };
    this.tokens = new TokenCache(() => this.issueToken(), opts.now ?? (() => new Date()));
  }

  async createMeeting(req: MeetingRequest): Promise<Meeting> {
    const body = {
      topic: req.topic,
      type: 2,
      start_time: toIsoSeconds(req.startsAt),
      duration: req.durationMinutes,
      timezone: req.timezone,
      agenda: req.agenda,
      settings: ZOOM_MEETING_SETTINGS,
    };
    const res = await this.request<ZoomMeetingResponse>("POST", `/users/${encodeURIComponent(this.userId)}/meetings`, body);
    if (!res) throw new MeetingProviderError("zoom", 0, "zoom POST /users/{userId}/meetings returned an empty body");
    const meeting: Meeting = { provider: "zoom", meetingId: String(res.id), joinUrl: res.join_url };
    if (res.start_url !== undefined) meeting.hostUrl = res.start_url;
    if (res.password !== undefined) meeting.passcode = res.password;
    return meeting;
  }

  async updateMeeting(meetingId: string, req: Partial<MeetingRequest>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (req.topic !== undefined) body["topic"] = req.topic;
    if (req.startsAt !== undefined) body["start_time"] = toIsoSeconds(req.startsAt);
    if (req.durationMinutes !== undefined) body["duration"] = req.durationMinutes;
    if (req.timezone !== undefined) body["timezone"] = req.timezone;
    if (req.agenda !== undefined) body["agenda"] = req.agenda;
    if (Object.keys(body).length === 0) return;
    await this.request("PATCH", `/meetings/${encodeURIComponent(meetingId)}`, body);
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    await this.request("DELETE", `/meetings/${encodeURIComponent(meetingId)}`, undefined, [404]);
  }

  async getParticipants(meetingId: string): Promise<ParticipantRecord[]> {
    const records: ParticipantRecord[] = [];
    let nextPageToken: string | undefined;
    do {
      const query = new URLSearchParams({ page_size: String(ZOOM_PARTICIPANTS_PAGE_SIZE) });
      if (nextPageToken) query.set("next_page_token", nextPageToken);
      const page = await this.request<ZoomParticipantsPage>(
        "GET",
        `/report/meetings/${encodeURIComponent(meetingId)}/participants?${query.toString()}`,
        undefined,
        undefined,
        `/report/meetings/${meetingId}/participants`,
      );
      for (const p of page?.participants ?? []) records.push(toRecord(p));
      nextPageToken = page?.next_page_token || undefined;
    } while (nextPageToken);
    return mergeParticipantsByEmail(records);
  }

  private async issueToken(): Promise<IssuedToken> {
    const query = new URLSearchParams({ grant_type: "account_credentials", account_id: this.accountId });
    const res = await requestJson<ZoomTokenResponse>(this.ctx, {
      method: "POST",
      url: `${this.oauthUrl}?${query.toString()}`,
      label: "/oauth/token",
      headers: { Authorization: `Basic ${this.basicAuth}` },
    });
    if (!res?.access_token) throw new MeetingProviderError("zoom", 0, "zoom POST /oauth/token returned no access_token");
    return { accessToken: res.access_token, expiresInSeconds: Number(res.expires_in) || 0 };
  }

  private async request<T = unknown>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
    tolerate?: readonly number[],
    label?: string,
  ): Promise<T | undefined> {
    const token = await this.tokens.get();
    return requestJson<T>(this.ctx, {
      method,
      url: `${this.baseUrl}${path}`,
      label: label ?? path,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      tolerate,
    });
  }
}

function toRecord(p: ZoomParticipant): ParticipantRecord {
  const joinedAt = new Date(p.join_time);
  const seconds = typeof p.duration === "number" ? p.duration : 0;
  const leftAt = p.leave_time ? new Date(p.leave_time) : new Date(joinedAt.getTime() + seconds * 1000);
  const rec: ParticipantRecord = { joinedAt, leftAt, durationMinutes: secondsToMinutesUp(seconds) };
  if (p.user_email) rec.email = p.user_email;
  if (p.name) rec.name = p.name;
  return rec;
}
