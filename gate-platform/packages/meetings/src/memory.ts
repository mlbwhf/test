import { stripUndefined } from "./http.js";
import type { Meeting, MeetingPort, MeetingRequest, ParticipantRecord } from "./types.js";

export interface InMemoryMeeting extends Meeting {
  request: MeetingRequest;
}

/** In-memory MeetingPort for tests and local development. */
export class InMemoryMeetings implements MeetingPort {
  readonly provider = "manual";
  /** Keyed by meetingId. */
  readonly meetings = new Map<string, InMemoryMeeting>();
  private readonly participants = new Map<string, ParticipantRecord[]>();
  private seq = 0;

  async createMeeting(req: MeetingRequest): Promise<Meeting> {
    for (const existing of this.meetings.values()) {
      if (existing.request.externalId === req.externalId) return toMeeting(existing);
    }
    const id = `mtg_${++this.seq}`;
    const created: InMemoryMeeting = {
      provider: "manual",
      meetingId: id,
      joinUrl: `https://meet.test/${id}`,
      hostUrl: `https://meet.test/${id}/host`,
      request: { ...req },
    };
    this.meetings.set(id, created);
    return toMeeting(created);
  }

  async updateMeeting(meetingId: string, req: Partial<MeetingRequest>): Promise<void> {
    const existing = this.meetings.get(meetingId);
    if (!existing) throw new Error(`InMemoryMeetings: unknown meeting ${meetingId}`);
    existing.request = { ...existing.request, ...stripUndefined(req) };
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    this.meetings.delete(meetingId);
    this.participants.delete(meetingId);
  }

  async getParticipants(meetingId: string): Promise<ParticipantRecord[]> {
    return [...(this.participants.get(meetingId) ?? [])];
  }

  /** Test helper: fixes the participant report returned for a meeting. */
  setParticipants(meetingId: string, records: ParticipantRecord[]): void {
    this.participants.set(meetingId, [...records]);
  }
}

function toMeeting(m: InMemoryMeeting): Meeting {
  const { request: _request, ...meeting } = m;
  return meeting;
}
