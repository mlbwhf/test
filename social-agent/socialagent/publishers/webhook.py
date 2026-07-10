"""Generic webhook publisher — hands the post to a workflow tool
(Zapier, Make, n8n, ...) which does the actual posting.

publisher_config:
  url_env: env var holding the webhook URL (default SOCIAL_WEBHOOK_URL)
"""

from __future__ import annotations

import os

import requests


def publish(account, text: str) -> str:
    url_env = account.publisher_config.get("url_env", "SOCIAL_WEBHOOK_URL")
    url = os.environ.get(url_env)
    if not url:
        raise SystemExit(f"Webhook URL missing: set the {url_env} env var.")
    resp = requests.post(
        url,
        json={
            "account": account.id,
            "platform": account.platform,
            "text": text,
        },
        timeout=30,
    )
    resp.raise_for_status()
    return f"webhook {resp.status_code}"
