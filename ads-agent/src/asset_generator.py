"""Draft-only ad asset generation with mechanical guardrails (Layer 4)."""
import yaml

def validate_asset(text: str, kind: str, rules: dict) -> tuple[bool, str]:
    limits = rules["asset_generation"]["char_limits"]
    if len(text) > limits[kind]:
        return False, f"{kind} over {limits[kind]} chars ({len(text)})"
    lowered = text.lower()
    for blocked in ["% off", "seats left", "early bird"]:
        if blocked in lowered:
            return False, f"blocked claim pattern: {blocked} (needs human confirmation)"
    import re
    if re.search(r"\d{3,}\+", text):
        return False, "specific large number claim needs human confirmation"
    return True, "ok"

if __name__ == "__main__":
    rules = yaml.safe_load(open("config/rules.yaml"))
    ok, why = validate_asset("3,000+ Professionals Trained", "headline", rules)
    print(ok, why)  # False - exactly the claim that needs verification
