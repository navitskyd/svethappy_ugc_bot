#!/usr/bin/env python3
"""
Full restore:
1. Download all missing index_files assets
2. Patch remaining absolute CDN URLs in index.html (data-original, background-image, meta content)
"""
import ssl, urllib.request, os, re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer":    "https://svethappy.tilda.ws/",
    "Accept":     "*/*",
}

HERE    = os.path.dirname(os.path.abspath(__file__))
OUT     = os.path.join(HERE, "public", "index_files")
HTML_IN = os.path.join(HERE, "public", "index.html")

os.makedirs(OUT, exist_ok=True)

# ─── asset map: local filename → remote URL ──────────────────────────────────
ASSETS = {
    # JS
    "tilda-stat-1.0.min.js":              "https://static.tildacdn.com/js/tilda-stat-1.0.min.js",
    "tilda-stat-1.0(1).min.js":           "https://static.tildacdn.com/js/tilda-stat-1.0.min.js",
    "tilda-polyfill-1.0.min.js":          "https://static.tildacdn.com/js/tilda-polyfill-1.0.min.js",
    "tilda-scripts-3.0.min.js":           "https://static.tildacdn.com/js/tilda-scripts-3.0.min.js",
    "tilda-lazyload-1.0.min.js":          "https://static.tildacdn.com/js/tilda-lazyload-1.0.min.js",
    "tilda-cards-1.0.min.js":             "https://static.tildacdn.com/js/tilda-cards-1.0.min.js",
    "tilda-events-1.0.min.js":            "https://static.tildacdn.com/js/tilda-events-1.0.min.js",
    "tilda-blocks-page115224436.min.js":  "https://svethappy.tilda.ws/tilda-blocks-page115224436.min.js",
    # CSS
    "tilda-grid-3.0.min.css":             "https://static.tildacdn.com/tilda-blocks/tilda-grid-3.0.min.css",
    "tilda-cards-1.0.min.css":            "https://static.tildacdn.com/tilda-blocks/tilda-cards-1.0.min.css",
    "tilda-blocks-page115224436.min.css": "https://svethappy.tilda.ws/tilda-blocks-page115224436.min.css",
    "css2":     "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
    # favicon
    "tildafavicon.ico": "https://static.tildacdn.com/img/tildafavicon.ico",
    # images
    "IMG_2583.JPG":             "https://static.tildacdn.ink/tild3462-3133-4137-b234-633631323834/IMG_2583.JPG",
    "IMG_3340.jpeg":            "https://static.tildacdn.ink/tild6162-3263-4762-b833-386266353333/IMG_3340.jpeg",
    "IMG_3630.JPG":             "https://static.tildacdn.ink/tild6531-3462-4164-b738-393164663831/IMG_3630.JPG",
    "IMG_3634.JPEG":            "https://static.tildacdn.ink/tild6333-3830-4164-b634-313533353532/IMG_3634.JPEG",
    "IMG_5519.JPEG":            "https://static.tildacdn.ink/tild3638-3134-4331-b138-626662323464/IMG_5519.JPEG",
    "L37A1030.jpg":             "https://static.tildacdn.ink/tild6164-3362-4664-a565-383338353261/L37A1030.jpg",
    "learn_UGC_logo.JPG":       "https://static.tildacdn.ink/tild3736-6666-4363-b961-353031353561/learn_UGC_logo.JPG",
    "Reels_and_UGC_cours_.png": "https://static.tildacdn.ink/tild3633-6631-4631-a538-323362633364/Reels_and_UGC_cours_.png",
    "logo_ugc_guide.PNG.webp":  "https://static.tildacdn.ink/tild3430-6463-4261-a431-386165373639/logo_ugc_guide.PNG",
    "reels_intensiv.jpg":       "https://static.tildacdn.ink/tild6131-6366-4262-a162-643530613765/reels_intensiv.jpg",
}

IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"}

def is_healthy(path, name):
    if not os.path.exists(path):
        return False
    size = os.path.getsize(path)
    ext = os.path.splitext(name)[1]
    if ext in IMG_EXTS:
        return size > 2000
    return size > 100

results = {}
for name, url in ASSETS.items():
    dest = os.path.join(OUT, name)
    if is_healthy(dest, name):
        results[name] = ("SKIP", os.path.getsize(dest))
        continue
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
            data = r.read()
        open(dest, "wb").write(data)
        results[name] = ("OK", len(data))
    except Exception as e:
        results[name] = ("FAIL", str(e))

