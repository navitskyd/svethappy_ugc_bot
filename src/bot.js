import {Bot} from "grammy";
import {conversations, createConversation} from "@grammyjs/conversations";
import {onboarding} from "./conversations/onboarding.js";

const {BOT_TOKEN, PRIVACY_POLICY_URL, OFFER_URL} = process.env;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not set in .env");

export const bot = new Bot(BOT_TOKEN);

bot.use(conversations());
bot.use(createConversation(onboarding));

bot.command("start", async (ctx) => {
    const name = ctx.from?.first_name ?? "друг";
    await ctx.reply(
        `👋 Привет, <b>${name}</b>! Добро пожаловать в SvetHappy UGC Bot.`,
        {parse_mode: "HTML"}
    );
    await ctx.conversation.enter("onboarding");
});

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

bot.catch((err) => {
    console.error("Bot error:", err);
});



