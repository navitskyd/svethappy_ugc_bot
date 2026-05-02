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

        // Search by email across all docs (primary)
        const emailSnapshot = await db.collection("svethappy_ugc")
            .where("email", "==", emailLower)
            .limit(1)
            .get();

        // Search by email across all docs (backupEmails)
        const backupEmailSnapshot = emailSnapshot.empty
            ? await db.collection("svethappy_ugc")
                .where("backupEmails", "array-contains", emailLower)
                .limit(1)
                .get()
            : null;

        let verified = false;

        // Forward: telegramId doc contains the email
        if (docSnap.exists) {
            const data = docSnap.data();
            const primaryMatch = data.email && data.email.toLowerCase() === emailLower;
            const backupMatch = Array.isArray(data.backupEmails) &&
                data.backupEmails.some(e => e.toLowerCase() === emailLower);
            verified = primaryMatch || backupMatch;
        }

        // Reverse: email found in some doc and that doc's ID matches the telegramId
        if (!verified) {
            const reverseDocId = !emailSnapshot.empty
                ? emailSnapshot.docs[0].id
                : (!backupEmailSnapshot?.empty ? backupEmailSnapshot.docs[0].id : null);
            if (reverseDocId && reverseDocId === String(telegramId)) {
                verified = true;
            }
        }

        if (!verified) {
            // What telegramId doc holds
            const telegramLinkedEmail = docSnap.exists ? (docSnap.data().email || "—") : "не найден в базе";
            const telegramLinkedBackupEmails = docSnap.exists && Array.isArray(docSnap.data().backupEmails)
                ? docSnap.data().backupEmails.join(", ") || "—"
                : "—";

            let emailLinkedTelegramId = "не найден в базе";
            let emailFoundIn = "";
            if (!emailSnapshot.empty) {
                emailLinkedTelegramId = emailSnapshot.docs[0].id;
                emailFoundIn = " (основной email)";
            } else if (backupEmailSnapshot && !backupEmailSnapshot.empty) {
                emailLinkedTelegramId = backupEmailSnapshot.docs[0].id;
                emailFoundIn = " (в backupEmails)";
            }

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
