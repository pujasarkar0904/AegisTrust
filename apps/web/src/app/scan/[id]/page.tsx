"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ScanResult } from "@aegistrust/core";
import { TrustBadge } from "../../../components/TrustBadge";
export default function ScanResultPage() {
  const params = useParams<{ id: string }>();
  const [result, setResult] = useState<ScanResult | null>(null);
  useEffect(() => { try { const raw = localStorage.getItem(`aegis:scan:${params.id}`); if (raw) setResult(JSON.parse(raw)); } catch { setResult(null); } }, [params.id]);
  if (!result) return <main className="shell"><header className="topbar"><a className="brand" href="/">AEGISTRUST</a></header><section className="empty-state"><h1>Scan report not found</h1><p>Reports are stored in this browser session. Run a fresh scan to continue.</p><a className="button-link" href="/">Back to scanner →</a></section></main>;
  return <main className="shell"><header className="topbar"><a className="brand" href="/">AEGISTRUST</a><a className="nav-link" href="/">← New scan</a></header><section className="result-card standalone-result"><div className="result-head"><div><div className="section-kicker">SAVED SCAN REPORT</div><h1>{result.domain}</h1><a className="muted-link" href={result.url}>{result.url}</a></div><TrustBadge score={result.trustScore} verdict={result.verdict}/></div><h2>Why this score</h2><ul className="reason-list">{result.reasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul><p className="scan-note">This score is a triage signal, not a guarantee. Verify independently before acting.</p></section></main>;
}
