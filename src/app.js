import express from "express";
import {webhookCallback} from "grammy";
import {bot} from "./bot.js";
import {CUSTOMERS_COLLECTION, db} from "./firestore.js";
import {buildKey} from "./utils.js";
import {FieldValue} from "firebase-admin/firestore";

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

    if (!email && !telegramId) {
        return res.status(400).json({error: "email or telegramId are required"});
    }

    let userKey = telegramId;
    if(!userKey){
        userKey = buildKey(email);
    }

    const ADMIN_ID = 553384344;

    try {
        const emailLower = email.toLowerCase();

        // Doc ID is userKey
        const docRef = db.collection(CUSTOMERS_COLLECTION).doc(String(userKey));
        const docSnap = await docRef.get();

        let verified = false;
        let emailLinkedTelegramId = "не найден в базе";
        let emailFoundIn = "";

        if (docSnap.exists) {
            const data = docSnap.data();

            // Step 1: check primary email
            if (data.email && data.email.toLowerCase() === emailLower) {
                verified = true;
            }

            // Step 2: check backupEmails in same doc
            if (!verified && Array.isArray(data.backupEmails) &&
                data.backupEmails.some(e => e.toLowerCase() === emailLower)) {
                verified = true;
            }
        }

        // Step 3: full DB scan only if still not verified
        if (!verified) {
            const allDocs = await db.collection(CUSTOMERS_COLLECTION).get();
            for (const doc of allDocs.docs) {
                if (doc.id === String(userKey)) continue; // already checked above
                const data = doc.data();
                const docEmails = [
                    ...(data.email ? [data.email.toLowerCase()] : []),
                    ...(Array.isArray(data.backupEmails) ? data.backupEmails.map(e => e.toLowerCase()) : [])
                ];
                if (docEmails.includes(emailLower)) {
                    emailLinkedTelegramId = doc.id;
                    emailFoundIn = data.email && data.email.toLowerCase() === emailLower
                        ? " (основной email)"
                        : " (в backupEmails)";
                    break;
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
                `  Telegram ID: ${userKey}\n\n` +
                `В Firestore:\n` +
                `  Telegram ID ${userKey} привязан к email: ${telegramLinkedEmail}\n` +
                `  Telegram ID ${userKey} backupEmails: ${telegramLinkedBackupEmails}\n` +
                `  Email ${email} привязан к Telegram ID: ${emailLinkedTelegramId}${emailFoundIn}\n\n` +
                `Требуется проверка.`;
            await bot.api.sendMessage(ADMIN_ID, alertText);

        }

        await docRef.set({
            telegramId: userKey,
            email,
            updatedAt: FieldValue.serverTimestamp(),
            ...(!snapshot.exists && {createdAt: FieldValue.serverTimestamp()}),
        }, {merge: true});

        if(telegramId) {
            const text = message || `✅ Оплата получена!\n\nEmail: ${email}\nTelegram ID: ${telegramId}`;
            await bot.api.sendMessage(telegramId, text);
        }
        res.json({success: true});
    } catch (err) {
        console.error("processPayment error:", err);
        res.status(500).json({error: err.message});
    }
});

export default app;
