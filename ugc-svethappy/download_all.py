#!/usr/bin/env python3
"""Download ALL assets referenced by index.html into ./public/index_files/"""
import ssl, urllib.request, os, re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://svethappy.tilda.ws/",
    "Accept": "*/*",
}

BASE = os.path.dirname(os.path.abspath(__file__))
OUT  = os.path.join(BASE, "public", "index_files")
os.makedirs(OUT, exist_ok=True)

# local filename → URL to download from
ASSETS = {
    # ── JS ─────────────────────────────────────────────────────────────────
    "tilda-stat-1.0.min.js":              "https://static.tildacdn.com/js/tilda-stat-1.0.min.js",
    "tilda-stat-1.0(1).min.js":           "https://static.tildacdn.com/js/tilda-stat-1.0.min.js",
    "tilda-fallback-1.0.min.js":          "https://static.tildacdn.com/js/tilda-fallback-1.0.min.js",
    "tilda-polyfill-1.0.min.js":          "https://static.tildacdn.com/js/tilda-polyfill-1.0.min.js",
    "tilda-scripts-3.0.min.js":           "https://static.tildacdn.com/js/tilda-scripts-3.0.min.js",
    "tilda-lazyload-1.0.min.js":          "https://static.tildacdn.com/js/tilda-lazyload-1.0.min.js",
    "tilda-cards-1.0.min.js":             "https://static.tildacdn.com/js/tilda-cards-1.0.min.js",
    "tilda-events-1.0.min.js":            "https://static.tildacdn.com/js/tilda-events-1.0.min.js",
    "tilda-blocks-page115224436.min.js":  "https://svethappy.tilda.ws/tilda-blocks-page115224436.min.js",
    # ── CSS ────────────────────────────────────────────────────────────────
    "tilda-grid-3.0.min.css":             "https://static.tildacdn.com/tilda-blocks/tilda-grid-3.0.min.css",
    "tilda-cards-1.0.min.css":            "https://static.tildacdn.com/tilda-blocks/tilda-cards-1.0.min.css",
    "tilda-blocks-page115224436.min.css": "https://svethappy.tilda.ws/tilda-blocks-page115224436.min.css",
    "css2":                               "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
    # ── Favicon ────────────────────────────────────────────────────────────
    "tildafavicon.ico":                   "https://static.tildacdn.com/img/tildafavicon.ico",
    # ── Images ─────────────────────────────────────────────────────────────
    "IMG_3340.jpeg":            "https://static.tildacdn.ink/tild6162-3263-4762-b833-386266353333/IMG_3340.jpeg",
    "IMG_3630.JPG":             "https://static.tildacdn.ink/tild6531-3462-4164-b738-393164663831/IMG_3630.JPG",
    "IMG_3634.JPEG":            "https://static.tildacdn.ink/tild6333-3830-4164-b634-313533353532/IMG_3634.JPEG",
    "IMG_5519.JPEG":            "https://static.tildacdn.ink/tild3638-3134-4331-b138-626662323464/IMG_5519.JPEG",
    "L37A1030.jpg":             "https://static.tildacdn.ink/tild6164-3362-4664-a565-383338353261/L37A1030.jpg",
    "learn_UGC_logo.JPG":       "https://static.tildacdn.ink/tild3736-6666-4363-b961-353031353561/learn_UGC_logo.JPG",
    "Reels_and_UGC_cours_.png": "https://static.tildacdn.ink/tild3633-6631-4631-a538-323362633364/Reels_and_UGC_cours_.png",
    "IMG_2583.JPG":             "https://thb.tildacdn.ink/tild3462-3133-4137-b234-633631323834/-/resize/504x/IMG_2583.JPG",
    "logo_ugc_guide.PNG.webp":  "https://static.tildacdn.ink/tild3633-6631-4631-a538-323362633364/Reels_and_UGC_cours_.png",
    "reels_intensiv.jpg":       "https://static.tildacdn.ink/tild6131-6366-4262-a162-643530613765/reels_intensiv.jpg",
}

