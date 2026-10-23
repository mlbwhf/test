#!/usr/bin/env bash
# Creates Trainyard's Stripe products, prices and webhook endpoint, and prints the lines to put
# in /opt/trainyard/.env. Safe to run again: prices are found by lookup key, the endpoint by URL.
#
#   ./stripe-setup.sh            (asks for the secret key; the API host comes from .env)
#   STRIPE_SECRET_KEY=sk_test_... ./stripe-setup.sh https://api.trainyard.app
#
# Run it once with the test key and once with the live key. Prices are per seat (per trainer,
# per Agile Release Train), in USD: Trainer 19/month or 192/year, Academy 249/month or 2388/year.
set -euo pipefail
cd "$(dirname "$0")"
envval() { grep -E "^$1=" .env 2>/dev/null | head -n1 | cut -d= -f2- | tr -d '"' | tr -d "'"; }
if [ -n "${1:-}" ]; then
  API_HOST=$1
else
  HOST=$(envval TRAINYARD_API_HOST)
  [ -n "$HOST" ] || HOST="api.$(envval TRAINYARD_DOMAIN)"
  [ "$HOST" != "api." ] || { echo "usage: $0 https://api.<your domain>"; exit 1; }
  API_HOST="https://$HOST"
fi
if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  read -r -s -p "Stripe secret key (sk_test_... or sk_live_..., from Developers > API keys): " STRIPE_SECRET_KEY
  echo
fi
case "$STRIPE_SECRET_KEY" in sk_test_*|sk_live_*|rk_*) ;; *) echo "That does not look like a Stripe secret key (sk_test_... or sk_live_...)."; exit 1;; esac
command -v jq >/dev/null || { echo "jq is required: sudo apt install -y jq"; exit 1; }
echo "Setting up Stripe for $API_HOST ..."
ACCOUNT=$(stripe account | jq -r '[(.settings.dashboard.display_name // .id), (if .livemode then "live mode" else "test mode" end)] | join(" · ")')
echo "Stripe account: $ACCOUNT"

# Every call stops the script with Stripe's own message when it fails (wrong key, no permission, ...).
stripe() {
  local out
  out=$(curl -sS -u "$STRIPE_SECRET_KEY:" "https://api.stripe.com/v1/$1" "${@:2}") || { echo "Could not reach api.stripe.com"; exit 1; }
  if echo "$out" | jq -e '.error' >/dev/null 2>&1; then
    echo "Stripe refused $1: $(echo "$out" | jq -r '.error.message')" >&2
    exit 1
  fi
  echo "$out"
}

product() { # name -> id (reuse by name)
  local id
  id=$(stripe products -G -d active=true -d limit=100 | jq -r --arg n "$1" '.data[] | select(.name==$n) | .id' | head -n1)
  [ -n "$id" ] || id=$(stripe products -d "name=$1" -d "description=$2" | jq -r .id)
  echo "$id"
}
price() { # lookup_key product amount_cents interval -> id
  local id
  id=$(stripe prices -G -d "lookup_keys[]=$1" -d active=true | jq -r '.data[0].id // empty')
  [ -n "$id" ] || id=$(stripe prices -d "lookup_key=$1" -d "product=$2" -d "unit_amount=$3" -d currency=usd -d "recurring[interval]=$4" -d "nickname=$1" | jq -r .id)
  echo "$id"
}

TRAINER=$(product "Trainyard Trainer" "One trainer, unlimited classes and rooms, hosted on trainyard.app")
ACADEMY=$(product "Trainyard Academy" "One Agile Release Train with every planning room, integrations and support")
TM=$(price trainer_monthly "$TRAINER" 1900 month)
TY=$(price trainer_yearly "$TRAINER" 19200 year)
AM=$(price academy_monthly "$ACADEMY" 24900 month)
AY=$(price academy_yearly "$ACADEMY" 238800 year)

URL="$API_HOST/v1/webhooks/stripe"
EXISTING=$(stripe webhook_endpoints -G -d limit=100 | jq -r --arg u "$URL" '.data[] | select(.url==$u) | .id' | head -n1)
SECRET_NOTE=""
if [ -n "$EXISTING" ]; then
  WHSEC="(already exists as $EXISTING: reuse the secret you saved, or delete it in the dashboard and run again)"
else
  EP=$(stripe webhook_endpoints -d "url=$URL" -d "description=Trainyard" \
    -d "enabled_events[]=invoice.paid" -d "enabled_events[]=invoice.payment_failed" \
    -d "enabled_events[]=customer.subscription.created" -d "enabled_events[]=customer.subscription.updated" -d "enabled_events[]=customer.subscription.deleted" \
    -d "enabled_events[]=checkout.session.completed" -d "enabled_events[]=checkout.session.async_payment_succeeded" -d "enabled_events[]=checkout.session.expired")
  WHSEC=$(echo "$EP" | jq -r .secret)
fi

PK=$(case "$STRIPE_SECRET_KEY" in sk_test_*) echo "pk_test_... (Developers → API keys, test mode)";; *) echo "pk_live_... (Developers → API keys)";; esac)

cat <<ENV

# ---- paste into /opt/trainyard/.env ----
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=$PK
STRIPE_WEBHOOK_SECRET=$WHSEC
STRIPE_PRICE_TRAINER_MONTHLY=$TM
STRIPE_PRICE_TRAINER_YEARLY=$TY
STRIPE_PRICE_ACADEMY_MONTHLY=$AM
STRIPE_PRICE_ACADEMY_YEARLY=$AY
STRIPE_TRIAL_DAYS=14
ENV
echo
echo "Then: cd /opt/trainyard && docker compose up -d --no-deps api"
echo "Also turn on Settings → Billing → Customer portal in the Stripe dashboard once."
