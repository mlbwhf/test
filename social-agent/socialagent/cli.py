"""Command-line interface.

Run from the social-agent/ directory:

  python -m socialagent accounts
  python -m socialagent use agile-agilist
  python -m socialagent templates
  python -m socialagent draft "March Leading SAFe cohort opens" --template announcement
  python -m socialagent check drafts/<file>.md
  python -m socialagent post drafts/<file>.md
  python -m socialagent history
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from . import guard, publishers
from .config import (DRAFTS_DIR, get_account, get_active_account_id,
                     load_accounts, require_active_account,
                     set_active_account)
from .history import load_history, record_post
from .templates import KINDS, list_templates, load_template


def cmd_accounts(_args) -> None:
    active = get_active_account_id()
    for acct in load_accounts().values():
        marker = "*" if acct.id == active else " "
        print(f"{marker} {acct.id:22} {acct.platform:10} {acct.name}")
    if not active:
        print("\n(no active account — pick one with: python -m socialagent use <id>)")


def cmd_use(args) -> None:
    acct = set_active_account(args.account_id)
    print(f"Active account: {acct.id} ({acct.name})")


def cmd_templates(_args) -> None:
    for kind in KINDS:
        names = list_templates(kind)
        print(f"{kind}: {', '.join(names) if names else '(none — drop .md files into templates/' + kind + '/)'}")


def cmd_draft(args) -> None:
    from .generator import generate  # deferred: needs the anthropic package + API key

    acct = get_account(args.account) if args.account else require_active_account()
    template_text = load_template(args.kind, args.template)

    print(f"Drafting for '{acct.id}' with template {args.kind}/{args.template} ...",
          file=sys.stderr)
    text = generate(acct, template_text, args.brief, args.kind)

    report = guard.check(text, acct)

    DRAFTS_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    path = DRAFTS_DIR / f"{acct.id}-{args.kind}-{stamp}.md"
    meta = {
        "account": acct.id,
        "kind": args.kind,
        "template": args.template,
        "fingerprint": report.fingerprint,
    }
    path.write_text(f"<!-- {json.dumps(meta)} -->\n{text}\n")

    print(text)
    print()
    print(report.render())
    print(f"\nDraft saved: {path}")
    if report.blocked:
        print("This draft is a near-duplicate and will be refused by `post`.")
    print(f"Publish with: python -m socialagent post {path}")


def _read_draft(path: Path) -> tuple[dict, str]:
    raw = path.read_text()
    meta = {}
    if raw.startswith("<!--"):
        header, _, body = raw.partition("-->")
        try:
            meta = json.loads(header[4:].strip())
        except json.JSONDecodeError:
            body = raw
        raw = body
    return meta, raw.strip()


def cmd_check(args) -> None:
    path = Path(args.file)
    meta, text = _read_draft(path)
    acct = get_account(meta["account"]) if meta.get("account") else require_active_account()
    report = guard.check(text, acct)
    print(f"Checking against account '{acct.id}':")
    print(report.render())
    sys.exit(1 if report.blocked else (2 if not report.ok else 0))


def cmd_post(args) -> None:
    path = Path(args.file)
    meta, text = _read_draft(path)
    acct = get_account(meta["account"]) if meta.get("account") else require_active_account()

    report = guard.check(text, acct)
    print(report.render())
    if report.blocked and not args.force:
        raise SystemExit("Refusing to post a near-duplicate. Use --force to override.")
    if not report.ok and not args.yes and not args.force:
        answer = input("Guard raised warnings. Post anyway? [y/N] ").strip().lower()
        if answer != "y":
            raise SystemExit("Aborted.")

    channel, ref = publishers.publish(acct, text)
    status = "outbox" if channel == "outbox" else "posted"
    record_post(
        acct.id,
        text=text,
        fingerprint=report.fingerprint,
        kind=meta.get("kind", "linkedin"),
        template=meta.get("template", ""),
        channel=channel,
        status=status,
        external_ref=ref,
    )
    print(f"{status} via {channel}: {ref}")


def cmd_history(args) -> None:
    entries = load_history(args.account)
    if not entries:
        print("(no posts recorded yet)")
        return
    for e in sorted(entries, key=lambda x: x["ts"]):
        first_line = e["text"].splitlines()[0][:70]
        print(f"{e['ts']}  {e['account']:22} {e['channel']:8} {e['status']:7} {first_line}")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="socialagent",
                                     description="Multi-account social media content agent")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("accounts", help="list accounts").set_defaults(func=cmd_accounts)

    p = sub.add_parser("use", help="switch the active account")
    p.add_argument("account_id")
    p.set_defaults(func=cmd_use)

    sub.add_parser("templates", help="list available templates").set_defaults(func=cmd_templates)

    p = sub.add_parser("draft", help="generate a draft for the active account")
    p.add_argument("brief", help="what the post is about (topic, key points, links, dates)")
    p.add_argument("--template", "-t", default="announcement", help="template name (without .md)")
    p.add_argument("--kind", "-k", default="linkedin", choices=KINDS, help="template folder")
    p.add_argument("--account", "-a", help="one-off account override (does not switch)")
    p.set_defaults(func=cmd_draft)

    p = sub.add_parser("check", help="run the novelty/mix-up guard on a draft file")
    p.add_argument("file")
    p.set_defaults(func=cmd_check)

    p = sub.add_parser("post", help="publish a draft via the account's channel")
    p.add_argument("file")
    p.add_argument("--yes", "-y", action="store_true", help="post despite warnings")
    p.add_argument("--force", action="store_true", help="post even if blocked as duplicate")
    p.set_defaults(func=cmd_post)

    p = sub.add_parser("history", help="show the post ledger")
    p.add_argument("account", nargs="?", help="limit to one account")
    p.set_defaults(func=cmd_history)

    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
