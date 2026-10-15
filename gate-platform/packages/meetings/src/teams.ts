import { mergeParticipantsByEmail } from "./attendance.js";
import {
  MeetingProviderError,
  TokenCache,
  addMinutes,
  defaultSleep,
  requestJson,
  secondsToMinutesUp,
  type HttpContext,
  type IssuedToken,
  type Sleep,
} from "./http.js";
import type { Meeting, MeetingPort, MeetingRequest, ParticipantRecord } from "./types.js";

export const DEFAULT_GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";
export const DEFAULT_MS_LOGIN_URL = "https://login.microsoftonline.com";
export const GRAPH_SCOPE = "https://graph.microsoft.com/.default";

export interface TeamsMeetingsOptions {
  /** Entra ID app registration (client-credentials). Never logged. */
  tenantId: string;
  clientId: string;
  clientSecret: string;
  /** Object id (or UPN) of the user who organizes the meetings. */
  organizerUserId: string;
  baseUrl?: string | undefined;
  loginUrl?: string | undefined;
  fetch?: typeof fetch | undefined;
  now?: (() => Date) | undefined;
  /** Injectable for tests; defaults to setTimeout-based sleep. */
  sleep?: Sleep | undefined;
}

interface GraphTokenResponse {
  access_token: string;
  expires_in: number | string;
}

interface GraphOnlineMeeting {
  id: string;
  joinWebUrl: string;
  startDateTime?: string;
  endDateTime?: string;
}

interface GraphCollection<T> {
  value?: T[];
  "@odata.nextLink"?: string;
}

interface GraphAttendanceReport {
  id: string;
}

interface GraphAttendanceInterval {
  joinDateTime: string;
  leaveDateTime: string;
  durationInSeconds?: number;
}

interface GraphAttendanceRecord {
  emailAddress?: string | null;
  identity?: { displayName?: string | null } | null;
  totalAttendanceInSeconds?: number;
  attendanceIntervals?: GraphAttendanceInterval[];
}

/** MeetingPort backed by Microsoft Graph online meetings using client-credentials OAuth. */
export class TeamsMeetings implements MeetingPort {
  readonly provider = "teams";
  private readonly tenantId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly organizerUserId: string;
  private readonly baseUrl: string;
  private readonly loginUrl: string;
  private readonly ctx: HttpContext;
  private readonly tokens: TokenCache;

