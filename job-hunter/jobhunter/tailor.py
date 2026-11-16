"""Resume tailoring by rules. It only selects and reorders what is already in resume.json;
it never writes new claims, so every tailored resume stays true to the source."""
from .util import has_phrase, norm


def _skill(entry):
    if isinstance(entry, str):
        return {"name": entry, "aliases": [], "tracks": [], "only_if_asked": False}
    return {"name": entry["name"], "aliases": entry.get("aliases", []), "tracks": entry.get("tracks", []),
            "only_if_asked": bool(entry.get("only_if_asked"))}


def _bullet(entry, track=None):
    """A bullet may carry your own alternative wording per track under "by_track"."""
    if isinstance(entry, str):
        return {"text": entry, "tracks": []}
    text = (entry.get("by_track") or {}).get(track) or entry["text"]
    return {"text": text, "tracks": entry.get("tracks", [])}


def for_region(resume, country, config):
    """Pick the resume version for a job's country. A version replaces whole top-level sections
    (contact, personal, summaries, experience and so on) of the base resume with its own."""
    versions = config.get("resume_versions", {})
    chosen = None
    for name, spec in versions.items():
        countries = spec.get("countries")
        if countries == "*" and chosen is None:
            chosen = name
        elif isinstance(countries, list) and country in countries:
            chosen = name
            break
    if chosen is None:
        return resume, "", dict(config.get("resume", {}))
    merged = {**resume, **(resume.get("versions") or {}).get(chosen, {})}
    limits = {**config.get("resume", {}), **versions[chosen].get("limits", {})}
    return merged, versions[chosen].get("label", chosen), limits


def job_keywords(job, config, titles=True):
    """Vocabulary terms (from every track) that this posting actually uses."""
    text = norm(job["title"] + " " + job.get("description", ""))
    vocab = []
    for track in config["tracks"].values():
        vocab += track.get("keywords", []) + (track.get("title", []) if titles else [])
    seen, found = set(), []
    for term in vocab:
        key = norm(term)
        if key not in seen and key in text:
            seen.add(key)
            found.append(term)
    return found


