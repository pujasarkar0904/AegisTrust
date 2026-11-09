"use client";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { ScanResult } from "@aegistrust/core";
import { AuthGate } from "../components/AuthGate";
import { TrustBadge } from "../components/TrustBadge";
import { apiFetch } from "../lib/api";
import { socketClient } from "../lib/socketClient";

function Dashboard() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const socket = socketClient();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => { socket.off("connect", onConnect); socket.off("disconnect", onDisconnect); };
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setResult(null);
    try {
      const response = await apiFetch("/api/scan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Scan failed.");
      setResult(data as ScanResult);
      localStorage.setItem(`aegis:scan:${data.id}`, JSON.stringify(data));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not reach the scan API."); }
    finally { setBusy(false); }
  }
  return <main className="shell">
    <header className="topbar"><a className="brand" href="/" aria-label="AegisTrust home"><span className="brand-mark">A</span><span>AEGIS<span className="brand-light">TRUST</span></span></a><nav><a className="nav-link" href="/live-map">Threat graph <span>↗</span></a><span className={`connection ${connected ? "online" : "offline"}`}><i />{connected ? "Live feed connected" : "Feed disconnected"}</span></nav></header>
    <section className="hero"><div className="eyebrow"><span className="eyebrow-dot" /> THREAT INTELLIGENCE / WEB2</div><h1>See the infrastructure<br/><em>behind the threat.</em></h1><p className="lede">Investigate suspicious links through DNS, TLS, page structure, and shared threat indicators — in one scan.</p>
      <form className="scan-form" onSubmit={submit}><label htmlFor="scan-url" className="sr-only">Website URL</label><span className="input-icon">⌕</span><input id="scan-url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste a suspicious URL or domain" autoComplete="url" required maxLength={2048}/><button disabled={busy}>{busy ? <><span className="spinner"/>Analyzing</> : <>Analyze link <span>→</span></>}</button></form>
      <p className="scan-note"><span>◈</span> Public websites only. Private and local network targets are blocked.</p>
    </section>
    {error && <div role="alert" className="error-card"><strong>Scan unavailable</strong><p>{error}</p></div>}
    {result && <section className="result-card"><div className="result-head"><div><div className="section-kicker">SCAN COMPLETE · {new Date(result.scannedAt).toLocaleString()}</div><h2>{result.domain}</h2><a className="muted-link" href={result.url} target="_blank" rel="noreferrer">{result.url} ↗</a></div><TrustBadge score={result.trustScore} verdict={result.verdict}/></div>
      <div className="result-grid"><div><h3>Assessment</h3><ul className="reason-list">{result.reasons.map((reason, i) => <li key={i}><span>—</span>{reason}</li>)}</ul><div className="pill-row"><span className="pill">AI {result.ai?.confidence ?? 0}%</span><span className="pill">{result.relatedThreats} graph links</span><span className="pill">{result.ai?.provider ?? "analysis"}</span></div><a className="report-link" href={`/scan/${result.id}`}>Open saved report →</a></div>
      <div className="intel-panel"><h3>Infrastructure</h3><dl><dt>Resolved IPs</dt><dd>{result.recon?.addresses.join(", ") || "Not available"}</dd><dt>ASN / provider</dt><dd>{result.recon?.asnProvider || "Not available"}</dd><dt>TLS issuer</dt><dd>{result.recon?.tls?.issuer || "Not observed"}</dd><dt>Certificate serial</dt><dd className="mono">{result.recon?.tls?.serialNumber || "—"}</dd><dt>DOM fingerprint</dt><dd className="mono">{result.domHash?.slice(0, 24) || "—"}</dd></dl></div></div>
      {result.screenshotDataUrl && <details className="evidence"><summary>View isolated page capture</summary><img src={result.screenshotDataUrl} alt="Screenshot captured by the isolated scan browser"/></details>}
    </section>}
    <section className="features"><div className="section-kicker">HOW AEGISTRUST LOOKS CLOSER</div><div className="feature-row"><article><span className="feature-index">01 / RECON</span><h3>Infrastructure first</h3><p>Resolve public DNS records and inspect the TLS identity before trusting the page.</p></article><article><span className="feature-index">02 / DETONATE</span><h3>Isolated page analysis</h3><p>Capture page structure in a short-lived browser context. No stealth or credential submission.</p></article><article><span className="feature-index">03 / RELATE</span><h3>Connect the indicators</h3><p>Link domains with IPs, certificates, and DOM fingerprints seen in prior reports.</p></article></div></section>
    <footer><span>AEGISTRUST / LOCAL RESEARCH CONSOLE</span><span>Signals are investigative aids, not a guarantee of safety.</span></footer>
  </main>;
}
export default function HomePage() { return <AuthGate><Dashboard/></AuthGate>; }
