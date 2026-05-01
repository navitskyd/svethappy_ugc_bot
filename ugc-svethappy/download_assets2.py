#!/usr/bin/env python3
import ssl, urllib.request, os

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Referer": "https://svethappy.tilda.ws/",
    "Accept": "image/*,*/*;q=0.8",
}

OUT = "/Users/dzmitry.navitski/IdeaProjects/svethappy_ugc_bot/ugc-svethappy/public/index_files"
os.makedirs(OUT, exist_ok=True)

# All assets with candidate URLs
ASSETS = {
    "tilda-stat-1.0.min.js":              "https://static.tildacdn.com/js/tilda-stat-1.0.min.js",
    "tilda-stat-1.0(1).min.js":           "https://static.tildacdn.com/js/tilda-stat-1.0.min.js",
    "tilda-fallback-1.0.min.js":          "https://static.tildacdn.com/js/tilda-fallback-1.0.min.js",
    "tilda-polyfill-1.0.min.js":          "https://static.tildacdn.com/js/tilda-polyfill-1.0.min.js",
    "tilda-scripts-3.0.min.js":           "https://static.tildacdn.com/js/tilda-scripts-3.0.min.js",
    "tilda-lazyload-1.0.min.js":          "https://static.tildacdn.com/js/tilda-lazyload-1.0.min.js",
    "tilda-cards-1.0.min.js":             "https://static.tildacdn.com/js/tilda-cards-1.0.min.js",
    "tilda-events-1.0.min.js":            "https://static.tildacdn.com/js/tilda-events-1.0.min.js",
    "tilda-grid-3.0.min.css":             "https://static.tildacdn.com/tilda-blocks/tilda-grid-3.0.min.css",
    "tilda-cards-1.0.min.css":            "https://static.tildacdn.com/tilda-blocks/tilda-cards-1.0.min.css",
    "tilda-blocks-page115224436.min.js":  "https://svethappy.tilda.ws/tilda-blocks-page115224436.min.js",
    "tilda-blocks-page115224436.min.css": "https://svethappy.tilda.ws/tilda-blocks-page115224436.min.css",
    "css2":                               "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
    "tildafavicon.ico":                   "https://static.tildacdn.com/img/tildafavicon.ico",
    # images
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

# Force re-download images smaller than 2KB (likely corrupt)
MIN_SIZE = 2048

for name, url in ASSETS.items():
    dest = os.path.join(OUT, name)
    existing_size = os.path.getsize(dest) if os.path.exists(dest) else 0
    if os.path.exists(dest) and existing_size >= MIN_SIZE:
        print(f"SKIP  {name:45s} ({existing_size:,} bytes)")
        continue
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
            data = r.read()
        with open(dest, "wb") as f:
            f.write(data)
        print(f"OK    {name:45s} {len(data):>10,} bytes  <- {url}")
    except Exception as e:
        print(f"FAIL  {name}: {e}")

# create empty custom.js if missing
cjs = os.path.join(OUT, "custom.js")
if not os.path.exists(cjs):
    open(cjs, "w").close()
    print("CREATED custom.js (empty)")

print("\n--- Final inventory ---")
for f in sorted(os.listdir(OUT)):
    size = os.path.getsize(os.path.join(OUT, f))
    status = "⚠️  SMALL" if size < 1000 and f.lower().split(".")[-1] in ("jpg","jpeg","png","webp") else ""
    print(f"  {f:50s}  {size:>10,} bytes  {status}")

