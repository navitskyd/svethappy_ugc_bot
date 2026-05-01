import "dotenv/config";
import express from "express";
import { Bot, webhookCallback } from "grammy";
const {
  BOT_TOKEN,
  WEBHOOK_PATH = "/webhook",
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
    { parse_mode: "HTML" }
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
// ------------------------------------------------------------import express from "ereimport { Bot, webhookCallback--const {
  BOT_TOKEN,
  WEBHOOK_PATH = "/webho--  BOT_ns  WEBHOOK_Pre} = process.env;
if (!BOT_T))if (!BOT_TOKEN)OO// ------------------------------------------------------------re// Bot
// ---------------------------------------------------------------------// ----const bot = new Bot(BOT_TOKEN);
bot.command("start", async (ctx) => {
  const nbot.command("start", async (ct--  const name = ctx.from?.first_name --  await ctx.reply(
    `Hi <b>${name}</b>! ?
node --input-type=module --check < /Users/dzmitry.navitski/IdeaProjects/svethappy_ugc_bot/index.js && echo "Syntax OK"
node --input-type=module --check < /Users/dzmitry.navitski/IdeaProjects/svethappy_ugc_bot/index.js; echo "exit: $?"
cd /Users/dzmitry.navitski/IdeaProjects/svethappy_ugc_bot && node -e "import('./index.js').then(() => console.log('OK')).catch(e => console.error(e.message))"
cd /Users/dzmitry.navitski/IdeaProjects/svethappy_ugc_bot && npx vercel --version 2>/dev/null && npx vercel ls 2>&1 | head -20
cd /Users/dzmitry.navitski/IdeaProjects/svethappy_ugc_bot && cat .vercel/project.json 2>/dev/null || echo "not found"
cat > /Users/dzmitry.navitski/IdeaProjects/svethappy_ugc_bot/.env << 'EOF'
BOT_TOKEN=8782926474:AAH8PemeEsxCyJMiy8aEu54NQvbPdfTxGFI
WEBHOOK_URL=https://your-project.vercel.app
WEBHOOK_PATH=/webhook
