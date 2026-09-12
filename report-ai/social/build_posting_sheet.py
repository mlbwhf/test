#!/usr/bin/env python3
"""Build a paste-ready posting sheet from the two stat-bank CSVs.
Each entry: card filename + full caption (text + link + hashtags) ready to copy into Buffer."""
import csv

SOURCES = [
    ("stat-bank-batch1.csv", "cards"),       # batch 1 -> cards/NN.png
    ("stat-bank-full.csv",   "cards-full"),  # full    -> cards-full/NN.png
]
BASE = "/home/user/test/report-ai/social/"
out = ["# Report-AI — posting sheet (paste-ready)",
       "",
       "For each post: attach the **Image**, then copy the **Caption** block into Buffer.",
       "Buffer posts the same caption to every connected channel. On **X**, if it exceeds 280",
       "characters, delete the hashtags line (X counts a link as 23 chars).",
       ""]

n = 0
for fname, folder in SOURCES:
    with open(BASE + fname) as f:
        rows = list(csv.DictReader(f))
    out.append(f"\n---\n\n## {fname}  ({len(rows)} posts)\n")
    for i, r in enumerate(rows, 1):
        n += 1
        card = f"{folder}/{i:02d}.png"
        cap = f"{r['Text']} {r['Link']}\n\n{r['Hashtags']}"
        out.append(f"### {n:02d} · `{card}` · {r['Date']}")
        out.append(f"```\n{cap}\n```\n")

with open(BASE + "posting-sheet.md", "w") as f:
    f.write("\n".join(out))
print(f"wrote posting-sheet.md with {n} posts")
