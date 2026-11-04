# Keeping and letting go of class data

What Trainyard stores for a class, where, for how long, and how a trainer gets a copy before anything goes. The periods below are the defaults; the operator sets them in the server's `.env` (see the end).

## What a class holds

| Data | Where | Personal data? |
|---|---|---|
| The class board: lessons, exercises, every card and every exercise's work (the shared copy and each team's copy), done marks, the timer | One row per board (`workspace_shards`, kind `board`) | What people write on it |
| The planning room (PI planning simulation) | One row per document (`workspace_shards`, kind `doc`, key `planning-room:<board>`) | What people write on it |
| Students: name, email, the hash of their link, when the link was emailed and last used | The platform record (`classGuests`) | Yes: name and email |
| Teams and seatings, the class owner, when the board was last worked on | Fields on the board | No |
| The audit log: who changed what, when (never the content) | `audit_log`, append-only | User ids only |

Nothing about a class is kept in the browser beyond the sign-in key, the trainer's team chip and an anonymous voter id.

## The life of a class

1. **Running.** The trainer starts the class from a template, adds students, sets up teams. Every change is saved on the server the moment it happens and reaches every open screen at once.
2. **Finished.** When the class is over the trainer can download its record from the board page, "Download record…": a **printable report** (one HTML page: students by team, every lesson's exercises with what was written, the planning room; print it to PDF for the records) and the **full record** (JSON, the whole board with everything in it, to keep or to import again).
3. **Archived.** "Archive class" closes the students' links (they see "This class has ended") and takes the class out of the trainer's list, under "Show archived". The trainer still opens it, downloads it, and can reopen it. A class nobody has touched for **180 days** is archived by itself.
4. **Deleted.** "Delete" removes the board, its planning room and its students' links. **Before it goes, the record (report and JSON) is emailed to the trainer** who made the class (or the workspace owner). An archived class is deleted by itself **365 days** after it was archived, again with the record emailed first; if there is nobody to email it to, the class is kept.

The sweep that archives and deletes runs every six hours on the server (`POST /v1/admin/retention/sweep` runs it on demand; `GET /v1/admin/retention` shows the policy).

## Students' personal data

- A student's name and email are held for the class invitation and the roster, and leave with the class. Removing a student from the Students panel removes them at once (their link stops working, their seat on the icebreaker clears).
- The link token is stored as a hash only; a lost link is replaced, never recovered.
- The exported record carries names and emails, because it is the trainer's roster. Trainers keep it under their own records policy; Trainyard holds no copy of an export once it is sent.
- When a trainer asks for a student's data to be removed, remove the student from every class they are in; nothing else about them is kept.

## Backups

The Postgres data volume is backed up by the `backup` compose profile (nightly `pg_dump`, kept for the days the profile sets). A deleted class therefore remains in backups until those age out. Backups are for disaster recovery only and are not read to restore a single class.

## Setting the periods

In the server's `.env`:

```
TRAINYARD_RETENTION_ARCHIVE_DAYS=180   # days without a change before a class is archived; 0 never
TRAINYARD_RETENTION_DELETE_DAYS=365    # days archived before a class is emailed out and deleted; 0 never
```

Mail must be configured (`TRAINYARD_SMTP_URL`) for the record to be emailed; without it, a trainer's own delete still goes through, and the sweep archives but never deletes.

## Storage and speed, for the operator

- Each board and planning document is its own database row, written only when it changed, so a sticky costs a write of that board and nothing else.
- A board holds at most 1 MB of exercise state and a planning room at most 1 MB; the API refuses more.
- Open pages hold one event stream each and fetch only when told something changed; polling is a fallback.
- Archiving finished classes keeps lists short; deleting them keeps the database small. The audit log only ever grows; prune it by date with your database tooling if it matters.
