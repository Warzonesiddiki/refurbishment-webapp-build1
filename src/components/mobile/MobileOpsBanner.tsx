import { useMemo } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

type MobileOpsBannerProps = {
  lanHintUrl: string;
  theme: "cyber" | "pro";
};

export function MobileOpsBanner({ lanHintUrl, theme }: MobileOpsBannerProps) {
  const isOnline = useOnlineStatus();

  const statusText = useMemo(() => {
    return isOnline
      ? "Online mode: all sync and backup actions available"
      : "Offline mode: continue working, sync when connectivity returns";
  }, [isOnline]);

  const copyLanHint = async () => {
    try {
      await navigator.clipboard.writeText(lanHintUrl);
    } catch {
      // ignore clipboard limitations
    }
  };

  return (
    <div data-component="mobile-MobileOpsBanner" data-testid="component-mobile-MobileOpsBanner" className={theme === "pro" ? "rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs" : "rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2.5 text-xs"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span aria-live="polite" className={theme === "pro" ? "text-slate-700" : "text-cyan-200"}>{statusText}</span>
        <div className="flex items-center gap-2">
          <code className={theme === "pro" ? "text-slate-600" : "text-cyan-300"}>{lanHintUrl}</code>
          <button className="btn-ghost px-2 py-1 text-[11px]" onClick={copyLanHint}>Copy URL</button>
        </div>
      </div>
    </div>
  );
}
