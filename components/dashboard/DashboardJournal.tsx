"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface DashboardJournalProps {
  initialEntry?: string | null;
}

const dummyHistory = [
  { date: "Yesterday", text: "Skin felt a bit dry. Applied extra moisturizer in the PM." },
  { date: "2 days ago", text: "Good skin day. Routine felt effective, no breakouts." },
  { date: "3 days ago", text: "Slight redness on cheeks, probably from the new serum. Scaling back." },
];

export function DashboardJournal({ initialEntry = "" }: DashboardJournalProps) {
  const [journalText, setJournalText] = useState(initialEntry ?? "");
  const [sleep, setSleep] = useState("");
  const [stress, setStress] = useState("");
  const [water, setWater] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Quick Daily Questions */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Hours of Sleep
          </label>
          <input
            type="number"
            min={0}
            max={24}
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Stress (1–10)
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={stress}
            onChange={(e) => setStress(e.target.value)}
            placeholder="—"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Water (glasses)
          </label>
          <input
            type="number"
            min={0}
            value={water}
            onChange={(e) => setWater(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400/30"
          />
        </div>
      </div>

      {/* Journal Text Area */}
      <div>
        <textarea
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="How is your skin feeling today?"
          rows={3}
          className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400/30"
        />
      </div>

      <motion.button
        type="submit"
        whileTap={{ scale: 0.95 }}
        className="w-full rounded-xl bg-teal-400 px-4 py-3 text-sm font-semibold text-zinc-900 shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-opacity hover:opacity-90"
      >
        {saved ? "Saved!" : "Save Entry"}
      </motion.button>

      {/* History */}
      <div className="max-h-48 overflow-y-auto border-t border-zinc-800 pt-4">
        <p className="mb-2 text-xs font-medium text-zinc-500">Recent entries</p>
        <div className="space-y-3">
          {dummyHistory.map((entry, i) => (
            <div key={i} className="rounded-lg border border-zinc-800/80 bg-zinc-800/30 p-3">
              <p className="text-xs text-teal-400">{entry.date}</p>
              <p className="mt-1 text-sm text-zinc-300">{entry.text}</p>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
