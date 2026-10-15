# @gate/meetings

Video-meeting provisioning and attendance for live-virtual training cohorts.
Exposes a provider-neutral `MeetingPort` (`createMeeting`, `updateMeeting`,
`deleteMeeting`, `getParticipants`), a `ZoomMeetings` implementation on the Zoom
REST API v2, a `TeamsMeetings` implementation on Microsoft Graph, a
`ManualMeetings` adapter for organizer-pasted links, an `InMemoryMeetings` for
tests, and the pure `summarizeAttendance` roll-up.

No runtime dependencies; uses the global `fetch`.

```ts
import { ZoomMeetings, summarizeAttendance } from "@gate/meetings";

const zoom = new ZoomMeetings({
  accountId: process.env.ZOOM_ACCOUNT_ID!,
  clientId: process.env.ZOOM_CLIENT_ID!,
  clientSecret: process.env.ZOOM_CLIENT_SECRET!,
});

const meeting = await zoom.createMeeting({
  topic: "Scrum Master Cohort 12 – Day 1",
  startsAt: new Date("2026-11-20T14:00:00Z"),
  durationMinutes: 240,
  timezone: "Europe/London",
  externalId: "cohort-12-day-1",
});

const records = await zoom.getParticipants(meeting.meetingId);
const { byEmail, unmatched } = summarizeAttendance(records, [
  { startsAt: new Date("2026-11-20T14:00:00Z"), endsAt: new Date("2026-11-20T18:00:00Z") },
  { startsAt: new Date("2026-11-21T14:00:00Z"), endsAt: new Date("2026-11-21T18:00:00Z") },
]);
```

## Providers

| Class              | `provider` | Auth                                   | Attendance source                              |
| ------------------ | ---------- | -------------------------------------- | ---------------------------------------------- |
| `ZoomMeetings`     | `zoom`     | Server-to-Server OAuth (account creds) | `GET /report/meetings/{id}/participants`       |
| `TeamsMeetings`    | `teams`    | Entra ID client credentials            | `onlineMeetings/{id}/attendanceReports`        |
| `ManualMeetings`   | `manual`   | none                                   | none (`getParticipants` returns `[]`)          |
| `InMemoryMeetings` | `manual`   | none                                   | `setParticipants(meetingId, records)` helper   |

All providers throw `MeetingProviderError { provider, status, message }` on a
non-2xx response, retry `429`/`5xx` up to 3 times with exponential backoff
(100 ms base, injectable `sleep`), and treat `404` on delete as success.
Access tokens are cached until 60 s before they expire. Credentials are only
ever sent in `Authorization` headers or the token request body and never appear
in error messages or logs.

Participant records are merged per email (case-insensitive): minutes summed,
earliest join, latest leave. Records without an email are returned as-is.

## Zoom setup

Create a **Server-to-Server OAuth** app in the Zoom App Marketplace and grant it
these scopes:

- `meeting:write:admin`
- `meeting:read:admin`
- `report:read:admin`

Meetings are created as scheduled meetings (`type: 2`) with a waiting room, no
join-before-host, manual registration approval, no registrant e-mails and cloud
recording. Participant reports are available once the meeting has ended.

Environment variables used by the API:

| Variable             | Purpose                                     |
| -------------------- | ------------------------------------------- |
| `ZOOM_ACCOUNT_ID`    | Account id of the Server-to-Server app      |
| `ZOOM_CLIENT_ID`     | App client id                               |
| `ZOOM_CLIENT_SECRET` | App client secret                           |

Optional: `userId` (default `me`) selects the Zoom user that owns the meetings.

## Microsoft Teams setup

Register an application in Entra ID, create a client secret and grant these
**application** permissions on Microsoft Graph (admin consent required):

- `OnlineMeetings.ReadWrite.All`
- `OnlineMeetingArtifact.Read.All`

Graph also requires an [application access policy](https://learn.microsoft.com/graph/cloud-communication-online-meeting-application-access-policy)
that allows the app to create meetings on behalf of the organizer user.

Environment variables used by the API:

| Variable               | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `MS_TENANT_ID`         | Entra ID tenant id                                   |
| `MS_CLIENT_ID`         | Application (client) id                              |
| `MS_CLIENT_SECRET`     | Client secret                                        |
| `MS_ORGANIZER_USER_ID` | Object id (or UPN) of the user who hosts the meetings |

## Attendance

`summarizeAttendance(records, sessions, opts?)` clips every participant interval
to the session windows, unions overlapping intervals per person (two devices do
not double count) and returns `{ byEmail, unmatched }`:

- `byEmail`: `Map<email, { minutes, sessionsAttended, status }>` keyed by
  lower-cased email. `sessionsAttended` counts sessions with at least 50 %
  overlap. `status` is `present` at ≥ 75 % of total scheduled minutes, `partial`
  at ≥ 25 %, otherwise `absent` (`presentThreshold` / `partialThreshold` override).
- `unmatched`: records without an email, for manual reconciliation.
