import { createHash, randomUUID } from "node:crypto";
import { assertPublicHttpUrl, baseDomain, scoreTrust, type AiAssessment, type ScanResult } from "@aegistrust/core";
import { db } from "@aegistrust/db/client";
import { certificates, domHashes, ips, threatEvents } from "@aegistrust/db/schema";
import { cacheScan, getCachedScan } from "./cache.js";
import { runParallelWorkers } from "./workerPool.js";

export type PublishThreat = (payload: { domain: string; verdict: string; trustScore: number; scannedAt: string }) => void;
async function persist(result: ScanResult): Promise<void> {
  if (result.verdict === "clean") return;
  try {
    const address = result.recon?.addresses[0];
    const serial = result.recon?.tls?.serialNumber;
    let ipId: string | undefined;
    let certId: string | undefined;
    let domHashId: string | undefined;
    if (address) {
      const [row] = await db.insert(ips).values({ ipAddress: address, asnProvider: result.recon?.asnProvider ?? null }).onConflictDoUpdate({ target: ips.ipAddress, set: { asnProvider: result.recon?.asnProvider ?? null } }).returning({ id: ips.id });
      ipId = row?.id;
    }
    if (serial) {
      const [row] = await db.insert(certificates).values({ serialNumber: serial, issuer: result.recon?.tls?.issuer ?? null }).onConflictDoUpdate({ target: certificates.serialNumber, set: { issuer: result.recon?.tls?.issuer ?? null } }).returning({ id: certificates.id });
      certId = row?.id;
    }
    if (result.domHash) {
      const [row] = await db.insert(domHashes).values({ hashValue: result.domHash }).onConflictDoUpdate({ target: domHashes.hashValue, set: { hashValue: result.domHash } }).returning({ id: domHashes.id });
      domHashId = row?.id;
    }
    await db.insert(threatEvents).values({ domainName: result.domain, ipId, certId, domHashId, aiConfidenceScore: result.ai?.confidence ?? 0, impersonatedBrand: result.ai?.brand, verdict: result.verdict, trustScore: result.trustScore }).onConflictDoUpdate({ target: threatEvents.domainName, set: { ipId, certId, domHashId, aiConfidenceScore: result.ai?.confidence ?? 0, impersonatedBrand: result.ai?.brand, verdict: result.verdict, trustScore: result.trustScore, createdAt: new Date() } });
  } catch (error) { console.warn("Threat graph persistence is unavailable:", error instanceof Error ? error.message : error); }
}
export async function scanUrl(input: string, publishThreat: PublishThreat): Promise<ScanResult> {
  const safeUrl = await assertPublicHttpUrl(input);
  const canonical = safeUrl.href;
  const cacheKey = createHash("sha256").update(canonical).digest("hex");
  const cached = await getCachedScan(cacheKey);
  if (cached) return cached;
  const domain = baseDomain(safeUrl.hostname);
  const [reconOutcome, sandboxOutcome] = await runParallelWorkers(canonical);
  const recon = reconOutcome.status === "fulfilled" ? reconOutcome.value : null;
  const sandbox = sandboxOutcome.status === "fulfilled" ? sandboxOutcome.value : null;
  if (!recon && !sandbox) throw new Error("Both scan workers are unavailable. Check the API and worker services.");
  const relatedThreats = recon?.relatedThreats ?? 0;
  const workerWarnings = [
    ...(reconOutcome.status === "rejected" ? ["Infrastructure reconnaissance did not complete."] : recon?.warnings ?? []),
    ...(sandboxOutcome.status === "rejected" ? ["Browser analysis did not complete."] : [])
  ];
  const ai: AiAssessment = sandbox?.ai ?? { confidence: 0, brand: null, credentialForm: false, explanation: "Content analysis was unavailable.", provider: "heuristic" };
  const scored = scoreTrust({ aiConfidence: ai.confidence, relatedThreats, tlsPresent: Boolean(recon?.tls), credentialForm: ai.credentialForm, warnings: workerWarnings });
  const result: ScanResult = {
    id: randomUUID(), url: canonical, domain, verdict: scored.verdict, trustScore: scored.trustScore,
    reasons: [...scored.reasons, ai.explanation], recon, ai, relatedThreats, domHash: sandbox?.domHash ?? null,
    ...(sandbox?.screenshotDataUrl ? { screenshotDataUrl: sandbox.screenshotDataUrl } : {}), scannedAt: new Date().toISOString()
  };
  await persist(result);
  await cacheScan(cacheKey, result);
  if (result.verdict === "phishing") publishThreat({ domain, verdict: result.verdict, trustScore: result.trustScore, scannedAt: result.scannedAt });
  return result;
}
