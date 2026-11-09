const TRACKING = /^(utm_[a-z0-9_]+|fbclid|gclid|mc_cid|mc_eid|ref)$/i;

export function normalizeUrl(input: string): URL {
  const value = input.trim();
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(withScheme);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only HTTP and HTTPS URLs are supported.");
  if (url.username || url.password) throw new Error("URLs containing credentials are not accepted.");
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) if (TRACKING.test(key)) url.searchParams.delete(key);
  url.hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) url.port = "";
  return url;
}

// Returns a conservative registrable-domain approximation. For production, use a regularly updated PSL.
export function baseDomain(hostname: string): string {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const labels = host.split(".");
  if (labels.length <= 2 || /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) return host;
  const twoPartSuffixes = new Set(["co.uk", "org.uk", "com.au", "co.jp", "com.br", "co.in"]);
  const suffix = labels.slice(-2).join(".");
  return labels.slice(twoPartSuffixes.has(suffix) ? -3 : -2).join(".");
}