  constructor(opts: TeamsMeetingsOptions) {
    if (!opts.tenantId) throw new Error("TeamsMeetings: tenantId is required");
    if (!opts.clientId) throw new Error("TeamsMeetings: clientId is required");
    if (!opts.clientSecret) throw new Error("TeamsMeetings: clientSecret is required");
    if (!opts.organizerUserId) throw new Error("TeamsMeetings: organizerUserId is required");
    this.tenantId = opts.tenantId;
    this.clientId = opts.clientId;
    this.clientSecret = opts.clientSecret;
    this.organizerUserId = opts.organizerUserId;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_GRAPH_BASE_URL).replace(/\/+$/, "");
    this.loginUrl = (opts.loginUrl ?? DEFAULT_MS_LOGIN_URL).replace(/\/+$/, "");
    this.ctx = { provider: "teams", fetchImpl: opts.fetch ?? globalThis.fetch, sleep: opts.sleep ?? defaultSleep };
    this.tokens = new TokenCache(() => this.issueToken(), opts.now ?? (() => new Date()));
  }

  async createMeeting(req: MeetingRequest): Promise<Meeting> {
    const body = {
      subject: req.topic,
      startDateTime: req.startsAt.toISOString(),
      endDateTime: addMinutes(req.startsAt, req.durationMinutes).toISOString(),
      externalId: req.externalId,
    };
    const res = await this.request<GraphOnlineMeeting>("POST", `${this.meetingsPath()}`, body);
    if (!res) throw new MeetingProviderError("teams", 0, "teams POST onlineMeetings returned an empty body");
    return { provider: "teams", meetingId: res.id, joinUrl: res.joinWebUrl };
  }

  async updateMeeting(meetingId: string, req: Partial<MeetingRequest>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (req.topic !== undefined) body["subject"] = req.topic;
    let startsAt = req.startsAt;
    if (req.durationMinutes !== undefined && startsAt === undefined) {
      // End time depends on the start; fetch the current start when only the duration changes.
      const current = await this.request<GraphOnlineMeeting>("GET", this.meetingPath(meetingId));
      if (current?.startDateTime) startsAt = new Date(current.startDateTime);
    }
    if (req.startsAt !== undefined) body["startDateTime"] = req.startsAt.toISOString();
    if (req.durationMinutes !== undefined && startsAt !== undefined) {
      body["endDateTime"] = addMinutes(startsAt, req.durationMinutes).toISOString();
    }
    if (Object.keys(body).length === 0) return;
    await this.request("PATCH", this.meetingPath(meetingId), body);
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    await this.request("DELETE", this.meetingPath(meetingId), undefined, [404]);
  }

  async getParticipants(meetingId: string): Promise<ParticipantRecord[]> {
    const reportsPath = `${this.meetingPath(meetingId)}/attendanceReports`;
    const reports = await this.collect<GraphAttendanceReport>(reportsPath);
    const records: ParticipantRecord[] = [];
    for (const report of reports) {
      const items = await this.collect<GraphAttendanceRecord>(`${reportsPath}/${encodeURIComponent(report.id)}/attendanceRecords`);
      for (const item of items) {
        const rec = toRecord(item);
        if (rec) records.push(rec);
      }
    }
    return mergeParticipantsByEmail(records);
  }

  /** Reads a Graph collection, following @odata.nextLink pages. */
  private async collect<T>(path: string): Promise<T[]> {
    const out: T[] = [];
    let url: string | undefined = `${this.baseUrl}${path}`;
    while (url) {
      const page: GraphCollection<T> | undefined = await this.requestUrl<GraphCollection<T>>("GET", url, path);
      out.push(...(page?.value ?? []));
      url = page?.["@odata.nextLink"] || undefined;
    }
    return out;
  }

  private meetingsPath(): string {
    return `/users/${encodeURIComponent(this.organizerUserId)}/onlineMeetings`;
  }

  private meetingPath(meetingId: string): string {
    return `${this.meetingsPath()}/${encodeURIComponent(meetingId)}`;
  }

  private async issueToken(): Promise<IssuedToken> {
    const form = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: GRAPH_SCOPE,
    });
    const res = await requestJson<GraphTokenResponse>(this.ctx, {
      method: "POST",
      url: `${this.loginUrl}/${encodeURIComponent(this.tenantId)}/oauth2/v2.0/token`,
      label: "/oauth2/v2.0/token",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (!res?.access_token) throw new MeetingProviderError("teams", 0, "teams POST /oauth2/v2.0/token returned no access_token");
    return { accessToken: res.access_token, expiresInSeconds: Number(res.expires_in) || 0 };
  }

  private request<T = unknown>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
    tolerate?: readonly number[],
  ): Promise<T | undefined> {
    return this.requestUrl<T>(method, `${this.baseUrl}${path}`, path, body, tolerate);
  }

  private async requestUrl<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    url: string,
    label: string,
    body?: unknown,
    tolerate?: readonly number[],
  ): Promise<T | undefined> {
    const token = await this.tokens.get();
    return requestJson<T>(this.ctx, {
      method,
      url,
      label,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      tolerate,
    });
  }
}

function toRecord(item: GraphAttendanceRecord): ParticipantRecord | undefined {
  const intervals = item.attendanceIntervals ?? [];
  let earliest: number | undefined;
  let latest: number | undefined;
  let intervalSeconds = 0;
  for (const iv of intervals) {
    const j = new Date(iv.joinDateTime).getTime();
    const l = new Date(iv.leaveDateTime).getTime();
    if (Number.isFinite(j) && (earliest === undefined || j < earliest)) earliest = j;
    if (Number.isFinite(l) && (latest === undefined || l > latest)) latest = l;
    intervalSeconds += typeof iv.durationInSeconds === "number" ? iv.durationInSeconds : Math.max(0, (l - j) / 1000);
  }
  if (earliest === undefined || latest === undefined) return undefined;
  const seconds = typeof item.totalAttendanceInSeconds === "number" ? item.totalAttendanceInSeconds : intervalSeconds;
  const rec: ParticipantRecord = { joinedAt: new Date(earliest), leftAt: new Date(latest), durationMinutes: secondsToMinutesUp(seconds) };
  if (item.emailAddress) rec.email = item.emailAddress;
  const name = item.identity?.displayName;
  if (name) rec.name = name;
  return rec;
}
