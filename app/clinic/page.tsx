"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";

interface LatestScan {
  overall_score: number;
  acne: number;
  pigmentation: number;
  hydration: number;
  ai_summary: string | null;
  created_at: string;
}

interface PatientRow {
  id: string;
  name: string;
  email: string;
  latest_scan: LatestScan | null;
}

function getKeyIssue(scan: LatestScan): string {
  const metrics = [
    { key: "acne", value: scan.acne, label: "Acne" },
    { key: "pigmentation", value: scan.pigmentation, label: "Pigmentation" },
    { key: "hydration", value: scan.hydration, label: "Hydration" },
  ];
  const lowest = metrics.reduce((a, b) => (a.value <= b.value ? a : b));
  return `${lowest.label} (${lowest.value})`;
}

function truncateSummary(summary: string | null, maxLen = 60): string {
  if (!summary || !summary.trim()) return "—";
  if (summary.length <= maxLen) return summary;
  return `${summary.slice(0, maxLen)}…`;
}

export default function ClinicPage() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clinic/patients")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(setPatients)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 px-6 py-10">
        <h1 className="mb-8 text-2xl font-bold tracking-tight text-white">
          Provider Command Center
        </h1>
        <div className="flex items-center justify-center py-20">
          <p className="text-zinc-500">Loading patients…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 px-6 py-10">
        <h1 className="mb-8 text-2xl font-bold tracking-tight text-white">
          Provider Command Center
        </h1>
        <p className="text-amber-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Provider Command Center
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Monitor patient skin health at a glance
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/50">
              <th className="px-5 py-4 text-left font-semibold text-zinc-300">
                Patient Name
              </th>
              <th className="px-5 py-4 text-left font-semibold text-zinc-300">
                Last Scan Date
              </th>
              <th className="px-5 py-4 text-left font-semibold text-zinc-300">
                Overall Score
              </th>
              <th className="px-5 py-4 text-left font-semibold text-zinc-300">
                Key Issue
              </th>
              <th className="px-5 py-4 text-left font-semibold text-zinc-300">
                AI Summary
              </th>
              <th className="px-5 py-4 text-right font-semibold text-zinc-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                  No patients found.
                </td>
              </tr>
            ) : (
              patients.map((p) => {
                const scan = p.latest_scan;
                const scoreLow = scan && scan.overall_score < 50;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-zinc-800/80 transition-colors hover:bg-zinc-800/30"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-xs text-zinc-500">{p.email}</p>
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {scan
                        ? format(new Date(scan.created_at), "MMM d, yyyy")
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {scan ? (
                        <span
                          className={
                            scoreLow
                              ? "font-semibold text-amber-500"
                              : "font-medium text-teal-400"
                          }
                        >
                          {scan.overall_score}
                        </span>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {scan ? getKeyIssue(scan) : "—"}
                    </td>
                    <td className="max-w-[200px] px-5 py-3 text-zinc-500">
                      {truncateSummary(scan?.ai_summary ?? null)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        className="rounded-lg border border-teal-500/50 bg-transparent px-3 py-1.5 text-sm font-medium text-teal-400 transition-colors hover:bg-teal-500/10"
                      >
                        View Patient
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
