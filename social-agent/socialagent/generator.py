"""Content generation via the Claude API.

Builds a system prompt from the active account's profile plus the chosen
template, then streams a draft for the given brief.
"""

from __future__ import annotations

import anthropic

from .config import Account

MODEL = "claude-opus-4-8"

SYSTEM_TEMPLATE = """\
You are the dedicated social media content writer for exactly one account. \
You never blend in material intended for the operator's other accounts.

<account id="{id}">
Name: {name}
Platform: {platform}
Focus: {focus}
Audience: {audience}
Voice: {voice}
Preferred hashtags: {hashtags}
</account>

<template>
{template}
</template>

Rules:
- Follow the template's structure and fill every placeholder with content \
grounded in the brief. If the brief lacks a detail a placeholder needs, \
choose something plausible and mark it [CONFIRM: ...] so the operator can fix it.
- Stay strictly inside this account's focus and voice. If the brief clearly \
belongs to a different kind of account, say so in one line at the top \
(prefixed WARNING:) and still produce the best on-focus draft you can.
- Write the post ready to publish: no meta commentary, no "Here is your post".
- Respect platform norms ({platform}): length, formatting, hashtag placement.
"""


def generate(account: Account, template_text: str, brief: str,
             kind: str) -> str:
    client = anthropic.Anthropic()
    system = SYSTEM_TEMPLATE.format(
        id=account.id,
        name=account.name,
        platform=account.platform,
        focus=account.focus.strip(),
        audience=account.audience.strip(),
        voice=account.voice.strip(),
        hashtags=" ".join(account.hashtags),
        template=template_text.strip(),
    )
    user = (
        f"Content type: {kind}\n"
        f"Brief from the operator:\n{brief.strip()}"
    )
    with client.messages.stream(
        model=MODEL,
        max_tokens=16000,
        thinking={"type": "adaptive"},
        system=system,
        messages=[{"role": "user", "content": user}],
    ) as stream:
        message = stream.get_final_message()
    return "".join(b.text for b in message.content if b.type == "text").strip()
