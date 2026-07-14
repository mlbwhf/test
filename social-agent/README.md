# Social Media Content Agent

A multi-account social media content agent. Each account is an isolated
**context** with its own focus, audience, voice, hashtags, and publishing
channel. The agent writes posts with Claude using **your** LinkedIn and video
templates, guards against duplicates and cross-account mix-ups, and publishes
through a pluggable channel (dry-run outbox, LinkedIn API, Buffer, or a
webhook into Zapier/Make/n8n).

Two ways to run it:

- **Browser app (Groq)** — `webapp/index.html`. Fully client-side: open the file
  in a browser, paste your Groq API key, and everything (accounts, templates,
  ledger) lives in that browser's localStorage. No install, no server.
- **Python CLI (Claude)** — the `socialagent` package below. Publishes via
  pluggable channels and keeps its ledger in files.

## Browser app (Groq) — quickest start

```bash
# just open it (double-click works too)
open social-agent/webapp/index.html        # macOS
xdg-open social-agent/webapp/index.html    # Linux
```

1. **Settings** → paste your Groq API key (from console.groq.com) and pick a
   model (default `llama-3.3-70b-versatile`). The key is stored only in your
   browser's localStorage and sent only to `api.groq.com`.
2. Pick the account pill (context) you're posting as. Accounts are editable
   as JSON in Settings — same fields as `accounts.yaml`.
3. Choose a template (`executive-story`, `executive-carousel`,
   `video-short-explainer` ship by default — Edit/New to manage your own),
   write a brief, **Generate draft**. Output streams in and is editable
   in place.
4. The guard runs automatically after generation (duplicate block,
   cross-account mix-up warning, focus-keyword check) — same logic as the
   Python version. **Copy** the post, publish it, then **Mark as posted** to
   record it in the ledger so future drafts are checked against it.
5. **Import past posts** seeds the ledger with content published before you
   started using the tool (paste, optionally split on `## ` sections — the
   `reference/linkedin-samples.md` corpus pastes straight in).

Note: the ledger is per-browser. If you draft on two machines, import your
recent posts on each, or keep to one browser.

## Python CLI (Claude API)

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
`[CONFIRM: ...]` so you can correct before posting.

Shipped templates:

- **`executive-story`** (the default) — the executive thought-leadership
  format: `Post: <title>` / `Visual Suggestion:` (ultra-realistic imperfect
  photo or "Without visuals") / `The Post:` (dated historical hook,
  one-sentence paragraphs, pivot to the AI-era executive moment, contrarian
  lesson, grounded close, 2–4 CamelCase hashtags woven inline) / two
  `CTA Options`. Modeled on the 19-post corpus in
  `reference/linkedin-samples.md`.
- **`executive-carousel`** — same post format plus a 4–5 slide carousel spec
  (text-only bold hook on slide 1, one labeled idea per slide, luxury
  minimalistic aesthetic).
- `announcement`, `insight`, `story` — generic LinkedIn starters.
- `short-explainer`, `talking-head` — video script starters.

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

Similarity is *containment*-based (overlap ÷ the smaller text), so a short
draft that re-treads part of a long past post is still caught.

**Seed the guard with posts published before this tool existed:**

```bash
# one file = one post
python -m socialagent import path/to/old-post.md --account executive-insights
# or a corpus file where each '## ...' section is a post
python -m socialagent import reference/linkedin-samples.md --account executive-insights --split
```

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
