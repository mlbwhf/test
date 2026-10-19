"""Build the SEO pack for twochasms.com: per-page meta table and JSON-LD blocks (length-checked)."""
import json
D = "https://twochasms.com"
PAGES = [
    ("/", "The Two Chasms Framework — Sense the shift early",
     "Moore found one chasm; teams fall into a second. Five states, two chasms, and a free assessment that shows where your team stands and which leap comes next."),
    ("/assess/", "Where's your team? Two Chasms assessment (free)",
     "Answer 22 statements as a team. Find the state you're in, the one beneath you that isn't holding, and the workshop that gets you across. Free, about 12 minutes."),
    ("/maturity/", "Five-state maturity assessment | Two Chasms",
     "Score Reflex, Playground, Signal Sensing, Immune and Mutation from Blind to Self-mutating. 25 statements; your weakest state names your next workshop."),
    ("/workshops/", "Fourteen workshops, one per leap | Two Chasms",
     "Workshops grouped by the five states, with free guides for the Innovation Matrix, Signal Mapping and IMMUNE / SignalNet. Certification in three tiers."),
    ("/books/", "The Innovation Playground & The Mutation Age | Two Chasms",
     "The two books behind the Two Chasms Framework by Mark Saymen: a business novel in two books, and the theory with the instruments to measure where you stand."),
    ("/cast/", "The cast: roles you already work with | Two Chasms",
     "Eight roles from The Innovation Playground — the sponsor who chooses, the signal reader, the builder who sees too late — tagged by the state they live in."),
]
rows = ["| URL | SEO title (chars) | Meta description (chars) |", "|---|---|---|"]
for p, t, d in PAGES:
    assert len(t) <= 60, (t, len(t)); assert 120 <= len(d) <= 160, (d, len(d))
    rows.append(f"| `{p}` | {t} ({len(t)}) | {d} ({len(d)}) |")
SITE = {"@context": "https://schema.org", "@graph": [
    {"@type": "WebSite", "@id": D + "/#website", "url": D + "/", "name": "The Two Chasms Framework", "alternateName": "Two Chasms",
     "inLanguage": "en", "publisher": {"@id": D + "/#org"}},
    {"@type": "Organization", "@id": D + "/#org", "name": "Agile Agilist Inc.", "url": "https://agile-agilist.com/",
     "logo": "https://agile-agilist.com/wp-content/uploads/2025/08/AA-SAFe-Brand-Color-minin.png",
     "address": {"@type": "PostalAddress", "addressLocality": "Toronto", "addressRegion": "ON", "addressCountry": "CA"},
     "sameAs": ["https://agile-agilist.com/", "https://www.linkedin.com/company/agile-agilist"]},
    {"@type": "Person", "@id": D + "/#mark", "name": "Mark Saymen", "worksFor": {"@id": D + "/#org"}}]}
BOOKS = {"@context": "https://schema.org", "@graph": [
    {"@type": "Book", "name": "The Innovation Playground", "author": {"@id": D + "/#mark"}, "publisher": {"@id": D + "/#org"},
     "genre": "Business fiction", "inLanguage": "en", "url": D + "/books/",
     "description": "A business novel in two books. Book One, The Playground: crossing the first chasm, control to trust. Book Two, SIGNAL: the second chasm, metrics to signals."},
    {"@type": "Book", "name": "The Mutation Age", "author": {"@id": D + "/#mark"}, "publisher": {"@id": D + "/#org"},
     "genre": "Business", "inLanguage": "en", "url": D + "/books/",
     "description": "The theory behind the Two Chasms Framework: the Seven Stagnation Signals, the Six Vitality Signals, the Five Levers of Reinvention and the Mutation Readiness Index."}]}
tag = lambda o: '<script type="application/ld+json">' + json.dumps(o, ensure_ascii=False, separators=(",", ":")) + "</script>\n"
open("schema-site.html", "w").write(tag(SITE))
open("schema-books.html", "w").write(tag(BOOKS))
open("meta_table.md", "w").write("\n".join(rows) + "\n")
print("\n".join(rows))
