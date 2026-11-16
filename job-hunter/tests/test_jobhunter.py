import json
import os
import sys
import tempfile
import unittest
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from jobhunter import __main__ as cli, match, render, sources, tailor, util  # noqa: E402
from datetime import date  # noqa: E402

TODAY = date(2026, 11, 16)


def read_rows(tmp):
    with open(os.path.join(tmp, "out", "jobs.json"), encoding="utf-8") as fh:
        return json.load(fh)


def load(*parts):
    with open(os.path.join(ROOT, *parts), encoding="utf-8") as fh:
        return json.load(fh)


CONFIG = load("config.json")
RESUME = load("resume.example.json")
JOBS = load("tests", "sample_jobs.json")


class MatchTests(unittest.TestCase):
    def test_locations_use_whole_words(self):
        self.assertEqual(match.country_of("Muscat, Oman", "", CONFIG), "Oman")
        self.assertIsNone(match.country_of("A woman-led clinic in Romania", "", CONFIG))
        self.assertEqual(match.country_of("Remote - Worldwide", "", CONFIG), "Remote")
        self.assertIsNone(match.country_of("Remote - USA", "", CONFIG))
        self.assertIsNone(match.country_of("Remote - Netherlands", "", CONFIG))
        self.assertEqual(match.country_of("Remote", "", CONFIG), "Remote")
        self.assertEqual(match.country_of("Remote - Canada", "", CONFIG), "Canada")
        self.assertIsNone(match.country_of("Berlin, Germany", "", CONFIG))

    def test_tracks(self):
        tracks = {j["title"]: match.score(j, CONFIG)[1] for j in JOBS}
        self.assertEqual(tracks["Senior Agile Coach"], "agile")
        self.assertEqual(tracks["Director, Business Transformation"], "transformation")
        self.assertEqual(tracks["Head of AI Transformation"], "ai")
        self.assertIsNone(tracks["Agile Software Developer"])
        self.assertIsNone(tracks["Nurse"])

    def test_select_filters_and_dedupes(self):
        picked = cli.select(JOBS, CONFIG, TODAY)
        titles = sorted(j["title"] for j in picked.values())
        self.assertEqual(titles, ["Director, Business Transformation", "Head of AI Transformation",
                                  "Scrum Master", "Senior Agile Coach"])
        coach = next(j for j in picked.values() if j["title"] == "Senior Agile Coach")
        self.assertEqual(coach["url"], "https://example.com/1")
        self.assertEqual(coach["apply_email"], "careers@maplebank.example")


class TailorTests(unittest.TestCase):
    def setUp(self):
        self.picked = {j["title"]: j for j in cli.select(JOBS, CONFIG, TODAY).values()}

    def test_only_reorders_source_content(self):
        source_bullets = set()
        for r in RESUME["experience"]:
            for b in r["bullets"]:
                source_bullets |= {b} if isinstance(b, str) else {b["text"], *b.get("by_track", {}).values()}
        source_skills = {s["name"] for s in RESUME["skills"]}
        for job in self.picked.values():
            view = tailor.tailor(RESUME, job, CONFIG)
            for role in view["experience"]:
                self.assertTrue(set(role["bullets"]) <= source_bullets)
            for shown in view["skills"]:
                self.assertTrue(shown in source_skills or any(shown.endswith(f"({n})") for n in source_skills), shown)

    def test_each_track_leads_with_its_own_evidence(self):
        agile = tailor.tailor(RESUME, self.picked["Senior Agile Coach"], CONFIG)
        ai = tailor.tailor(RESUME, self.picked["Head of AI Transformation"], CONFIG)
        self.assertIn("Agile Coach", agile["headline"])
        self.assertIn("Agile Release Trains", " ".join(agile["experience"][0]["bullets"][:2]))
        self.assertEqual(agile["skills"][0], "SAFe")
        self.assertIn("AI", ai["headline"])
        self.assertIn("generative AI", ai["experience"][0]["bullets"][0])
        gaps = tailor.tailor(RESUME, self.picked["Director, Business Transformation"], CONFIG)["missing"]
        self.assertIn("vision 2030", gaps)

    def test_regional_versions(self):
        ca, label_ca, limits_ca = tailor.for_region(RESUME, "Canada", CONFIG)
        gulf, label_gulf, limits_gulf = tailor.for_region(RESUME, "Saudi Arabia", CONFIG)
        remote, label_remote, _ = tailor.for_region(RESUME, "Remote", CONFIG)
        self.assertEqual((label_ca, label_gulf, label_remote),
                         ("Canada / US", "Middle East / international", "Middle East / international"))
        self.assertFalse(ca.get("personal"))
        self.assertIn("Nationality: Canadian", gulf["personal"])
        self.assertLess(limits_ca["max_bullets_recent"], limits_gulf["max_bullets_recent"])
        view = tailor.tailor(gulf, self.picked["Director, Business Transformation"], CONFIG, limits_gulf)
        self.assertIn("Nationality: Canadian", render.resume_html(view))
        self.assertNotIn("Nationality", render.resume_html(tailor.tailor(ca, self.picked["Senior Agile Coach"], CONFIG, limits_ca)))

    def test_posting_wording_and_optional_skills(self):
        job = {"title": "Agile Coach", "track": "agile", "country": "Canada",
               "description": "Scaled Agile experience and Six Sigma required. Coaching leaders."}
        view = tailor.tailor(RESUME, job, CONFIG)
        self.assertEqual(view["skills"][0], "Scaled Agile (SAFe)")
        self.assertIn("Six Sigma (Lean Six Sigma)", view["skills"])
        self.assertNotIn("PRINCE2", view["skills"])
        self.assertIn("Strengths most relevant to this role: Scaled Agile (SAFe)", view["summary"])
        plain = tailor.tailor(RESUME, self.picked["Senior Agile Coach"], CONFIG)
        self.assertNotIn("Lean Six Sigma", " ".join(plain["skills"]))
        self.assertTrue(any("posting's wording" in t for t in view["tweaks"]))

    def test_bullet_wording_per_track(self):
        view = tailor.tailor(RESUME, self.picked["Director, Business Transformation"], CONFIG)
        self.assertIn("Advised 30 executives on portfolio governance", " ".join(view["experience"][0]["bullets"]))
        agile = tailor.tailor(RESUME, self.picked["Senior Agile Coach"], CONFIG)
        self.assertIn("Coached 30 executives", " ".join(agile["experience"][0]["bullets"]))

    def test_cover_letter_is_filled(self):
        job = self.picked["Director, Business Transformation"]
        letter = tailor.cover_letter(RESUME, job, tailor.tailor(RESUME, job, CONFIG))
        self.assertIn("Director, Business Transformation role at Gulf Holding", letter)
        self.assertNotIn("{", letter)


