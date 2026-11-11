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

**Important:** Metricool, Publer and most schedulers only auto-publish to **X on a PAID plan** (X's API pricing forced this). So for a free setup, use **Buffer**.

**Recommended (free): Buffer free plan.** It connects **X + Instagram + LinkedIn** — exactly your 3 active channels — and includes X on the free tier.

1. Create a free Buffer account → connect **X, Instagram, LinkedIn** (3 channels = the free limit).
2. Open `stat-bank-batch1.csv` and **paste each post's Text + Hashtags + Link** into Buffer's queue. (Buffer's free plan has no CSV import, but 17 posts is a ~10-minute paste; it holds ~10 per channel, so reload every couple of weeks.)
3. Review every post. **Nothing publishes until you approve/queue it.**
4. Instagram requires an image on every post — see "Images" below.

**Free X-only alternatives** if you'd rather not use Buffer:
- **X native scheduler** — schedule each daily post directly in X's compose box (calendar icon). Manual, X-only, zero tools.
- **WP-to-Twitter plugin + your own free X API keys** — fully automated tweets from the site, but requires creating a free X developer app.

**Paid, only for true zero-touch + CSV bulk import:** Publer (~$12/mo) or Metricool (~$18/mo) auto-publish to X *and* import `stat-bank-batch1.csv` directly.

---

## The stat bank (`stat-bank-batch1.csv`)

- **17 posts**, every figure pulled from your own published reports (Compare, Regulating AI, Dark Side) — each carries its primary source in the text.
- Pre-scheduled one per weekday, 09:30, starting Mon 3 Aug 2026 (change freely in Metricool).
- Columns: `Date, Time, X, Instagram, LinkedIn, Text, Hashtags, Link, Image Idea`.
- On import, map **Text → post text**; append **Hashtags** and **Link** to the text (X counts a link as ~23 chars — all posts are sized to fit 280).

This is **Batch 1 (sample)**, 17 posts.

## The full stat bank (`stat-bank-full.csv`)
**42 more posts** mined from 14 reports (Geography of AI, Regulation by Country, Kill-Switch forecast, AI-bubble/hidden-debt, autonomous cyberattacks, Dark Side surveillance/misinformation/jobs/weapons, Best Models 2026). Same 9-column format, scheduled one per weekday **26 Aug – 22 Oct 2026**, 09:30. No overlap with Batch 1.

> **Verify the `Link` column before scheduling.** These URLs were inferred from each report's breadcrumb and have not been checked against the live site — some paths (e.g. `/geography-of-ai/`, the AI-bubble reports, `/indexes/technical-performance/`) may differ. The stat text and source in every post are copied verbatim from the reports and are accurate; only the links need a pass. (On Instagram the link isn't clickable anyway — it lives in your bio.)

## Images (needed for Instagram)
Instagram won't post text-only. Each row has an **Image Idea**. Next step I can generate a set of **branded stat cards** (your black / cobalt / Archivo look) as ready-to-upload PNGs — one per stat — so the drip is fully visual. Say the word and I'll produce Batch 1's 17 cards.

## Optional: also post the daily stat on the site
If you'd like each daily stat to also appear on report-ai.org (fresh-content signal for SEO) and auto-share via Jetpack, I can deliver a scheduled WPCode/wp-cron snippet that publishes a "Stat of the Day" into a dedicated category. Optional — the Metricool route works without it.
