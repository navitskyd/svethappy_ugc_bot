import "dotenv/config";
import {Bot, InlineKeyboard} from "grammy";
import {conversations, createConversation} from "@grammyjs/conversations";

const {BOT_TOKEN} = process.env;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not set in .env");

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

    // Step 2 – email
    await ctx.reply("📧 Пожалуйста, введите ваш <b>email</b>:", {parse_mode: "HTML"});

    let email = null;
    while (!email) {
        const emailCtx = await conversation.waitFor("message:text");
        const input = emailCtx.message.text.trim();
        if (EMAIL_RE.test(input)) {
            email = input;
        } else {
            await emailCtx.reply("⚠️ Некорректный email. Пожалуйста, введите действующий адрес электронной почты.");
        }
    }

    // Step 3 – summary
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