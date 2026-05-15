import { StorageError } from "@/store/persistence/errors";

type HydrationScreenProps = {
  state: "loading" | "migrating" | "error";
  error?: StorageError | null;
  onRetry?: () => void;
  onReset?: () => void;
};

export function HydrationScreen({ state, error, onRetry, onReset }: HydrationScreenProps) {
  return (
    <div data-component="Loading-HydrationScreen" data-testid="component-Loading-HydrationScreen" className="min-h-screen bg-grid flex items-center justify-center p-6">
      <div className="glass-card p-8 w-full max-w-lg text-center space-y-4">
        <div className="text-3xl neon-text-cyan animate-pulse">⬡</div>
        {state === "loading" && <p className="text-cyan-200">Loading your data...</p>}
        {state === "migrating" && <p className="text-cyan-200">Upgrading data format...</p>}
        {state === "error" && (
          <>
            <p className="text-red-300">{error?.message ?? "Hydration failed"}</p>
            <div className="flex items-center justify-center gap-2">
              {onRetry && <button className="btn-cyber" onClick={onRetry}>Retry</button>}
              {onReset && <button className="btn-ghost" onClick={onReset}>Reset</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
