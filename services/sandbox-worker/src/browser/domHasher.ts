import { createHash } from "node:crypto";

export function summarizeDom(html: string): { hash: string; summary: string; credentialForm: boolean } {
  const normalized = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "<script></script>")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "<style></style>")
    .replace(/\s(?:value|nonce|data-[\w-]+|id|class)=("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/>[^<]+</g, "><")
    .replace(/\s+/g, " ")
    .toLowerCase();
  const hash = createHash("sha256").update(normalized).digest("hex");
  const tags = [...normalized.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/g)].slice(0, 300);
  const forms = tags.filter(([, tag]) => tag === "form").length;
  const inputs = tags.filter(([, tag]) => tag === "input").length;
  const passwordInputs = [...normalized.matchAll(/<input\b[^>]*type\s*=\s*["']?password/gi)].length;
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, " ").trim().slice(0, 120) ?? "";
  return { hash, summary: JSON.stringify({ title, tags: tags.slice(0, 150).map(([, tag]) => tag), formCount: forms, inputCount: inputs, passwordInputCount: passwordInputs }), credentialForm: passwordInputs > 0 };
}
