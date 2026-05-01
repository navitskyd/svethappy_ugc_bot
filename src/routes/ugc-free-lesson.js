import {Router} from "express";

const {
    YOUTUBE_VIDEO_ID = "",
    UGC_CLUB_URL = "#",
    PRIVATE_COMMUNITY_URL = "#",
    PRIVACY_POLICY_URL = "#",
    OFFER_URL = "#",
} = process.env;

const router = Router();

router.get("/ugc-free-lesson", (_req, res) => {
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
    footer {
      margin-top: 48px;
      padding: 20px 16px;
      text-align: center;
      font-size: 0.8rem;
      color: #718096;
      border-top: 1px solid rgba(255,255,255,0.08);
      width: 100%;
      max-width: 760px;
    }
    footer a {
      color: #a0aec0;
      text-decoration: none;
      margin: 0 10px;
      transition: color 0.15s;
    }
    footer a:hover { color: #fff; }
    footer .separator { margin: 0 4px; opacity: 0.4; }
    .consent-wrap {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      max-width: 480px;
      margin-bottom: 24px;
      cursor: pointer;
    }
    .consent-wrap input[type="checkbox"] {
      appearance: none;
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      min-width: 20px;
      border: 2px solid rgba(255,255,255,0.4);
      border-radius: 5px;
      background: transparent;
      cursor: pointer;
      position: relative;
      transition: border-color 0.15s, background 0.15s;
      margin-top: 1px;
    }
    .consent-wrap input[type="checkbox"]:checked {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-color: #667eea;
    }
    .consent-wrap input[type="checkbox"]:checked::after {
      content: "✓";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      font-size: 13px;
      font-weight: 700;
    }
    .consent-wrap label {
      font-size: 0.85rem;
      color: #a0aec0;
      line-height: 1.5;
      cursor: pointer;
    }
    .consent-wrap label a { color: #c3b1e1; text-decoration: underline; }
    .consent-wrap label a:hover { color: #fff; }
    .btn-primary:disabled,
    .btn-primary[aria-disabled="true"] {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
      pointer-events: none;
    }
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

  <label class="consent-wrap">
    <input type="checkbox" id="consent-checkbox"/>
    <span>Я ознакомлен(а) и согласен(на) с условиями <a href="${OFFER_URL}" target="_blank" rel="noopener noreferrer">Публичной оферты</a> и <a href="${PRIVACY_POLICY_URL}" target="_blank" rel="noopener noreferrer">Политики конфиденциальности</a>.</span>
  </label>

  <div class="buttons">
    <a class="btn btn-primary" id="btn-ugc" href="${UGC_CLUB_URL}" aria-disabled="true">🎬 Вступить в UGC Клуб</a>
    <a class="btn btn-secondary" href="${PRIVATE_COMMUNITY_URL}">🔒 Войти в закрытое сообщество</a>
  </div>

  <footer>
    <a href="${PRIVACY_POLICY_URL}" target="_blank" rel="noopener noreferrer">Политика конфиденциальности / Privacy Policy</a>
    <span class="separator">|</span>
    <a href="${OFFER_URL}" target="_blank" rel="noopener noreferrer">Публичная оферта / Terms and Conditions</a>
  </footer>

  <script>
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email") || "";
    const telegramId = params.get("telegramId") || "";
    const btn = document.getElementById("btn-ugc");
    const checkbox = document.getElementById("consent-checkbox");

    function updateBtn() {
      if (checkbox.checked) {
        btn.removeAttribute("aria-disabled");
        btn.style.pointerEvents = "";
      } else {
        btn.setAttribute("aria-disabled", "true");
        btn.style.pointerEvents = "none";
      }
    }

    checkbox.addEventListener("change", updateBtn);
    updateBtn();

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

