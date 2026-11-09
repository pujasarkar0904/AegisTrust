import { lookup, resolveTxt } from "node:dns/promises";
import { isPublicAddress } from "@aegistrust/core";
export async function resolvePublicDns(hostname: string): Promise<{ addresses: string[]; txtRecords: string[] }> {
  const records = await lookup(hostname, { all: true, verbatim: true });
  const addresses = [...new Set(records.map(record => record.address).filter(isPublicAddress))];
  if (!addresses.length) throw new Error("No public address found for host.");
  let txtRecords: string[] = [];
  try { txtRecords = (await resolveTxt(hostname)).map(chunks => chunks.join("")).slice(0, 40); } catch { /* TXT records are optional. */ }
  return { addresses, txtRecords };
}
