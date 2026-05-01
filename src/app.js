import express from "express";
import {webhookCallback} from "grammy";
import {bot} from "./bot.js";
import homeRouter from "./routes/home.js";
import privacyRouter from "./routes/privacy.js";

const {WEBHOOK_PATH = "/webhook"} = process.env;

const app = express();
app.use(express.json());

app.use(homeRouter);
app.use(privacyRouter);
app.post(WEBHOOK_PATH, webhookCallback(bot, "express"));
app.get("/health", (_req, res) => res.json({status: "ok"}));

export default app;

