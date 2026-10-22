# Mutation Readiness Community — Discord Setup Runbook (Workstream 3)

**Status: v1.0-draft.** Execute at day ~55 of the launch plan (server
ready before day-60 beta opening). Requires: a human with Discord account
to click through setup (~2 hours); all copy below is paste-ready.

## 1. Server creation

- Server name: **Mutation Readiness** · icon: brand mark [owner asset]
- Enable Community feature (Settings → Enable Community) — required for
  welcome screen, announcement channel type, and discovery later.
- Verification level: Medium. 2FA requirement for moderators: on.

## 2. Channels (6, per brief)

| Channel | Type | Access | Topic line (paste) |
|---|---|---|---|
| #announcements | Announcement, read-only | everyone reads, owner posts | Official news: releases, calls, framework versions. |
| #introductions | Text | everyone | Who you are, what you run, and your current band if you'll share it. |
| #questions | Text | everyone | No bad questions. Search first, then ask freely. |
| #practitioners | Text | auto-granted on join | Running the framework inside a team? This is your room. Wins, walls, and weekly-review war stories. |
| #facilitators | Text | **manual grant** | For people teaching and facilitating the framework. Ask in #questions for access. |
| #contributors | Text | **manual grant** | Extending the framework via the GitHub repo: PRs, translations, case studies, tooling. |

Roles: `@practitioner` (auto via bot on join), `@facilitator`,
`@contributor` (manual, owner/CM grants), `@moderator`.

## 3. Bot (MEE6 or Carl-bot — either works; Carl-bot recommended, better free tier)

Configure:
1. **Welcome DM** on join (paste):
   > Welcome to the Mutation Readiness community! Three links to get you
   > started:
   > 📘 Framework Guide (PDF): [link]
   > 📊 Free assessment: [link]
   > 🤝 Code of conduct: [link to pinned post]
   > First step: introduce yourself in #introductions — who you are, what
   > org you run or advise, and what brought you here.
2. **Auto-role:** grant `@practitioner` on join.
3. **Moderation:** spam/invite-link filter on; log channel `#mod-log`
   (hidden, staff only).

## 4. Code of conduct post

Pin in #announcements: post the short form (rules 1–5) from
`mutation-framework/CODE_OF_CONDUCT.md`, link to full text on GitHub.
**Owner must set the conduct contact email before launch** (placeholder in
the file).

## 5. Onboarding flow (per brief — verify with 3 test members)

Join via invite → welcome DM (3 links) → guided prompt to #introductions →
auto `@practitioner`. #facilitators / #contributors granted manually by
owner/CM on request.

**Test script (run with 3 test accounts before beta):** join → confirm DM
arrives with working links → post intro → confirm auto-role → request
facilitator access → confirm manual grant works → confirm read-only on
#announcements.

## 6. Launch sequence

| Day (plan) | Action |
|---|---|
| ~55 | Server built, bot tested with 3 test members, CoC pinned |
| 60 | Invite first 100 beta members (from Kit list: `assessment-done`, most-engaged segment) — **non-vanity invite link, no expiry, beta-capped** |
| 60–75 | Owner posts substantive content 3×/week (risk register mitigation — pre-write 6 posts before opening) |
| 75 | Public opening: invite link added to website /framework page + GitHub README |
| ≤90 from launch | First quarterly community call scheduled (Riverside.fm or Zoom, recorded → YouTube). Announce in #announcements + Kit broadcast |

## 7. Seed content (pre-write before day 60; 2 of 6 drafted)

1. "Show us your radar" — owner posts own org's (or a composite) dimension
   profile in #practitioners, invites others to share theirs.
2. "The kill-latency confession thread" — what's the longest a project
   survived past its kill criteria where you work?
3–6. [Owner to draft: one per remaining week of beta period.]

## 8. Owner time budget (from brief — calendar it now)

Weeks 1–12: 2–4 h/week. Weeks 13–26 (>200 members): 4–8 h/week, begin CM
search. >1,000 members: part-time CM ($3–6k/month; brief suggests hiring
from a future certification cohort).
