import type { AppState } from "@/store/appState";
import { getAuthToken } from "@/utils/javaAuth";

export type SharedStateSnapshot = {
  timestamp: number;
  state: AppState;
};

const API_BASE = (import.meta.env.VITE_JAVA_API_BASE as string | undefined) || "http://localhost:8085";
const DEFAULT_ENDPOINT = "/api/state/snapshot";

function buildHeaders() {
  const token = getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function fetchSharedState(endpoint = DEFAULT_ENDPOINT): Promise<SharedStateSnapshot | null> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET",
    headers: buildHeaders(),
  });

  if (res.status === 404 || res.status === 204) return null;
  if (!res.ok) throw new Error(`Shared state fetch failed (${res.status})`);

  const payload = (await res.json()) as Partial<SharedStateSnapshot>;
  if (!payload || typeof payload.timestamp !== "number" || !payload.state) return null;
  return { timestamp: payload.timestamp, state: payload.state };
}

export async function pushSharedState(snapshot: SharedStateSnapshot, endpoint = DEFAULT_ENDPOINT): Promise<void> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(snapshot),
  });

  if (!res.ok) throw new Error(`Shared state push failed (${res.status})`);
}
