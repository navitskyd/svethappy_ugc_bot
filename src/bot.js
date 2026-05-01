import {Bot} from "grammy";
import {conversations, createConversation} from "@grammyjs/conversations";
import {onboarding} from "./conversations/onboarding.js";

const {BOT_TOKEN} = process.env;
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

bot.catch((err) => {
    console.error("Bot error:", err);
});

