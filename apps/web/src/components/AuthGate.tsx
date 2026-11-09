"use client";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { apiFetch, clearSession, getSessionToken } from "../lib/api";

type Props = { children: ReactNode };
export function AuthGate({ children }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setToken(getSessionToken()); setReady(true);
    const onExpired = () => { clearSession(); setToken(null); setError("Your session expired. Please sign in again."); };
    window.addEventListener("aegis:session-expired", onExpired);
    return () => window.removeEventListener("aegis:session-expired", onExpired);
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await apiFetch(`/api/${mode === "register" ? "register" : "login"}`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password })
      });
      const data = await response.json() as { token?: string; error?: string };
      if (!response.ok || !data.token) throw new Error(data.error ?? "Sign in failed.");
      window.localStorage.setItem("aegis:token", data.token);
      setToken(data.token);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not connect to the API."); }
    finally { setBusy(false); }
  }
  if (!ready) return <main className="shell"><p className="lede">Preparing your researcher session…</p></main>;
  if (!token) return <main className="shell auth-shell"><header className="topbar"><a className="brand" href="/"><span className="brand-mark">A</span><span>AEGIS<span className="brand-light">TRUST</span></span></a><span className="section-kicker">RESEARCHER ACCESS</span></header><section className="auth-card"><div className="eyebrow"><span className="eyebrow-dot"/> PRIVATE RESEARCH WORKSPACE</div><h1>{mode === "register" ? <>Create your<br/><em>research account.</em></> : <>Continue to your<br/><em>threat console.</em></>}</h1><p className="lede">Local account credentials are stored as a password hash. Your session token stays in this browser.</p><form className="auth-form" onSubmit={submit}><label htmlFor="auth-email">Email address</label><input id="auth-email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.org"/><label htmlFor="auth-password">Password (12–128 characters)</label><input id="auth-password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} placeholder="Use a unique password"/>{error && <div role="alert" className="auth-error">{error}</div>}<button className="auth-submit" disabled={busy}>{busy ? "Connecting…" : mode === "register" ? "Create account →" : "Sign in →"}</button></form><p className="auth-switch">{mode === "register" ? "Already registered?" : "New to AegisTrust?"} <button onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}>{mode === "register" ? "Sign in" : "Create an account"}</button></p></section><p className="auth-foot">Local MVP authentication · Use a unique password · Do not reuse a password from another service</p></main>;
  return <>{children}<button className="sign-out" onClick={() => { clearSession(); setToken(null); }}>Sign out</button></>;
}
