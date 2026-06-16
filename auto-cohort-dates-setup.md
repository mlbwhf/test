# Easier cohort dates — update once in the calendar, everywhere syncs (Route B)

**Goal:** never hand-edit the page again. You set a date **once** on the event in wp-admin; the filterable schedule table *and* the registration form's cohort dropdown both read from it.

Two pieces — the **page** (snippet) and the **form** (dynamic dropdown). Do both so the date you pick and the date the buyer registers for are the same record.

---

## Part 1 — Page table from the calendar (the snippet)
1. Install the free **WPCode** plugin (Plugins → Add New → "WPCode").
2. **WPCode → + Add Snippet → Add Your Custom Code (New Snippet) → PHP Snippet.**
3. Paste all of **`aa-cohorts-wpcode-snippet.php`**. Insert Method = **Auto Insert → Run Everywhere**. **Save + Activate.** (It only registers a shortcode, so "Run Everywhere" is safe.)
4. **First-run check (as admin):** put `[aa_cohorts debug="1"]` on any draft page and preview. You'll see a dark box listing the detected **taxonomy, post type, and start-date meta key**, plus the meta keys on your first event.
   - If everything shows "found" and a meta key is detected → great, delete the debug shortcode.
   - If something says **NOT FOUND/DETECTED**, copy that line to me (or pass it yourself), e.g.
     `[aa_cohorts post_type="wp_events" taxonomy="event_categories" date_meta="start_ts"]`
5. On the course page, **replace the static schedule block** with just:
   ```
   [aa_cohorts]
   ```
   (Optionally `[aa_cohorts price="$850" limit="12"]`.) Now the table is generated live from your "sa" events — upcoming only, sorted by date, with the **This month / Next month / Weekend / Weekday / Time slot / Month** filters working automatically from each event's date.

**To change a cohort date from now on:** edit the event in wp-admin → change its date → done. Table updates itself. Past dates drop off automatically.

---

## ✅ Confirmed config for this site (use these — no guessing)
- **Taxonomy:** `event_category` · **term:** `sa`
- **Cohort option value:** Post ID · **label:** event title + date
- If `[aa_cohorts]` still renders nothing, pin it explicitly:
  `[aa_cohorts taxonomy="event_category" post_type="wp_events" date_meta="<from debug box>"]`

## Part 2 — Make the FORM dropdown read the same events (so the link binds)
> ✅ **DONE / LIVE.** Form 3's Cohort Date dropdown already pulls from the `sa` events
> (label = title + date, value = Post ID) via a live WPCode snippet, verified at
> `…/enroll-leading-safe-pilot/?cohort=22456` (6 dated options, July 9 pre-selected).
> Do **not** add a second snippet for this — the steps below are the original reference only.
Right now form 3's Cohort field is a static dropdown (cohort-1/2/3). Switch it to pull from the same events so the value matches the table's `?cohort=<event-id>` links:

1. Fluent Forms → form 3 → edit the **Cohort Date** field → delete it, add a **"Select" (Dropdown)** field set to **Dynamic** source (Fluent Forms Pro → field → **Advanced → Dynamic Options / Auto Populate → Post/CPT**):
   - **Post type:** your events CPT (the one the debug box reported, e.g. `wp_events`).
   - **Term/Category:** `sa`.
   - **Label =** post title, **Value =** **Post ID**.
2. Same field → **Advanced → Default Value = `{get.cohort}`**.

Now the chain is consistent:
`table row (event #123) → link ?cohort=123 → form dropdown option value 123 (that same event)`.
The buyer lands on the form with the exact cohort they clicked pre-selected, and it's the same record you dated in the calendar.

> The snippet also outputs `window.AA_COHORTS = {123:"Jul 18, 2026", …}`. Update the page's yellow "You're enrolling in:" indicator script to read it, so it shows the real date instead of "Cohort 1":
> ```js
> var label=(window.AA_COHORTS&&window.AA_COHORTS[p])||p;
> nm.textContent=label;box.style.display='block';
> ```

---

## What stays manual vs automatic now
| Thing | Before | After Route B |
|---|---|---|
| Cohort dates on the page | hand-edit `<tr>` rows | **edit the event date once** |
| Form cohort options | hand-edit dropdown | **auto from same events** |
| Old dates | manually remove | **auto-drop when past** |
| Filters (month/weekend/slot) | manual tags | **derived from the date** |

## If the debug box shows NOT FOUND
Send me the three detected lines (taxonomy / post type / meta keys). I'll lock the exact `post_type`, `taxonomy`, and `date_meta` into the shortcode so it's pinned — no auto-detect needed.
