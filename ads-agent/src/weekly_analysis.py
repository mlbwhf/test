"""Weekly Monday report. Provider-agnostic: Groq (default) or Anthropic.
Set LLM_PROVIDER=groq and GROQ_API_KEY in .env. Groq uses OpenAI-compatible API."""
import os, json, requests

PROMPT_TMPL = """You are the Agile Agilist ads agent analyst. GROUND TRUTH = Eventbrite registrations; platform 'conversions' are only outbound clicks — never treat them as sales. Rules constitution:
{rules}

REGISTRATIONS (14d + same period last year): {regs}
AD SNAPSHOTS (14d, Google + Microsoft): {snaps}

Produce: 1) registrations WoW + YoY vs seasonal norm, 2) spend vs seasonal calendar per platform, 3) anomalies, 4) MAX THREE recommended actions ranked by registration impact — recommend NOTHING if data is within seasonal norms (over-tinkering is the documented failure mode). Never recommend actions violating the immutable rules."""

def run(snapshots_14d: dict, registrations: dict, rules_yaml: str) -> str:
    prompt = PROMPT_TMPL.format(rules=rules_yaml, regs=json.dumps(registrations), snaps=json.dumps(snapshots_14d))
    provider = os.environ.get("LLM_PROVIDER", "groq").lower()

    if provider == "groq":
        r = requests.post("https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
                     "Content-Type": "application/json"},
            json={"model": os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
                  "max_tokens": 1500,
                  "messages": [{"role": "user", "content": prompt}]}, timeout=60)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]

    # fallback: anthropic
    import anthropic
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    msg = client.messages.create(model="claude-sonnet-4-6", max_tokens=1500,
                                 messages=[{"role": "user", "content": prompt}])
    return msg.content[0].text

if __name__ == "__main__":
    print("Provider:", os.environ.get("LLM_PROVIDER", "groq"), "- wire snapshots from Airtable, then call run().")
