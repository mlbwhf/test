# Rooms: organising, access and licensing

## The model

```
Workspace (the customer: one plan, one bill)
 └─ Rooms ── connected to each other, or standing alone
     ├─ Boards (whiteboards, class boards, imported boards)
     └─ Pins (the app's own views: PI board, readiness, OKR dashboard, portfolio…)
```

- **A room is for one purpose.** Kinds: ART room, OKR room, Portfolio room, Class room, Team room, or general.
  - A new room starts with the views its kind needs pinned. For example, an ART room pins the PI planning board, readiness, PI Outcome Planning and delivery dashboards.
- **Rooms connect.** A portfolio room links to every ART room and back, so people move between them in one click. A room can also stand alone, such as a private leadership room or a class cohort.
- **Boards live in at most one room.** A board outside any room is open to the whole workspace, which is how boards worked before rooms. So rooms are optional and nothing existing breaks.

## Access: decided per room, inherited by boards

Access is checked on rooms, never on individual boards or cards. This is what iObeya and Miro
teams do in practice: per-board permissions do not scale past a handful of boards and cannot be
audited.

| | Workspace admin | Planner / architect | Viewer |
| --- | --- | --- | --- |
| Open room (default "everyone can edit") | Manages | Edits | Looks |
| Open room ("others can only look") | Manages | Looks, or more if added | Looks |
| Private room, added as "Manages" | Manages | Manages | Looks |
| Private room, not added | Manages | No access (the room is invisible) | No access |

- **The workspace role is the ceiling.** A viewer never edits, whatever a room says. Licensing therefore stays simple: viewers are free on every plan.
- **Room managers run their room.** They add people, set Can look, Can edit or Manages, make the room private or open, and connect it to other rooms. Workspace admins can always do this too.
- **Deleting a room never deletes boards.** They return to the whole workspace.
- **Enforced in the API, not only in the interface** (`apps/api/src/rooms.ts`, `boards.ts`, core `rooms.ts`). A board in a private room returns 404 to anyone outside it.

## Licensing: rooms as the unit customers understand

Seats stay the main price unit: trainers on Trainer, trains on Academy, source packs on Insights.
Rooms add a cap that maps to how customers think ("one room per ART", "one per class cohort")
and gives a clean upgrade moment.

| Plan | Rooms | Private rooms | Why |
| --- | --- | --- | --- |
| Practice (free) | 1 | No | Try the idea; the workspace has 5 people anyway |
| Trainer | 5 per trainer seat | Yes | One room per cohort or client; grows with seats |
| Academy | Unlimited | Yes | Priced by trains already; an ART room per train plus portfolio, OKR and team rooms |
| Insights | 2 | Yes | The OKR room plus one planning room |

- **Hitting a cap** returns 402 PLAN_LIMIT with an upgrade link. The Rooms page shows a meter ("3 of 5 rooms") and a *More rooms* link at the limit.
- **Private rooms** are the paid differentiator: free workspaces keep every room open.
- **Self-hosted** has no limits.

### Options for later (not built)

- **Guests per room:** invite an outside person (a client, a vendor team) to one room only, free up to a number per plan. This is how iObeya and Miro grow inside enterprises without full seats.
- **Room templates:** "ART room" with its boards ready-made (PI board, program board, ROAM, retrospective). Creating one would count as one room.
- **Room-level SSO groups:** map an identity-provider group (for example "ART Credit") to room membership. This builds on the identity provider seam in `apps/api/src/identity.ts`.
- **Usage-based add-on:** extra rooms sold in packs for Trainer, if 5 per seat proves tight.
