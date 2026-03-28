"use client";

import { useState } from "react";

interface DashboardJournalProps {
  initialEntry?: string | null;
}

const dummyHistory = [
  {
    date: "Yesterday",
    text: "Skin felt a bit dry. Applied extra moisturizer in the PM.",
  },
  {
    date: "2 days ago",
    text: "Good skin day. Routine felt effective, no breakouts.",
  },
  {
    date: "3 days ago",
    text: "Slight redness on cheeks, probably from the new serum. Scaling back.",
  },
];

const MINT = "#E0F0ED";
const TEAL = "#6B8E8E";

export function DashboardJournal({ initialEntry = "" }: DashboardJournalProps) {
  const [journalText, setJournalText] = useState(initialEntry ?? "");
  const [sleep, setSleep] = useState("0");
  const [stress, setStress] = useState("0");
  const [water, setWater] = useState("0");
  const [saved, setSaved] = useState(false);
  const [historyIdx, setHistoryIdx] = useState(0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePrevious = () => {
    const entry = dummyHistory[historyIdx % dummyHistory.length];
    if (entry) {
      setJournalText(entry.text);
      setHistoryIdx((i) => i + 1);
    }
  };

  const inputClass =
    "w-full rounded-[14px] border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 tabular-nums shadow-sm focus:border-[#6B8E8E] focus:outline-none focus:ring-2 focus:ring-[#6B8E8E]/20";

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-600">
            Hours of Sleep
          </label>
          <input
            type="number"
            min={0}
            max={24}
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-600">
            Stress (1-10)
          </label>
          <input
            type="number"
            min={0}
            max={10}
            value={stress}
            onChange={(e) => setStress(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-600">
            Water (glasses)
          </label>
          <input
            type="number"
            min={0}
            value={water}
            onChange={(e) => setWater(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div
        className="rounded-[18px] p-4"
        style={{ backgroundColor: MINT }}
      >
        <textarea
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="How is your skin feeling today? Any changes or concerns?"
          rows={5}
          className="mb-4 w-full resize-none rounded-[14px] border border-white/60 bg-white/40 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-[#6B8E8E]/40 focus:outline-none focus:ring-2 focus:ring-[#6B8E8E]/15"
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="min-w-[120px] flex-1 rounded-[14px] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:flex-none"
            style={{ backgroundColor: TEAL }}
          >
            {saved ? "Saved!" : "Save Entry"}
          </button>
          <button
            type="button"
            onClick={handlePrevious}
            className="min-w-[120px] flex-1 rounded-[14px] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:flex-none"
            style={{ backgroundColor: TEAL }}
          >
            Previous Entry
          </button>
        </div>
      </div>
    </form>
  );
}
