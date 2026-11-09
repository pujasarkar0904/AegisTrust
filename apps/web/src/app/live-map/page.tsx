"use client";
import { useEffect, useState } from "react";
import type { ThreatGraphEdge, ThreatGraphNode } from "@aegistrust/core";
import { AuthGate } from "../../components/AuthGate";
import { ThreatGraph } from "../../components/ThreatGraph";
import { apiFetch } from "../../lib/api";
import { socketClient } from "../../lib/socketClient";
type Event = { domain: string; verdict: string; trustScore: number; scannedAt: string };
function LiveMap() {
  const [nodes, setNodes] = useState<ThreatGraphNode[]>([]);
  const [edges, setEdges] = useState<ThreatGraphEdge[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    apiFetch("/api/graph").then(async response => { if (!response.ok) throw new Error("Graph API unavailable"); return response.json(); }).then(data => { setNodes(data.nodes); setEdges(data.edges); }).catch(() => setError("Could not load graph data. Start PostgreSQL and the API gateway."));
    const socket = socketClient();
    const onThreat = (event: Event) => setEvents(previous => [event, ...previous].slice(0, 12));
    socket.on("threat:new", onThreat);
    return () => { socket.off("threat:new", onThreat); };
  }, []);
  return <main className="shell map-shell"><header className="topbar"><a className="brand" href="/"><span className="brand-mark">A</span><span>AEGIS<span className="brand-light">TRUST</span></span></a><a className="nav-link" href="/">← Return to scanner</a></header><div className="map-title"><div><div className="eyebrow"><span className="eyebrow-dot"/> RELATIONAL THREAT GRAPH</div><h1>Infrastructure <em>connections</em></h1><p className="lede">Each node links a domain to shared infrastructure indicators found during scans.</p></div><span className="connection online"><i/>Listening for new threats</span></div>
    {error && <div className="error-card">{error}</div>}<div className="map-layout"><section className="graph-panel"><div className="panel-head"><span>INDICATOR NETWORK</span><span>{nodes.length} nodes / {edges.length} links</span></div>{nodes.length ? <ThreatGraph nodes={nodes} edges={edges}/> : <div className="empty-graph">No indicators yet. Scan a public URL to populate the graph.</div>}<div className="legend"><span><i className="dot-domain"/>Domain</span><span><i className="dot-ip"/>IP address</span><span><i className="dot-cert"/>Certificate</span><span><i className="dot-dom"/>DOM fingerprint</span></div></section><aside className="feed-panel"><div className="panel-head"><span>LIVE THREAT FEED</span><span className="live-pulse">LIVE</span></div>{events.length ? events.map((event, i) => <article className="feed-event" key={`${event.domain}-${i}`}><span className="feed-dot"/><div><strong>{event.domain}</strong><small>{event.verdict} · trust {event.trustScore}/100</small></div><time>{new Date(event.scannedAt).toLocaleTimeString()}</time></article>) : <div className="empty-feed">No new threat broadcasts. Confirmed high-risk results appear here in real time.</div>}</aside></div></main>;
}
export default function LiveMapPage() { return <AuthGate><LiveMap/></AuthGate>; }
