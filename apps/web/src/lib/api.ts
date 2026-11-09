const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("aegis:token");
}
export function clearSession(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem("aegis:token");
}
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getSessionToken();
  if (token && !headers.has("authorization")) headers.set("authorization", `Bearer ${token}`);
  const response = await fetch(`${API}${path}`, { ...init, headers });
  if (response.status === 401 && path !== "/api/login" && path !== "/api/register") {
    clearSession();
    window.dispatchEvent(new CustomEvent("aegis:session-expired"));
  }
  return response;
}
