import express from "express";
import {webhookCallback} from "grammy";
import {bot} from "./bot.js";

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

export default app;
