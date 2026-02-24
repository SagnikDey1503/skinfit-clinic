"use client";

import { motion } from "framer-motion";
import { FileText, Download, User } from "lucide-react";

const visitHistory = [
  {
    date: "Oct 15, 2025",
    doctor: "Dr. Ruby Sachdev",
    notes:
      "Skin is responding well to the new PM routine. Increasing hydration serum to twice daily. Acne lesions reduced by ~40%. Continue current treatment.",
  },
  {
    date: "Oct 1, 2025",
    doctor: "Dr. Ruby Sachdev",
    notes:
      "Baseline assessment complete. Started gentle cleanser + Vitamin C + SPF for AM. Retinol 0.3% introduced for PM. Follow-up in 2 weeks.",
  },
  {
    date: "Sep 20, 2025",
    doctor: "Dr. Ruby Sachdev",
    notes:
      "Initial consultation. Skin type: combination. Primary concerns: acne, uneven tone. AI scan score: 72. Treatment plan discussed.",
  },
];

const reports = [
  { title: "Complete Blood Count", date: "Oct 1, 2025" },
  { title: "AI Deep Scan - Oct 12", date: "Oct 12, 2025" },
  { title: "Hormonal Panel", date: "Sep 18, 2025" },
];

const progressCards = [
  { label: "Baseline (Day 1)", date: "Sep 20" },
  { label: "After Session 1", date: "Oct 1" },
  { label: "Week 4 Update", date: "Oct 15" },
  { label: "6-Week Check-in", date: "Oct 28" },
];

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      {/* Patient Profile */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex shrink-0 justify-center sm:justify-start">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-800">
              <User className="h-12 w-12 text-zinc-500" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Test Patient</h2>
            <p className="text-sm text-zinc-400">Age: 28</p>
            <p className="text-sm text-zinc-400">
              Skin Type: <span className="text-teal-400">Combination</span>
            </p>
            <p className="text-sm text-zinc-400">
              Primary Goal: <span className="text-teal-400">Acne Reduction</span>
            </p>
          </div>
        </div>
      </motion.section>

      {/* Progress Tracker */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6"
      >
        <h3 className="mb-4 text-lg font-bold text-white">Progress Tracker</h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {progressCards.map((card) => (
            <div
              key={card.label}
              className="min-w-[160px] shrink-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800/80 shadow-lg"
            >
              <div className="aspect-[3/4] bg-gradient-to-br from-zinc-700 to-zinc-800" />
              <div className="border-t border-zinc-700 px-3 py-2">
                <p className="text-xs font-medium text-teal-400">{card.label}</p>
                <p className="text-xs text-zinc-500">{card.date}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Visit History & Notes */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6"
      >
        <h3 className="mb-4 text-lg font-bold text-white">
          Visit History & Notes
        </h3>
        <div className="space-y-4">
          {visitHistory.map((visit) => (
            <div
              key={visit.date}
              className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-teal-400">
                  {visit.date}
                </span>
                <span className="text-sm text-zinc-400">{visit.doctor}</span>
              </div>
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Doctor&apos;s Notes
                </p>
                <p className="text-sm leading-relaxed text-zinc-300">
                  {visit.notes}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Lab & Scan Reports */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6"
      >
        <h3 className="mb-4 text-lg font-bold text-white">
          Lab & Scan Reports
        </h3>
        <div className="space-y-3">
          {reports.map((report) => (
            <button
              key={report.title}
              type="button"
              className="group flex w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 transition-colors hover:bg-zinc-800 hover:border-teal-400/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-700">
                  <FileText className="h-5 w-5 text-teal-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white">{report.title}</p>
                  <p className="text-xs text-zinc-500">{report.date}</p>
                </div>
              </div>
              <Download className="h-5 w-5 text-zinc-500 transition-colors group-hover:text-teal-400 shrink-0" />
            </button>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
