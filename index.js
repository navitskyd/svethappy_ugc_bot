import "dotenv/config";
import express from "express";
import {Bot, webhookCallback} from "grammy";

const {
    BOT_TOKEN,
    WEBHOOK_URL,
    WEBHOOK_PATH = "/webhook",
    PORT = "3000",
} = process.env;

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not set in .env");

// ---------------------------------------------------------------------------
// Bot
// ---------------------------------------------------------------------------

const bot = new Bot(BOT_TOKEN);

bot.command("start", async (ctx) => {
    const name = ctx.from?.first_name ?? "there";
    await ctx.reply(
        `Hi <b>${name}</b>! 👋 I'm SvetHappy UGC Bot.\nSend me anything and I'll echo it back.`,
        {parse_mode: "HTML"}
    );
});

bot.command("help", async (ctx) => {
    await ctx.reply(
        "Available commands:\n/start – Start the bot\n/help  – Show this help message"
    );
});

bot.on("message:text", async (ctx) => {
    await ctx.reply(ctx.message.text);
});

bot.catch((err) => {
    console.error("Bot error:", err);
});

// ---------------------------------------------------------------------------
// Express + webhook
// ---------------------------------------------------------------------------

const app = express();
app.use(express.json());

app.post(WEBHOOK_PATH, webhookCallback(bot, "express"));

app.get("/health", (_req, res) => {
    res.json({status: "ok"});
});

// ---------------------------------------------------------------------------
// Export for Vercel (serverless) – no app.listen()
// ---------------------------------------------------------------------------

export default app;

