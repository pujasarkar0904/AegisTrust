import type { AiAssessment, ReconResult } from "@aegistrust/core";
import { config } from "../config.js";
export interface SandboxResult { domHash: string; ai: AiAssessment; screenshotDataUrl?: string }
async function postJson<T>(endpoint: string, url: string): Promise<T> {
  const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }), signal: AbortSignal.timeout(22_000) });
  if (!response.ok) throw new Error(`Worker returned ${response.status}.`);
  return response.json() as Promise<T>;
}
export async function runParallelWorkers(url: string): Promise<[PromiseSettledResult<ReconResult>, PromiseSettledResult<SandboxResult>]> {
  const [recon, sandbox] = await Promise.allSettled([
    postJson<ReconResult>(`${config.reconUrl}/recon`, url),
    postJson<SandboxResult>(`${config.sandboxUrl}/detonate`, url)
  ]);
  return [recon, sandbox];
}
