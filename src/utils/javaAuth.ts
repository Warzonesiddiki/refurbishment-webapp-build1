import { joinJavaApiPath, resolveJavaApiBase } from "@/utils/javaApiBase";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role?: "ADMIN" | "USER";
};

export type AuthDirectoryUser = AuthUser;

const TOKEN_KEY = "alm_auth_token";
const API_BASE = resolveJavaApiBase(import.meta.env.VITE_JAVA_API_BASE as string | undefined);
const REQUEST_TIMEOUT_MS = 8000;

function buildNetworkErrorMessage(action: string) {
  return `Unable to ${action}. Could not reach auth server at ${API_BASE}. Start the Java API server and try again.`;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function readErrorBody(res: Response) {
  const text = await res.text();
  return text.trim();
}

async function requestJson<T>(path: string, init: RequestInit, action: string): Promise<T> {
  try {
    const res = await fetchWithTimeout(joinJavaApiPath(API_BASE, path), init);
    if (!res.ok) {
      const body = await readErrorBody(res);
      throw new Error(body || `Failed to ${action}`);
    }
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out while trying to ${action}.`);
    }
    if (error instanceof TypeError) {
      throw new Error(buildNetworkErrorMessage(action));
    }
    throw error;
  }
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function registerUser(input: { email: string; fullName: string; password: string }) {
  return requestJson<AuthUser>(
    "/api/auth/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "register",
  );
}

export async function loginUser(input: { email: string; password: string }) {
  const data = await requestJson<{ token: string; user: AuthUser }>(
    "/api/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "login",
  );
  setAuthToken(data.token);
  return data;
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetchWithTimeout(joinJavaApiPath(API_BASE, "/api/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      clearAuthToken();
      return null;
    }

    return (await res.json()) as AuthUser;
  } catch {
    // Keep token on transient network failure; only clear on explicit unauthorized responses.
    return null;
  }
}

export async function fetchAuthUsers() {
  const token = getAuthToken();
  if (!token) return [] as AuthDirectoryUser[];

  const data = await requestJson<{ users: AuthDirectoryUser[] }>(
    "/api/auth/users",
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    },
    "load users",
  );

  return Array.isArray(data.users) ? data.users : [];
}

export async function resetSeededSkylinePasswords() {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  return requestJson<{ status: string; resetCount: number }>(
    "/api/auth/reset-seeded-passwords",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: "{}",
    },
    "reset seeded passwords",
  );
}
