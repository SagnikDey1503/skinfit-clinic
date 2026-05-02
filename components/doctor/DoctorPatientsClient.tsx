"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type PatientRow = {
  id: string;
  name: string;
  email: string;
  primaryConcern: string | null;
  onboardingComplete: boolean;
  createdAt: string;
  /** Recent SOS in 14d: needs review vs marked reviewed in Alerts. */
  sosRowTint?: "urgent" | "seen" | null;
  lastSosAt?: string | null;
};

const CONCERNS = [
  { value: "", label: "Any concern" },
  { value: "acne", label: "Acne" },
  { value: "pigmentation", label: "Pigmentation" },
  { value: "ageing", label: "Ageing" },
  { value: "hair", label: "Hair" },
  { value: "general", label: "General" },
];

export function DoctorPatientsClient({
  initialSosOnly = false,
}: {
  initialSosOnly?: boolean;
}) {
  const [q, setQ] = useState("");
  const [concern, setConcern] = useState("");
  const [sosOnly, setSosOnly] = useState(initialSosOnly);
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (concern) params.set("concern", concern);
      if (sosOnly) params.set("sos", "1");
      const res = await fetch(`/api/doctor/patients?${params}`, {
        credentials: "include",
      });
      const data = (await res.json()) as {
        success?: boolean;
        patients?: PatientRow[];
        error?: string;
      };
      if (!res.ok || !data.success) {
        setErr(data.error ?? "Could not load patients.");
        setRows([]);
        return;
      }
      setRows(data.patients ?? []);
    } catch {
      setErr("Network error.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [q, concern, sosOnly]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 280);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Search</span>
          <span className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name or email"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-slate-900 outline-none focus:border-teal-500"
            />
          </span>
        </label>
        <label className="flex min-w-[160px] flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Concern</span>
          <select
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            className="rounded-lg border border-slate-200 py-2 px-3 text-slate-900 outline-none focus:border-teal-500"
          >
            {CONCERNS.map((c) => (
              <option key={c.value || "any"} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
          <input
            type="checkbox"
            checked={sosOnly}
            onChange={(e) => setSosOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          SOS only (14d)
        </label>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </button>
      </div>

      {err ? (
        <p className="text-sm text-red-600" role="alert">
          {err}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
          No patients match these filters.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Concern</th>
                <th className="px-4 py-3">Onboarding</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => {
                const sosTint = p.sosRowTint;
                const rowClass =
                  sosTint === "urgent"
                    ? "border-l-4 border-l-red-600 bg-red-50 hover:bg-red-100/85"
                    : sosTint === "seen"
                      ? "border-l-4 border-l-red-300 bg-red-50/35 hover:bg-red-50/65"
                      : "hover:bg-slate-50/80";
                return (
                <tr key={p.id} className={rowClass}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.email}</div>
                    {sosTint === "urgent" ? (
                      <div
                        className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                        title={
                          p.lastSosAt
                            ? `SOS needs review · ${formatDistanceToNow(new Date(p.lastSosAt), { addSuffix: true })}`
                            : "SOS in the last 14 days"
                        }
                      >
                        <AlertTriangle className="h-3 w-3" aria-hidden />
                        SOS
                      </div>
                    ) : sosTint === "seen" ? (
                      <div
                        className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-900"
                        title={
                          p.lastSosAt
                            ? `Marked reviewed in Alerts · last SOS ${formatDistanceToNow(new Date(p.lastSosAt), { addSuffix: true })}`
                            : "Recent SOS — reviewed"
                        }
                      >
                        <AlertTriangle className="h-3 w-3 text-red-700" aria-hidden />
                        SOS
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {p.primaryConcern ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.onboardingComplete ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        Done
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                        In progress
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/doctor/patients/${p.id}`}
                      className="font-medium text-teal-700 hover:text-teal-600"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
