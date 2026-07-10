"""Template discovery and loading.

Templates are plain Markdown files the user drops into
social-agent/templates/<kind>/ (kind = linkedin, video, ...).
The whole file is handed to the model as the structure to follow,
so anything goes: section headings, [PLACEHOLDERS], style notes.
"""

from __future__ import annotations

from pathlib import Path

from .config import TEMPLATES_DIR

KINDS = ("linkedin", "video")


def list_templates(kind: str) -> list[str]:
    folder = TEMPLATES_DIR / kind
    if not folder.is_dir():
        return []
    return sorted(p.stem for p in folder.glob("*.md"))


def load_template(kind: str, name: str) -> str:
    path = TEMPLATES_DIR / kind / f"{name}.md"
    if not path.exists():
        available = ", ".join(list_templates(kind)) or "(none)"
        raise SystemExit(
            f"Template '{name}' not found under templates/{kind}/. "
            f"Available: {available}"
        )
    return path.read_text()
