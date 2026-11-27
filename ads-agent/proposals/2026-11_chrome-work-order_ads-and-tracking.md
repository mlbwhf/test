# Chrome extension work order: ads fixes + purchase tracking (27 Nov 2026)

Give Claude in Chrome **one task at a time**, in order. Each task lists where to go, what to change,
and what must not be touched. **Owner decisions already made:** Microsoft Option B budgets, Audience
Network off, brand CPC at most CA$2, competitor negatives, active GTM container = **GTM-K9627QZB**.

**Standing rules for every task:**
- **Microsoft Ads:** never edit **Tracking template** or **Final URL suffix**.
- **Microsoft Ads:** never import from Google Ads.
- Never change billing, users or account access.
- **GTM: build in a workspace, use Preview, and do NOT Publish** until Task 7 says so.
- Stop and screenshot if anything looks different from this order.

---

## TASK 1: Microsoft Ads budgets, Audience Network, brand CPC (about 15 min)
Go to `https://ads.microsoft.com` → Agile Agilist account (187136875) → **Campaigns**.

1. Set each campaign's **daily** budget (click the Budget cell, edit, Save):

   | Campaign | Daily budget |
   |---|---|
   | Certifications - English | 36 |
   | AI-Native - Virtual | 20 |
   | AgileAgilist Defense - English | 2 |
   | AI-Native - Face-to-Face | 2 |

2. In **each of the 4 campaigns:** go to Settings → **Networks / Ad distribution** → search only.
   **Untick Audience network.** Then open each ad group → Settings → **Ad distribution**, and untick
   Audience network there too if it's shown. Save.
3. **AgileAgilist Defense - English** → Ad groups → set the default bid (max CPC) to **2.00**. If the
   campaign uses automatic bidding, set its **max CPC limit** to **2.00** instead.
4. **Screenshot:** the campaign list with budgets, plus one campaign's network settings.

## TASK 2: Google Ads networks + competitor negatives (about 10 min)
Go to `https://ads.google.com` → account 337-177-3090.

1. For **every Search campaign**: Settings → **Networks** → **untick "Include Google search partners"**
   and **untick "Include Google Display Network"**. Certifications - English has "Display Select" on.
   Save each one.
2. **Tools → Shared library → Exclusion lists (Negative keyword lists) → +**. Name it
   `Competitors (approved 25 Nov)`. Add these as **phrase** match, one per line:
   `"coursera"`, `"grow google"`, `"google ai essentials"`, `"uoft"`, `"university of toronto"`.
   Save, then **apply the list to all Search campaigns**.
3. **Don't change bid strategies, budgets, keywords or ads** in this task.
4. **Screenshot:** one campaign's Networks section, and the negative list with its applied campaigns.

## TASK 3: Audit GTM-K9627QZB (read-only, about 5 min)
Go to `https://tagmanager.google.com` → container **GTM-K9627QZB**.

1. **Versions:** screenshot the latest **published** version (number, date, who published).
2. **Tags:** screenshot the full list with types and firing triggers.
3. **Flag (don't delete yet)** any tag that:
   - (a) fires on outbound clicks to **eventbrite**;
   - (b) is a **Corsizio** conversion;
   - (c) fires on **/registration-confirmed/** page view;
   - (d) sends any URL that may contain `name=`.
4. Confirm whether a **Conversion Linker** tag and a **Microsoft UET** tag (343248805) exist.
5. **Send the screenshots to Claude** (the ads agent session) before Task 6.

## TASK 4: Google Ads, create the website purchase conversion (about 5 min)
Goals → Conversions → **+ New conversion action** → Website → **Add a conversion action manually**.
- Name: **`Website Purchase - Paid Registration`** (exactly).
- Category: **Purchase**. Value: **Use different values for each conversion**, with a default of 0.
- Count: **One**. Click-through window: **30 days**.
- **Set it as a SECONDARY action for now** (not used for bidding) until Task 7.
- Choose "Use Google Tag Manager" and copy the **Conversion ID** and **Conversion Label**. Send them to
  the person doing Task 6.

## TASK 5: Microsoft Ads, create the matching conversion goal (about 5 min)
Conversions → Conversion goals → **Create** → Website → **Event**.
- Name: **`Website Purchase - Paid Registration`**.
- Action: **equals `purchase`**. Revenue: **dynamic** (fall back to 0). Count: **Unique**.
- UET tag: **343248805**.
- **Include in "Conversions": NO for now** (until Task 7).

## TASK 6: Build the tags in GTM-K9627QZB (workspace + Preview only, about 20 min)
New workspace named `website-purchase`.

1. **Variables** (Data Layer Variable, version 2):
   - `DLV - ecommerce.value` → `ecommerce.value`
   - `DLV - ecommerce.transaction_id` → `ecommerce.transaction_id`
   - `DLV - ecommerce.currency` → `ecommerce.currency`
2. **Trigger:** Custom Event, event name **`purchase`** (exact), all custom events.
3. **Tags:**
   - **Conversion Linker**, firing on All Pages (skip if one already exists).
   - **Google Ads Conversion Tracking:**
     - Conversion ID and Label from Task 4.
     - Value = `{{DLV - ecommerce.value}}`, Transaction ID = `{{DLV - ecommerce.transaction_id}}`,
       Currency = `{{DLV - ecommerce.currency}}`.
     - Trigger: `purchase`.
   - **Microsoft UET base tag** (Tag ID 343248805) on All Pages, **only if Task 3 found none** and
     UET isn't installed some other way.
   - **Microsoft UET custom event:**
     - Action `purchase`.
     - Revenue = `{{DLV - ecommerce.value}}`, currency = `{{DLV - ecommerce.currency}}`.
     - Trigger: `purchase`.
4. **Pause** (don't delete) the tags flagged in Task 3 (a) to (d).
5. **Preview** on agile-agilist.com:
   - Ordinary page loads show the linker and the UET base tag, and **no** purchase tags.
6. **Don't Publish.** Screenshot the workspace changes list.

## TASK 7: Go live, same day (only after the web team's part is live)
**Web team (not Chrome), section 2 of `proposals/2026-11_website-conversion-tracking.md`:**
- Mark website Stripe payments with `metadata.origin = agile-agilist.com`.
- Push one `purchase` dataLayer event, server-verified, once per paid website checkout.
- Remove the name from the confirmation URL.
- Switch **GTM4WP output ON with GTM-K9627QZB**.

**Then, with Claude in Chrome:**
1. **Test in GTM Preview:** a Stripe **test-mode** website purchase fires exactly **one** `purchase`.
   Reloading the confirmation page fires **none**. No name or email appears in any URL.
2. **Publish** the GTM workspace (version name: `website purchase tracking`).
3. **Google Ads:** make **Website Purchase - Paid Registration** **Primary**. Set **Eventbrite Click -
   Register** and **Corsizio Registration - AI-Native** to **Secondary**.
4. **Microsoft Ads:** set **Website Purchase** to Include in "Conversions" = **Yes**. Untick it on the
   Eventbrite-click goal.
5. **Bidding: needs Mark's OK first.** Campaigns on Maximize Conversions move to **Maximize Clicks with
   a max CPC cap**, until each one has 15 website purchases in 30 days (your smart-bidding rule).
6. Tell Claude. The daily agent then checks Stripe payments against Google's count every day.
