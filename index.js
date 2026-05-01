import "dotenv/config";
import express from "express";
import {Bot, InlineKeyboard, webhookCallback} from "grammy";
import {conversations, createConversation} from "@grammyjs/conversations";
import {cert, getApps, initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";

const {BOT_TOKEN, FIREBASE_SERVICE_ACCOUNT} = process.env;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not set in .env");
if (!FIREBASE_SERVICE_ACCOUNT) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set in .env");

// ---------------------------------------------------------------------------
// Firestore
// ---------------------------------------------------------------------------

if (!getApps().length) {
    initializeApp({credential: cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT))});
}
const db = getFirestore();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatUserSummary(from, email) {
    const lines = [
        "✅ <b>Данные успешно собраны!</b>",
        "",
        `📧 <b>Email:</b> ${email}`,
        `🆔 <b>Telegram ID:</b> <code>${from.id}</code>`,
        `👤 <b>Имя:</b> ${from.first_name}`,
    ];
    if (from.last_name) lines.push(`👤 <b>Фамилия:</b> ${from.last_name}`);
    if (from.username) lines.push(`🔗 <b>Username:</b> @${from.username}`);
    if (from.language_code) lines.push(`🌐 <b>Язык:</b> ${from.language_code}`);
    lines.push(`🤖 <b>Бот:</b> ${from.is_bot ? "Да" : "Нет"}`);
    return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Conversation
// ---------------------------------------------------------------------------

async function onboarding(conversation, ctx) {
    // Step 1 – consent
    const consentKeyboard = new InlineKeyboard()
        .text("✅ Согласен", "agree")
        .text("❌ Не согласен", "disagree");

    await ctx.reply(
        "📋 Для продолжения нам необходимо ваше согласие на <b>сбор и обработку персональных данных</b>.\n\n" +
        "Мы собираем: имя, Telegram ID, username и email.\n\n" +
        "Вы согласны?",
        {parse_mode: "HTML", reply_markup: consentKeyboard}
    );

    const consentCtx = await conversation.waitForCallbackQuery(["agree", "disagree"]);
    await consentCtx.answerCallbackQuery();

    if (consentCtx.callbackQuery.data === "disagree") {
        await consentCtx.editMessageText(
            "❌ Вы отказались от обработки персональных данных. Без согласия мы не можем продолжить.\n\n" +
            "Если передумаете — введите /start."
        );
        return;
    }

    await consentCtx.editMessageText("✅ Спасибо за согласие!");

    // Step 2 – email (loop until confirmed)
    let email = null;
    while (!email) {
        await ctx.reply("📧 Пожалуйста, введите ваш <b>email</b>:", {parse_mode: "HTML"});

        let candidate = null;
        while (!candidate) {
            const emailCtx = await conversation.waitFor("message:text");
            const input = emailCtx.message.text.trim();
            if (EMAIL_RE.test(input)) {
                candidate = input;
            } else {
                await emailCtx.reply("⚠️ Некорректный email. Пожалуйста, введите действующий адрес электронной почты.");
            }
        }

        // Step 3 – confirmation
        const confirmKeyboard = new InlineKeyboard()
            .text("✅ Верно", "confirm")
            .text("✏️ Исправить", "retry");

        await ctx.reply(
            `📧 Вы указали email: <b>${candidate}</b>\n\nВсё верно?`,
            {parse_mode: "HTML", reply_markup: confirmKeyboard}
        );

        const confirmCtx = await conversation.waitForCallbackQuery(["confirm", "retry"]);
        await confirmCtx.answerCallbackQuery();

        if (confirmCtx.callbackQuery.data === "confirm") {
            await confirmCtx.editMessageText(`✅ Email <b>${candidate}</b> подтверждён.`, {parse_mode: "HTML"});
            email = candidate;
        } else {
            await confirmCtx.editMessageText("✏️ Хорошо, давайте попробуем ещё раз.");
        }
    }

    // Step 4 – save to Firestore (move old email to backupEmails, keep last 5)
    const docRef = db.collection("svethappy_ugc").doc(String(ctx.from.id));
    const existing = await docRef.get();
    const existingData = existing.exists ? existing.data() : {};

    const baseData = {
        telegramId: ctx.from.id,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name ?? null,
        username: ctx.from.username ?? null,
        languageCode: ctx.from.language_code ?? null,
        isBot: ctx.from.is_bot ?? false,
        email,
        consentGiven: true,
        updatedAt: FieldValue.serverTimestamp(),
        ...(!existing.exists && {createdAt: FieldValue.serverTimestamp()}),
    };

    if (existingData.email && existingData.email !== email) {
        const prev = Array.isArray(existingData.backupEmails) ? existingData.backupEmails : [];
        const backupEmails = [...new Set([...prev, existingData.email])].slice(-5);
        baseData.backupEmails = backupEmails;
    }

    await docRef.set(baseData, {merge: true});

    // Step 5 – show summary
    await ctx.reply(formatUserSummary(ctx.from, email), {parse_mode: "HTML"});
}

// ---------------------------------------------------------------------------
// Bot
// ---------------------------------------------------------------------------

const bot = new Bot(BOT_TOKEN);

bot.use(conversations());
bot.use(createConversation(onboarding));

bot.command("start", async (ctx) => {
    const name = ctx.from?.first_name ?? "друг";
  await ctx.reply(
      `👋 Привет, <b>${name}</b>! Добро пожаловать в SvetHappy UGC Bot.`,
    { parse_mode: "HTML" }
  );
    await ctx.conversation.enter("onboarding");
});

bot.catch((err) => {
  console.error("Bot error:", err);
});

// ---------------------------------------------------------------------------
// Express – export for Vercel (serverless)
// ---------------------------------------------------------------------------

const {WEBHOOK_PATH = "/webhook", YOUTUBE_VIDEO_ID = "", UGC_CLUB_URL = "#", PRIVATE_COMMUNITY_URL = "#"} = process.env;

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
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
    .video-wrapper iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
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
    .btn-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff;
    }
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
    <a class="btn btn-primary" href="${UGC_CLUB_URL}">🎬 Enter UGC Club</a>
    <a class="btn btn-secondary" href="${PRIVATE_COMMUNITY_URL}">🔒 Join Private Community</a>
  </div>
</body>
</html>`);
});

app.post(WEBHOOK_PATH, webhookCallback(bot, "express"));
app.get("/health", (_req, res) => res.json({status: "ok"}));

export default app;
