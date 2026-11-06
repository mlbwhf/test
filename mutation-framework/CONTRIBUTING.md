# Contributing to the Mutation Readiness Framework

Thank you for helping practitioners everywhere get better at this. All
contribution types below are welcome from anyone; you don't need permission
to start, just an issue so we know you're working.

## What we're looking for

| Contribution | How |
|---|---|
| **Case studies** | The most valuable contribution. See below. |
| **Translations** | See [translations/README.md](translations/README.md). |
| **Template improvements** | PR with the change and a sentence on the field experience behind it. |
| **Tooling** | Fixes/features for `score.py` or the MCP server; integrations welcome as separate repos we link to. |
| **Typos & clarity** | Straight to PR, no issue needed. |
| **Framework changes** | Questions, bands, dimensions, levers — issue first, always. See "Changing the framework itself." |

## Ground rules

- **Open an issue before substantial work** so efforts don't collide.
- **One change per pull request.** A typo fix and a new template are two PRs.
- **The YAML is the source of truth** for assessments. If you change a
  question, change the `.yaml`, the `.md`, the Claude skill, and
  `mcp-server/src/spec.ts` together — PRs that desync them will be asked to
  finish the set. (`score.py` reads the YAML directly and needs no edit.)
- **No scoring math changes** outside a versioned framework release.
- By contributing you agree your contribution is licensed under the
  repository's licenses (CC BY-SA 4.0 for documents, MIT for code).

## Submitting a case study

Case studies live in `examples/` and follow the existing pattern:

1. **Anonymize or get written permission.** Composite cases are fine and
   should say so in the header.
2. **Include real numbers**: scorecard profile at two or more points in
   time, what was done between them, and what it cost.
3. **Honest beats heroic.** We deliberately publish positive, cautionary,
   and mixed cases — a plateau honestly examined teaches more than a
   triumph lightly described.
4. Header must declare: type (positive/cautionary/mixed), organization
   profile (size, sector — no names unless permitted), and status.

## Development setup (for code contributions)

```bash
# Python scorer
cd assessments && pip install pyyaml && python3 score.py --answers 3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3

# MCP server
cd mcp-server && npm install && npm run build && npm start
```

Both must run clean before a code PR is reviewed.

## Changing the framework itself

The Framework Guide is versioned deliberately, like the Scrum Guide:
point releases for clarification, minor versions for new instruments,
major versions only with substantial field evidence. Proposals need:

1. An issue describing the problem with the current text (not just a
   preference),
2. Field evidence — what happened when real teams hit this gap,
3. Maintainer (owner) sign-off. The framework has a single author of
   record; this repo is open to contribution, but the canonical text is
   curated, not crowdsourced.

## Questions

Open a GitHub issue, or ask in the community Discord (invite link in the
README once the community launches).
