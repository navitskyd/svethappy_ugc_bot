import {Bot} from "grammy";
import {conversations, createConversation} from "@grammyjs/conversations";
import {onboarding, setStartPayload} from "./conversations/onboarding.js";
import {CUSTOMERS_COLLECTION, db} from "./firestore.js";

const {BOT_TOKEN, PRIVACY_POLICY_URL, OFFER_URL, SUPPORT_EMAIL} = process.env;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not set in .env");

export const bot = new Bot(BOT_TOKEN);

bot.use(conversations());
bot.use(createConversation(onboarding));

// ── /start ────────────────────────────────────────────────────────────────
bot.command("start", async (ctx) => {
    await ctx.conversation.exit(); // reset any active scenario
    const name = ctx.from?.first_name ?? "друг";

    // Parse deep-link payload: /start <context>_<instagramNick>
    // e.g. /start UGC_johndoe  or  /start Travel
    const raw = ctx.match?.trim() ?? "";
    const parts = raw.split("-");
    const startPayload = {
        context: parts[0] ?? "",
        instagramNick: parts[1] ?? null,
    };

    await ctx.reply(
        `👋 Привет, <b>${name}</b>! Вас приветствует помощник SvetHappy.`,
        {parse_mode: "HTML"}
    );
    setStartPayload(ctx.from.id, startPayload);
    await ctx.conversation.enter("onboarding");
});

// ── /profile ──────────────────────────────────────────────────────────────
bot.command("profile", async (ctx) => {
    const privacy = PRIVACY_POLICY_URL || "https://svet-happy.web.app/privacy.html";
    const offer = OFFER_URL || "https://svet-happy.web.app/offer.html";
    const support = SUPPORT_EMAIL || "svethappy.support@gmail.com";

    const snap = await db.collection(CUSTOMERS_COLLECTION).doc(String(ctx.from.id)).get();
    const email = snap.exists && snap.data().email ? snap.data().email : "не указан";

    await ctx.reply(
        "👤 <b>Ваш профиль</b>\n\n" +
        `📧 <b>Email:</b> <code>${email}</code>\n\n` +
        `📄 <b>Документы:</b>\n` +
        `🔒 <a href="${privacy}">Политика конфиденциальности</a>\n` +
        `📋 <a href="${offer}">Публичная оферта</a>\n\n` +
        `💬 <b>Поддержка:</b> <a href="mailto:${support}">${support}</a>`,
        {
            parse_mode: "HTML",
            link_preview_options: {is_disabled: true},
        }
    );
});

// ── /law  /terms ──────────────────────────────────────────────────────────
async function sendLegalLinks(ctx) {
    const privacy = PRIVACY_POLICY_URL || "https://svet-happy.web.app/privacy.html";
    const offer = OFFER_URL || "https://svet-happy.web.app/offer.html";
    await ctx.reply(
        "📄 <b>Юридические документы</b>\n\n" +
        `🔒 <a href="${privacy}">Политика конфиденциальности</a>\n` +
        `📋 <a href="${offer}">Публичная оферта</a>`,
        {parse_mode: "HTML", link_preview_options: {is_disabled: true}}
    );
}

bot.command("law", sendLegalLinks);
bot.command("terms", sendLegalLinks);

// ── Register bot menu commands ─────────────────────────────────────────────
bot.api.setMyCommands([
    {command: "start", description: "Начать / зарегистрироваться"},
    {command: "profile", description: "Мой профиль, email и документы"},
    {command: "law", description: "Юридические документы"},
]).catch((e) => console.error("setMyCommands failed:", e));

bot.catch((err) => {
    console.error("Bot error:", err);
});
