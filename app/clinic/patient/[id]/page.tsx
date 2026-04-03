"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Calendar,
  CalendarPlus,
  Clock,
  FileText,
  File,
  FileDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  Images,
  ZoomIn,
  ArrowRight,
  Droplet,
  Sun,
} from "lucide-react";

const DUMMY_PATIENT = {
  name: "Demo Patient",
  age: 28,
  skinCode: "O.P.A.H",
  lastVisit: "2 days ago",
  overallScore: 78,
  aiSummary:
    "Skin shows good overall resilience with room for improvement in hydration. Prioritize a consistent PM routine with hydrating serums and occlusive moisturizer to address mild dryness.",
  metrics: [
    { label: "Acne", value: 85, trend: 5, improved: true },
    { label: "Hydration", value: 60, trend: -10, improved: false },
    { label: "Pigmentation", value: 90, trend: 0, improved: true },
  ],
  lastVisitNotes:
    "Patient presenting with improved acne control since last visit. Continue current routine. Recommend adding hyaluronic acid to AM routine for hydration support. Follow-up in 4 weeks.",
};

// 30-day adherence: 1 = perfect, 0.5 = partial, 0 = missed
const DUMMY_ADHERENCE: number[] = [
  1, 1, 1, 0.5, 1, 1, 0, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1,
  0.5, 1, 1, 1, 1, 1,
];

const DUMMY_REPORTS = [
  { title: "Full Facial AI Analysis", date: "March 1, 2026", type: "AI Scan", size: "2.4 MB" },
  { title: "Blood Panel: Hormonal Acne", date: "February 15, 2026", type: "Lab Result", size: "1.1 MB" },
  { title: "Initial Consultation Notes", date: "January 10, 2026", type: "Clinical Note", size: "0.8 MB" },
];

/** `dateYmd` / `timeHm` used for simple clash detection vs proposed schedule. */
const UPCOMING_APPOINTMENTS = [
  {
    id: 1,
    type: "Follow-up AI Scan",
    dateYmd: "2026-03-15",
    timeHm: "10:00",
    date: "March 15, 2026",
    time: "10:00 AM",
    status: "Confirmed",
  },
];

const APPOINTMENT_TYPES = ["Follow-up", "Treatment", "Lab Work"] as const;

const CURRENT_REGIMEN = [
  { time: "AM Routine", products: ["Gentle Foaming Cleanser", "Vitamin C Serum 10%", "SPF 50 Sunscreen"] },
  { time: "PM Routine", products: ["Salicylic Acid Cleanser", "Hyaluronic Acid", "Retinol 0.025%"] },
];

const DUMMY_PAST_SCANS = [
  { id: 1, date: "March 1, 2026", thumbnailUrl: "https://placehold.co/96x128/27272a/71717a?text=Scan" },
  { id: 2, date: "Feb 28, 2026", thumbnailUrl: "https://placehold.co/96x128/27272a/71717a?text=Scan" },
  { id: 3, date: "Feb 15, 2026", thumbnailUrl: "https://placehold.co/96x128/27272a/71717a?text=Scan" },
  { id: 4, date: "Feb 1, 2026", thumbnailUrl: "https://placehold.co/96x128/27272a/71717a?text=Scan" },
  { id: 5, date: "Jan 18, 2026", thumbnailUrl: "https://placehold.co/96x128/27272a/71717a?text=Scan" },
  { id: 6, date: "Jan 5, 2026", thumbnailUrl: "https://placehold.co/96x128/27272a/71717a?text=Scan" },
];

export default function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [newRxInput, setNewRxInput] = useState("");
  const [upcomingAppointments] = useState(UPCOMING_APPOINTMENTS);
  const [scheduleType, setScheduleType] = useState<string>("Follow-up");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleClash, setScheduleClash] = useState<string | null>(null);

  const getAdherenceClass = (v: number) => {
    if (v >= 1) return "bg-teal-500";
    if (v > 0) return "bg-teal-500/50";
    return "bg-zinc-800";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Back nav */}
        <Link
          href="/clinic"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-teal-400"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Provider Command Center
        </Link>

        {/* Top Section: Vitals */}
        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div>
              <h1 className="text-xl font-semibold text-white">
                {DUMMY_PATIENT.name}
              </h1>
              <div className="mt-0.5 flex items-center gap-3 text-zinc-500">
                <span className="flex items-center gap-1 text-xs">
                  <User className="h-3.5 w-3.5" />
                  {DUMMY_PATIENT.age} years
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  Last visit {DUMMY_PATIENT.lastVisit}
                </span>
              </div>
            </div>
            <span className="rounded-lg border border-teal-500/50 bg-teal-500/10 px-2.5 py-1 text-xs font-medium text-teal-400">
              {DUMMY_PATIENT.skinCode}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            {/* Overall Score - prominent */}
            <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Overall Score
              </p>
              <p className="text-2xl font-bold text-teal-400">
                {DUMMY_PATIENT.overallScore}
              </p>
              <p className="text-[10px] text-zinc-500">/ 100</p>
            </div>

            {/* Metric cards with trends */}
            {DUMMY_PATIENT.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"
              >
                <p className="mb-1 text-[10px] font-medium text-zinc-500">
                  {m.label}
                </p>
                <div className="flex items-end justify-between">
                  <span className="text-lg font-bold text-white">{m.value}</span>
                  {m.trend !== 0 ? (
                    <span
                      className={`flex items-center gap-0.5 text-xs font-medium ${
                        m.improved ? "text-emerald-500" : "text-red-400"
                      }`}
                    >
                      {m.improved ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {m.trend > 0 ? "+" : ""}
                      {m.trend}%
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-600">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* AI Summary strip */}
          <div className="mt-3 rounded-lg border border-teal-500/20 bg-teal-500/5 px-3 py-2">
            <p className="text-xs text-zinc-300">{DUMMY_PATIENT.aiSummary}</p>
          </div>
        </section>

        {/* Middle Section: Visual Audit */}
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-1.5 text-base font-semibold text-white">
            <Activity className="h-4 w-4 text-teal-400" />
            Visual Audit
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Baseline (Day 1)
              </p>
              <div className="aspect-video rounded-lg border border-zinc-800 bg-zinc-900" />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Latest Scan (Today)
              </p>
              <div className="aspect-video rounded-lg border border-zinc-800 bg-zinc-900" />
            </div>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Historical Scans Timeline
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {DUMMY_PAST_SCANS.slice(0, 3).map((scan) => (
                <div key={scan.id} className="shrink-0">
                  <div className="h-32 w-24 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 object-cover">
                    <img
                      src={scan.thumbnailUrl}
                      alt={`Scan ${scan.date}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-500">{scan.date}</p>
                </div>
              ))}
              <button
                type="button"
                className="flex h-32 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 transition-colors hover:bg-zinc-800/50"
              >
                <Images className="h-6 w-6 text-teal-400" />
                <span className="text-[10px] font-medium text-teal-400">View All ({DUMMY_PAST_SCANS.length}) Scans</span>
                <ArrowRight className="h-3.5 w-3.5 text-teal-400" />
              </button>
            </div>
          </div>
        </section>

        {/* Bottom Section: Compliance & Notes */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left: 30-Day Adherence + Current Active Regimen */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="mb-3 flex items-center gap-1.5 text-base font-semibold text-white">
                <FileText className="h-4 w-4 text-teal-400" />
                30-Day AM/PM Adherence
              </h2>
              <div className="flex flex-wrap gap-0.5">
                {DUMMY_ADHERENCE.map((v, i) => (
                  <div
                    key={i}
                    className={`h-4 w-4 rounded-sm ${getAdherenceClass(v)}`}
                    title={`Day ${i + 1}: ${v >= 1 ? "Complete" : v > 0 ? "Partial" : "Missed"}`}
                  />
                ))}
              </div>
              <div className="mt-2 flex gap-3 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-teal-500" /> Full
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-teal-500/50" /> Partial
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-zinc-800" /> Missed
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="mb-3 flex items-center gap-1.5 text-base font-semibold text-white">
                Current Active Regimen
              </h2>
              {CURRENT_REGIMEN.map((reg) => (
                <div key={reg.time} className="mb-4 last:mb-0">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    {reg.time === "AM Routine" ? (
                      <Sun className="h-3.5 w-3.5 text-teal-400" />
                    ) : (
                      <Droplet className="h-3.5 w-3.5 text-teal-400" />
                    )}
                    {reg.time}
                  </p>
                  <div>
                    {reg.products.map((product) => (
                      <span
                        key={product}
                        className="mb-2 mr-2 inline-block rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Schedule & Reminders + Doctor Notes */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="mb-3 flex items-center gap-1.5 text-base font-semibold text-white">
                <CalendarPlus className="h-4 w-4 text-teal-400" />
                Schedule & Reminders
              </h2>
              <ul className="mb-4 space-y-2">
                {upcomingAppointments.map((apt) => (
                  <li
                    key={apt.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-700/80 bg-zinc-800/50 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{apt.type}</p>
                      <p className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                        <Clock className="h-3.5 w-3.5" />
                        {apt.date} at {apt.time}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      {apt.status}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="space-y-3 rounded-lg border border-zinc-700/80 bg-zinc-800/30 p-3">
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-white focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                >
                  {APPOINTMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => {
                      setScheduleClash(null);
                      setScheduleDate(e.target.value);
                    }}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-white focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                  />
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => {
                      setScheduleClash(null);
                      setScheduleTime(e.target.value);
                    }}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-white focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                  />
                </div>
                {scheduleClash ? (
                  <p className="text-xs font-medium text-amber-400">{scheduleClash}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setScheduleClash(null);
                    if (!scheduleDate.trim() || !scheduleTime.trim()) {
                      setScheduleClash("Choose a date and time first.");
                      return;
                    }
                    const clash = UPCOMING_APPOINTMENTS.some(
                      (a) =>
                        a.dateYmd === scheduleDate.trim() &&
                        a.timeHm === scheduleTime.trim()
                    );
                    if (clash) {
                      setScheduleClash(
                        "That slot clashes with an existing visit. Pick a different time."
                      );
                      return;
                    }
                    setScheduleClash(null);
                  }}
                  className="w-full rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-teal-400"
                >
                  Send to Patient Calendar
                </button>
              </div>
            </div>
          </div>

          {/* Doctor Notes & Rx - full width */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-1.5 text-base font-semibold text-white">
              <FileText className="h-4 w-4 text-teal-400" />
              Doctor Notes & Rx
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-medium text-zinc-500">
                  Last Visit Notes
                </label>
                <textarea
                  readOnly
                  value={DUMMY_PATIENT.lastVisitNotes}
                  rows={5}
                  className="min-h-[120px] w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-400 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-medium text-zinc-500">
                    New prescription or routine adjustment
                  </label>
                  <textarea
                    placeholder="Add new prescription or routine adjustment..."
                    value={newRxInput}
                    onChange={(e) => setNewRxInput(e.target.value)}
                    rows={5}
                    className="min-h-[120px] w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                  />
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-teal-400"
                >
                  Update Patient Plan
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Lab & Scan Reports */}
        <section className="mt-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="mb-3 flex items-center gap-1.5 text-base font-semibold text-white">
              <File className="h-4 w-4 text-teal-400" />
              Lab & Scan Reports
            </h2>
            <div>
              {DUMMY_REPORTS.map((report, i) => (
                <div
                  key={i}
                  className={`flex flex-wrap items-center justify-between gap-3 py-3 ${i < DUMMY_REPORTS.length - 1 ? "border-b border-zinc-800" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 shrink-0 text-zinc-500" />
                    <div>
                      <p className="text-sm font-medium text-white">{report.title}</p>
                      <p className="text-[10px] text-zinc-500">{report.date}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-medium text-teal-400">
                    {report.type}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-500">{report.size}</span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-transparent px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-teal-500/50 hover:text-teal-400"
                    >
                      <FileDown className="h-4 w-4" />
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
