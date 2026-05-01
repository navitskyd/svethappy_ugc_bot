#!/usr/bin/env node
/**
 * Manually manage the Telegram webhook.
 * Usage: node webhook_manager.js [set|delete|info]
 */

import "dotenv/config";
import {Bot} from "grammy";

const {BOT_TOKEN, WEBHOOK_URL, WEBHOOK_PATH = "/webhook"} = process.env;

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not set in .env");

const bot = new Bot(BOT_TOKEN);
const webhookFullUrl = `${(WEBHOOK_URL ?? "").replace(/\/$/, "")}${WEBHOOK_PATH}`;

const commands = {
    async set() {
        const result = await bot.api.setWebhook(webhookFullUrl);
        console.log("setWebhook →", result);
        const info = await bot.api.getWebhookInfo();
        console.log("Webhook info:", info);
    },
    async delete() {
        const result = await bot.api.deleteWebhook();
        console.log("deleteWebhook →", result);
    },
    async info() {
        const info = await bot.api.getWebhookInfo();
        console.log("Webhook info:", info);
    },
};

const cmd = process.argv[2] ?? "info";
if (!commands[cmd]) {
    console.error("Usage: node webhook_manager.js [set|delete|info]");
    process.exit(1);
}

commands[cmd]()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });

