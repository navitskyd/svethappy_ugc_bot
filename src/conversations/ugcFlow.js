const {LANDING_PAGE} = process.env;

/**
 * Called after onboarding is complete when context === "UGC".
 * Sends a welcome message with the UGC landing page link.
 *
 * @param {import("grammy").Context} ctx
 * @param {string} email
 * @param {string|null} instagramNick
 */
export async function ugcFlow(ctx, email, instagramNick) {
    const landingUrl = LANDING_PAGE
        ? `${LANDING_PAGE}?email=${encodeURIComponent(email)}&telegram_id=${ctx.from.id}`
        : null;

    const igLine = instagramNick
        ? `\n📸 Instagram: <b>@${instagramNick}</b>`
        : "";

    await ctx.reply(
        `🎉 <b>Добро пожаловать в UGC Club!</b>${igLine}\n\n` +
        `Переходи на наш сайт и приятного просмотра 👇\n\n` +
        (landingUrl ? `🌐 <a href="${landingUrl}">Войти в UGC Club</a>` : ""),
        {
            parse_mode: "HTML",
            link_preview_options: {is_disabled: true},
        }
    );
}

