"use client";

import { useEffect } from "react";
import { useCallbackDueStore } from "./useCallbackDueStore";

/**
 * Starts callback-due polling when mounted (user is authenticated).
 * Stops polling when unmounted. Renders nothing.
 */
export function CallbackPollingTrigger() {
  const startPolling = useCallbackDueStore((s) => s.startPolling);
  const stopPolling = useCallbackDueStore((s) => s.stopPolling);

  useEffect(() => {
    startPolling();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        useCallbackDueStore.getState().fetchDue();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [startPolling, stopPolling]);

  return null;
}
