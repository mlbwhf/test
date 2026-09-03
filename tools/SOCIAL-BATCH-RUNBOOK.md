# Social batch runbook (used by the every-10-days Routine)

Goal: queue ~10 fresh stat posts to ALL connected Buffer channels, with house-style
card images. Reference batch: `social-posts/2026-08-21/` (posts.md = copy + alt text).

1. **No repeats.** Check Buffer `list_posts` (sent + queued) and previous
   `social-posts/*/posts.md` batches. Every stat must be new or meaningfully updated.
2. **Source the stats** from report-ai.org's own pages (newest reports/indexes first —
   `wp_get_posts` post_type page, sorted new). Follow CLAUDE.md rules: every figure
   attributed, dated, confidence-rated (HIGH/MEDIUM/DERIVED). Link the on-site page.
3. **Cards:** copy `social-posts/2026-08-21/cards.sample.js`, replace the cards array
   with the new stats, then:
   `npm i playwright-core sharp` (scratchpad), chromium at
   `/opt/pw-browsers/chromium-*/chrome-linux/chrome`, run
   `node tools/gen-social-cards.mjs <cards.js> <outdir>`, then quantize with sharp
   (palette:true, colors:64) — target 8–20KB per PNG.
4. **Host:** commit + push the PNGs (repo is public), then `wp_upload_media` with
   `url:` raw.githubusercontent.com pinned to the commit SHA → use the returned
   report-ai.org media URLs everywhere.
5. **Queue in Buffer** (`get_account` → org "AI Indexes" → `list_channels` → one
   `create_post` per post per channel, `schedulingType: automatic`, default
   addToQueue, image asset with altText):
   - twitter: short copy ≤ 280 chars incl. link
   - linkedin: full copy + link
   - instagram: `metadata.instagram {type:"post", shouldShareToFeed:true}`, caption
     mentions report-ai.org by name (links aren't clickable)
   - any newly connected channel: match its platform limits
   - Free plan = 10 queued per channel: count the existing queue first and only add
     what fits; report anything skipped.
6. **Never double-post**: Buffer and Jetpack own different platforms; touch only
   Buffer channels.
7. Write the batch's `posts.md` (copy + alt text) into `social-posts/<date>/`,
   commit, push.
