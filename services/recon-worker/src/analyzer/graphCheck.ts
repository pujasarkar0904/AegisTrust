import { and, eq, or } from "drizzle-orm";
import { db } from "@aegistrust/db/client";
import { certificates, ips, threatEvents } from "@aegistrust/db/schema";

export async function countRelatedThreats(addresses: string[], serialNumber?: string): Promise<number> {
  if (!addresses.length && !serialNumber) return 0;
  const ipRows = addresses.length ? await db.select({ id: ips.id }).from(ips).where(or(...addresses.map(address => eq(ips.ipAddress, address)))) : [];
  const certRows = serialNumber ? await db.select({ id: certificates.id }).from(certificates).where(eq(certificates.serialNumber, serialNumber)) : [];
  const indicators = [
    ...ipRows.map(row => eq(threatEvents.ipId, row.id)),
    ...certRows.map(row => eq(threatEvents.certId, row.id))
  ];
  if (!indicators.length) return 0;
  const matches = await db.select({ id: threatEvents.id }).from(threatEvents).where(and(
    or(...indicators), eq(threatEvents.isActive, true), or(eq(threatEvents.verdict, "phishing"), eq(threatEvents.verdict, "suspicious"))
  )).limit(25);
  return matches.length;
}
