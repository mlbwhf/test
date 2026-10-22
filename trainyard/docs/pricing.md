# Pricing: how the numbers were chosen

The website's plans (`apps/web/lib/pricing.ts`) come from two inputs: a side-by-side evaluation of PI planning dashboard tools done for a 48-team organisation, and the vendors' public pages as of October 2026. This note keeps the reasoning so the numbers can be revisited rather than re-guessed.

## What the market charges by

| Tool | Unit | Public figure (Oct 2026) |
|---|---|---|
| Miro | every member | Starter $8 (yearly) / $10 (monthly) per member per month; Business $20 / $25; Enterprise from 30 members, quote |
| BigPicture (Jira) | every Jira user on the site | 2024 cloud table: 25 users $1,185 a year, 100 users $4,740, 1,000 users $20,055 (about $47 per user per year at small sizes, $20 at 1,000) |
| Easy Agile Programs (Jira) | every Jira user on the site | tier must match the Jira site; Atlassian's calculator |
| Agile Hive (Jira) | user | quote only |
| iObeya | room | Team+ 3,780 per room per year, minimum one room; Enterprise from ten rooms, quote |
| PIPlanning.io | team | quote; a free trial on cloud, five team licences for a pilot |
| Jira Align | full user | about $129 per full user per month at the smallest tier; integrated users free |

Two patterns stand out. Jira plugins bill every user on the Jira site, so the price follows the size of the company, not the number of people planning. Whiteboards bill every member, so the PI planning room itself (a hundred people for two days) is the expensive part. Room licences avoid that but come with minimums.

## The model

Three plans, named as in the website design (Practice, Trainer, Academy), priced by the two units a buyer already thinks in:

- **Practice, $0.** The open-source edition is the product, not a trial, so the free plan has to be honest about it: self-host with every feature and no limits, or one small hosted room. This is the acquisition channel for coaches and the evaluation path for enterprises.
- **Trainer, $19 per trainer per month ($16 yearly).** The unit is the person running the room. Participants are free and unlimited, which is the opposite of per-member whiteboard pricing. The figure is the design's placeholder kept on purpose: it sits between Miro Starter and Business for one seat, and a trainer running a 30-person class pays $19 where a per-member tool would charge $240 to $750 a month.
- **Academy, $249 per Agile Release Train per month ($199 yearly, so $2,388 a train a year).** The unit is the train: a thing an enterprise already counts, with a SAFe-defined size (50 to 125 people) that caps how much value one unit can absorb. Everyone on the train is included, as are the Jira app and the Azure DevOps extension, SSO and the option to run on their servers.

## How Academy compares at the evaluated size

The evaluation covered 48 teams, roughly six trains and about a thousand people.

| | Yearly cost at that size |
|---|---|
| Trainyard Academy, 6 trains at $2,388 | about $14,300 |
| Easy Agile, quoted | about $17,300 |
| BigPicture, 1,000 Jira users (public 2024 table) | about $20,100 |
| iObeya, 10-room minimum at the public per-room price | about $37,800 |
| Agile Hive and PIPlanning.io, quoted for the same scope | $44,000 to $46,000 |
| Miro at the quoted entry point | about $12,000, growing with every member and without tracker integration |

So Academy lands below every integrated tool at that size, above only a whiteboard that does not integrate, and the gap widens as trains get larger because the price does not move with headcount. One train at $2,388 a year is also below iObeya's single Team+ room, with integration included rather than sold as an enterprise feature.

## Things deliberately not done

- No per-user tier, even though Jira buyers know it: it would reintroduce the room-is-expensive problem and undercut the one-line pitch ("never per person in the room").
- No published price above ten trains or for on-premises support agreements; those are quotes, as they are everywhere else.
- No competitor prices on the website. The comparison table shows capabilities and *what each tool charges by*, which is public, stable and the actual argument.

## When to revisit

- Hosted costs per room become known (today everything runs on one VPS).
- Multiple workspaces per server ship, which makes Practice's hosted room and self-serve sign-up real.
- A vendor changes its unit (for example, if a Jira plugin moves to per-planner pricing).
