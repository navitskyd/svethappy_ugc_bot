import {InlineKeyboard} from "grammy";
import {FieldValue} from "firebase-admin/firestore";
import {CUSTOMERS_COLLECTION, db} from "../firestore.js";
import {EMAIL_RE, formatUserSummary} from "../helpers.js";
import {ugcFlow} from "./ugcFlow.js";

const {LANDING_PAGE, PRIVACY_POLICY_URL = "", OFFER_URL = ""} = process.env;

function isStart(ctx) {
    return ctx.message?.text?.trim().startsWith("/start");
}

/**
 * @param {import("@grammyjs/conversations").Conversation} conversation
 * @param {import("grammy").Context} ctx
 * @param {{ context?: string, instagramNick?: string }} [startPayload]
 */
export async function onboarding(conversation, ctx, startPayload) {
    console.log("startPayload:", startPayload);
    const flowContext = (startPayload?.context ?? "").toUpperCase();
    const instagramNick = startPayload?.instagramNick ?? null;
    const policyLink = PRIVACY_POLICY_URL
        ? `<a href="${PRIVACY_POLICY_URL}">Политикой конфиденциальности</a>`
        : "Политикой конфиденциальности";
    const offerLink = OFFER_URL
        ? `<a href="${OFFER_URL}">Офертой</a>`
        : "Офертой";

    // ── Check existing registration ──────────────────────────────────────
    const docRef = db.collection(CUSTOMERS_COLLECTION).doc(String(ctx.from.id));
    const existingSnap = await conversation.external(() => docRef.get());
    const existingData = existingSnap.exists ? existingSnap.data() : {};
    const existingEmail = existingData.email ?? null;

    let email = null;

    if (existingEmail) {
        // User already registered – show existing info and ask to confirm
        const confirmKeyboard = new InlineKeyboard()
            .text("✅ Всё верно", "confirm_existing")
            .text("✏️ Изменить email", "change_existing");

        await ctx.reply(
            `👋 Вы уже зарегистрированы!\n\n` +
            `📧 <b>Email:</b> <code>${existingEmail}</code>\n` +
            `👤 <b>Имя:</b> ${ctx.from.first_name ?? "—"}` + (ctx.from.last_name ? ` ${ctx.from.last_name}` : "") + `\n` +
            `🆔 <b>Telegram ID:</b> <code>${ctx.from.id}</code>\n\n` +
            `Подтвердите данные или измените email:`,
            {parse_mode: "HTML", link_preview_options: {is_disabled: true}, reply_markup: confirmKeyboard}
        );

        const existingCtx = await conversation.waitForCallbackQuery(["confirm_existing", "change_existing"]);
        await existingCtx.answerCallbackQuery();

        if (existingCtx.callbackQuery.data === "confirm_existing") {
            await existingCtx.editMessageText(
                `✅ Данные подтверждены.\n📧 Email: <b>${existingEmail}</b>`,
                {parse_mode: "HTML"}
            );
            email = existingEmail;
        } else {
            await existingCtx.editMessageText("✏️ Хорошо, введите новый email:");
        }
    }

    if (!email && !existingEmail) {
        // ── Step 1 – greeting + consent ──────────────────────────────────
        const consentKeyboard = new InlineKeyboard()
            .text("✅ Согласен", "consent_agree")
            .text("❌ Не согласен", "consent_disagree");

        await ctx.reply(
            `👋 Привет!\n\n` +
            `Чтобы получить доступ к <b>материалам SvetHappy</b>, мне понадобится ваш email.\n\n` +
            `Вводя свои данные, вы даёте согласие на обработку данных вашего профиля Telegram и email в соответствии с ${policyLink} и принимаете условия ${offerLink}.\n\n` +
            `🔒 Ваши данные в безопасности и обрабатываются согласно стандартам GDPR.`,
            {parse_mode: "HTML", link_preview_options: {is_disabled: true}, reply_markup: consentKeyboard}
        );

        const consentCtx = await conversation.waitForCallbackQuery(["consent_agree", "consent_disagree"]);
        await consentCtx.answerCallbackQuery();

        if (consentCtx.callbackQuery.data === "consent_disagree") {
            await consentCtx.editMessageText(
                "❌ Вы отказались от обработки персональных данных. Без согласия мы не можем продолжить.\n\n" +
                "Если передумаете — введите /start.",
                {parse_mode: "HTML"}
            );
            return;
        }

        await consentCtx.editMessageText(
            `✅ Спасибо за согласие!\n\nПожалуйста, введите ваш email ниже:`,
            {parse_mode: "HTML"}
        );
    }

    // ── Step 2 – email loop (only when email not yet confirmed) ──────────
    while (!email) {
        let candidate = null;
        while (!candidate) {
            const emailCtx = await conversation.waitFor("message:text");
            if (isStart(emailCtx)) return;
            const input = emailCtx.message.text.trim();
            if (EMAIL_RE.test(input)) {
                candidate = input;
            } else {
                await emailCtx.reply("⚠️ Некорректный email. Пожалуйста, введите действующий адрес электронной почты.");
            }
        }

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

    // ── Step 3 – save to Firestore ────────────────────────────────────────
    // Re-use already fetched snapshot (existingData), no extra read needed
    const prev = Array.isArray(existingData.backupEmails) ? existingData.backupEmails : [];
    const merged = existingData.email && existingData.email !== email
        ? [...prev, existingData.email]
        : [...prev];
    const backupEmails = [...new Set(merged)].filter(e => e !== email).slice(-5);

    const existingContexts = Array.isArray(existingData.context) ? existingData.context : [];
    const contexts = flowContext
        ? [...new Set([...existingContexts, flowContext])]
        : existingContexts;

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
        ...(instagramNick && {instagramNick}),
        ...(contexts.length > 0 && {context: contexts}),
        updatedAt: FieldValue.serverTimestamp(),
        ...(!existingSnap.exists && {createdAt: FieldValue.serverTimestamp()}),
    }, {merge: true});

    // ── Step 4 – show summary ────────────────────────────────────────────
    await ctx.reply(formatUserSummary(ctx.from, email), {parse_mode: "HTML"});

    // ── Step 5 – context-specific flow ───────────────────────────────────
    if (flowContext === "UGC") {
        await ugcFlow(ctx, email, instagramNick);
    } else {
        await ctx.reply(
            "🎉 Добро пожаловать в наше сообщество!\n\n" +
            "Переходи на наш сайт и приятного просмотра 👇\n\n" +
            `🌐 ${LANDING_PAGE}?email=` + encodeURIComponent(email) + "&telegram_id=" + ctx.from.id,
        );
    }
}
