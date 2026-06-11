# Translations

Community translations of the Mutation Readiness Framework are welcome and
gratefully credited.

## What to translate (in priority order)

1. `reference/framework-guide-v1.0.md` — the canonical guide
2. `assessments/mutation-readiness-scorecard.md` — the core instrument
3. The templates in `templates/`
4. Case studies in `examples/`

## How to contribute a translation

1. **Open an issue first** titled `Translation: <language>` so efforts
   don't collide. We'll confirm no one else is mid-flight on the same
   language.
2. Create a subdirectory named with the BCP 47 language code:
   `translations/de/`, `translations/pt-BR/`, `translations/ja/`, …
3. Mirror the source file paths inside it, e.g.
   `translations/de/reference/framework-guide-v1.0.md`.
4. Add a header block to each translated file noting: source file, source
   version (e.g. `v1.0`), translator credit, and date.
5. Open a pull request. A second speaker of the language will be asked to
   review; if none is available, the PR may wait — accuracy beats speed.

## Rules

- **Translate meaning, not just words.** Scorecard questions must keep
  their diagnostic force; where a literal translation reads as ambiguous,
  prefer a natural phrasing and add a translator's note.
- **Never change the numbers.** Scoring math, band thresholds, question
  counts, and question IDs (SD1…LP3) stay identical in every language —
  tools depend on them.
- **Track the version you translated.** When the English source moves to a
  new version, an issue will be opened per language; translations carry a
  banner marking them outdated until updated.
- Translations are licensed under the same terms as the source
  (CC BY-SA 4.0 for documents).

## Status

| Language | Guide | Scorecard | Templates | Maintainer |
|---|---|---|---|---|
| *(none yet — be the first)* | | | | |
