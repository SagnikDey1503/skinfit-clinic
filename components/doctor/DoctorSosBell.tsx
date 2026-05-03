"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { GLOBAL_LIVE_REFRESH_EVENT } from "@/src/lib/globalRefreshEvents";

type SosItem = {
  patientId: string;
  messageId: string;
  patientName: string;
  preview: string;
  createdAt: string;
};

export function DoctorSosBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<SosItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [ackingId, setAckingId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/doctor/sos-summary", { credentials: "include" });
      const data = (await res.json()) as {
        success?: boolean;
        patientCount?: number;
        items?: SosItem[];
      };
      if (res.ok && data.success) {
        setCount(data.patientCount ?? 0);
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const acknowledge = useCallback(async (messageId: string) => {
    setAckingId(messageId);
    try {
      const res = await fetch("/api/doctor/sos-summary/ack", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chatMessageId: messageId }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean };
      if (res.ok && data.success) {
        await load();
      }
    } finally {
      setAckingId(null);
    }
  }, [load]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 30_000);
    const onRefresh = () => void load();
    window.addEventListener(GLOBAL_LIVE_REFRESH_EVENT, onRefresh);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(GLOBAL_LIVE_REFRESH_EVENT, onRefresh);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`SOS alerts. ${count} patients need review.`}
      >
        <Bell className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Alerts</span>
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-[min(calc(100vw-2rem),22rem)] rounded-xl border border-slate-200 bg-white py-2 shadow-lg"
          role="menu"
        >
          <div className="border-b border-slate-100 px-3 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              SOS (14 days)
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              Use the checklist on each row when you have seen the alert — the badge count drops and
              the row clears. A new SOS from the same patient will appear again. Push also goes to
              the SkinnFit app on doctor accounts.
            </p>
          </div>
          {loading && items.length === 0 && count === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">Loading…</p>
          ) : count === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">
              No SOS waiting for review. You’re caught up.
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {items.map((it) => (
                <li
                  key={it.messageId}
                  className="flex gap-2 border-b border-slate-50 px-2 py-2 last:border-0"
                >
                  <div className="flex w-14 shrink-0 flex-col items-center gap-0.5 pt-0.5">
                    <button
                      type="button"
                      disabled={ackingId === it.messageId}
                      className="flex h-7 w-7 items-center justify-center rounded border-2 border-slate-300 bg-white text-xs font-bold text-teal-700 shadow-sm hover:border-teal-500 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Mark SOS from ${it.patientName} as reviewed`}
                      title="Reviewed — remove from alert count"
                      onClick={() => void acknowledge(it.messageId)}
                    >
                      {ackingId === it.messageId ? "…" : "✓"}
                    </button>
                    <span className="text-center text-[9px] font-medium leading-tight text-slate-500">
                      Reviewed
                    </span>
                  </div>
                  <Link
                    href={`/doctor/patients/${it.patientId}`}
                    className="min-w-0 flex-1 rounded-md px-1 py-0.5 hover:bg-red-50"
                    onClick={() => setOpen(false)}
                    role="menuitem"
                  >
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600" aria-hidden />
                      <span className="text-sm font-semibold text-slate-900">{it.patientName}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{it.preview}</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {formatDistanceToNow(new Date(it.createdAt), { addSuffix: true })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-100 px-3 pt-2">
            <Link
              href="/doctor/patients?sos=1"
              className="text-xs font-semibold text-teal-700 hover:text-teal-600"
              onClick={() => setOpen(false)}
            >
              Show patients with recent SOS (14d) →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
