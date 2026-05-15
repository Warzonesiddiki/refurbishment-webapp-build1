export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
};

const TOKEN_KEY = "alm_auth_token";
const API_BASE = (import.meta.env.VITE_JAVA_API_BASE as string | undefined) || "http://localhost:8085";

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
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to register");
  }

  return (await res.json()) as AuthUser;
}

export async function loginUser(input: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to login");
  }

  const data = (await res.json()) as { token: string; user: AuthUser };
  setAuthToken(data.token);
  return data;
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    clearAuthToken();
    return null;
  }

  return (await res.json()) as AuthUser;
}
