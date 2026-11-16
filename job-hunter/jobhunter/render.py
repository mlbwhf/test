"""Write a tailored resume as HTML, DOCX and (when a Chrome binary is available) PDF."""
import os
import shutil
import subprocess
import zipfile
from html import escape
from xml.sax.saxutils import escape as xesc

RESUME_CSS = """
@page { size: A4; margin: 16mm 17mm; }
* { box-sizing: border-box; }
body { font: 10.5pt/1.42 Calibri, "Segoe UI", Arial, sans-serif; color: #1c2430; max-width: 780px; margin: 24px auto; padding: 0 20px; }
h1 { font-size: 22pt; margin: 0; letter-spacing: .2px; }
.headline { font-size: 12pt; color: #1f4e79; font-weight: 600; margin: 2px 0 4px; }
.contact { font-size: 9.5pt; color: #46505c; }
h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 1px; color: #1f4e79; border-bottom: 1px solid #b9c4d0; margin: 14px 0 6px; padding-bottom: 2px; }
p { margin: 0 0 6px; }
.role { margin-bottom: 9px; break-inside: avoid; }
.role-head { display: flex; justify-content: space-between; gap: 12px; font-weight: 600; }
.role-sub { color: #46505c; font-size: 9.5pt; }
ul { margin: 3px 0 0; padding-left: 17px; }
li { margin-bottom: 2px; }
@media print { body { margin: 0; padding: 0; max-width: none; } }
"""


def _contact_line(contact):
    keys = ("location", "phone", "email", "linkedin", "website")
    return [str(contact[k]) for k in keys if contact.get(k)]


def _personal(view):
    """Optional personal details line (nationality, visa status...) used by some regional versions."""
    items = view.get("personal") or []
    if isinstance(items, dict):
        items = [f"{k}: {v}" for k, v in items.items() if v]
    return " | ".join(str(i) for i in items)


def _line(entry):
    if isinstance(entry, str):
        return entry
    return " - ".join(str(v) for v in entry.values() if v)


def resume_html(view):
    c = view["contact"]
    out = ["<!doctype html><html lang='en'><head><meta charset='utf-8'>",
           f"<title>{escape(c.get('name', 'Resume'))} - Resume</title><style>{RESUME_CSS}</style></head><body>",
           f"<h1>{escape(c.get('name', ''))}</h1>",
           f"<div class='headline'>{escape(view['headline'])}</div>",
           f"<div class='contact'>{escape(' | '.join(_contact_line(c)))}</div>"]
    if _personal(view):
        out.append(f"<div class='contact'>{escape(_personal(view))}</div>")
    if view["summary"]:
        out.append(f"<h2>Profile</h2><p>{escape(view['summary'])}</p>")
    if view["skills"]:
        out.append(f"<h2>Core Skills</h2><p>{escape(' | '.join(view['skills']))}</p>")
    if view["experience"]:
        out.append("<h2>Experience</h2>")
        for role in view["experience"]:
            dates = " - ".join(str(x) for x in (role.get("start"), role.get("end")) if x)
            sub = " | ".join(str(x) for x in (role.get("company"), role.get("location")) if x)
            out.append(f"<div class='role'><div class='role-head'><span>{escape(role.get('title', ''))}</span>"
                       f"<span>{escape(dates)}</span></div><div class='role-sub'>{escape(sub)}</div><ul>"
                       + "".join(f"<li>{escape(b)}</li>" for b in role["bullets"]) + "</ul></div>")
    for heading, key in (("Certifications", "certifications"), ("Education", "education"), ("Languages", "languages")):
        if view.get(key):
            out.append(f"<h2>{heading}</h2><ul>" + "".join(f"<li>{escape(_line(e))}</li>" for e in view[key]) + "</ul>")
    out.append("</body></html>")
    return "".join(out)


