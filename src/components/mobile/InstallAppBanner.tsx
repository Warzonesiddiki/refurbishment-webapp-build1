import { useEffect, useMemo, useState } from "react";
import {
  BeforeInstallPromptEvent,
  canInstallPwa,
  getIosInstallSteps,
  shouldShowInstallPrompt,
  shouldShowIosInstallHint,
} from "@/utils/pwa";

type InstallAppBannerProps = {
  theme: "cyber" | "pro";
};

export function InstallAppBanner({ theme }: InstallAppBannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const showAndroidInstall = useMemo(() => {
    if (isDismissed) return false;
    return shouldShowInstallPrompt(ua, Boolean(deferredPrompt));
  }, [deferredPrompt, isDismissed, ua]);

  const showIosHint = useMemo(() => {
    if (isDismissed) return false;
    return shouldShowIosInstallHint(ua);
  }, [isDismissed, ua]);

  const canInstall = useMemo(() => {
    if (isDismissed) return false;
    return canInstallPwa(ua, Boolean(deferredPrompt));
  }, [deferredPrompt, isDismissed, ua]);

  const onInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (!canInstall || (!showAndroidInstall && !showIosHint)) return null;

  return (
    <div
      className={
        theme === "pro"
          ? "rounded-xl border border-blue-200 bg-blue-50 p-3"
          : "rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3"
      }
    >
      <div data-component="mobile-InstallAppBanner" data-testid="component-mobile-InstallAppBanner" className="space-y-2">
        {showAndroidInstall ? (
          <p className={theme === "pro" ? "text-xs text-blue-900" : "text-xs text-cyan-200"}>
            Install Tahir ERP on Android for app-like offline access.
          </p>
        ) : (
          <div className={theme === "pro" ? "text-xs text-blue-900" : "text-xs text-cyan-200"}>
            <p>iPhone/iPad install steps:</p>
            <ol className="list-decimal pl-4 mt-1 space-y-0.5">
              {getIosInstallSteps().map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex items-center gap-2">
          {showAndroidInstall && (
            <button className="btn-cyber text-xs px-3 py-1.5" onClick={onInstall}>
              Install App
            </button>
          )}
          <button className="btn-ghost text-xs px-2 py-1.5" onClick={() => setIsDismissed(true)}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
