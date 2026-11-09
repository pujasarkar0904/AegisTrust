export interface ScoreInput { aiConfidence: number; relatedThreats: number; tlsPresent: boolean; credentialForm: boolean; warnings: string[] }
export function scoreTrust(input: ScoreInput): { trustScore: number; verdict: "clean" | "suspicious" | "phishing"; reasons: string[] } {
  const confidence = Math.max(0, Math.min(100, input.aiConfidence));
  const graphPenalty = Math.min(35, Math.max(0, input.relatedThreats) * 12);
  const tlsPenalty = input.tlsPresent ? 0 : 8;
  const formPenalty = input.credentialForm ? 14 : 0;
  const warningPenalty = Math.min(20, input.warnings.length * 5);
  const trustScore = Math.max(0, Math.min(100, Math.round(100 - confidence * 0.58 - graphPenalty - tlsPenalty - formPenalty - warningPenalty)));
  const reasons: string[] = [];
  if (confidence >= 45) reasons.push(`Content analysis raised ${confidence}% phishing confidence.`);
  if (input.relatedThreats) reasons.push(`${input.relatedThreats} related infrastructure indicator(s) have prior threat reports.`);
  if (!input.tlsPresent) reasons.push("No TLS certificate was observed.");
  if (input.credentialForm) reasons.push("A credential-entry form was detected.");
  reasons.push(...input.warnings);
  if (!reasons.length) reasons.push("No high-risk indicators were detected by the available checks.");
  return { trustScore, verdict: trustScore <= 25 ? "phishing" : trustScore <= 65 ? "suspicious" : "clean", reasons };
}
