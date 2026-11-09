const STORAGE_KEY = "aegisBlockedDomains";
const RULE_BASE = 1000;
function normalizeDomain(input: string): string | null {
  const domain = input.toLowerCase().replace(/^\*\./, "").replace(/\.$/, "");
  return /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(domain) ? domain : null;
}
export async function getBlockedDomains(): Promise<string[]> {
  const value = await chrome.storage.local.get(STORAGE_KEY);
  return Array.isArray(value[STORAGE_KEY]) ? value[STORAGE_KEY] as string[] : [];
}
export async function replaceBlockedDomains(inputs: string[]): Promise<void> {
  const domains = [...new Set(inputs.map(normalizeDomain).filter((domain): domain is string => Boolean(domain)))].slice(-4000);
  await chrome.storage.local.set({ [STORAGE_KEY]: domains });
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const addRules = domains.map((host, index) => ({
    id: RULE_BASE + index,
    priority: 1,
    action: { type: chrome.declarativeNetRequest.RuleActionType.REDIRECT, redirect: { extensionPath: "/blocked.html" } },
    condition: { urlFilter: `||${host}^`, resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME] }
  }));
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: existing.map(rule => rule.id), addRules });
}
export async function addBlockedDomain(input: string): Promise<void> {
  const domain = normalizeDomain(input);
  if (!domain) return;
  const current = await getBlockedDomains();
  if (current.includes(domain)) return;
  await replaceBlockedDomains([...current, domain]);
}
