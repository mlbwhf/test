# Agile Agilist — ASPC / SPC Live-Page Fixes (paste-ready)

_WPCOM MCP authoring is fully disabled for agile-agilist.com (every pages.*/posts.* operation off in MCP settings), so these are paste-ready native-Gutenberg blocks for the wp-admin Code editor. Adapted from the supplied JSX `<Sequence>/<Step>` markup into native blocks per site rule "native Gutenberg only." Salary data wrapped in the green clarifier banner per handover §5._

> ⚠️ **NOT verified against the live page** — MCP read access is disabled, so I could not confirm the exact current markup of page 1835. Before pasting, open the page and confirm the broken timeline block ("This is timeline description. Please click here to change this description.") is the section you're replacing.

> 🔒 **Slug/URL changes held for your approval** — Action 3 (the `/safe-for-harware/` typo + dedupe, blog folder consolidation) is NOT included here because it changes URLs. See "Ask-first items" at the bottom.

---

## Action 1 — ASPC page (ID 1835, `/training/adv-safe/aspc/`)
**Placement:** Replace the broken default-theme timeline section (the "Please click here to change this description" placeholder) with the blocks below.

```html
<!-- wp:heading -->
<h2>The Advanced SPC (ASPC) Certification Journey</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3>1. Advanced SPC Onboarding &mdash; Immediate Access</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Gain entry to the SAFe&reg; Studio Community. Complete the prerequisite self-learning modules on "Writing Effective OKRs" and review the core transformation case studies.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>2. Immersive 4-Day Learning Arc &mdash; Live SPCT-Led Instruction</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Participate in the live, interactive simulation. Master executive coaching facilitation, advanced portfolio flow engineering, and tactical framework customization.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>3. The Capstone Learning Lab &mdash; Day 4 Group Practical</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Apply the entire 4-day curriculum to a complex, simulated enterprise transformation challenge, integrating AI forecasting metrics and organizational change mechanics.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>4. Certification Examination &mdash; 60-Minute Web-Based Exam</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Take the official closed-book, web-based ASPC exam. Achieve a passing score of 75% (23 out of 30 questions) to unlock your advanced credential.</p>
<!-- /wp:paragraph -->
```

---

## Action 2 — SPC vs ASPC comparison table
**Placement:** Inject into the middle section of BOTH the SPC page (ID 24776) and the ASPC page (ID 1835).
**Note:** The compensation row is wrapped with the green clarifier banner first (handover §5 — customers were misreading wages as course price).

```html
<!-- wp:heading -->
<h2>Strategic Comparison: SAFe&reg; Practice Consultant (SPC) vs Advanced SPC (ASPC)</h2>
<!-- /wp:heading -->

<!-- wp:group {"style":{"color":{"background":"#dcfce7"},"border":{"left":{"color":"#65a30d","width":"4px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group has-background" style="border-left-color:#65a30d;border-left-width:4px;background-color:#dcfce7">
<!-- wp:paragraph -->
<p><strong>About the compensation figures:</strong> The salary ranges in the final row reflect typical <em>market compensation</em> earned by certified professionals across major enterprise hubs &mdash; they are <strong>not</strong> the price of this course or certification. For Agile Agilist tuition, see the enrollment section.</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Core Focus Area</th><th>SAFe&reg; Practice Consultant (SPC)</th><th>Advanced SPC (ASPC)</th></tr></thead><tbody><tr><td>Operational Layer</td><td>Agile Release Train (ART) &amp; Teams</td><td>Multi-Train Value Streams &amp; Lean Portfolios</td></tr><tr><td>Primary Mission</td><td>Launching ARTs, establishing LACE, running standard classes</td><td>Executive advising, custom framework architecture, systems flow</td></tr><tr><td>AI Integration</td><td>Guiding teams on local AI tooling usage</td><td>Engineering AI-driven portfolio forecasting &amp; flow metrics</td></tr><tr><td>Instructional Scope</td><td>Authorized to teach foundational SAFe courses (e.g., Leading SAFe)</td><td>Authorized to teach advanced leadership tracks (e.g., LPM, ASPC)</td></tr><tr><td>Market Value (Compensation)</td><td>$95,000&ndash;$140,000+ across major enterprise hubs</td><td>$120,000&ndash;$160,000+ (top-tier advisory rates)</td></tr></tbody></table></figure>
<!-- /wp:table -->
```

---

## Action 3 — Technical SEO (JSON-LD) — content portion only
The LPM Course schema. JSON-LD normally belongs in the page `<head>` (AIOSEO → page → Schema, or a header-injection plugin), NOT in the post body — so this is a webmaster/AIOSEO task, not a Gutenberg paste. Provided for reference:

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "SAFe® Lean Portfolio Management (LPM) Certification",
  "description": "Align strategy with execution using Lean Budgeting, Agile Portfolio Operations, and Lean Governance.",
  "provider": {
    "@type": "EducationalOrganization",
    "name": "Agile Agilist",
    "sameAs": "https://agile-agilist.com"
  }
}
```
_Note: I dropped the `"financialAidEligible": "Group discounts available"` field — `financialAidEligible` expects a definedTerm/boolean, and a free-text marketing phrase there is invalid schema that can trip Google's Rich Results validator. Put "group discounts" in the human-readable copy instead._

---

## 🔒 Ask-first items (URL/slug changes — NOT done)
1. **`/training/safe-industry/safe-for-harware/` duplicate ASPC content** — remove the duplicated ASPC text, and either (a) rewrite that page with real SAFe-for-Hardware content, or (b) redirect it. Also the slug typo `harware` → `hardware`. **All of this changes URLs → needs your go-ahead, and a 301 redirect plan so existing links don't 404.**
2. **Blog consolidation** — moving technical posts from `/blog-post-agile-agilist/` into `/blogs/` and recategorizing from "Uncategorized". **Changes post URLs → needs your go-ahead + 301 redirects.**
