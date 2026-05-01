#!/usr/bin/env python3
"""Fix remaining broken/missing assets and update HTML to use local paths."""
import ssl, urllib.request, os, re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
headers = {"User-Agent": "Mozilla/5.0", "Referer": "https://svethappy.tilda.ws/"}

BASE = "/Users/dzmitry.navitski/IdeaProjects/svethappy_ugc_bot/ugc-svethappy/public"
OUT  = os.path.join(BASE, "index_files")

# Re-download anything < 2KB or explicitly listed
FORCE = {
    "tilda-cards-1.0.min.css":  "https://static.tildacdn.com/tilda-blocks/tilda-cards-1.0.min.css",
    "tilda-fallback-1.0.min.js": "https://static.tildacdn.com/js/tilda-fallback-1.0.min.js",
}

for name, url in FORCE.items():
    dest = os.path.join(OUT, name)
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=20) as r:
            data = r.read()
        open(dest, "wb").write(data)
        print("OK   ", name, len(data), "bytes")
    except Exception as e:
        print("FAIL ", name, e)

# ── Patch HTML: replace remaining absolute CDN image URLs with local paths ──
HTML = os.path.join(BASE, "index.html")
with open(HTML, encoding="utf-8") as f:
    html = f.read()

original = html

replacements = [
    # favicon
    ("https://static.tildacdn.ink/img/tildafavicon.ico",    "./index_files/tildafavicon.ico"),
    ("https://static.tildacdn.com/img/tildafavicon.ico",    "./index_files/tildafavicon.ico"),
    # og:image
    ("https://thb.tildacdn.ink/tild3462-3133-4137-b234-633631323834/-/resize/504x/IMG_2583.JPG",
     "./index_files/IMG_2583.JPG"),
    # tildacdn.ink images
    ("https://static.tildacdn.ink/tild3638-3134-4331-b138-626662323464/IMG_5519.JPEG",
     "./index_files/IMG_5519.JPEG"),
    ("https://static.tildacdn.ink/tild3736-6666-4363-b961-353031353561/learn_UGC_logo.JPG",
     "./index_files/learn_UGC_logo.JPG"),
    ("https://static.tildacdn.ink/tild6131-6366-4262-a162-643530613765/reels_intensiv.jpg",
     "./index_files/reels_intensiv.jpg"),
    ("https://static.tildacdn.ink/tild6162-3263-4762-b833-386266353333/IMG_3340.jpeg",
     "./index_files/IMG_3340.jpeg"),
    ("https://static.tildacdn.ink/tild6164-3362-4664-a565-383338353261/L37A1030.jpg",
     "./index_files/L37A1030.jpg"),
    ("https://static.tildacdn.ink/tild6333-3830-4164-b634-313533353532/IMG_3634.JPEG",
     "./index_files/IMG_3634.JPEG"),
    ("https://static.tildacdn.ink/tild6531-3462-4164-b738-393164663831/IMG_3630.JPG",
     "./index_files/IMG_3630.JPG"),
    ("https://static.tildacdn.ink/tild3633-6631-4631-a538-323362633364/Reels_and_UGC_cours_.png",
     "./index_files/Reels_and_UGC_cours_.png"),
]

for old, new in replacements:
    count = html.count(old)
    if count:
        html = html.replace(old, new)
        print(f"REPLACED ({count}x)  {old}  ->  {new}")
    else:
        print(f"NOT FOUND          {old}")

if html != original:
    with open(HTML, "w", encoding="utf-8") as f:
        f.write(html)
    print("\nHTML saved.")
else:
    print("\nNo changes to HTML.")

print("\nDone.")

