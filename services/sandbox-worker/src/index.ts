import "./load-env.js";
import express from "express";
import { z } from "zod";
import { captureAndAssess } from "./browser/capturer.js";
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.get("/health", (_req, res) => res.json({ ok: true, service: "sandbox-worker" }));
app.post("/detonate", async (req, res) => {
  const parsed = z.object({ url: z.string().url().max(2048) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Provide a valid URL." });
  try { return res.json(await captureAndAssess(parsed.data.url)); }
  catch (error) { return res.status(422).json({ error: error instanceof Error ? error.message : "Sandbox scan failed." }); }
});
const port = Number(process.env.SANDBOX_PORT ?? 4102);
const bindHost = process.env.BIND_HOST ?? "127.0.0.1";
app.listen(port, bindHost, () => console.log(`Sandbox worker listening on ${bindHost}:${port}`));
