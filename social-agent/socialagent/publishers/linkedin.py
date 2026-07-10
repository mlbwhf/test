"""LinkedIn REST API publisher (UGC posts).

publisher_config:
  token_env:  name of the env var holding an OAuth access token with the
              w_member_social (person) or w_organization_social (org) scope
  author_urn: "urn:li:person:..." or "urn:li:organization:..."
"""

from __future__ import annotations

import os

import requests

API_URL = "https://api.linkedin.com/v2/ugcPosts"


def publish(account, text: str) -> str:
    cfg = account.publisher_config
    token_env = cfg.get("token_env", "LINKEDIN_ACCESS_TOKEN")
    token = os.environ.get(token_env)
    author = cfg.get("author_urn")
    if not token:
        raise SystemExit(f"LinkedIn token missing: set the {token_env} env var.")
    if not author:
        raise SystemExit(
            f"Account '{account.id}' needs publisher_config.author_urn "
            "(urn:li:person:... or urn:li:organization:...)."
        )
    payload = {
        "author": author,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": text},
                "shareMediaCategory": "NONE",
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
    }
    resp = requests.post(
        API_URL,
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "X-Restli-Protocol-Version": "2.0.0",
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.headers.get("x-restli-id", "") or resp.json().get("id", "")
