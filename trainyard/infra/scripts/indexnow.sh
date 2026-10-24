#!/usr/bin/env bash
# Tell IndexNow (Bing, Yandex, Seznam, Naver; Bing feeds ChatGPT search and Copilot) which
# public pages exist, straight from the live sitemap. Run after a deploy:
#   ./indexnow.sh trainyard.app
set -uo pipefail
host=${1:?usage: indexnow.sh <host>}
key=7c1e4b9a2f6d48e3b05a9c7d3e1f2a64
urls=$(curl -fsS --max-time 20 "https://$host/sitemap.xml" | grep -o '<loc>[^<]*</loc>' | sed 's/<loc>//;s/<\/loc>//')
[ -n "$urls" ] || { echo "no URLs in https://$host/sitemap.xml"; exit 0; }
json=$(printf '%s\n' "$urls" | awk -v h="$host" -v k="$key" 'BEGIN{printf "{\"host\":\"%s\",\"key\":\"%s\",\"keyLocation\":\"https://%s/%s.txt\",\"urlList\":[",h,k,h,k} {printf "%s\"%s\"", (NR>1?",":""), $0} END{print "]}"}')
code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 -X POST https://api.indexnow.org/indexnow -H 'content-type: application/json; charset=utf-8' -d "$json")
echo "IndexNow: $(printf '%s\n' "$urls" | wc -l) URLs submitted, HTTP $code (200 or 202 means accepted)"
