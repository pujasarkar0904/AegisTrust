import "./load-env.js";
import express from "express";
import { z } from "zod";
import { runRecon } from "./scanners/recon.js";
import { countRelatedThreats } from "./analyzer/graphCheck.js";
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.get("/health", (_req, res) => res.json({ ok: true, service: "recon-worker" }));
app.post("/recon", async (req, res) => {
  const parsed = z.object({ url: z.string().url().max(2048) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Provide a valid URL." });
  try {
    const recon = await runRecon(parsed.data.url);
    const relatedThreats = await countRelatedThreats(recon.addresses, recon.tls?.serialNumber);
    return res.json({ ...recon, relatedThreats });
  } catch (error) { return res.status(422).json({ error: error instanceof Error ? error.message : "Recon failed." }); }
});
const port = Number(process.env.RECON_PORT ?? 4101);
const bindHost = process.env.BIND_HOST ?? "127.0.0.1";
app.listen(port, bindHost, () => console.log(`Recon worker listening on ${bindHost}:${port}`));
