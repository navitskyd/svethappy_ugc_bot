import {InlineKeyboard} from "grammy";
import {FieldValue} from "firebase-admin/firestore";
import {db} from "../firestore.js";
import {EMAIL_RE, formatUserSummary} from "../helpers.js";

const {LANDING_PAGE} = process.env;

export async function onboarding(conversation, ctx) {
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

    // Step 4 – save to Firestore (move old email to backupEmails, keep last 5, no duplicates)
    const docRef = db.collection("svethappy_ugc").doc(String(ctx.from.id));
    const existing = await docRef.get();
    const existingData = existing.exists ? existing.data() : {};

    const prev = Array.isArray(existingData.backupEmails) ? existingData.backupEmails : [];
    const merged = existingData.email && existingData.email !== email
        ? [...prev, existingData.email]
        : [...prev];
    const backupEmails = [...new Set(merged)].filter(e => e !== email).slice(-5);

    const baseData = {
        telegramId: ctx.from.id,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name ?? null,
        username: ctx.from.username ?? null,
        languageCode: ctx.from.language_code ?? null,
        isBot: ctx.from.is_bot ?? false,
        email,
        consentGiven: true,
        backupEmails,
        updatedAt: FieldValue.serverTimestamp(),
        ...(!existing.exists && {createdAt: FieldValue.serverTimestamp()}),
    };

    await docRef.set(baseData, {merge: true});

    // Step 5 – show summary and navigation link
    await ctx.reply(formatUserSummary(ctx.from, email), {parse_mode: "HTML"});

    await ctx.reply(
        "🎉 Добро пожаловать в наше сообщество!\n\n" +
        "Переходи на наш сайт и приятного просмотра 👇\n\n" +
        `🌐 ${LANDING_PAGE}?email=` + encodeURIComponent(email) + "&telegramId=" + ctx.from.id,
    );
}

