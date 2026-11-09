import type { ThreatVerdict } from "@aegistrust/core";
export function TrustBadge({ score, verdict }: { score: number; verdict: ThreatVerdict }) {
  const label = verdict === "phishing" ? "HIGH RISK" : verdict === "suspicious" ? "CAUTION" : verdict === "clean" ? "LOW RISK" : "INCOMPLETE";
  return <div className={`trust-badge ${verdict}`} aria-label={`${label}, trust score ${score} out of 100`}><span className="trust-score">{score}<small>/100</small></span><span className="trust-label">{label}</span></div>;
}
