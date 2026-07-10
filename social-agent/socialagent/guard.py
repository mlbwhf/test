"""Novelty and mix-up guard.

Every draft is checked before posting:

1. Duplicate check — word-shingle similarity against the SAME account's
   history. Near-duplicates are blocked (you already posted this).
2. Cross-account leak check — similarity against OTHER accounts' history.
   High overlap means the draft is a re-tread of content that belongs to a
   different account (a mix-up).
3. Focus check — the draft's wording is scored against every account's
   `topics` keywords. If a different account matches the draft noticeably
   better than the active one, the draft probably got written for the
   wrong context.

Pure standard library on purpose: deterministic, offline, cheap.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field

from .config import Account, load_accounts
from .history import load_history

DUP_THRESHOLD = 0.60          # same account: block
CROSS_THRESHOLD = 0.40        # other account: warn (mix-up)
FOCUS_MARGIN = 2              # other account must beat active by this many keyword hits


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def fingerprint(text: str) -> str:
    return hashlib.sha256(normalize(text).encode()).hexdigest()[:16]


def _shingles(text: str, n: int = 3) -> set[tuple[str, ...]]:
    words = normalize(text).split()
    if len(words) < n:
        return {tuple(words)} if words else set()
    return {tuple(words[i:i + n]) for i in range(len(words) - n + 1)}


def similarity(a: str, b: str) -> float:
    sa, sb = _shingles(a), _shingles(b)
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def focus_score(text: str, account: Account) -> int:
    norm = " " + normalize(text) + " "
    return sum(1 for kw in account.topics if f" {normalize(kw)} " in norm)


@dataclass
class GuardReport:
    ok: bool = True
    blocked: bool = False
    fingerprint: str = ""
    warnings: list = field(default_factory=list)
    notes: list = field(default_factory=list)

    def render(self) -> str:
        lines = []
        status = "BLOCKED" if self.blocked else ("OK" if self.ok else "WARNINGS")
        lines.append(f"guard: {status}  (fingerprint {self.fingerprint})")
        for w in self.warnings:
            lines.append(f"  ! {w}")
        for n in self.notes:
            lines.append(f"  - {n}")
        return "\n".join(lines)


def check(text: str, active: Account) -> GuardReport:
    report = GuardReport(fingerprint=fingerprint(text))

    # 1 + 2: similarity against history, split by owning account
    for entry in load_history():
        sim = similarity(text, entry.get("text", ""))
        same = entry["account"] == active.id
        if same and (sim >= DUP_THRESHOLD or entry["fingerprint"] == report.fingerprint):
            report.blocked = True
            report.ok = False
            report.warnings.append(
                f"near-duplicate of a post already published on '{active.id}' "
                f"({entry['ts']}, similarity {sim:.0%})"
            )
        elif not same and sim >= CROSS_THRESHOLD:
            report.ok = False
            report.warnings.append(
                f"MIX-UP RISK: {sim:.0%} similar to a post from account "
                f"'{entry['account']}' ({entry['ts']}) — is this draft on the right account?"
            )

    # 3: focus keywords — does another account claim this draft harder?
    scores = {aid: focus_score(text, acct) for aid, acct in load_accounts().items()}
    active_score = scores.get(active.id, 0)
    for aid, score in scores.items():
        if aid != active.id and score >= active_score + FOCUS_MARGIN:
            report.ok = False
            report.warnings.append(
                f"MIX-UP RISK: draft matches '{aid}' focus keywords better "
                f"({score} vs {active_score} for '{active.id}')"
            )
    report.notes.append(
        "focus keyword hits: "
        + ", ".join(f"{aid}={s}" for aid, s in sorted(scores.items(), key=lambda x: -x[1]))
    )
    return report
