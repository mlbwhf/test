# Translations

English stays in the code as the one source. Every other language is a catalogue here, keyed by the
English text, so a fix to a template or a course never means recreating anything: change the English
in the code, run the two commands below, and the changed text shows up as `new` to translate.

```bash
node i18n/extract.cjs . i18n/labels.json   # every user-visible English text, with file:line and phase
node i18n/sync.cjs fr-CA                   # update fr-CA.json: keep translations, add new texts, mark removed ones stale
node i18n/sync.cjs fr-CA --check              # fails when texts are waiting for a translation (for CI)
```

- `fr-CA.json` — French (Quebec). `{ "<English>": { fr, status, phase, where, note? } }`. Status: `draft` (machine first pass),
  `approved`, `new` (no French yet), `stale` (no longer in the code; kept for reuse), `course` (Scaled Agile wording).
- `glossary-fr-CA.tsv` — SAFe terms: official SAFe French (fr-ca) glossary, with the choices made for SAFe 6 renames.
- `style-fr-CA.md` — tone and typography rules every translation follows.
- Phases: 1 = what a class sees; 2 = the rest of the app; 3 = public website and legal; course = lesson text.

## Reviewing in a spreadsheet

`Trainyard-fr-CA.xlsx` is the catalogue as a workbook. Download it, edit the Translation column and set
Status (Approved, Changed, Rejected), then upload it back here (Add file → Upload files, same name).
`python3 i18n/workbook.py import fr-CA` applies it, glossary included; `export` rebuilds the workbook.
A new language starts with `node i18n/sync.cjs <lang>` (e.g. `es`, `de`) and then `export <lang>`.

Not yet wired into the screens: the next step reads these catalogues at display time, per class language.
