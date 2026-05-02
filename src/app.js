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
        const emailLower = email.toLowerCase();

        // Doc ID is telegramId
        const docRef = db.collection("svethappy_ugc").doc(String(telegramId));
        const docSnap = await docRef.get();

        // Fetch all documents and search manually (structure: docId=telegramId, fields={email, backupEmails, ...})
        const allDocs = await db.collection("svethappy_ugc").get();

        let verified = false;
        let emailLinkedTelegramId = "не найден в базе";
        let emailFoundIn = "";

        for (const doc of allDocs.docs) {
            const data = doc.data();
            const docEmails = [
                ...(data.email ? [data.email.toLowerCase()] : []),
                ...(Array.isArray(data.backupEmails) ? data.backupEmails.map(e => e.toLowerCase()) : [])
            ];

            if (docEmails.includes(emailLower)) {
                // Found which doc owns this email
                if (doc.id === String(telegramId)) {
                    verified = true;
                    break;
                } else {
                    // Email belongs to a different telegramId
                    emailLinkedTelegramId = doc.id;
                    emailFoundIn = data.email && data.email.toLowerCase() === emailLower
                        ? " (основной email)"
                        : " (в backupEmails)";
                }
            }
        }

        if (!verified) {
            // What telegramId doc holds
            const telegramLinkedEmail = docSnap.exists ? (docSnap.data().email || "—") : "не найден в базе";
            const telegramLinkedBackupEmails = docSnap.exists && Array.isArray(docSnap.data().backupEmails)
                ? docSnap.data().backupEmails.join(", ") || "—"
                : "—";


            const alertText =
                `⚠️ processPayment: несовпадение данных!\n\n` +
                `Входящие данные:\n` +
                `  Email: ${email}\n` +
                `  Telegram ID: ${telegramId}\n\n` +
                `В Firestore:\n` +
                `  Telegram ID ${telegramId} привязан к email: ${telegramLinkedEmail}\n` +
                `  Telegram ID ${telegramId} backupEmails: ${telegramLinkedBackupEmails}\n` +
                `  Email ${email} привязан к Telegram ID: ${emailLinkedTelegramId}${emailFoundIn}\n\n` +
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
