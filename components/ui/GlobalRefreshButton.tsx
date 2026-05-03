"use client";

import { useCallback, useState } from "react";
import { RefreshCw } from "lucide-react";
import clsx from "clsx";
import { dispatchGlobalLiveRefresh } from "@/src/lib/globalRefreshEvents";

export function GlobalRefreshButton({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  const onRefresh = useCallback(() => {
    setBusy(true);
    dispatchGlobalLiveRefresh();
    window.setTimeout(() => setBusy(false), 700);
  }, []);

  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={busy}
      className={clsx(
        compact
          ? "inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700"
          : "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-teal-700",
        "disabled:cursor-not-allowed disabled:opacity-70",
        className
      )}
      title="Refresh now"
      aria-label="Refresh now"
    >
      <RefreshCw className={clsx("h-4 w-4", busy && "animate-spin")} aria-hidden />
      {compact ? null : "Refresh"}
    </button>
  );
}
