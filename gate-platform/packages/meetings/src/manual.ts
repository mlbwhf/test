import type { Meeting, MeetingPort, MeetingRequest, ParticipantRecord } from "./types.js";

export interface ManualMeetingLink {
  joinUrl: string;
  hostUrl?: string | undefined;
  passcode?: string | undefined;
}

/**
 * MeetingPort for cohorts where the organizer pastes a meeting link by hand.
 * Nothing is provisioned and attendance is not tracked.
 */
export class ManualMeetings implements MeetingPort {
  readonly provider = "manual";

  async createMeeting(req: MeetingRequest, link?: ManualMeetingLink): Promise<Meeting> {
    if (!link?.joinUrl) throw new Error("manual provider needs a joinUrl");
    const meeting: Meeting = { provider: "manual", meetingId: req.externalId, joinUrl: link.joinUrl };
    if (link.hostUrl !== undefined) meeting.hostUrl = link.hostUrl;
    if (link.passcode !== undefined) meeting.passcode = link.passcode;
    return meeting;
  }

  async updateMeeting(_meetingId: string, _req: Partial<MeetingRequest>): Promise<void> {
    // Nothing to update: the link lives wherever the organizer pasted it.
  }

  async deleteMeeting(_meetingId: string): Promise<void> {
    // Nothing to delete.
  }

  async getParticipants(_meetingId: string): Promise<ParticipantRecord[]> {
    return [];
  }
}
