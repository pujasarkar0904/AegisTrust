import { Router } from "express";
import { db } from "@aegistrust/db/client";
import { certificates, domHashes, ips, threatEvents } from "@aegistrust/db/schema";
import { requireAuth } from "../middleware/requireAuth.js";

export const graphRouter: ReturnType<typeof Router> = Router();
graphRouter.get("/graph", requireAuth, async (_req, res) => {
  try {
    const [events, ipRows, certRows, hashRows] = await Promise.all([
      db.select().from(threatEvents).orderBy(threatEvents.createdAt).limit(150),
      db.select().from(ips).limit(150), db.select().from(certificates).limit(150), db.select().from(domHashes).limit(150)
    ]);
    const nodes: Array<{ data: { id: string; label: string; kind: string; weight: number } }> = [];
    const edges: Array<{ data: { id: string; source: string; target: string } }> = [];
    const ipById = new Map(ipRows.map(row => [row.id, row]));
    const certById = new Map(certRows.map(row => [row.id, row]));
    const hashById = new Map(hashRows.map(row => [row.id, row]));
    for (const event of events) {
      const domainId = `domain:${event.domainName}`;
      nodes.push({ data: { id: domainId, label: event.domainName, kind: "domain", weight: 100 - event.trustScore } });
      for (const [id, label, kind] of [
        event.ipId ? [`ip:${event.ipId}`, ipById.get(event.ipId)?.ipAddress ?? "IP indicator", "ip"] : null,
        event.certId ? [`cert:${event.certId}`, certById.get(event.certId)?.issuer ?? "TLS certificate", "certificate"] : null,
        event.domHashId ? [`dom:${event.domHashId}`, (hashById.get(event.domHashId)?.hashValue ?? "DOM").slice(0, 12), "dom"] : null
      ].filter(Boolean) as string[][]) {
        if (!nodes.some(node => node.data.id === id)) nodes.push({ data: { id, label, kind, weight: 60 } });
        edges.push({ data: { id: `${domainId}->${id}`, source: domainId, target: id } });
      }
    }
    return res.json({ nodes, edges, updatedAt: new Date().toISOString() });
  } catch { return res.status(503).json({ error: "Threat graph database is unavailable." }); }
});
