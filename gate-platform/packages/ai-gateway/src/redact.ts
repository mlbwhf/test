/**
 * Reversible PII redaction. Replaces emails, phone numbers, IBANs and long
 * digit runs with stable tokens before text reaches any model, and maps
 * tokens back on the way out. Card numbers never reach this layer (PCI
 * scope stays with the payment provider), but the digit rule catches
 * them anyway as defense in depth.
 */
export interface Redaction {
  text: string;
  /** token -> original */
  map: Map<string, string>;
}

const RULES: Array<{ label: string; re: RegExp }> = [
  { label: "EMAIL", re: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
  { label: "IBAN", re: /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){3,7}(?:[ ]?[A-Z0-9]{1,4})?\b/g },
  { label: "PHONE", re: /(?:\+?\d{1,3}[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}\b/g },
  { label: "DIGITS", re: /\b\d(?:[ -]?\d){11,18}\b/g },
];

export function redact(input: string, existing?: Map<string, string>): Redaction {
  const map = existing ?? new Map<string, string>();
  const reverse = new Map<string, string>();
  for (const [token, original] of map) reverse.set(original, token);
  let text = input;
  for (const { label, re } of RULES) {
    text = text.replace(re, (match) => {
      const prior = reverse.get(match);
      if (prior) return prior;
      const token = `<${label}_${map.size + 1}>`;
      map.set(token, match);
      reverse.set(match, token);
      return token;
    });
  }
  return { text, map };
}

export function restore(text: string, map: Map<string, string>): string {
  let out = text;
  for (const [token, original] of map) out = out.split(token).join(original);
  return out;
}
