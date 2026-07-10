# Social Media Content Agent

A multi-account social media content agent. Each account is an isolated
**context** with its own focus, audience, voice, hashtags, and publishing
channel. The agent writes posts with Claude using **your** LinkedIn and video
templates, guards against duplicates and cross-account mix-ups, and publishes
through a pluggable channel (dry-run outbox, LinkedIn API, Buffer, or a
webhook into Zapier/Make/n8n).

```
accounts.yaml          account registry (focus, voice, topics, publisher per account)
templates/linkedin/    your LinkedIn post templates (.md — drop in your own)
templates/video/       your video script templates
drafts/                generated drafts awaiting review        (gitignored)
outbox/                dry-run "published" posts               (gitignored)
history/               per-account post ledger (JSONL)         (gitignored)
state.json             remembers the active account            (gitignored)
socialagent/           the Python package (CLI, generator, guard, publishers)
```

## Setup

```bash
cd social-agent
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...   # or `ant auth login`
```

## Daily workflow

```bash
# 1. See your accounts, pick the context you're posting as
python -m socialagent accounts
python -m socialagent use agile-agilist

# 2. Draft a post from a brief, using one of your templates
python -m socialagent draft \
  "Leading SAFe cohort opens March 3, Toronto + remote, early-bird ends Feb 14, link: agileagilist.com/leading-safe" \
  --template announcement

# Video script instead:
python -m socialagent draft "What is PI Planning in 60 seconds" \
  --kind video --template short-explainer

# One-off post for a different account WITHOUT switching context:
python -m socialagent draft "..." --account personal-brand --template story

# 3. Review the draft (it's saved under drafts/), then publish
python -m socialagent post drafts/agile-agilist-linkedin-20260710-190201.md

# 4. Audit trail
python -m socialagent history
```

## Accounts = switchable contexts

`accounts.yaml` defines every account. The active account is sticky
(`use <id>`) so consecutive drafts stay in the same context; `--account`
overrides for a single draft. Each account's `focus`, `audience`, `voice`,
and `hashtags` are injected into the system prompt, so the same brief produces
a different post per account — the company page announcement and the personal
"lessons learned" post never sound alike.

## Templates

Drop any `.md` file into `templates/linkedin/` or `templates/video/` and it
becomes available as `--template <filename>`. Templates are free-form: section
structure, `[PLACEHOLDERS]`, and style notes are all passed to the model as
the structure to follow. Missing details are filled in and flagged with
`[CONFIRM: ...]` so you can correct before posting. Three LinkedIn templates
(announcement, insight, story) and two video templates (short-explainer,
talking-head) ship as starters — replace them with your own.

## The mix-up guard

Every draft is checked before it can be posted (`draft` runs it automatically;
`check <file>` runs it standalone; `post` enforces it):

1. **Duplicate block** — ≥60% word-shingle similarity with anything already
   posted on the *same* account blocks the post (override with `--force`).
2. **Cross-account leak warning** — ≥40% similarity with a post from a
   *different* account warns that content is bleeding between contexts.
3. **Focus check** — the draft is scored against every account's `topics`
   keywords; if another account matches the draft clearly better than the one
   you're posting to, you get a "wrong account?" warning before publishing.

Warnings require an explicit confirmation (`--yes` to skip the prompt);
duplicates are refused outright.

## Publishers

Set per account in `accounts.yaml` (`publisher:` + `publisher_config:`):

| publisher  | what happens | needs |
|---|---|---|
| `outbox`   | writes the post to `outbox/` — safe dry run (default) | nothing |
| `linkedin` | posts via the LinkedIn UGC API | OAuth token env var + `author_urn` |
| `buffer`   | queues into a Buffer profile | Buffer token env var + `profile_id` |
| `webhook`  | POSTs `{account, platform, text}` to your Zapier/Make/n8n workflow | webhook URL env var |

Credentials are only ever read from environment variables — never put tokens
in `accounts.yaml`.

Every publish (including dry runs) is recorded in `history/<account>.jsonl`,
which is also what feeds the duplicate/mix-up guard.
