import { Router } from "express";
import { z } from "zod";
import { scanUrl, type PublishThreat } from "../orchestrator/scan.js";
import { requireAuth } from "../middleware/requireAuth.js";

const bodySchema = z.object({ url: z.string().trim().min(1).max(2048) });
export function scanRouter(publishThreat: PublishThreat): ReturnType<typeof Router> {
  const router = Router();
  router.post("/scan", requireAuth, async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Enter a valid HTTP or HTTPS URL (max 2048 characters)." });
    try { return res.json(await scanUrl(parsed.data.url, publishThreat)); }
    catch (error) { return res.status(422).json({ error: error instanceof Error ? error.message : "The scan could not be completed." }); }
  });
  return router;
}
