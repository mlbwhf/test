# Go-live runbook — 16 Nov 2026 (owner approved "go live" in chat, 16 Nov)

Tools: ONLY `mcp__report-ai_org__*` (load via ToolSearch). NEVER any `mcp__agile-agilist_com__*` tool.
Read /home/user/test/CLAUDE.md first. Same-post edits strictly sequential; wp_alter_post in PLAIN mode
(replaces every occurrence); never start a search with `">` + tag; on a 403 retry once, then back off and report.
Fetch raw content with `list_pages` (include=[id], status=["any"], context="edit") — `get_pages` with context edit is
broken on this server. If the result is too large it is saved to a file; pass that file to compare.py.

Repo: /home/user/test. Pre-go-live commit (drafts as they are on the site now): b709e4a146623829fa04b8c69f44babe478e3046.
Go-live commit (target content): da203db2a2423df019aa8779680499500d078dab (branch claude/peaceful-gauss-clw4O, repo mlbwhf/test).
Plan: content-ops/golive/plan.json — per draft: id, slug, new_local (target file), simple (ordered edits with expected counts).

## A. Patch + publish one draft (repeat per draft, one page at a time)
1. Fetch raw (context edit). Confirm status is draft. Write the PRE version with
   `git -C /home/user/test show b709e4a146623829fa04b8c69f44babe478e3046:<new_local path> > /tmp/claude-0/-home-user-test/911ce32d-9f4b-5c19-8ea9-a895933a62cc/scratchpad/pre-<id>.html`
   and run `python3 /home/user/test/tools/state-of-ai/compare.py <saved fetch> <pre file>` → must be IDENTICAL.
   If not, do NOT edit that page; report the diff and move on.
2. Apply plan `simple` edits in order (plain mode). Each must report exactly the expected `count` replacements.
3. Fetch again; compare.py against `new_local` → must be IDENTICAL.
4. Publish: `wp_update_post` status "publish", and set the post date to the current time (use the GMT time from
   `mcp_ping` for a GMT date field if the tool offers one; otherwise the local date field). Drafts carry their creation
   date, so publishing without setting the date would show 11–15 Nov as the publish date. Check the tool schema first.
5. Verify with list_pages (context view or embed): status publish, `link` equals the expected URL
   (https://report-ai.org + the page's path as written in its own citation line / schema `url`).

## B. Swap a live page for its staged rebuild (322→4007, 358→4009, 934→3915)
1. Fetch the OLD live page; save its raw content to backups/<old id>-20261116.html. Confirm it has NO child pages
   (list_pages parent=[old id], status any). If it has children, stop and report.
2. Note the Redirection rules first (`wp_get_redirects`, search the old URL path).
3. Set the old page to status "draft" FIRST, then change its slug to `<slug>-archive`.
4. Check `wp_get_redirects` again. If Redirection auto-created a rule whose SOURCE is the real URL (e.g. /indexes/state-of-ai/state-of-ai-2024/)
   during step 3, disable or delete that one rule (it would hijack the real URL) and record its details. Touch no other rule.
5. Patch the staged draft as in A.1–A.3 (its pre/target files are in plan.json).
6. `wp_update_post` on the staged draft: slug = the real slug (e.g. state-of-ai-2024), status publish, date = now (as A.4).
7. Verify its `link` is exactly the real URL and the old page's link is now the -archive one (draft). If WordPress appended
   "-2" to the slug, the old page still holds it — fix the old slug and retry.

## C. Never
- publish State of AI in Numbers 2026 (3847) — it publishes mid-December;
- delete any page or media; edit 3229/3227 (only the corrections agent does); touch pages outside your list.

Report per page: ID, action, edits applied (counts), compare results, final status, link, any errors.
