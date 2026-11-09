import { getBlockedDomains } from "./blocklist.js";
export async function isBlocked(url?: string): Promise<boolean> {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    const domains = await getBlockedDomains();
    return domains.some(domain => host === domain || host.endsWith(`.${domain}`));
  } catch { return false; }
}
