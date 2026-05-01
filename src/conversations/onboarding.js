import {InlineKeyboard} from "grammy";
import {FieldValue} from "firebase-admin/firestore";
import {db} from "../firestore.js";
import {EMAIL_RE, formatUserSummary} from "../helpers.js";

const {LANDING_PAGE, PRIVACY_POLICY_URL = "", OFFER_URL = ""} = process.env;

export async function onboarding(conversation, ctx) {
    const policyLink = PRIVACY_POLICY_URL
        ? `<a href="${PRIVACY_POLICY_URL}">Политикой конфиденциальности</a>`
        : "Политикой конфиденциальности";
    const offerLink = OFFER_URL
        ? `<a href="${OFFER_URL}">Офертой</a>`
        : "Офертой";

    // Step 1 – single greeting + consent + email prompt
    await ctx.reply(
        `👋 Привет!\n\n` +
        `Чтобы получить доступ к <b>SvetHappy UGC</b>, мне понадобится ваш email.\n\n` +
        `Вводя свои данные, вы даёте согласие на обработку данных вашего профиля Telegram и email в соответствии с ${policyLink} и принимаете условия ${offerLink}.\n\n` +
        `🔒 Ваши данные в безопасности и обрабатываются согласно стандартам GDPR.\n\n` +
        `Пожалуйста, введите ваш email ниже:`,
        {parse_mode: "HTML", link_preview_options: {is_disabled: true}}
    );

    // Step 2 – email loop until confirmed
    let email = null;
    while (!email) {
        // Wait for a valid email format
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

        // Step 3 – ask to confirm
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
            await ctx.reply("📧 Введите ваш email:");
        }
    }

    // Step 4 – save to Firestore (move old email to backupEmails, keep last 5, no duplicates)
    const docRef = db.collection("svethappy_ugc").doc(String(ctx.from.id));
    const snapshot = await docRef.get();
    const existingData = snapshot.exists ? snapshot.data() : {};

    const prev = Array.isArray(existingData.backupEmails) ? existingData.backupEmails : [];
    const merged = existingData.email && existingData.email !== email
        ? [...prev, existingData.email]
        : [...prev];
    const backupEmails = [...new Set(merged)].filter(e => e !== email).slice(-5);

    await docRef.set({
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
        ...(!snapshot.exists && {createdAt: FieldValue.serverTimestamp()}),
    }, {merge: true});

    // Step 5 – show summary and navigation link
    await ctx.reply(formatUserSummary(ctx.from, email), {parse_mode: "HTML"});

    await ctx.reply(
        "🎉 Добро пожаловать в наше сообщество!\n\n" +
        "Переходи на наш сайт и приятного просмотра 👇\n\n" +
        `🌐 ${LANDING_PAGE}?email=` + encodeURIComponent(email) + "&telegramId=" + ctx.from.id,
    );
}
