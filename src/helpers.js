// RFC 5322-inspired regex: validates local part, @, domain, and TLD (2+ chars)
export const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export function formatUserSummary(from, email) {
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

