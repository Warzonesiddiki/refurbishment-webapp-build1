import { useEffect, useMemo, useState } from "react";
import type { DeviceInfo, Session } from "@/store/types/SecurityTypes";

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
export const WARNING_BEFORE_MS = 5 * 60 * 1000;

export function getDeviceInfo(): DeviceInfo {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export function createSession(userId: string | null = null, userName: string | null = null): Session {
  const startedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString();
  return {
    id: crypto.randomUUID(),
    userId,
    userName,
    startedAt,
    lastActivityAt: startedAt,
    expiresAt,
    isActive: true,
    deviceInfo: getDeviceInfo(),
    activityCount: 0,
  };
}

export function refreshSession(session: Session): Session {
  if (!session.isActive) return session;
  return {
    ...session,
    lastActivityAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString(),
    activityCount: session.activityCount + 1,
  };
}

export function endSession(session: Session): Session {
  return { ...session, isActive: false, expiresAt: new Date().toISOString() };
}

export function checkSessionValidity(session: Session) {
  return session.isActive && +new Date(session.expiresAt) > Date.now();
}

export function useSession() {
  const [session, setSession] = useState<Session>(() => createSession());
  const timeRemaining = useMemo(() => Math.max(0, +new Date(session.expiresAt) - Date.now()), [session.expiresAt]);
  const refresh = () => setSession((s) => refreshSession(s));
  const end = () => setSession((s) => endSession(s));
  return { session, refresh, end, timeRemaining };
}

export function useActivityTracker(refresh: () => void) {
  useEffect(() => {
    const handler = () => refresh();
    ["mousemove", "keydown", "click", "scroll"].forEach((evt) => window.addEventListener(evt, handler));
    return () => ["mousemove", "keydown", "click", "scroll"].forEach((evt) => window.removeEventListener(evt, handler));
  }, [refresh]);
}
