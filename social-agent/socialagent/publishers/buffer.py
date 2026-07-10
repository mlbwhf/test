"""Buffer publisher — queues the post into a Buffer profile.

publisher_config:
  token_env:  env var holding the Buffer access token (default BUFFER_ACCESS_TOKEN)
  profile_id: the Buffer profile to queue into
"""

from __future__ import annotations

import os

import requests

API_URL = "https://api.bufferapp.com/1/updates/create.json"


def publish(account, text: str) -> str:
    cfg = account.publisher_config
    token_env = cfg.get("token_env", "BUFFER_ACCESS_TOKEN")
    token = os.environ.get(token_env)
    profile_id = cfg.get("profile_id")
    if not token:
        raise SystemExit(f"Buffer token missing: set the {token_env} env var.")
    if not profile_id:
        raise SystemExit(f"Account '{account.id}' needs publisher_config.profile_id.")
    resp = requests.post(
        API_URL,
        data={"text": text, "profile_ids[]": profile_id, "access_token": token},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    updates = data.get("updates", [])
    return updates[0].get("id", "") if updates else ""
