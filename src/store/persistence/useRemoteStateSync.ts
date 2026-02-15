import { useEffect, useRef } from "react";
import type { Action, AppState } from "@/store/appState";
import { fetchSharedState, pushSharedState } from "@/utils/sharedStateClient";
import { debounce } from "@/utils/debounce";
import { deepEqual } from "@/utils/deepEqual";

const DEFAULT_POLL_MS = 2000;

export function useRemoteStateSync(state: AppState, dispatch: React.Dispatch<Action>, pollMs = DEFAULT_POLL_MS) {
  const latestTimestampRef = useRef<number>(0);
  const stateRef = useRef<AppState>(state);
  const lastPublishedStateRef = useRef<AppState | null>(null);
  const skipNextPublishRef = useRef(false);
  const initialSyncDoneRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let cancelled = false;

    const hydrateFromRemote = async (isInitial = false) => {
      try {
        const remote = await fetchSharedState();
        if (cancelled) return;

        if (!remote) {
          if (isInitial && navigator.onLine) {
            const ts = Date.now();
            latestTimestampRef.current = ts;
            await pushSharedState({ timestamp: ts, state: stateRef.current });
            lastPublishedStateRef.current = stateRef.current;
          }
          return;
        }

        if (remote.timestamp <= latestTimestampRef.current) return;

        latestTimestampRef.current = remote.timestamp;
        if (!deepEqual(remote.state, stateRef.current)) {
          skipNextPublishRef.current = true;
          lastPublishedStateRef.current = remote.state;
          dispatch({ type: "RESTORE_STATE", payload: remote.state });
        }
      } catch {
        // Remote sync is best-effort; keep local app responsive even when API is unavailable.
      } finally {
        if (isInitial) initialSyncDoneRef.current = true;
      }
    };

    hydrateFromRemote(true);

    const timer = window.setInterval(() => {
      if (navigator.onLine) hydrateFromRemote();
    }, pollMs);

    const onFocus = () => {
      if (navigator.onLine) hydrateFromRemote();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [dispatch, pollMs]);

  useEffect(() => {
    if (!initialSyncDoneRef.current) {
      return;
    }

    if (skipNextPublishRef.current) {
      skipNextPublishRef.current = false;
      return;
    }

    if (lastPublishedStateRef.current && deepEqual(lastPublishedStateRef.current, state)) {
      return;
    }

    const publish = debounce(async () => {
      if (!navigator.onLine) return;
      const ts = Date.now();
      latestTimestampRef.current = ts;
      try {
        await pushSharedState({ timestamp: ts, state });
        lastPublishedStateRef.current = state;
      } catch {
        // Remote sync is optional; local persistence remains primary fallback.
      }
    }, 400);

    publish();
  }, [state]);
}
