export async function lookupAsnProvider(ip: string): Promise<string | undefined> {
  try {
    const response = await fetch(`https://rdap.org/ip/${encodeURIComponent(ip)}`, { headers: { accept: "application/rdap+json, application/json" }, signal: AbortSignal.timeout(3500) });
    if (!response.ok) return undefined;
    const data = await response.json() as { name?: string; handle?: string; country?: string };
    const owner = [data.name, data.handle, data.country].filter(Boolean).join(" · ");
    return owner ? owner.slice(0, 255) : undefined;
  } catch { return undefined; }
}
