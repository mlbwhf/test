"""Account registry and active-account state."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent  # social-agent/
ACCOUNTS_FILE = ROOT / "accounts.yaml"
STATE_FILE = ROOT / "state.json"
DRAFTS_DIR = ROOT / "drafts"
HISTORY_DIR = ROOT / "history"
OUTBOX_DIR = ROOT / "outbox"
TEMPLATES_DIR = ROOT / "templates"


@dataclass
class Account:
    id: str
    name: str
    platform: str
    focus: str
    audience: str = ""
    voice: str = ""
    hashtags: list = field(default_factory=list)
    topics: list = field(default_factory=list)
    publisher: str = "outbox"
    publisher_config: dict = field(default_factory=dict)


def load_accounts() -> dict[str, Account]:
    data = yaml.safe_load(ACCOUNTS_FILE.read_text())
    accounts = {}
    for raw in data.get("accounts", []):
        acct = Account(**raw)
        accounts[acct.id] = acct
    return accounts


def get_account(account_id: str) -> Account:
    accounts = load_accounts()
    if account_id not in accounts:
        known = ", ".join(accounts)
        raise SystemExit(f"Unknown account '{account_id}'. Known accounts: {known}")
    return accounts[account_id]


def _load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def _save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2) + "\n")


def get_active_account_id() -> str | None:
    return _load_state().get("active_account")


def set_active_account(account_id: str) -> Account:
    acct = get_account(account_id)  # validates
    state = _load_state()
    state["active_account"] = account_id
    _save_state(state)
    return acct


def require_active_account() -> Account:
    account_id = get_active_account_id()
    if not account_id:
        raise SystemExit(
            "No active account. Pick one with: python -m socialagent use <id>\n"
            "List accounts with:               python -m socialagent accounts"
        )
    return get_account(account_id)
