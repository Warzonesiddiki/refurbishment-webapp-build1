export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function isAndroidDevice(userAgent = ""): boolean {
  return /android/i.test(userAgent);
}

export function isIOSDevice(userAgent = ""): boolean {
  return /iphone|ipad|ipod/i.test(userAgent);
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
}

export function canInstallPwa(userAgent: string, hasDeferredPrompt: boolean): boolean {
  if (isStandaloneDisplayMode()) return false;
  if (isAndroidDevice(userAgent)) return hasDeferredPrompt;
  if (isIOSDevice(userAgent)) return true;
  return false;
}

export function shouldShowInstallPrompt(userAgent: string, hasDeferredPrompt: boolean): boolean {
  if (!hasDeferredPrompt) return false;
  if (!isAndroidDevice(userAgent)) return false;
  if (isStandaloneDisplayMode()) return false;
  return true;
}

export function shouldShowIosInstallHint(userAgent: string): boolean {
  return isIOSDevice(userAgent) && !isStandaloneDisplayMode();
}

export const IOS_INSTALL_STEPS = ["Open Share menu", "Tap Add to Home Screen", "Confirm Install"] as const;

export function getIosInstallSteps(): string[] {
  return [...IOS_INSTALL_STEPS];
}

export async function registerServiceWorker(swPath = "/sw.js") {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register(swPath);
  } catch {
    // non-blocking for app startup
  }
}
