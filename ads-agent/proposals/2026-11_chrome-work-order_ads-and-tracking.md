# Chrome extension work order: ads fixes + purchase tracking (27 Nov 2026)

Give Claude in Chrome **one task at a time**, in order. Each task lists where to go, what to change,
and what must not be touched. **Owner decisions already made:** Microsoft Option B budgets, Audience
Network off, brand CPC at most CA$2, competitor negatives, GTM container = **GTM-KNLG4JL5** (changed 27 Nov after the screenshots; see Task 3).

**Standing rules for every task:**
- **Microsoft Ads:** never edit **Tracking template** or **Final URL suffix**.
- **Microsoft Ads:** never import from Google Ads.
- Never change billing, users or account access.
- **GTM: build in a workspace, use Preview, and do NOT Publish** until Task 7 says so.
- Stop and screenshot if anything looks different from this order.

---

## TASK 0: Remove the Black Friday / Cyber Monday offer from both accounts (DO FIRST, about 15 min)
The owner ended the sale on 27 Nov. Remove every offer item **today**:

**Google Ads** (campaigns Certifications - English, AI-Native - Virtual, AI-Native - Face-to-Face):
1. **Assets → Promotions:** remove the **Black Friday** promotion and the scheduled **Cyber Monday**
   one.
2. **Assets → Sitelinks:** remove "Black Friday: 15% Off" and "Cyber Monday: 15% Off".
3. **Assets → Callouts:** remove "15% Off Until Nov 30". Keep "Exam Included", "Live Online Classes"
   and "Exam Prep and Support".
4. **Every responsive search ad** in those campaigns:
   - Remove these headlines: "15% Off Until Nov 30", "15% Off Every SAFe Class", "15% Off AI-Native
     Courses", "Offer Ends Nov 30", and any "Black Friday…" headline.
   - Remove these descriptions: "15% off every public SAFe and AI-Native class…", "Any upcoming class
     date. The 15% discount…", "…15% off until Nov 30."
   - Unpin position 1 if "15% Off Until Nov 30" was pinned.
   - Every ad must keep at least 3 headlines and 2 descriptions.
5. Search the account (Ads → filter "Ad text contains `15%`", then `Black Friday`, then `Cyber`).
   The answer must be **0 ads**.

**Microsoft Ads** (same three campaigns, **by hand**):
6. Remove the promotion extensions, the two sitelinks, the "15% Off Until Nov 30" callout, and the
   same headlines and descriptions as above.
7. **Don't touch the tracking template or Final URL suffix.**

**Screenshot:** the "15%" ad search returning nothing in both accounts.

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

## TASK 3: GTM audit: DONE from the owner's screenshots (27 Nov)
| | **GTM-KNLG4JL5** | GTM-K9627QZB |
|---|---|---|
| Google's container quality | **Good** | **Urgent** (2 issues: usually "tag not found on the site") |
| Google tags | GA4 **G-9PD6PWS906** + GT-M6JL466, Google Ads **AW-17013571967** | AW-17013571967 only |
| Tags | Conversion Linker, GA4 Configuration, Google Tag AW, Google Ads Eventbrite Click Conversion, UET base, UET Eventbrite Click | Hotjar (3 yrs), Conversion Linker, Google Ads Eventbrite Click, UET base, UET Eventbrite Click, Microsoft Clarity |
| Last edits | 4-7 months ago | 2-3 years (Hotjar, linker), 5-7 months |

**Decision: use GTM-KNLG4JL5.** It's rated Good (Google sees it on the site), it carries your GA4
history, and it already has the Conversion Linker and UET base. **Keep GTM-K9627QZB off.** The GTM4WP
plugin output must stay OFF; switching it on would load a second copy of the Eventbrite and UET tags
and double-count. If you want Microsoft Clarity, recreate it in KNLG4JL5.

**Confirm in 1 minute:** install Google **Tag Assistant**, open agile-agilist.com, and check that
**exactly one** container is shown and that it's KNLG4JL5. Send a screenshot.

Flagged for the cut-over (Task 7): **Google Ads - Eventbrite Click Conversion** and **Microsoft Ads -
UET - Eventbrite Click**. Leave them running until then, so bidding keeps a signal. No Corsizio tag, no
/registration-confirmed/ tag and no name-in-URL tag were found.

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

## TASK 6: Build the tags in GTM-KNLG4JL5 (workspace + Preview only, about 15 min)
New workspace named `website-purchase`.

1. **Variables** (Data Layer Variable, version 2):
   - `DLV - ecommerce.value` → `ecommerce.value`
   - `DLV - ecommerce.transaction_id` → `ecommerce.transaction_id`
   - `DLV - ecommerce.currency` → `ecommerce.currency`
2. **Trigger:** Custom Event, event name **`purchase`** (exact), all custom events.
3. **Tags:**
   - Conversion Linker and the UET base tag **already exist**. Don't add new ones.
   - **Google Ads Conversion Tracking:**
     - Conversion ID and Label from Task 4.
     - Value = `{{DLV - ecommerce.value}}`, Transaction ID = `{{DLV - ecommerce.transaction_id}}`,
       Currency = `{{DLV - ecommerce.currency}}`.
     - Trigger: `purchase`.
   - **Microsoft UET custom event:**
     - Action `purchase`.
     - Revenue = `{{DLV - ecommerce.value}}`, currency = `{{DLV - ecommerce.currency}}`.
     - Trigger: `purchase`.
4. Don't pause the Eventbrite click tags yet. That happens in Task 7.
5. **Preview** on agile-agilist.com:
   - Ordinary page loads show the linker and the UET base tag, and **no** purchase tags.
6. **Don't Publish.** Screenshot the workspace changes list.

## TASK 7: Go live, same day (only after the web team's part is live)
**Web team (not Chrome), section 2 of `proposals/2026-11_website-conversion-tracking.md`:**
- Mark website Stripe payments with `metadata.origin = agile-agilist.com`.
- Push one `purchase` dataLayer event, server-verified, once per paid website checkout.
- Remove the name from the confirmation URL.
- **Leave GTM4WP output OFF.** KNLG4JL5 already loads on the site; don't add a second container.

**Then, with Claude in Chrome:**
1. **Test in GTM Preview:** a Stripe **test-mode** website purchase fires exactly **one** `purchase`.
   Reloading the confirmation page fires **none**. No name or email appears in any URL.
2. In the workspace, **pause** "Google Ads - Eventbrite Click Conversion" and "Microsoft Ads - UET -
   Eventbrite Click". Then **Publish** (version name: `website purchase tracking`).
3. **Google Ads:** make **Website Purchase - Paid Registration** **Primary**. Set **Eventbrite Click -
   Register** and **Corsizio Registration - AI-Native** to **Secondary**.
4. **Microsoft Ads:** set **Website Purchase** to Include in "Conversions" = **Yes**. Untick it on the
   Eventbrite-click goal.
5. **Bidding: needs Mark's OK first.** Campaigns on Maximize Conversions move to **Maximize Clicks with
   a max CPC cap**, until each one has 15 website purchases in 30 days (your smart-bidding rule).
6. Tell Claude. The daily agent then checks Stripe payments against Google's count every day.