# Stub files that couldn't be downloaded
STUBS = {
    "tilda-fallback-1.0.min.js": (
        "// tilda-fallback stub\n"
        "document.addEventListener('error', function(e){\n"
        "  var el=e.target; if(!el) return;\n"
        "  if(el.loaderr==='y'||el.getAttribute('data-loaderr')==='y'){\n"
        "    var fb=el.getAttribute('data-fallback');\n"
        "    if(fb){el.src=fb; el.loaderr=''; el.setAttribute('data-loaderr','');}\n"
        "  }\n"
        "}, true);\n"
    ),
    "tilda-cards-1.0.min.css": (
        ".t-card{position:relative;display:block;overflow:hidden}"
        ".t-card__img{display:block;width:100%;height:auto;object-fit:cover}"
        ".t-card__textholder{padding:20px}"
        ".t847__wrapper{display:flex;flex-wrap:wrap;margin:0 auto}"
        ".t847__col{display:flex;flex-direction:column}"
        ".t847__img{width:100%;display:block;object-fit:cover}"
        ".t847__img-wrapper{overflow:hidden;position:relative}\n"
    ),
    "custom.js": "",
}

for name, content in STUBS.items():
    dest = os.path.join(OUT, name)
    if not is_healthy(dest, name):
        open(dest, "w").write(content)
        results[name] = ("STUB", len(content))

# ─── patch HTML ──────────────────────────────────────────────────────────────
with open(HTML_IN, encoding="utf-8") as f:
    html = f.read()

original = html

# Replace ALL remaining absolute tildacdn image URLs (in data-original, background-image, meta content)
CDN_MAP = {
    # thb (thumbnail)
    "https://thb.tildacdn.ink/tild3462-3133-4137-b234-633631323834/-/resize/504x/IMG_2583.JPG": "./index_files/IMG_2583.JPG",
    # optim (webp variant used in background-image)
    "https://optim.tildacdn.ink/tild3462-3133-4137-b234-633631323834/-/format/webp/IMG_2583.JPG.webp": "./index_files/IMG_2583.JPG",
    # original sizes
    "https://static.tildacdn.ink/tild3462-3133-4137-b234-633631323834/IMG_2583.JPG":     "./index_files/IMG_2583.JPG",
    "https://static.tildacdn.ink/tild6162-3263-4762-b833-386266353333/IMG_3340.jpeg":    "./index_files/IMG_3340.jpeg",
    "https://static.tildacdn.ink/tild6531-3462-4164-b738-393164663831/IMG_3630.JPG":     "./index_files/IMG_3630.JPG",
    "https://static.tildacdn.ink/tild6333-3830-4164-b634-313533353532/IMG_3634.JPEG":    "./index_files/IMG_3634.JPEG",
    "https://static.tildacdn.ink/tild3638-3134-4331-b138-626662323464/IMG_5519.JPEG":    "./index_files/IMG_5519.JPEG",
    "https://static.tildacdn.ink/tild6164-3362-4664-a565-383338353261/L37A1030.jpg":     "./index_files/L37A1030.jpg",
    "https://static.tildacdn.ink/tild3736-6666-4363-b961-353031353561/learn_UGC_logo.JPG": "./index_files/learn_UGC_logo.JPG",
    "https://static.tildacdn.ink/tild3633-6631-4631-a538-323362633364/Reels_and_UGC_cours_.png": "./index_files/Reels_and_UGC_cours_.png",
    "https://static.tildacdn.ink/tild3430-6463-4261-a431-386165373639/logo_ugc_guide.PNG": "./index_files/logo_ugc_guide.PNG.webp",
    "https://static.tildacdn.ink/tild6131-6366-4262-a162-643530613765/reels_intensiv.jpg": "./index_files/reels_intensiv.jpg",
    # favicon
    "https://static.tildacdn.ink/img/tildafavicon.ico": "./index_files/tildafavicon.ico",
    "https://static.tildacdn.com/img/tildafavicon.ico": "./index_files/tildafavicon.ico",
}

patch_count = 0
for old, new in CDN_MAP.items():
    n = html.count(old)
    if n:
        html = html.replace(old, new)
        patch_count += n

if html != original:
    with open(HTML_IN, "w", encoding="utf-8") as f:
        f.write(html)

# ─── report ──────────────────────────────────────────────────────────────────
log_lines = ["=== ASSET DOWNLOAD REPORT ==="]
for name in sorted(results):
    status, info = results[name]
    log_lines.append(f"  {status:4s}  {name:50s}  {info}")

log_lines.append(f"\n=== HTML PATCH: {patch_count} replacement(s) made ===")
log_lines.append("\n=== FINAL INDEX_FILES ===")
for f in sorted(os.listdir(OUT)):
    size = os.path.getsize(os.path.join(OUT, f))
    flag = " *** SMALL ***" if size < 500 else ""
    log_lines.append(f"  {f:50s}  {size:>10,} bytes{flag}")

report = "\n".join(log_lines)
log_path = os.path.join(HERE, "download_report.txt")
open(log_path, "w").write(report)
print(report)
print(f"\nReport saved to {log_path}")

