import { Redis } from "ioredis";
import type { ScanResult } from "@aegistrust/core";
import { config } from "../config.js";

export const redis = new Redis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false });
export async function getCachedScan(key: string): Promise<ScanResult | null> {
  try { const value = await redis.get(`scan:${key}`); return value ? { ...(JSON.parse(value) as ScanResult), cached: true } : null; }
  catch { return null; }
}
export async function cacheScan(key: string, result: ScanResult): Promise<void> {
  try {
    const value = JSON.stringify(result);
    if (result.verdict === "phishing") await redis.set(`scan:${key}`, value);
    else await redis.set(`scan:${key}`, value, "EX", config.cleanTtlSeconds);
  } catch { /* The database remains authoritative when Redis is unavailable. */ }
}
