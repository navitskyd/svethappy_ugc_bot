import {Router} from "express";

const {
    YOUTUBE_VIDEO_ID = "",
    UGC_CLUB_URL = "#",
    PRIVATE_COMMUNITY_URL = "#",
} = process.env;

const router = Router();

router.get("/", (_req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SvetHappy UGC</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      font-family: 'Segoe UI', sans-serif;
      color: #fff;
      padding: 24px;
    }
    h1 {
      font-size: clamp(1.6rem, 4vw, 2.6rem);
      font-weight: 700;
      margin-bottom: 8px;
      text-align: center;
      background: linear-gradient(90deg, #e0c3fc, #8ec5fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p.subtitle {
      font-size: 1rem;
      color: #a0aec0;
      margin-bottom: 32px;
      text-align: center;
    }
    .video-wrapper {
      width: 100%;
      max-width: 760px;
      aspect-ratio: 16 / 9;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      margin-bottom: 36px;
      background: #000;
    }
    .video-wrapper iframe { width: 100%; height: 100%; border: none; }
    .buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      border-radius: 50px;
      font-size: 1rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.15s, box-shadow 0.15s;
      cursor: pointer;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; }
    .btn-secondary {
      background: transparent;
      color: #fff;
      border: 2px solid rgba(255,255,255,0.4);
    }
    .btn-secondary:hover { border-color: #fff; }
  </style>
</head>
<body>
  <h1>SvetHappy UGC</h1>
  <p class="subtitle">Добро пожаловать в наше сообщество</p>

  <div class="video-wrapper">
    <iframe
      src="https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>
  </div>

  <div class="buttons">
    <a class="btn btn-primary" id="btn-ugc" href="${UGC_CLUB_URL}">🎬 Вступить в UGC Клуб</a>
    <a class="btn btn-secondary" href="${PRIVATE_COMMUNITY_URL}">🔒 Войти в закрытое сообщество</a>
  </div>

  <script>
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email") || "";
    const telegramId = params.get("telegramId") || "";
    const btn = document.getElementById("btn-ugc");
    const base = btn.href.split("?")[0];
    const existing = btn.href.includes("?") ? btn.href.split("?")[1] : "";
    const extra = new URLSearchParams(existing);
    if (email) extra.set("locked_prefilled_email", email);
    if (telegramId) extra.set("client_reference_id", telegramId);
    btn.href = base + "?" + extra.toString();
  </script>
</body>
</html>`);
});

export default router;

