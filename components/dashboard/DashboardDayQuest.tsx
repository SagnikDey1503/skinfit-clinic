"use client";

import { useEffect, useState } from "react";
import { Sparkles, Timer } from "lucide-react";
import { useEndOfDayCountdown } from "@/src/lib/useEndOfDayCountdown";

const TEAL = "#6B8E8E";
/** Background track for the day ring (unfinished portion reads as this color). */
const RING_TRACK_PINK = "#EBB0B9";

/** Avoid hydration mismatches: `Date`-based UI must match server + first client paint. */
function useClientMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

/** Hero gamification: day progress ring + time until 11:59:59 PM. */
export function DashboardDayQuestBanner() {
  const mounted = useClientMounted();
  const cd = useEndOfDayCountdown();
  const R = 44;
  const C = 2 * Math.PI * R;
  const offset = mounted ? C * (1 - cd.dayProgress) : C;
  const showUrgent = mounted && cd.isLastHour;

  const timeDisplay = mounted ? cd.formatted : "--:--:--";

  return (
    <section
      className={`relative isolate overflow-hidden rounded-[22px] border border-amber-200/55 bg-[#fffbeb] p-5 text-zinc-950 shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:p-6 ${
        showUrgent ? "ring-2 ring-amber-400/55" : ""
      }`}
      aria-labelledby="day-quest-title"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-pink-200/25 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-teal-300/15 blur-2xl" />

      <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0" aria-hidden>
            <svg width={108} height={108} className="-rotate-90">
              <circle
                cx={54}
                cy={54}
                r={R}
                fill="none"
                stroke={RING_TRACK_PINK}
                strokeWidth={8}
              />
              <circle
                cx={54}
                cy={54}
                r={R}
                fill="none"
                stroke={TEAL}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={offset}
                className="transition-[stroke-dashoffset] duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles
                className={`h-7 w-7 ${showUrgent ? "text-amber-600" : "text-teal-700"}`}
                strokeWidth={2}
              />
            </div>
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p
              id="day-quest-title"
              className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-950"
            >
              Today&apos;s quest
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-zinc-950">
              Lock in your dashboard before the day resets
            </p>
          </div>
        </div>

        <div
          className="flex w-full flex-col items-center rounded-2xl border border-transparent bg-transparent px-5 py-4 sm:w-auto sm:min-w-[200px]"
          role="timer"
          aria-live="polite"
          aria-label={
            mounted
              ? `Time remaining until end of day: ${cd.formatted}`
              : "Time remaining until end of day"
          }
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-950">
            <Timer className="h-3.5 w-3.5 shrink-0 text-zinc-950" aria-hidden />
            Time left today
          </div>
          <p className="mt-1 min-w-[9ch] text-center text-3xl font-bold tabular-nums tracking-tight text-zinc-950">
            {timeDisplay}
          </p>
          {showUrgent ? (
            <p className="mt-1 text-center text-xs font-semibold text-amber-700">
              Final hour — finish strong
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Compact countdown for section headers (time until end of day only). */
export function DashboardSectionCountdown() {
  const mounted = useClientMounted();
  const cd = useEndOfDayCountdown();
  const urgent = mounted && cd.isLastHour;
  return (
    <div
      role="status"
      aria-label={
        mounted
          ? `Time left today until 11:59 PM: ${cd.formatted}`
          : "Time left today until 11:59 PM"
      }
      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${
        urgent
          ? "border-amber-300 bg-amber-50 text-amber-950"
          : "border-teal-200/80 bg-teal-50/90 text-teal-950"
      }`}
    >
      <Timer className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      <span className="min-w-[7ch] tabular-nums">
        {mounted ? cd.formatted : "--:--:--"}
      </span>
    </div>
  );
}
