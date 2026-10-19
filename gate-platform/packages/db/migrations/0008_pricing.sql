-- Localized pricing: presentment currencies, FX fallback, rounding and stored rates.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pricing jsonb;
