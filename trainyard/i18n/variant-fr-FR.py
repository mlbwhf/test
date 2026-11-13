"""Fills French (France) from French (Quebec): every text that has no fr-FR translation yet takes
the fr-CA one, converted to France conventions. Texts already translated or approved in fr-FR are
left alone.   python3 i18n/variant-fr-FR.py     (from the trainyard folder, after sync.cjs fr-FR)"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
NN = " "
SWAPS = [
    (r"\bde courriels\b", "d’e-mails"), (r"\bde courriel\b", "d’e-mail"), (r"\ble courriel\b", "l’e-mail"), (r"\bLe courriel\b", "L’e-mail"),
    (r"\bcourriels\b", "e-mails"), (r"\bCourriels\b", "E-mails"), (r"\bcourriel\b", "e-mail"), (r"\bCourriel\b", "E-mail"), (r"\bCOURRIEL\b", "E-MAIL"),
    (r"^Stationnement$", "Parking"), (r"\bfin de semaine\b", "week-end"),
    (r"agilité d[’']affaires", "agilité métier"), (r"Agilité d[’']affaires", "Agilité métier"), (r"AGILITÉ D[’']AFFAIRES", "AGILITÉ MÉTIER"),
    (r"valeur d[’']affaires", "valeur métier"), (r"Valeur d[’']affaires", "Valeur métier"), (r"VALEUR D[’']AFFAIRES", "VALEUR MÉTIER"),
    (r"dossier d[’']affaires", "business case"), (r"Dossier d[’']affaires", "Business case"), (r"DOSSIER D[’']AFFAIRES", "BUSINESS CASE"),
    (r"[Rr]esponsables d[’']affaires", "Business Owners"), (r"[Rr]esponsable d[’']affaires", "Business Owner"),
    (r"RESPONSABLES D[’']AFFAIRES", "BUSINESS OWNERS"), (r"RESPONSABLE D[’']AFFAIRES", "BUSINESS OWNER"),
]


def france(t):
    t = re.sub(r"(?<=\S)([;!?])(?=\s|$|[»\"”)])", NN + r"\1", t)  # narrow non-breaking space before ; ! ?
    t = re.sub(r"(&[a-z]+|&#\d+)" + NN + ";", r"\1;", t)  # not inside HTML entities
    for a, b in SWAPS:
        t = re.sub(a, b, t)
    return t


ca = json.load(open(os.path.join(HERE, "fr-CA.json"), encoding="utf-8"))
path = os.path.join(HERE, "fr-FR.json")
fr = json.load(open(path, encoding="utf-8"))
n = 0
for en, e in fr.items():
    src = ca.get(en)
    if e.get("fr") or not src or not src.get("fr"):
        continue
    e["fr"], e["status"] = france(src["fr"]), "draft"
    if src.get("note"):
        e["note"] = src["note"]
    n += 1
json.dump(fr, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"fr-FR: {n} texts filled from fr-CA")
