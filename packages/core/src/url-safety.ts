import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { normalizeUrl } from "./normalize.js";

function isPrivateIPv4(ip: string): boolean {
  const octets = ip.split(".").map(Number);
  const [a, b] = octets;
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
}
function isPrivateIPv6(ip: string): boolean {
  const v = ip.toLowerCase();
  return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb") || v.startsWith("ff") || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.");
}
export function isPublicAddress(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return !isPrivateIPv4(ip);
  if (family === 6) return !isPrivateIPv6(ip);
  return false;
}
export async function assertPublicHttpUrl(input: string): Promise<URL> {
  const url = normalizeUrl(input);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) throw new Error("Local network hosts are not allowed.");
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) throw new Error("The URL resolves to a private or reserved network address and was blocked.");
  return url;
}
