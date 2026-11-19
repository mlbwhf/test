"""Weekly Monday report. Provider-agnostic: Groq (default) or Anthropic.

LLM_PROVIDER=groq (default) uses GROQ_API_KEY against Groq's OpenAI-compatible API.
LLM_PROVIDER=anthropic uses the Anthropic SDK (ANTHROPIC_API_KEY; model via
ANTHROPIC_MODEL, default claude-opus-5-5) with server-side refusal fallback on.
"""
import json
import os

PROMPT_TMPL = """You are the Agile Agilist ads agent analyst. GROUND TRUTH = paid registrations: website (Stripe) payments plus Eventbrite orders. Platform 'conversions' are NOT sales unless they come from the website payment-confirmation tag - never treat Eventbrite outbound clicks as sales. Rules constitution:
{rules}

REGISTRATIONS (14d + same period last year, by source and course family): {regs}
AD SNAPSHOTS (14d, Google + Microsoft): {snaps}
ACTIVE OWNER-CONFIRMED PROMOTIONS: {promos}

Produce: 1) registrations WoW + YoY vs seasonal norm, 2) spend vs seasonal calendar per platform, 3) anomalies, 4) MAX THREE recommended actions ranked by registration impact - recommend NOTHING if data is within seasonal norms (over-tinkering is the documented failure mode). Never recommend actions violating the immutable rules or owner_directives (no broad match, no Display/Audience Network, no Performance Max, no smart bidding without >=15 verified registrations/30d, ads only to approved stable landing pages, never /event/ or /wp-training/ URLs)."""


def build_prompt(snapshots_14d, registrations, rules_yaml: str, promos=None) -> str:
    return PROMPT_TMPL.format(rules=rules_yaml, regs=json.dumps(registrations, default=str),
                              snaps=json.dumps(snapshots_14d, default=str),
                              promos=json.dumps(promos or [], default=str))


def run(snapshots_14d, registrations, rules_yaml: str, promos=None) -> str:
    prompt = build_prompt(snapshots_14d, registrations, rules_yaml, promos)
    provider = os.environ.get("LLM_PROVIDER", "groq").lower()

    if provider == "groq":
        import requests
        r = requests.post("https://api.groq.com/openai/v1/chat/completions",
                          headers={"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
                                   "Content-Type": "application/json"},
                          json={"model": os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
                                "max_tokens": 1500,
                                "messages": [{"role": "user", "content": prompt}]}, timeout=60)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]

    import anthropic
    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
    msg = client.beta.messages.create(
        model=os.environ.get("ANTHROPIC_MODEL", "claude-opus-5-5"),
        max_tokens=16000,  # thinking is always on for this model; leave headroom
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        messages=[{"role": "user", "content": prompt}],
    )
    if msg.stop_reason == "refusal":
        raise RuntimeError("weekly analysis was declined by the model; check the input data")
    return "".join(b.text for b in msg.content if b.type == "text")


if __name__ == "__main__":
    print("Provider:", os.environ.get("LLM_PROVIDER", "groq"),
          "- run src/weekly_run.py to gather data from Airtable and send the report.")