class RunTests(unittest.TestCase):
    def test_end_to_end_and_new_flag(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = ["--out", os.path.join(tmp, "out"), "run", "--config", os.path.join(ROOT, "config.json"),
                    "--resume", os.path.join(ROOT, "resume.example.json"), "--state", os.path.join(tmp, "state"),
                    "--input", os.path.join(ROOT, "tests", "sample_jobs.json"), "--no-pdf"]
            cli.main(base + ["--date", "2026-11-16"])
            rows = read_rows(tmp)
            self.assertEqual(len(rows), 4)
            self.assertTrue(all(r["is_new"] for r in rows))
            docx = os.path.join(tmp, "out", rows[0]["files"]["Resume Word"])
            with zipfile.ZipFile(docx) as z:
                self.assertIn("Sample Candidate", z.read("word/document.xml").decode("utf-8"))
            self.assertTrue(any(r["mailto"].startswith("mailto:careers@maplebank.example?subject=") for r in rows))
            cli.main(base + ["--date", "2026-11-17"])
            rows = read_rows(tmp)
            self.assertEqual(len(rows), 4)
            self.assertFalse(any(r["is_new"] for r in rows))
            cli.main(base + ["--date", "2026-12-20"])  # aged out, must not come back as new
            self.assertEqual(read_rows(tmp), [])


class SourceParsingTests(unittest.TestCase):
    def test_strip_html_handles_escaped_markup(self):
        self.assertEqual(util.strip_html("&lt;p&gt;Lead &amp;amp; coach&lt;/p&gt;&lt;ul&gt;&lt;li&gt;SAFe&lt;/li&gt;&lt;/ul&gt;"), "Lead & coach\nSAFe")

    def test_greenhouse_and_failing_board(self):
        def fake(url, **kwargs):
            if "broken" in url:
                raise ValueError("404")
            return {"jobs": [{"title": "Agile Coach", "absolute_url": "https://x/1", "location": {"name": "Dubai"},
                              "updated_at": "2026-11-10T10:00:00Z", "content": "&lt;p&gt;SAFe&lt;/p&gt;"}]}
        original, sources.get_json = sources.get_json, fake
        try:
            report = {"sources": {}, "errors": [], "skipped": []}
            config = {**CONFIG, "sources": {"greenhouse": {"boards": ["careem", "broken"]}}}
            jobs = cli.collect(config, report)
        finally:
            sources.get_json = original
        self.assertEqual([(j["title"], j["location"], j["posted"], j["description"]) for j in jobs],
                         [("Agile Coach", "Dubai", "2026-11-10", "SAFe")])
        self.assertEqual(len(report["errors"]), 1)


if __name__ == "__main__":
    unittest.main()