def tailor(resume, job, config, limits=None):
    """Build the resume view for one job: chosen headline and summary, skills in the posting's own
    wording, and each role led by the bullets that match the posting best."""
    track = job["track"]
    text = norm(job["title"] + " " + job.get("description", ""))
    limits = config.get("resume", {}) if limits is None else limits
    tweaks = []

    def pick(mapping):
        mapping = mapping or {}
        if isinstance(mapping, str):
            return mapping
        return mapping.get(track) or mapping.get("default") or next(iter(mapping.values()), "")

    skills = [_skill(s) for s in resume.get("skills", [])]

    def skill_hit(s):
        return any(has_phrase(text, n) for n in [s["name"]] + s["aliases"])

    matched = [s for s in skills if skill_hit(s)]
    on_track = [s for s in skills if s not in matched and track in s["tracks"]]
    rest = [s for s in skills if s not in matched and s not in on_track]

    def shown(s):
        # Use the posting's wording when it names the skill by one of your aliases.
        if s in matched and not has_phrase(text, s["name"]):
            alias = next(a for a in s["aliases"] if has_phrase(text, a))
            if norm(alias).strip() not in norm(s["name"]):
                return f"{alias} ({s['name']})"
        return s["name"]

    visible = matched + [s for s in on_track + rest if not s["only_if_asked"]]
    ordered_skills = [shown(s) for s in visible][: limits.get("max_skills", 18)]
    if matched:
        tweaks.append("Skills the posting asks for moved to the front: " + ", ".join(s["name"] for s in matched[:8]))
    renamed = [shown(s) for s in matched if shown(s) != s["name"]]
    if renamed:
        tweaks.append("Skills shown in the posting's wording: " + ", ".join(renamed))
    extra = [s["name"] for s in matched if s["only_if_asked"]]
    if extra:
        tweaks.append("Added because the posting asks for them: " + ", ".join(extra))

    terms = job_keywords(job, config) + [n for s in matched for n in [s["name"]] + s["aliases"]]
    resume_text = norm(" ".join(
        [s["name"] + " " + " ".join(s["aliases"]) for s in skills]
        + [_bullet(b, track)["text"] for role in resume.get("experience", []) for b in role.get("bullets", [])]
        + [pick(resume.get("summaries")), pick(resume.get("headlines"))]
    ))
    wanted = job_keywords(job, config, titles=False)
    covered = [k for k in wanted if has_phrase(resume_text, k)]
    missing = [k for k in wanted if k not in covered]

    skill_text = " ".join(norm(n) for s in matched for n in [s["name"]] + s["aliases"])

    experience, highlights = [], []
    for index, role in enumerate(resume.get("experience", [])):
        bullets = [_bullet(b, track) for b in role.get("bullets", [])]

        def weight(b):
            b_text = norm(b["text"])
            return 2 * sum(1 for t in terms if has_phrase(b_text, t)) + (3 if track in b["tracks"] else 0)

        ranked = sorted(enumerate(bullets), key=lambda pair: (-weight(pair[1]), pair[0]))
        keep = limits.get("max_bullets_recent", 6) if index < 2 else limits.get("max_bullets_older", 3)
        chosen = ranked[:keep]
        if index == 0 and chosen and chosen[0][0] != 0 and weight(chosen[0][1]) > 0:
            tweaks.append("Latest role now leads with: " + chosen[0][1]["text"][:90])
        if len(bullets) > keep:
            tweaks.append(f"{role.get('title', 'Role')}: kept the {keep} most relevant of {len(bullets)} bullets")
        if index < 3:
            highlights += [(weight(b), b["text"]) for _, b in chosen[:2]]
        experience.append({**{k: v for k, v in role.items() if k != "bullets"},
                           "bullets": [b["text"] for _, b in chosen]})

    highlights = [text_ for _, text_ in sorted(highlights, key=lambda h: -h[0])[:3]]
    summary = pick(resume.get("summaries"))
    strengths = [shown(s) for s in matched[: limits.get("max_strengths", 5)]]
    if summary and len(strengths) >= 2 and limits.get("strengths_line", True):
        summary = summary.rstrip() + " Strengths most relevant to this role: " + ", ".join(strengths) + "."
        tweaks.append("Profile ends with the strengths this posting asks for")
    tweaks.insert(0, f"Headline and profile written for {config['tracks'][track].get('label', track)} roles")
    return {
        "contact": resume.get("contact", {}),
        "personal": resume.get("personal", []),
        "tweaks": tweaks,
        "headline": pick(resume.get("headlines")),
        "summary": summary,
        "skills": ordered_skills,
        "experience": experience,
        "certifications": resume.get("certifications", []),
        "education": resume.get("education", []),
        "languages": resume.get("languages", []),
        "matched": ([s["name"] for s in matched] + [k for k in covered if norm(k) not in skill_text])[:14],
        "missing": missing,
        "highlights": highlights,
    }


def cover_letter(resume, job, view):
    """Fill the cover letter template from resume.json with this job's details."""
    letter = resume.get("cover_letter", {})
    contact = resume.get("contact", {})
    track_para = (letter.get("tracks") or {}).get(job["track"]) or (letter.get("tracks") or {}).get("default", "")
    values = {"title": job["title"], "company": job["company"] or "your organization",
              "country": job.get("country", ""), "name": contact.get("name", "")}

    def fill(template):
        out = template or ""
        for key, value in values.items():
            out = out.replace("{" + key + "}", value)
        return out

    parts = [fill(letter.get("greeting", "Dear Hiring Team,")),
             fill(letter.get("opening", "I am writing to apply for the {title} role at {company}.")),
             fill(track_para)]
    if view["highlights"]:
        parts.append(fill(letter.get("proof_intro", "Relevant results from my recent work:")) + "\n"
                     + "\n".join("- " + h for h in view["highlights"]))
    parts.append(fill(letter.get("closing", "I would welcome the chance to discuss how I can contribute to {company}.")))
    parts.append(fill(letter.get("signoff", "Kind regards,\n{name}")))
    return "\n\n".join(p for p in parts if p.strip())
