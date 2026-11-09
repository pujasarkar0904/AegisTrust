import { Router } from "express";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@aegistrust/db/client";
import { threatEvents } from "@aegistrust/db/schema";
export const threatsRouter: ReturnType<typeof Router> = Router();
threatsRouter.get("/threats", async (_req, res) => {
  try {
    const rows = await db.select({ domain: threatEvents.domainName, verdict: threatEvents.verdict, trustScore: threatEvents.trustScore, scannedAt: threatEvents.createdAt })
      .from(threatEvents)
      .where(and(eq(threatEvents.isActive, true), or(eq(threatEvents.verdict, "phishing"), eq(threatEvents.verdict, "suspicious"))))
      .orderBy(desc(threatEvents.createdAt)).limit(4000);
    return res.json({ threats: rows });
  } catch { return res.status(503).json({ error: "Threat graph database is unavailable." }); }
});
