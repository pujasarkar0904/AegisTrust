import { assertPublicHttpUrl, type ReconResult } from "@aegistrust/core";
import { resolvePublicDns } from "./dnsResolv.js";
import { readTlsCertificate } from "./tlsCert.js";
import { lookupAsnProvider } from "./geoIp.js";
export async function runRecon(input: string): Promise<ReconResult> {
  const url = await assertPublicHttpUrl(input);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const { addresses, txtRecords } = await resolvePublicDns(host);
  const [tlsInfo, asnProvider] = await Promise.all([
    url.protocol === "https:" ? readTlsCertificate(addresses[0]!, host, Number(url.port || 443)) : Promise.resolve(undefined),
    lookupAsnProvider(addresses[0]!)
  ]);
  const warnings: string[] = [];
  if (url.protocol !== "https:") warnings.push("The submitted URL uses HTTP instead of HTTPS.");
  if (url.protocol === "https:" && !tlsInfo) warnings.push("TLS certificate details could not be retrieved.");
  return { hostname: host, addresses, txtRecords, ...(asnProvider ? { asnProvider } : {}), ...(tlsInfo ? { tls: tlsInfo } : {}), warnings };
}
