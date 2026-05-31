#!/usr/bin/env python3
import re, sys, os
sys.path.insert(0, "/home/user/test")
from build_v3 import MENUS, COVER_END

def last_phrase(pid):
    src = open(f"/home/user/test/src{pid}.html", encoding="utf-8").read()
    body = src[src.find(COVER_END)+len(COVER_END):]
    heads = re.findall(r'<h[2-4]\b[^>]*>(.*?)</h[2-4]>', body, re.DOTALL)
    if not heads:
        return None
    # strip tags, return text of last heading
    txt = re.sub(r'<[^>]+>', '', heads[-1]).strip()
    return txt

def main(pid):
    p = f"/home/user/test/final/page{pid}_full.html"
    full = open(p, encoding="utf-8").read()
    size = len(full.encode("utf-8"))
    o = full.count("<!-- wp:"); c = full.count("<!-- /wp:")
    h1m = re.search(r'<h1\b[^>]*>(.*?)</h1>', full, re.DOTALL)
    h1txt = re.sub(r'<[^>]+>', '', h1m.group(1)).strip() if h1m else ""
    menu_ok = all(href in full for _,_,_,href in MENUS[pid])
    dollars = full.count("$")
    has2col = "hero-2col" in full
    hasjump = "Jump to section" in full
    lp = last_phrase(pid)
    lp_found = bool(lp) and (lp in full)
    checks = {
        "size>8000": size > 8000,
        "balanced_and>=10": (o == c and o >= 10),
        "hero-2col": has2col,
        "Jump to section": hasjump,
        "H1 nonempty": bool(h1txt),
        "menu hrefs": menu_ok,
        "dollars==0": dollars == 0,
        "late-phrase": lp_found,
    }
    allok = all(checks.values())
    print(f"PID {pid} | bytes={size} | wp {o}/{c} | H1={h1txt!r} | menu={menu_ok} | $={dollars} | lp={lp_found!r} ({lp!r})")
    for k,v in checks.items():
        if not v:
            print(f"   FAIL: {k}")
    print("RESULT:", "PASS" if allok else "FAIL")
    return allok

if __name__ == "__main__":
    ok = main(int(sys.argv[1]))
    sys.exit(0 if ok else 1)
