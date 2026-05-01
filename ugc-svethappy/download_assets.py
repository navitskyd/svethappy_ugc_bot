#!/usr/bin/env python3
"""Download all external resources for the Tilda page and save them to index_files/"""

import os
import re
import urllib.request
import urllib.error
import shutil

BASE = "/Users/dzmitry.navitski/IdeaProjects/svethappy_ugc_bot/ugc-svethappy/public"
OUT  = os.path.join(BASE, "index_files")
os.makedirs(OUT, exist_ok=True)

# Map: local filename → list of URLs to try (first success wins)
ASSETS = {
    # ── Tilda JS ──────────────────────────────────────────────────────────────
    "tilda-stat-1.0.min.js": [
        "https://static.tildacdn.com/js/tilda-stat-1.0.min.js",
        "https://static.tildacdn.info/js/tilda-stat-1.0.min.js",
    ],
    "tilda-stat-1.0(1).min.js": [
        "https://static.tildacdn.com/js/tilda-stat-1.0.min.js",
    ],
    "tilda-fallback-1.0.min.js": [
        "https://static.tildacdn.com/js/tilda-fallback-1.0.min.js",
        "https://static.tildacdn.info/js/tilda-fallback-1.0.min.js",
    ],
    "tilda-polyfill-1.0.min.js": [
        "https://static.tildacdn.com/js/tilda-polyfill-1.0.min.js",
        "https://static.tildacdn.info/js/tilda-polyfill-1.0.min.js",
    ],
    "tilda-scripts-3.0.min.js": [
        "https://static.tildacdn.com/js/tilda-scripts-3.0.min.js",
        "https://static.tildacdn.info/js/tilda-scripts-3.0.min.js",
    ],
    "tilda-lazyload-1.0.min.js": [
        "https://static.tildacdn.com/js/tilda-lazyload-1.0.min.js",
        "https://static.tildacdn.info/js/tilda-lazyload-1.0.min.js",
    ],
    "tilda-cards-1.0.min.js": [
        "https://static.tildacdn.com/js/tilda-cards-1.0.min.js",
        "https://static.tildacdn.info/js/tilda-cards-1.0.min.js",
    ],
    "tilda-events-1.0.min.js": [
        "https://static.tildacdn.com/js/tilda-events-1.0.min.js",
        "https://static.tildacdn.info/js/tilda-events-1.0.min.js",
    ],
    # page-specific JS/CSS (hosted on the Tilda site itself)
    "tilda-blocks-page115224436.min.js": [
        "https://svethappy.tilda.ws/tilda-blocks-page115224436.min.js",
    ],
    "tilda-blocks-page115224436.min.css": [
        "https://svethappy.tilda.ws/tilda-blocks-page115224436.min.css",
    ],
    # ── Tilda CSS ─────────────────────────────────────────────────────────────
    "tilda-grid-3.0.min.css": [
        "https://static.tildacdn.com/tilda-blocks/tilda-grid-3.0.min.css",
        "https://static.tildacdn.info/tilda-blocks/tilda-grid-3.0.min.css",
    ],
    "tilda-cards-1.0.min.css": [
        "https://static.tildacdn.com/tilda-blocks/tilda-cards-1.0.min.css",
        "https://static.tildacdn.info/tilda-blocks/tilda-cards-1.0.min.css",
    ],
    # ── Google Fonts ──────────────────────────────────────────────────────────
    "css2": [
        "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
    ],
    # ── Images ────────────────────────────────────────────────────────────────
    "learn_UGC_logo.JPG": [
        "https://static.tildacdn.ink/tild3736-6666-4363-b961-353031353561/learn_UGC_logo.JPG",
    ],
    "reels_intensiv.jpg": [
        "https://static.tildacdn.ink/tild6131-6366-4262-a162-643530613765/reels_intensiv.jpg",
    ],
    "logo_ugc_guide.PNG.webp": [
        "https://static.tildacdn.ink/tild3633-6631-4631-a538-323362633364/Reels_and_UGC_cours_.png",
    ],
    # ── Favicon ───────────────────────────────────────────────────────────────
    "tildafavicon.ico": [
        "https://static.tildacdn.ink/img/tildafavicon.ico",
        "https://static.tildacdn.com/img/tildafavicon.ico",
    ],
    # ── Inline images referenced directly in HTML ─────────────────────────────
    "IMG_5519.JPEG": [
        "https://static.tildacdn.ink/tild3638-3134-4331-b138-626662323464/IMG_5519.JPEG",
    ],
    "IMG_3340.jpeg": [
        "https://static.tildacdn.ink/tild6162-3263-4762-b833-386266353333/IMG_3340.jpeg",
    ],
    "L37A1030.jpg": [
        "https://static.tildacdn.ink/tild6164-3362-4664-a565-383338353261/L37A1030.jpg",
    ],
    "IMG_3634.JPEG": [
        "https://static.tildacdn.ink/tild6333-3830-4164-b634-313533353532/IMG_3634.JPEG",
    ],
    "IMG_3630.JPG": [
        "https://static.tildacdn.ink/tild6531-3462-4164-b738-393164663831/IMG_3630.JPG",
    ],
    "IMG_2583.JPG": [
        "https://thb.tildacdn.ink/tild3462-3133-4137-b234-633631323834/-/resize/504x/IMG_2583.JPG",
    ],
}

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Referer": "https://svethappy.tilda.ws/",
}

def download(local_name, urls):
    dest = os.path.join(OUT, local_name)
    if os.path.exists(dest):
        print(f"  [SKIP]  {local_name} (already exists)")
        return True
    for url in urls:
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = resp.read()
            with open(dest, "wb") as f:
                f.write(data)
            print(f"  [OK]    {local_name}  ← {url}")
            return True
        except Exception as e:
            print(f"  [FAIL]  {url} → {e}")
    print(f"  [ERROR] Could not download {local_name}")
    return False

# Create empty custom.js if missing (user's own file)
custom = os.path.join(OUT, "custom.js")
if not os.path.exists(custom):
    open(custom, "w").close()
    print("  [CREATED] custom.js (empty)")

for name, urls in ASSETS.items():
    download(name, urls)

print("\nDone. Files in index_files/:")
for f in sorted(os.listdir(OUT)):
    size = os.path.getsize(os.path.join(OUT, f))
    print(f"  {f:50s}  {size:>8,} bytes")

