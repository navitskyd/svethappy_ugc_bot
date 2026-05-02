import express from "express";
import {webhookCallback} from "grammy";
import {bot} from "./bot.js";
import {db} from "./firestore.js";

const {WEBHOOK_PATH = "/webhook"} = process.env;

const app = express();
app.use(express.json());

app.post(WEBHOOK_PATH, webhookCallback(bot, "express"));
app.get("/health", (_req, res) => res.json({status: "ok"}));

const NON_SENSITIVE_KEYS = [
    "PRIVACY_POLICY_URL",
    "OFFER_URL"
];

app.get("/info", (_req, res) => {
    const info = {};
    for (const key of NON_SENSITIVE_KEYS) {
        info[key] = process.env[key] ?? null;
    }
    res.json(info);
});

app.post("/processPayment", async (req, res) => {
    const {email, telegramId, message} = req.body;

    if (!email || !telegramId) {
        return res.status(400).json({error: "email and telegramId are required"});
    }

    const ADMIN_ID = 553384344;

    try {
        // Verify that email and telegramId belong to the same Firestore document
        const snapshot = await db.collection("svethappy_ugc")
            .where("telegramId", "==", String(telegramId))
            .limit(1)
            .get();

        let verified = false;
        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            if (data.email && data.email.toLowerCase() === email.toLowerCase()) {
                verified = true;
            }
        }

        if (!verified) {
            // Find what telegramId is linked to
            const telegramLinkedEmail = !snapshot.empty
                ? (snapshot.docs[0].data().email || "—")
                : "не найден в базе";

            // Find what email is linked to
            const emailSnapshot = await db.collection("svethappy_ugc")
                .where("email", "==", email.toLowerCase())
                .limit(1)
                .get();
            const emailLinkedTelegramId = !emailSnapshot.empty
                ? (emailSnapshot.docs[0].data().telegramId || "—")
                : "не найден в базе";

            const alertText =
                `⚠️ processPayment: несовпадение данных!\n\n` +
                `Входящие данные:\n` +
                `  Email: ${email}\n` +
                `  Telegram ID: ${telegramId}\n\n` +
                `В Firestore:\n` +
                `  Telegram ID ${telegramId} привязан к email: ${telegramLinkedEmail}\n` +
                `  Email ${email} привязан к Telegram ID: ${emailLinkedTelegramId}\n\n` +
                `Требуется проверка.`;
            await bot.api.sendMessage(ADMIN_ID, alertText);
        }

        const text = message || `✅ Оплата получена!\n\nEmail: ${email}\nTelegram ID: ${telegramId}`;
        await bot.api.sendMessage(telegramId, text);
        res.json({success: true});
    } catch (err) {
        console.error("processPayment error:", err);
        res.status(500).json({error: err.message});
    }
});

export default app;
