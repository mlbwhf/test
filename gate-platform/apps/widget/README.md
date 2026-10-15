# @gate/widget

Embeddable schedule-and-checkout widget. A training provider drops two lines of HTML on a course page and
gets the live cohort schedule, ticket prices in the visitor's chosen currency, a checkout form and
payment (Stripe Payment Element) without any server-side integration.

Vanilla TypeScript, no framework, one minified IIFE bundle (`dist/gate-widget.js`, well under 40 KB).

## Embed snippet

```html
<div data-gate-widget
     data-gate-api="https://api.gate.example"
     data-gate-org="org_123"
     data-gate-course="leading-safe"
     data-gate-currency="CAD"
     data-gate-stripe-pk="pk_test_..."></div>
<script src="https://api.gate.example/widget/v1/gate-widget.js" async></script>
```

The script mounts into every `[data-gate-widget]` element it finds, both when it runs and again on
`DOMContentLoaded` (in case it was loaded early). Elements are initialised once (`data-gate-mounted="1"`),
so the script can safely be included more than once or re-run via `window.GateWidget.init()` after
inserting elements dynamically (e.g. in an SPA). `window.GateWidget.mount(element, options)` mounts a
single element programmatically.

### Attributes

| Attribute              | Required | Meaning                                                                                            |
| ---------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `data-gate-api`        | yes      | Base URL of the public API (no trailing path), e.g. `https://api.gate.example`.                     |
| `data-gate-org`        | yes      | Organization id (`org_...`).                                                                        |
| `data-gate-course`     | yes      | Course slug as shown in the dashboard, e.g. `leading-safe`.                                         |
| `data-gate-currency`   | no       | Preferred display/checkout currency (ISO 4217). Used when at least one ticket type is priced in it; otherwise the organization's currency, then the first available one. |
| `data-gate-stripe-pk`  | no       | Stripe publishable key. When set, payment is taken with a Stripe Payment Element (Stripe.js is loaded from `https://js.stripe.com/v3/` on demand). When omitted and the API returns a client secret, the widget shows a **Simulate payment (test mode)** button that calls the dev-only `POST /public/v1/dev/payments/{paymentRef}/succeed` endpoint. Never omit it on a production page. |

### What the visitor sees

1. **Schedule** – course name, one card per cohort (date range in the cohort's own time zone with the zone
   abbreviation, format badge, session count) and one row per ticket type with the price in the selected
   currency, an "Early bird until …" badge, "N left" when 5 or fewer remain and a disabled "Sold out" state.
   A currency selector lists the union of all currencies the ticket types are priced in.
2. **Checkout** – seats (1 to `min(10, remaining)`), buyer email, one attendee block per seat (email required,
   name and company optional; the first attendee follows the buyer email while "Same as buyer" is ticked)
   and a live price summary taken from a `dryRun: true` order (debounced 300 ms). A "Service fee" line is
   shown only when `attendeeFeeMinor > 0`.
3. **Payment** – Stripe Payment Element and a Pay button, or the test-mode button. The widget then polls the
   order every 1.5 s for up to 20 s ("Confirming…") until it is `paid`. Free orders (`totalMinor` 0) skip
   payment entirely.
4. **Success** – "You're registered", order id, cohort name and dates, the per-seat attendee list and a note
   that confirmation emails with calendar invites are on their way.

API errors (`{ error: { code, message, hint } }`) are rendered inline with the hint when present; a network
failure shows "Can't reach the registration service".

### Styling and accessibility

All CSS is injected once into `<style id="gate-widget-css">`; every class is prefixed `gw-`, so host-page
styles are left alone and vice versa. The widget follows `prefers-color-scheme` (light and dark), reflows
at phone widths, uses real `<button>`s and `<label>`s, and announces status changes through an
`aria-live` region. To match brand colours, override the custom properties on `.gw-root`
(`--gw-accent`, `--gw-bg`, `--gw-fg`, `--gw-border`, …) from the host page's stylesheet.

## WordPress

Add a **Custom HTML** block (block editor: `/html`) to the course page and paste the embed snippet into it.
Classic editor: switch the editor to the *Text* tab before pasting so WordPress does not rewrite the markup.
If your site strips `<script>` tags for the account you're editing with (typical on multisite or for
non-administrator roles), paste only the `<div data-gate-widget …>` into the block and enqueue the script once
site-wide, for example from your theme's `functions.php`:

```php
add_action('wp_enqueue_scripts', function () {
  wp_enqueue_script('gate-widget', 'https://api.gate.example/widget/v1/gate-widget.js', [], null, ['strategy' => 'async']);
});
```

Page caching plugins are fine: the widget fetches live schedule data from the API on every page view.

## Development

```sh
pnpm --filter @gate/widget typecheck   # tsc, strict, DOM lib only
pnpm --filter @gate/widget test        # vitest + jsdom, mocked fetch
pnpm --filter @gate/widget build       # esbuild -> dist/gate-widget.js (fails if > 40 KB)
```

Source layout: `src/index.ts` (auto-mount), `src/widget.ts` (UI flow), `src/api.ts` (typed client),
`src/format.ts` (pure money/date/currency helpers), `src/styles.ts` (CSS). Serve `dist/gate-widget.js`
from the API at `/widget/v1/gate-widget.js` with CORS enabled on `/public/v1/*`.
