# FLOW.md — select classes, select dates, register or compare

Reference design: `reference/Course Selection Flow.dc.html` (interactive). Data: `data/training-menu.json` (`cohorts`, `price`, `prerequisites`, `bestFor`, `who`, `format`, `exam`).

## 1. Entry
From the menu's shortlist button ("Pick a date"), go to `/training/select/?classes=devops,sp` in the same tab. Class ids only. With one class, the button instead goes to that course page `#register`. The flow also opens from any "Register" CTA with `?classes=<id>`.

## 2. Steps (progress bar is clickable for completed steps)
**Step 1 — Classes.** Grid of class cards (checkbox semantics: `role="checkbox"`, `aria-checked`). Card: name, who it's for, code, length, next date, per-seat price. Continue disabled with none selected. Label: "Choose dates (n)".

**Step 2 — Dates.** One block per chosen class. Cohort cards in a horizontally scrolling `radiogroup` (snap, 78% width on mobile so the next card peeks). Soonest non-full cohort preselected. Full cohorts are disabled, greyed and say "Full". Low seats show "n seats left" in warm text. Overlap rule: if two chosen cohorts overlap by date, show an alert on the later class and disable Continue. "Remove" drops a class (back to step 1 if it was the last).

**Step 3 — Decide.** Segmented tabs: Register | Compare (n). Default Register unless arrived from a compare link.
- *Register:* summary rows (class, date range, per-seat price), seat stepper (1–20, label "Seats per class"), primary "Continue to payment". (The design mock shows an email field; the implementation omits it, the course-page checkout collects email.) While pending: "Opening checkout…" with spinner, button replaced by a non-interactive busy element, `aria-busy`. Helper: total is confirmed at payment; link to Compare.
- *Compare:* table, one column per class, fixed label column. Rows: price per seat, length, your date, format, exam, prerequisites, best for. "Show differences only" checkbox (the "Your date" row always stays). Each column header has "Register this one" which switches to Register with only that class.

Bottom bar (all steps, sticky, safe-area aware): Back · one-line summary · Continue. Step 3 has no Continue; its action is inside the panel.

## 3. Refusals (copy)
- Overlap: "This overlaps <class>. Pick a different date for one of them." and, at submit, "Two classes overlap. Go back and change a date."
- Cohort filled meanwhile: "<range> just filled up. Choose another date." Return to step 2 with that class focused.
All in `role="alert"`, above the action button.

## 4. Copy (English; FR, ES, AR translated, labels under ~22 chars)
Steps: Classes · Dates · Register or compare. Buttons: Choose dates (n) · Review & decide · Register · Compare · Register this one · Continue to payment · Opening checkout… · Back · Remove · Clear. Helper: "Next: secure payment in this tab. Your total is confirmed there."

## 5. LLM and search requirements
- The flow is progressive enhancement. Every fact it uses must exist in plain HTML elsewhere:
  - Each course page lists its cohorts as a plain `<ul>` with `<time datetime>`, seats status text, and price per seat.
  - `/training/compare/` is a real `<table>` with `<th scope>` (see `html/compare-table.html`). JS only adds the diff toggle.
  - `/training-menu.txt` includes class, length, next date, URL. Extend it with price and cohort dates once real.
- `CourseInstance` JSON-LD per cohort on course pages (`startDate`, `endDate`, `courseMode`, `offers` with price).
- `/training/select/` is `noindex,follow` (state-dependent). The compare page is indexable.
- State lives in the URL as ids only (`classes`, `cohorts`) so it can be shared and restored. Never put email, seats, or price in the URL.

## 6. Checkout contract (assumption, confirm)
One Stripe checkout per class (existing two-step checkout on course pages). For several classes the flow sends the buyer through them in order, same tab, carrying `?cohort=<id>&seats=<n>`. The course page registration section opens with that cohort selected and shows the same seat number. A multi-class single payment is out of scope until the backend supports it.

## 7. Mobile
- 360 and 390px. Progress bar scrolls sideways, current step first. Cards single column. Date cards snap-scroll. Compare table scrolls sideways with sticky label column (116px). Bottom bar always visible; Continue 48px high.
- Email field: `type="email"`, `inputmode="email"`, `autocomplete="email"`, 16px text.
- No horizontal page scroll. Test with the iOS keyboard open: bottom bar must not cover the field or alert.

## 8. Accessibility
Progress nav uses `aria-current="step"`. Date groups are `radiogroup` with the class name as label. Announce selection changes in a polite live region. Focus moves to the step heading on step change. Escape closes any open sheet.

## 9. Analytics (no personal data)
Events: flow_open, classes_selected (ids), dates_selected (cohort ids), mode_register, mode_compare, refusal (type), checkout_start. Never include email.
