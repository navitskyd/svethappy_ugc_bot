import {Router} from "express";

const router = Router();

router.get("/privacy", (_req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Privacy Policy / Политика конфиденциальности</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0f1117;
      --surface: #1a1d27;
      --border: rgba(255,255,255,0.08);
      --accent: #8b72e0;
      --accent2: #5ea4f0;
      --text: #e2e8f0;
      --muted: #718096;
      --en: #8ec5fc;
      --ru: #e0c3fc;
    }
    html { scroll-behavior: smooth; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 15px;
      line-height: 1.7;
      padding: 0 16px 60px;
    }
    header {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-bottom: 1px solid var(--border);
      padding: 28px 16px 20px;
      text-align: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    header h1 {
      font-size: clamp(1.1rem, 3.5vw, 1.6rem);
      font-weight: 700;
      background: linear-gradient(90deg, var(--en), var(--ru));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 14px;
    }
    .lang-tabs {
      display: inline-flex;
      background: rgba(255,255,255,0.05);
      border-radius: 50px;
      padding: 3px;
      gap: 2px;
    }
    .lang-tabs button {
      border: none;
      background: transparent;
      color: var(--muted);
      font-size: 0.85rem;
      font-weight: 600;
      padding: 6px 20px;
      border-radius: 50px;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .lang-tabs button.active {
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      color: #fff;
    }
    .container {
      max-width: 780px;
      margin: 36px auto 0;
    }
    .section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px 28px;
      margin-bottom: 16px;
    }
    .section-header {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 14px;
    }
    .section-num {
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      color: #fff;
      font-size: 0.8rem;
      font-weight: 700;
      min-width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
      flex-shrink: 0;
    }
    .section-titles { display: flex; flex-direction: column; gap: 2px; }
    .title-en {
      font-size: 1rem;
      font-weight: 700;
      color: var(--en);
    }
    .title-ru {
      font-size: 1rem;
      font-weight: 700;
      color: var(--ru);
    }
    .content-en, .content-ru {
      font-size: 0.92rem;
      color: #a0aec0;
    }
    .content-en ul, .content-ru ul {
      padding-left: 18px;
      margin-top: 6px;
    }
    .content-en li, .content-ru li { margin-bottom: 4px; }
    .divider {
      border: none;
      border-top: 1px solid var(--border);
      margin: 14px 0;
    }
    a { color: var(--accent2); text-decoration: none; }
    a:hover { text-decoration: underline; }
    footer {
      text-align: center;
      color: var(--muted);
      font-size: 0.78rem;
      margin-top: 40px;
    }
    /* language visibility */
    body.en .content-ru, body.en .title-ru { display: none; }
    body.ru .content-en, body.ru .title-en { display: none; }
    body.en .divider { display: none; }
    body.ru .divider { display: none; }

    @media (max-width: 520px) {
      .section { padding: 18px 16px; }
    }
  </style>
</head>
<body class="both">
<header>
  <h1>Privacy Policy / Политика конфиденциальности</h1>
  <div class="lang-tabs">
    <button onclick="setLang('both')" class="active" id="tab-both">EN + RU</button>
    <button onclick="setLang('en')" id="tab-en">English</button>
    <button onclick="setLang('ru')" id="tab-ru">Русский</button>
  </div>
</header>

<div class="container">

  <div class="section">
    <div class="section-header">
      <div class="section-num">1</div>
      <div class="section-titles">
        <div class="title-en">Data Controller</div>
        <div class="title-ru">Контролер данных</div>
      </div>
    </div>
    <div class="content-en">
      The data controller is <strong>Sviatlana Navitskaya</strong>, an Individual Entrepreneur (<em>Trabalhador Independente</em>) registered in Portugal.<br/>
      NIF (VAT Number): <strong>334825334</strong><br/>
      Address: Rua General Manuel Diogo Neto, 179 1ESQ, 2765-334 Estoril, Portugal.<br/>
      Contact email: <a href="mailto:svethappy.support@gmail.com">svethappy.support@gmail.com</a>
    </div>
    <hr class="divider"/>
    <div class="content-ru">
      Контролером данных является <strong>Sviatlana Navitskaya</strong>, индивидуальный предприниматель (<em>Trabalhador Independente</em>), зарегистрированный в Португалии.<br/>
      NIF: <strong>334825334</strong><br/>
      Адрес: Rua General Manuel Diogo Neto, 179 1ESQ, 2765-334 Estoril, Portugal.<br/>
      Контактный email: <a href="mailto:svethappy.support@gmail.com">svethappy.support@gmail.com</a>
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-num">2</div>
      <div class="section-titles">
        <div class="title-en">Data Collection</div>
        <div class="title-ru">Сбор данных</div>
      </div>
    </div>
    <div class="content-en">
      We collect:
      <ul>
        <li><strong>Provided by you:</strong> Email address.</li>
        <li><strong>Automatically via Telegram:</strong> User ID, First/Last name, and Username (as set in your public Telegram profile).</li>
        <li><strong>Payment info:</strong> Processed by Stripe. We do not store your card details.</li>
      </ul>
    </div>
    <hr class="divider"/>
    <div class="content-ru">
      Мы собираем:
      <ul>
        <li><strong>Предоставлено вами:</strong> Email адрес.</li>
        <li><strong>Автоматически через Telegram:</strong> User ID, имя, фамилия и юзернейм (как указано в вашем профиле).</li>
        <li><strong>Платежные данные:</strong> обрабатываются Stripe. Мы не храним данные ваших карт.</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-num">3</div>
      <div class="section-titles">
        <div class="title-en">Purpose of Processing</div>
        <div class="title-ru">Цель обработки</div>
      </div>
    </div>
    <div class="content-en">
      We use your data to:
      <ul>
        <li>Provide access to digital products.</li>
        <li>Identify your purchase in the Telegram bot.</li>
        <li>Send service notifications and transaction receipts.</li>
      </ul>
    </div>
    <hr class="divider"/>
    <div class="content-ru">
      Мы используем данные для:
      <ul>
        <li>Предоставления доступа к цифровым продуктам.</li>
        <li>Идентификации вашей покупки в Telegram-боте.</li>
        <li>Отправки уведомлений и чеков об оплате.</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-num">4</div>
      <div class="section-titles">
        <div class="title-en">Legal Basis (GDPR)</div>
        <div class="title-ru">Правовое основание (GDPR)</div>
      </div>
    </div>
    <div class="content-en">
      Processing is based on your <strong>Consent</strong> (Art. 6(1)(a) GDPR) given by starting the bot and providing your email, and <strong>Contract Performance</strong> (Art. 6(1)(b) GDPR).
    </div>
    <hr class="divider"/>
    <div class="content-ru">
      Обработка основана на вашем <strong>Согласии</strong> (ст. 6(1)(a) GDPR), данном при запуске бота и вводе email, а также на <strong>Исполнении договора</strong> (ст. 6(1)(b) GDPR).
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-num">5</div>
      <div class="section-titles">
        <div class="title-en">Data Transfers</div>
        <div class="title-ru">Передача данных</div>
      </div>
    </div>
    <div class="content-en">
      Data is processed via <strong>Telegram</strong> (Messenger Inc.) and <strong>Stripe</strong> (Stripe Inc.). Your data may be transferred outside the EEA. We ensure safety through Standard Contractual Clauses (SCCs).
    </div>
    <hr class="divider"/>
    <div class="content-ru">
      Данные обрабатываются через <strong>Telegram</strong> и <strong>Stripe</strong>. Ваши данные могут передаваться за пределы ЕЭЗ. Мы обеспечиваем безопасность через стандартные договорные условия (SCCs).
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-num">6</div>
      <div class="section-titles">
        <div class="title-en">Your Rights</div>
        <div class="title-ru">Ваши права</div>
      </div>
    </div>
    <div class="content-en">
      Under GDPR, you have the right to <strong>access</strong>, <strong>rectify</strong>, or <strong>delete</strong> your data, and the right to <strong>withdraw consent</strong> at any time by contacting us via email.
    </div>
    <hr class="divider"/>
    <div class="content-ru">
      Согласно GDPR, у вас есть право на <strong>доступ</strong>, <strong>исправление</strong> или <strong>удаление</strong> ваших данных, а также право <strong>отозвать согласие</strong> в любой момент, написав нам на email.
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-num">7</div>
      <div class="section-titles">
        <div class="title-en">Retention Period</div>
        <div class="title-ru">Срок хранения</div>
      </div>
    </div>
    <div class="content-en">
      We store your email until you <strong>withdraw consent</strong>. Payment records are kept as required by Portuguese tax law.
    </div>
    <hr class="divider"/>
    <div class="content-ru">
      Мы храним ваш email до <strong>отзыва согласия</strong>. Записи о платежах хранятся в соответствии с налоговым законодательством Португалии.
    </div>
  </div>

  <footer>
    &copy; ${new Date().getFullYear()} Sviatlana Navitskaya &mdash; NIF 334825334, Portugal &mdash;
    <a href="mailto:svethappy.support@gmail.com">svethappy.support@gmail.com</a>
  </footer>
</div>

<script>
  function setLang(lang) {
    document.body.className = lang;
    document.getElementById('tab-both').classList.toggle('active', lang === 'both');
    document.getElementById('tab-en').classList.toggle('active', lang === 'en');
    document.getElementById('tab-ru').classList.toggle('active', lang === 'ru');
  }
</script>
</body>
</html>`);
});

export default router;

