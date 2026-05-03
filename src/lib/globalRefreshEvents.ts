/** Global "refresh now" event to force refetch across client widgets. */
export const GLOBAL_LIVE_REFRESH_EVENT = "skinfit-global-live-refresh";

export function dispatchGlobalLiveRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GLOBAL_LIVE_REFRESH_EVENT));
}
