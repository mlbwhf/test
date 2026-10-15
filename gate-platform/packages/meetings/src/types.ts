export interface MeetingRequest {
  topic: string;
  startsAt: Date;
  durationMinutes: number;
  /** IANA timezone name, e.g. "Europe/London". */
  timezone: string;
  hostEmail?: string | undefined;
  agenda?: string | undefined;
  /** Stable key so re-runs don't create duplicates. */
  externalId: string;
}

export interface Meeting {
  provider: "zoom" | "teams" | "manual";
  meetingId: string;
  joinUrl: string;
  hostUrl?: string | undefined;
  passcode?: string | undefined;
}

export interface ParticipantRecord {
  email?: string | undefined;
  name?: string | undefined;
  joinedAt: Date;
  leftAt: Date;
  durationMinutes: number;
}

export interface MeetingPort {
  readonly provider: Meeting["provider"];
  createMeeting(req: MeetingRequest): Promise<Meeting>;
  updateMeeting(meetingId: string, req: Partial<MeetingRequest>): Promise<void>;
  deleteMeeting(meetingId: string): Promise<void>;
  getParticipants(meetingId: string): Promise<ParticipantRecord[]>;
}
