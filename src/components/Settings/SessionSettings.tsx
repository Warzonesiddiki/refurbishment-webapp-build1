import { useSession } from "@/hooks/useSession";
import { useActivityTracker } from "@/hooks/useActivityTracker";

export function SessionSettings() {
  const { session, refresh, end, timeRemaining } = useSession();
  useActivityTracker(refresh);
  return (
    <div data-component="Settings-SessionSettings" data-testid="component-Settings-SessionSettings" className="glass-card p-4 space-y-2">
      <h3 className="font-bold">Session Settings</h3>
      <div>Session ID: {session.id}</div>
      <div>Started: {new Date(session.startedAt).toLocaleString()}</div>
      <div>Last activity: {new Date(session.lastActivityAt).toLocaleString()}</div>
      <div>Time remaining: {Math.ceil(timeRemaining / 1000)}s</div>
      <div className="flex gap-2"><button className="btn-ghost" onClick={refresh}>Refresh</button><button className="btn-ghost" onClick={end}>End session</button></div>
    </div>
  );
}
