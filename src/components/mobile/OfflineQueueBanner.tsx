import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/utils/cn";
import { resolveOfflineConflictSeverity } from "@/utils/offlineConflictPolicy";
import { useOfflineEscalation } from "@/hooks/useOfflineEscalation";

type OfflineQueueBannerProps = {
  theme?: "cyber" | "pro";
};

export function OfflineQueueBanner({ theme = "cyber" }: OfflineQueueBannerProps) {
  const isOnline = useOnlineStatus();
  const { queue, clear, remove, replay, conflictCount, repeatedConflictExceptions } = useOfflineQueue();
  const severity = resolveOfflineConflictSeverity(queue);
  const { showEscalation, acknowledge, resetAck } = useOfflineEscalation(queue);

  if (queue.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border p-3 text-xs flex items-start justify-between gap-3",
        theme === "pro" ? "border-amber-200 bg-amber-50 text-amber-900" : severity === "critical" ? "border-red-500/40 bg-red-500/10 text-red-200" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Offline queue: {queue.length} pending actions</p>
        <p className="opacity-80">
          {isOnline ? "Connection restored — replay or clear queued actions." : "You are offline — actions are being recorded."}
        </p>
        {conflictCount > 0 && (
          <p className="mt-1 text-[11px] font-semibold text-red-300">Conflict prompts: {conflictCount} item(s) need review before replay.</p>
        )}
        {repeatedConflictExceptions > 0 && (
          <p className="mt-1 text-[11px] font-semibold text-red-400">Repeated conflict exceptions: {repeatedConflictExceptions} key(s) repeated 2+ times.</p>
        )}
        {showEscalation && (
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[11px] font-semibold text-red-400">Escalation recommended: notify supervisor before replaying additional conflict actions.</p>
            <button className="btn-ghost text-[10px]" onClick={acknowledge}>Acknowledge</button>
            <button className="btn-ghost text-[10px]" onClick={resetAck}>Reset</button>
          </div>
        )}

        <div className="mt-2 space-y-1">
          {queue.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="opacity-80 truncate">• {item.summary}{item.status === "conflict" ? " (conflict)" : ""}</span>
              <div className="flex items-center gap-1">
                <button className="btn-ghost text-[10px]" onClick={() => remove(item.id)}>Dismiss</button>
                <button
                  className="btn-ghost text-[10px]"
                  disabled={!isOnline}
                  onClick={() => replay(item.id)}
                  title={!isOnline ? "Go online to replay" : "Replay queued action"}
                >
                  Replay
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="btn-ghost text-[11px]" onClick={clear}>Clear queue</button>
    </div>
  );
}
