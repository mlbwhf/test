"""One-time Microsoft Ads (Bing Ads API) OAuth helper -> prints a REFRESH TOKEN.

Microsoft uses the authorization-code flow, which REQUIRES an interactive
browser sign-in as the account that manages Ads account 187136875. It cannot be
run headlessly / in a CI sandbox. Run it once on your own machine:

    cd ads-agent
    export MS_ADS_CLIENT_ID=...        # Azure app registration (Application/client ID)
    export MS_ADS_CLIENT_SECRET=...    # Azure app > Certificates & secrets
    python scripts/get_ms_refresh_token.py

Steps it walks you through:
  1. Prints an authorize URL. Open it, sign in, consent.
  2. Microsoft redirects to the redirect URI with ?code=... in the address bar.
     Copy the FULL redirected URL (or just the code) and paste it back here.
  3. It exchanges the code and prints MS_ADS_REFRESH_TOKEN=... -> paste into .env.

Azure app registration must have:
  - Redirect URI (type: Web or "Mobile & desktop"):  the REDIRECT_URI below
  - API permission / scope consent for:  https://ads.microsoft.com/msads.manage
Refresh tokens are long-lived but rotate; keep the one this prints in .env / n8n
credential store, never in git.
"""
import os, sys, json, urllib.parse, urllib.request

AUTH = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
TOKEN = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
# Native-client redirect works without hosting anything; it just shows the code
# in the browser/address bar for you to copy. Must ALSO be registered in Azure.
REDIRECT_URI = "https://login.microsoftonline.com/common/oauth2/nativeclient"
SCOPE = "https://ads.microsoft.com/msads.manage offline_access"


def main():
    client_id = os.environ.get("MS_ADS_CLIENT_ID")
    client_secret = os.environ.get("MS_ADS_CLIENT_SECRET")
    if not client_id or not client_secret:
        sys.exit("Set MS_ADS_CLIENT_ID and MS_ADS_CLIENT_SECRET in the environment first.")

    q = urllib.parse.urlencode({
        "client_id": client_id, "response_type": "code", "redirect_uri": REDIRECT_URI,
        "scope": SCOPE, "response_mode": "query", "prompt": "consent",
    })
    print("\n1) Open this URL, sign in as the Ads-managing account, and consent:\n")
    print(f"   {AUTH}?{q}\n")
    print("2) After consent you'll land on a blank/native-client page. Copy the FULL")
    print("   redirected URL from the address bar (it contains ?code=...).\n")
    pasted = input("Paste the redirected URL (or just the code): ").strip()

    code = pasted
    if "code=" in pasted:
        code = urllib.parse.parse_qs(urllib.parse.urlparse(pasted).query).get("code", [""])[0]
    if not code:
        sys.exit("Could not find an authorization code in what you pasted.")

    body = urllib.parse.urlencode({
        "client_id": client_id, "client_secret": client_secret,
        "code": code, "redirect_uri": REDIRECT_URI, "grant_type": "authorization_code",
        "scope": SCOPE,
    }).encode()
    try:
        with urllib.request.urlopen(urllib.request.Request(TOKEN, data=body)) as r:
            tok = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"Token exchange failed ({e.code}): {e.read().decode()}")

    rt = tok.get("refresh_token")
    if not rt:
        sys.exit(f"No refresh_token in response: {json.dumps(tok, indent=2)}")
    print("\n=== SUCCESS — paste this line into ads-agent/.env (and your n8n creds) ===\n")
    print(f"MS_ADS_REFRESH_TOKEN={rt}\n")
    print("Access token expires in", tok.get("expires_in"), "s; the refresh token above is what the agent stores.")


if __name__ == "__main__":
    main()
