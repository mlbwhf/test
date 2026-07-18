# Re-add the missing interactive scripts (3 pages)

**Why the API can't do this:** WordPress.com's firewall rejects any content
push that contains interactive JavaScript patterns (`document.getElementById`,
`addEventListener`, `innerHTML`, etc.) — it reads them as an attack signature
and returns `invalid_json`. Confirmed live: page 1705 pushed fine (plain
schema data), but 28785 was blocked the moment its quiz JS was included.
The **block editor bypasses the firewall**, so pasting is the fix.

These 3 pages RENDER fine today — they're just missing their interactivity:
- **28785 /assessments/agile-maturity/** — the maturity quiz is empty (no
  questions, no radar chart, no results). **Most broken — do this first.**
- **28854 /services/operating-model/** — a small interactive script.
- **964 /about/** — 4 scripts incl. the HubSpot contact form embed.

## How to paste (same steps per page)

1. wp-admin → Pages → open the page → make sure you're in the **Block editor**.
2. Find the **Custom HTML block** that holds the page (the big one with all
   the markup). Click it → the code shows.
3. Scroll to the **very end** of that block's code — just before the final
   `</div>` and `<!-- /wp:html -->`.
4. Open the matching `scripts-<id>.html` file here, copy **each** `<script>…
   </script>` block (ignore my `<!-- next script block -->` separators and the
   header lines), and paste them in right before that closing `</div>`.
5. **Update** the page. Hard-refresh the front end and test:
   - 28785: answer the 4 questions → "See my maturity profile" renders the
     radar + score.
   - 964: the "Send us a message" HubSpot form appears and submits.

## Alternative (cleaner, if you're comfortable): full replace

Instead of appending scripts, you can replace the whole Custom HTML block with
the complete file from `snippets/pages/<file>.html`:
- 28785 → `agile-maturity-assessment.html`
- 28854 → `operating-model.html`
- 964   → `about-964.html`
Select-all inside the Custom HTML block, delete, paste the full file, Update.
Same firewall bypass; guarantees the page exactly matches the repo source.

## JSON-LD note (SEO)
Each page's source also has a `<script type="application/ld+json">` schema
block near the top. Those are plain data (no firewall trigger) — if you do the
**full replace** they come along automatically. If you only paste the
interactive blocks, the schema stays missing; tell me and I'll push just the
JSON-LD via API (that part the firewall allows, as 1705 proved).
