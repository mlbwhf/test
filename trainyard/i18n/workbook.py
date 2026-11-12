"""Moves a language catalogue to and from a spreadsheet, for review in Excel or Google Sheets.

  python3 i18n/workbook.py export fr-CA     # i18n/fr-CA.json -> i18n/Trainyard-fr-CA.xlsx
  python3 i18n/workbook.py import fr-CA     # your edited i18n/Trainyard-fr-CA.xlsx -> i18n/fr-CA.json

On import, rows are matched by the English text. Status "Approved" or "Changed" marks the French as
approved; "Rejected" clears it so it shows as new; anything else keeps it as a draft. The Glossary
sheet is written back to glossary-<lang>.tsv. Needs openpyxl (pip install openpyxl).
"""
import csv, json, os, sys
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

HERE = os.path.dirname(os.path.abspath(__file__))
SHEETS = [("1", "Phase 1 · class"), ("2", "Phase 2 · app"), ("3", "Phase 3 · website & legal"), ("course", "Course content")]
COLS = ["#", "English", "Translation", "Note", "Status", "Where (file:line)"]
STATUS_OUT = {"draft": "To review", "approved": "Approved", "new": "Not translated", "course": "Scaled Agile", "stale": "No longer used"}


def export(lang):
    cat = json.load(open(os.path.join(HERE, f"{lang}.json"), encoding="utf-8"))
    wb = Workbook()
    rm = wb.active
    rm.title = "Read me"
    for line in [
        [f"Trainyard · translation workbook ({lang})"], [""],
        ["How to review", "Edit the Translation column. Set Status to Approved, Changed or Rejected. Yellow rows carry a note that needs a decision."],
        ["How to send back", "Upload this file to the i18n folder on GitHub (Add file → Upload files), replacing it, and ask for an import; or send it back by email."],
        ["Phases", "1 = what a class sees · 2 = the rest of the app · 3 = public website and legal pages · Course content = Scaled Agile wording."],
        ["Glossary", "SAFe terms used everywhere. Change a term on the Glossary sheet and it is applied on import."],
        ["Placeholders", "{0}, {1}… are filled in by the app: keep them, in any order."],
    ]:
        rm.append(line)
    rm["A1"].font = Font(bold=True, size=14)
    rm.column_dimensions["A"].width = 18
    rm.column_dimensions["B"].width = 120
    head, fill, wrap, note = Font(bold=True, color="FFFFFF"), PatternFill("solid", fgColor="14123A"), Alignment(wrap_text=True, vertical="top"), PatternFill("solid", fgColor="FFF4C2")
    g = wb.create_sheet("Glossary")
    gpath = os.path.join(HERE, f"glossary-{lang}.tsv")
    if os.path.exists(gpath):
        with open(gpath, encoding="utf-8") as f:
            for r in csv.reader(f, delimiter="\t"):
                g.append(r)
        for c in g[1]:
            c.font, c.fill = head, fill
        for col, w in zip("ABCDE", [42, 44, 40, 18, 60]):
            g.column_dimensions[col].width = w
        g.freeze_panes = "A2"
    for key, name in SHEETS:
        ws = wb.create_sheet(name)
        ws.append(COLS)
        for c in ws[1]:
            c.font, c.fill = head, fill
        n = 0
        for en, e in cat.items():
            if e.get("phase") != key or e.get("status") == "stale":
                continue
            n += 1
            ws.append([n, en, e.get("fr", ""), e.get("note", ""), STATUS_OUT.get(e.get("status"), e.get("status")), e.get("where", "")])
            if e.get("note"):
                for c in ws[ws.max_row]:
                    c.fill = note
        for col, w in zip("ABCDEF", [7, 60, 60, 36, 14, 48]):
            ws.column_dimensions[col].width = w
        for r in ws.iter_rows(min_row=2):
            for c in r:
                c.alignment = wrap
        ws.freeze_panes = "C2"
        ws.auto_filter.ref = ws.dimensions
        dv = DataValidation(type="list", formula1='"To review,Approved,Changed,Rejected"', allow_blank=True)
        ws.add_data_validation(dv)
        dv.add(f"E2:E{max(2, ws.max_row)}")
    out = os.path.join(HERE, f"Trainyard-{lang}.xlsx")
    wb.save(out)
    print("wrote", out)


def import_(lang):
    path = os.path.join(HERE, f"{lang}.json")
    cat = json.load(open(path, encoding="utf-8"))
    wb = load_workbook(os.path.join(HERE, f"Trainyard-{lang}.xlsx"), read_only=True)
    counts = {"approved": 0, "rejected": 0, "edited": 0, "unknown": 0}
    for _, name in SHEETS:
        if name not in wb.sheetnames:
            continue
        rows = wb[name].iter_rows(values_only=True)
        hdr = [str(h or "") for h in next(rows)]
        ie, it, ist = hdr.index("English"), hdr.index("Translation") if "Translation" in hdr else hdr.index("French (draft)"), hdr.index("Status")
        for r in rows:
            en, tr, st = (r[ie] or ""), (r[it] or ""), str(r[ist] or "")
            if not en or en not in cat:
                counts["unknown"] += bool(en)
                continue
            e = cat[en]
            if st in ("Approved", "Changed"):
                e["fr"], e["status"] = str(tr), "approved"
                counts["approved"] += 1
            elif st == "Rejected":
                e["fr"], e["status"] = "", "new"
                counts["rejected"] += 1
            elif tr and str(tr) != e.get("fr"):
                e["fr"], e["status"] = str(tr), "draft"
                counts["edited"] += 1
    if "Glossary" in wb.sheetnames:
        with open(os.path.join(HERE, f"glossary-{lang}.tsv"), "w", encoding="utf-8", newline="") as f:
            w = csv.writer(f, delimiter="\t", lineterminator="\n")
            for r in wb["Glossary"].iter_rows(values_only=True):
                if any(r):
                    w.writerow(["" if x is None else str(x) for x in r[:5]])
    json.dump(cat, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{lang}:", counts)


if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] not in ("export", "import"):
        sys.exit(__doc__)
    (export if sys.argv[1] == "export" else import_)(sys.argv[2])
