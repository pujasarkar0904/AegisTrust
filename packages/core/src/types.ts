export type ThreatVerdict = "clean" | "suspicious" | "phishing" | "unavailable";

export interface ReconResult {
  hostname: string;
  addresses: string[];
  txtRecords: string[];
  asnProvider?: string;
  relatedThreats?: number;
  tls?: { subject?: string; issuer?: string; serialNumber?: string; validTo?: string };
  warnings: string[];
}

export interface AiAssessment {
  confidence: number;
  brand: string | null;
  credentialForm: boolean;
  explanation: string;
  provider: "gemini" | "heuristic";
}

export interface ScanResult {
  id: string;
  url: string;
  domain: string;
  verdict: ThreatVerdict;
  trustScore: number;
  reasons: string[];
  recon: ReconResult | null;
  ai: AiAssessment | null;
  relatedThreats: number;
  domHash: string | null;
  screenshotDataUrl?: string;
  scannedAt: string;
  cached?: boolean;
}

export interface ThreatGraphNode {
  data: { id: string; label: string; kind: "domain" | "ip" | "certificate" | "dom"; weight: number };
}
export interface ThreatGraphEdge { data: { id: string; source: string; target: string } }
export interface UserJWT { sub: string; email: string; reputation: number }
