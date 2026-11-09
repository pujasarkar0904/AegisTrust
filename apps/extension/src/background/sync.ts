import { io } from "socket.io-client";
import { addBlockedDomain, replaceBlockedDomains } from "./blocklist.js";
const API = import.meta.env.VITE_AEGIS_API_URL || "http://localhost:4000";
async function refreshBlocklist(): Promise<void> {
  try {
    const response = await fetch(`${API}/api/threats`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return;
    const data = await response.json() as { threats?: Array<{ domain?: string; verdict?: string }> };
    const domains = (data.threats ?? []).filter(threat => threat.verdict === "phishing").map(threat => threat.domain ?? "");
    await replaceBlockedDomains(domains);
  } catch { /* The last known local blocklist remains active while offline. */ }
}
export function connectThreatFeed(): void {
  const socket = io(API, { transports: ["websocket"], reconnection: true, reconnectionDelayMax: 30_000, timeout: 5000 });
  socket.on("connect", () => void refreshBlocklist());
  socket.on("threat:new", (event: { domain?: string; verdict?: string }) => {
    if (event.verdict === "phishing" && event.domain) void addBlockedDomain(event.domain);
  });
  void refreshBlocklist();
}