# Force re-download if file is missing or too small (< 1 KB for images, < 500 B for others)
IMG_EXTS = {".jpg",".jpeg",".png",".webp",".JPG",".JPEG",".PNG"}

def needs_download(name):
    dest = os.path.join(OUT, name)
    if not os.path.exists(dest):
        return True
    size = os.path.getsize(dest)
    ext = os.path.splitext(name)[1]
    if ext in IMG_EXTS and size < 2000:
        return True
    if ext not in IMG_EXTS and size < 100:
        return True
    return False

for name, url in ASSETS.items():
    dest = os.path.join(OUT, name)
    if not needs_download(name):
        print(f"SKIP  {name:50s} ({os.path.getsize(dest):,} bytes)")
        continue
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
            data = r.read()
        open(dest, "wb").write(data)
        print(f"OK    {name:50s} {len(data):>10,} bytes")
    except Exception as e:
        print(f"FAIL  {name}: {e}")

# Create empty custom.js if missing
cjs = os.path.join(OUT, "custom.js")
if not os.path.exists(cjs):
    open(cjs, "w").close()
    print("CREATED custom.js (empty)")

# ── Patch HTML: replace any remaining absolute CDN URLs ──────────────────────
HTML_PATH = os.path.join(BASE, "public", "index.html")
with open(HTML_PATH, encoding="utf-8") as f:
    html = f.read()

original = html

URL_MAP = {
    "https://static.tildacdn.ink/img/tildafavicon.ico":    "./index_files/tildafavicon.ico",
    "https://static.tildacdn.com/img/tildafavicon.ico":    "./index_files/tildafavicon.ico",
    "https://thb.tildacdn.ink/tild3462-3133-4137-b234-633631323834/-/resize/504x/IMG_2583.JPG":
        "./index_files/IMG_2583.JPG",
    "https://static.tildacdn.ink/tild3638-3134-4331-b138-626662323464/IMG_5519.JPEG":
        "./index_files/IMG_5519.JPEG",
    "https://static.tildacdn.ink/tild3736-6666-4363-b961-353031353561/learn_UGC_logo.JPG":
        "./index_files/learn_UGC_logo.JPG",
    "https://static.tildacdn.ink/tild6131-6366-4262-a162-643530613765/reels_intensiv.jpg":
        "./index_files/reels_intensiv.jpg",
    "https://static.tildacdn.ink/tild6162-3263-4762-b833-386266353333/IMG_3340.jpeg":
        "./index_files/IMG_3340.jpeg",
    "https://static.tildacdn.ink/tild6164-3362-4664-a565-383338353261/L37A1030.jpg":
        "./index_files/L37A1030.jpg",
    "https://static.tildacdn.ink/tild6333-3830-4164-b634-313533353532/IMG_3634.JPEG":
        "./index_files/IMG_3634.JPEG",
    "https://static.tildacdn.ink/tild6531-3462-4164-b738-393164663831/IMG_3630.JPG":
        "./index_files/IMG_3630.JPG",
    "https://static.tildacdn.ink/tild3633-6631-4631-a538-323362633364/Reels_and_UGC_cours_.png":
        "./index_files/Reels_and_UGC_cours_.png",
}

for old, new in URL_MAP.items():
    n = html.count(old)
    if n:
        html = html.replace(old, new)
        print(f"PATCHED ({n}x)  {old}")

if html != original:
    with open(HTML_PATH, "w", encoding="utf-8") as f:
        f.write(html)
    print("\nHTML updated.")
else:
    print("\nHTML already clean.")

# ── Final report ─────────────────────────────────────────────────────────────
print("\n=== Final inventory ===")
for f in sorted(os.listdir(OUT)):
    size = os.path.getsize(os.path.join(OUT, f))
    flag = " ⚠️  SMALL" if size < 1000 else ""
    print(f"  {f:50s}  {size:>10,} bytes{flag}")

