import { useEffect, useRef } from "react";
import type { AppState, Action } from "@/store/appState";

const CHANNEL_NAME = "tahir-erp-sync";

type SyncMessage =
  | { type: "STATE_UPDATED"; payload: { timestamp: number; state: AppState } }
  | { type: "TAB_OPENED"; payload: { tabId: string } }
  | { type: "TAB_CLOSED"; payload: { tabId: string } };

export function useTabSync(state: AppState, dispatch: React.Dispatch<Action>) {
  const lastLocalTs = useRef<number>(Date.now());
  const tabId = useRef(`tab-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL_NAME);

    channel.postMessage({ type: "TAB_OPENED", payload: { tabId: tabId.current } } satisfies SyncMessage);

    const handleMessage = (event: MessageEvent<SyncMessage>) => {
      const message = event.data;
      if (message.type === "STATE_UPDATED") {
        if (message.payload.timestamp > lastLocalTs.current) {
          lastLocalTs.current = message.payload.timestamp;
          dispatch({ type: "RESTORE_STATE", payload: message.payload.state });
        }
      }
    };

    channel.addEventListener("message", handleMessage);
    return () => {
      channel.postMessage({ type: "TAB_CLOSED", payload: { tabId: tabId.current } } satisfies SyncMessage);
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [dispatch]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const ts = Date.now();
    lastLocalTs.current = ts;
    const timer = window.setTimeout(() => {
      channel.postMessage({ type: "STATE_UPDATED", payload: { timestamp: ts, state } } satisfies SyncMessage);
      channel.close();
    }, 100);

    return () => {
      window.clearTimeout(timer);
      channel.close();
    };
  }, [state]);
}
