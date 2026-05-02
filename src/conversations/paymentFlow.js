import Stripe from "stripe";
import {FieldValue} from "firebase-admin/firestore";
import {CUSTOMERS_COLLECTION, db} from "../firestore.js";

import { Redis } from '@upstash/redis'

const {STRIPE_SECRET_KEY, LANDING_PAGE,REDIS_KV_REST_API_URL,REDIS_KV_REST_API_TOKEN} = process.env;
const redis = new Redis({
    url: REDIS_KV_REST_API_URL,
    token: REDIS_KV_REST_API_TOKEN,
});

/**
 * Handles post-payment registration.
 * Fetches Stripe session → extracts email + product → upserts Firestore doc.
 *
 * @param {import("grammy").Context} ctx
 * @param {string} sessionId  – Stripe Checkout Session ID (param1 from deep link)
 */
export async function paymentFlow(ctx, sessionId) {
    if (!STRIPE_SECRET_KEY) {
        console.error("STRIPE_SECRET_KEY is not set");
        await ctx.reply("⚠️ Ошибка конфигурации. Обратитесь в поддержку.");
        return;
    }

    if (!sessionId) {
        await ctx.reply("⚠️ Не удалось определить сессию оплаты. Обратитесь в поддержку.");
        return;
    }

    let shortKey = sessionId;
    sessionId = await redis.get(shortKey);
    redis.del(shortKey);

    if (!sessionId) {
        await ctx.reply("⚠️ Не удалось определить сессию оплаты. Обратитесь в поддержку.");
        return;
    }

    await ctx.reply("⏳ Проверяем вашу оплату...");

    let session;
    try {
        const stripe = new Stripe(STRIPE_SECRET_KEY);
        session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ["line_items.data.price.product"],
        });
    } catch (err) {
        console.error("Stripe session fetch error:", err);
        await ctx.reply("⚠️ Не удалось получить данные об оплате. Попробуйте позже или обратитесь �� поддержку.");
        return;
    }

    // ── Extract email ──────────────────────────────────────────────────���──
    const email = session.customer_details?.email ?? session.customer_email ?? null;
    if (!email) {
        await ctx.reply("⚠️ Не удалось определить email из сессии оплаты. Обратитесь в поддержку.");
        return;
    }

    // ── Extract purchased products ────────────────────────────────────────
    const newProducts = (session.line_items?.data ?? []).map((item) => {
        const product = item.price?.product;
        return {
            id: typeof product === "object" ? product.id : (product ?? "unknown"),
            name: typeof product === "object" ? (product.name ?? "—") : "—",
        };
    });

    // ── Upsert Firestore ──────────────────────────────────────────────────
    const docRef = db.collection(CUSTOMERS_COLLECTION).doc(String(ctx.from.id));
    const snapshot = await docRef.get();
    const existing = snapshot.exists ? snapshot.data() : {};

    // backupEmails: move old email if different
    const prev = Array.isArray(existing.backupEmails) ? existing.backupEmails : [];
    const merged = existing.email && existing.email !== email ? [...prev, existing.email] : [...prev];
    const backupEmails = [...new Set(merged)].filter(e => e !== email).slice(-5);

    // purchasedProducts: merge without duplicates (by id)
    const existingProducts = Array.isArray(existing.purchasedProducts) ? existing.purchasedProducts : [];
    const existingProductIds = new Set(existingProducts.map(p => p.id));
    const mergedProducts = [
        ...existingProducts,
        ...newProducts.filter(p => !existingProductIds.has(p.id)),
    ];

    // context[]
    const existingContexts = Array.isArray(existing.context) ? existing.context : [];
    const contexts = [...new Set([...existingContexts, "PAYMENT"])];

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
        purchasedProducts: mergedProducts,
        context: contexts,
        updatedAt: FieldValue.serverTimestamp(),
        ...(!snapshot.exists && {createdAt: FieldValue.serverTimestamp()}),
    }, {merge: true});

    // ── Confirm to user ───────��───────────────────────────────────────────
    const productList = newProducts.length
        ? newProducts.map(p => `• ${p.name}`).join("\n")
        : "—";

    const landingUrl = LANDING_PAGE
        ? `${LANDING_PAGE}?email=${encodeURIComponent(email)}&telegram_id=${ctx.from.id}`
        : null;

    await ctx.reply(
        `✅ <b>Оплата подтверждена!</b>\n\n` +
        `📧 <b>Email:</b> <code>${email}</code>\n` +
        `🛍 <b>Приобретен��:</b>\n${productList}\n\n` +
        (landingUrl ? `🌐 <a href="${landingUrl}">Перейти к материалам</a>\n\n` : "") +
        `Добро пожаловать! Приятного просмотра 🎉`,
        {parse_mode: "HTML", link_preview_options: {is_disabled: true}}
    );
}