def _p(text, *, bold=False, size=21, color=None, after=60, indent=0, caps=False):
    props = f"<w:sz w:val='{size}'/>" + ("<w:b/>" if bold else "") + (f"<w:color w:val='{color}'/>" if color else "") \
        + ("<w:caps/>" if caps else "") + "<w:rFonts w:ascii='Calibri' w:hAnsi='Calibri'/>"
    ind = f"<w:ind w:left='{indent}' w:hanging='{180 if indent else 0}'/>" if indent else ""
    return (f"<w:p><w:pPr><w:spacing w:after='{after}'/>{ind}</w:pPr>"
            f"<w:r><w:rPr>{props}</w:rPr><w:t xml:space='preserve'>{xesc(text)}</w:t></w:r></w:p>")


def resume_docx(view, path):
    """A minimal, ATS-readable .docx built with the standard library."""
    c = view["contact"]
    body = [_p(c.get("name", ""), bold=True, size=40, after=0),
            _p(view["headline"], bold=True, size=24, color="1F4E79", after=20),
            _p(" | ".join(_contact_line(c)), size=19, color="46505C", after=20 if _personal(view) else 160)]
    if _personal(view):
        body.append(_p(_personal(view), size=19, color="46505C", after=160))

    def heading(text):
        body.append(_p(text, bold=True, size=22, color="1F4E79", after=60, caps=True))

    if view["summary"]:
        heading("Profile")
        body.append(_p(view["summary"], after=140))
    if view["skills"]:
        heading("Core Skills")
        body.append(_p(" | ".join(view["skills"]), after=140))
    if view["experience"]:
        heading("Experience")
        for role in view["experience"]:
            dates = " - ".join(str(x) for x in (role.get("start"), role.get("end")) if x)
            body.append(_p(f"{role.get('title', '')}   ({dates})" if dates else role.get("title", ""), bold=True, after=0))
            sub = " | ".join(str(x) for x in (role.get("company"), role.get("location")) if x)
            body.append(_p(sub, size=19, color="46505C", after=40))
            for i, bullet in enumerate(role["bullets"]):
                body.append(_p("• " + bullet, indent=260, after=120 if i == len(role["bullets"]) - 1 else 30))
    for title, key in (("Certifications", "certifications"), ("Education", "education"), ("Languages", "languages")):
        if view.get(key):
            heading(title)
            for entry in view[key]:
                body.append(_p("• " + _line(entry), indent=260, after=30))
    ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    document = (f"<?xml version='1.0' encoding='UTF-8' standalone='yes'?><w:document xmlns:w='{ns}'><w:body>"
                + "".join(body)
                + "<w:sectPr><w:pgSz w:w='11906' w:h='16838'/><w:pgMar w:top='1000' w:right='1080' w:bottom='1000' "
                  "w:left='1080' w:header='500' w:footer='500' w:gutter='0'/></w:sectPr></w:body></w:document>")
    types = ("<?xml version='1.0' encoding='UTF-8'?><Types xmlns='http://schemas.openxmlformats.org/package/2006/content-types'>"
             "<Default Extension='rels' ContentType='application/vnd.openxmlformats-package.relationships+xml'/>"
             "<Default Extension='xml' ContentType='application/xml'/>"
             "<Override PartName='/word/document.xml' ContentType='application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'/></Types>")
    rels = ("<?xml version='1.0' encoding='UTF-8'?><Relationships xmlns='http://schemas.openxmlformats.org/package/2006/relationships'>"
            "<Relationship Id='rId1' Type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument' Target='word/document.xml'/></Relationships>")
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", types)
        z.writestr("_rels/.rels", rels)
        z.writestr("word/document.xml", document)


def find_chrome():
    if os.environ.get("CHROME_BIN"):
        return os.environ["CHROME_BIN"]
    for name in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome"):
        found = shutil.which(name)
        if found:
            return found
    for path in ("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                 "/Applications/Chromium.app/Contents/MacOS/Chromium",
                 r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                 r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"):
        if os.path.exists(path):
            return path
    return None


def html_to_pdf(chrome, html_path, pdf_path):
    """Print an HTML file to PDF with headless Chrome. Returns True on success."""
    try:
        subprocess.run([chrome, "--headless=new", "--no-sandbox", "--disable-gpu", "--no-pdf-header-footer",
                        f"--print-to-pdf={pdf_path}", "file://" + os.path.abspath(html_path)],
                       check=True, capture_output=True, timeout=60)
    except (subprocess.SubprocessError, OSError):
        return False
    return os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0
