# Report-AI — Automatic social posting setup

Your 5 accounts:
- **X** — https://x.com/AIbyNumbers
- **Instagram** — the.ai.index  *(cross-posts to Facebook + Threads automatically)*
- **LinkedIn Page** — company/ai-indexes
- **Facebook Page** — The AI Index (fed by Instagram)
- **Threads** — @the.ai.index (fed by Instagram)

Because **Instagram cascades to Facebook + Threads**, we only actively drive **3 channels**:
**Instagram · LinkedIn · X.**

---

## Two machines

### Machine A — auto-post NEW reports (native, free, one-time setup)
Uses **Jetpack Social**, already installed on the site.

1. wp-admin → **Jetpack → Social** (or **Tools → Marketing → Connections**).
2. Connect **Instagram** (must be a Business/Creator account linked to the Facebook Page) and **LinkedIn Page**. Log in when prompted — this is a one-time OAuth you do yourself.
3. From now on, **every published report auto-shares** to Instagram + LinkedIn. Instagram then cross-posts to Facebook + Threads.
4. **X is not supported by Jetpack** (X killed its free API in 2023). Post new reports to X from Metricool (below), or by hand.

Note: the free Jetpack Social tier has a monthly auto-share cap. If you publish a lot, the paid Jetpack Social add-on lifts it.

### Machine B — the DAILY stat drip
Publicize only fires on new posts, so a daily statistic needs its own queue.

**Tool: Metricool (free tier).** It's the only free scheduler that holds X + Instagram + LinkedIn together (Buffer free = 3 channels but no bulk import; Publer free = 3 accounts).

1. Create a free Metricool account → add one Brand → connect **X, Instagram, LinkedIn**.
2. **Planner → Import** and upload `stat-bank-batch1.csv`.
3. Review every post in the calendar. **Nothing publishes until you approve it.**
4. Instagram requires an image on every post — see "Images" below.

---

## The stat bank (`stat-bank-batch1.csv`)

- **17 posts**, every figure pulled from your own published reports (Compare, Regulating AI, Dark Side) — each carries its primary source in the text.
- Pre-scheduled one per weekday, 09:30, starting Mon 3 Aug 2026 (change freely in Metricool).
- Columns: `Date, Time, X, Instagram, LinkedIn, Text, Hashtags, Link, Image Idea`.
- On import, map **Text → post text**; append **Hashtags** and **Link** to the text (X counts a link as ~23 chars — all posts are sized to fit 280).

This is **Batch 1 (sample)**. Once you're happy with the voice and format, I'll expand to a rolling **40–60 stat bank** mined across all 366 reports and refill it monthly.

## Images (needed for Instagram)
Instagram won't post text-only. Each row has an **Image Idea**. Next step I can generate a set of **branded stat cards** (your black / cobalt / Archivo look) as ready-to-upload PNGs — one per stat — so the drip is fully visual. Say the word and I'll produce Batch 1's 17 cards.

## Optional: also post the daily stat on the site
If you'd like each daily stat to also appear on report-ai.org (fresh-content signal for SEO) and auto-share via Jetpack, I can deliver a scheduled WPCode/wp-cron snippet that publishes a "Stat of the Day" into a dedicated category. Optional — the Metricool route works without it.
