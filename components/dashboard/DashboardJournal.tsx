"use client";

import { useEffect, useState } from "react";
import { addDays, format, parseISO, subDays } from "date-fns";

import type { TodayJournalLog } from "./DashboardView";

const MINT = "#E0F0ED";
const TEAL = "#6B8E8E";

type JournalEntry = {
  date: string;
  sleepHours: number;
  stressLevel: number;
  waterGlasses: number;
  journalEntry: string | null;
  mood: string;
  amRoutine: boolean;
  pmRoutine: boolean;
  dietType?: string | null;
  sunExposure?: string | null;
  cycleDay?: number | null;
  comments?: string | null;
};

export function DashboardJournal({ todayLog }: { todayLog: TodayJournalLog }) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [sleep, setSleep] = useState(String(todayLog?.sleepHours ?? 0));
  const [stress, setStress] = useState(String(todayLog?.stressLevel ?? 5));
  const [water, setWater] = useState(String(todayLog?.waterGlasses ?? 0));
  const [journalText, setJournalText] = useState(todayLog?.journalEntry ?? "");
  const [mood, setMood] = useState(todayLog?.mood ?? "Neutral");
  const [amRoutine, setAmRoutine] = useState(todayLog?.amRoutine ?? false);
  const [pmRoutine, setPmRoutine] = useState(todayLog?.pmRoutine ?? false);
  const [dietType, setDietType] = useState("balanced");
  const [sunExposure, setSunExposure] = useState("low");
  const [cycleDay, setCycleDay] = useState("");
  const [comments, setComments] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setHint(null);
      try {
        const res = await fetch(`/api/journal?date=${selectedDate}`);
        const data = await res.json();
        if (cancelled) return;
        const entry = data.entry as JournalEntry | null | undefined;
        if (entry) {
          setSleep(String(entry.sleepHours));
          setStress(String(entry.stressLevel));
          setWater(String(entry.waterGlasses));
          setJournalText(entry.journalEntry ?? "");
          setMood(entry.mood ?? "Neutral");
          setAmRoutine(entry.amRoutine);
          setPmRoutine(entry.pmRoutine);
          setDietType(
            typeof entry.dietType === "string" ? entry.dietType : "balanced"
          );
          setSunExposure(
            typeof entry.sunExposure === "string" ? entry.sunExposure : "low"
          );
          setCycleDay(
            typeof entry.cycleDay === "number" && entry.cycleDay > 0
              ? String(entry.cycleDay)
              : ""
          );
          setComments(typeof entry.comments === "string" ? entry.comments : "");
        } else {
          setSleep("0");
          setStress("5");
          setWater("0");
          setJournalText("");
          setMood("Neutral");
          setAmRoutine(false);
          setPmRoutine(false);
          setDietType("balanced");
          setSunExposure("low");
          setCycleDay("");
          setComments("");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setHint(null);
    setSaving(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          sleepHours: Number.parseInt(sleep, 10) || 0,
          stressLevel: Number.parseInt(stress, 10) || 0,
          waterGlasses: Number.parseInt(water, 10) || 0,
          journalEntry: journalText.trim() || null,
          mood,
          amRoutine,
          pmRoutine,
          dietType,
          sunExposure,
          cycleDay:
            cycleDay.trim() === ""
              ? null
              : Math.min(35, Math.max(1, Number.parseInt(cycleDay, 10) || 0)),
          comments: comments.trim() || null,
        }),
      });
      if (!res.ok) {
        setHint("Could not save. Try again.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setHint("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  /** Move to the previous calendar day (loads that day from API, saved or blank). */
  const handlePrevious = () => {
    setHint(null);
    const d = parseISO(`${selectedDate}T12:00:00`);
    setSelectedDate(format(subDays(d, 1), "yyyy-MM-dd"));
  };

  /** Move one day forward, capped at today. */
  const handleNextDay = () => {
    setHint(null);
    if (selectedDate >= todayStr) return;
    const d = parseISO(`${selectedDate}T12:00:00`);
    const next = addDays(d, 1);
    const todayNoon = parseISO(`${todayStr}T12:00:00`);
    setSelectedDate(
      next > todayNoon ? todayStr : format(next, "yyyy-MM-dd")
    );
  };

  const inputClass =
    "w-full rounded-[14px] border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 tabular-nums shadow-sm focus:border-[#6B8E8E] focus:outline-none focus:ring-2 focus:ring-[#6B8E8E]/20";

  const dateLabel =
    selectedDate === todayStr
      ? "Today"
      : format(new Date(selectedDate + "T12:00:00"), "MMM d, yyyy");

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-zinc-500">
        <span>
          Editing: {dateLabel}
          {loading ? " · Loading…" : null}
        </span>
        {selectedDate !== todayStr ? (
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className="font-semibold text-[#6B8E8E] underline-offset-2 hover:underline"
          >
            Jump to today
          </button>
        ) : null}
      </p>

      {hint ? (
        <div
          role="status"
          className="rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          {hint}
        </div>
      ) : null}

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
            disabled={loading}
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
            disabled={loading}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-600">
            Hydration (litres approx.)
          </label>
          <input
            type="number"
            min={0}
            value={water}
            onChange={(e) => setWater(e.target.value)}
            disabled={loading}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-[14px] border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800">
          <input
            type="checkbox"
            checked={amRoutine}
            onChange={(e) => setAmRoutine(e.target.checked)}
            disabled={loading}
            className="h-4 w-4 rounded border-zinc-300 text-[#6B8E8E] focus:ring-[#6B8E8E]/30"
          />
          AM checklist done today
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-[14px] border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800">
          <input
            type="checkbox"
            checked={pmRoutine}
            onChange={(e) => setPmRoutine(e.target.checked)}
            disabled={loading}
            className="h-4 w-4 rounded border-zinc-300 text-[#6B8E8E] focus:ring-[#6B8E8E]/30"
          />
          PM checklist done today
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-600">
            Diet type today
          </label>
          <select
            value={dietType}
            onChange={(e) => setDietType(e.target.value)}
            disabled={loading}
            className={inputClass}
          >
            <option value="heavy">Heavy</option>
            <option value="balanced">Balanced</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-600">
            Sun exposure
          </label>
          <select
            value={sunExposure}
            onChange={(e) => setSunExposure(e.target.value)}
            disabled={loading}
            className={inputClass}
          >
            <option value="low">Low</option>
            <option value="moderate">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-600">
            Menstrual cycle day (optional)
          </label>
          <input
            type="number"
            min={1}
            max={35}
            value={cycleDay}
            onChange={(e) => setCycleDay(e.target.value)}
            disabled={loading}
            className={inputClass}
            placeholder="e.g. 14"
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
          disabled={loading}
          className="mb-4 w-full resize-none rounded-[14px] border border-white/60 bg-white/40 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-[#6B8E8E]/40 focus:outline-none focus:ring-2 focus:ring-[#6B8E8E]/15"
        />
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Comments: pimples, dryness, scalp, weight or any observation"
          rows={3}
          disabled={loading}
          className="mb-4 w-full resize-none rounded-[14px] border border-white/60 bg-white/40 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-[#6B8E8E]/40 focus:outline-none focus:ring-2 focus:ring-[#6B8E8E]/15"
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading || saving}
            className="min-w-[120px] flex-1 rounded-[14px] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:flex-none"
            style={{ backgroundColor: TEAL }}
          >
            {saved ? "Saved!" : saving ? "Saving…" : "Save Entry"}
          </button>
          <button
            type="button"
            onClick={handlePrevious}
            disabled={loading}
            className="min-w-[120px] flex-1 rounded-[14px] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:flex-none"
            style={{ backgroundColor: TEAL }}
          >
            Previous day
          </button>
          {selectedDate < todayStr ? (
            <button
              type="button"
              onClick={handleNextDay}
              disabled={loading}
              className="min-w-[120px] flex-1 rounded-[14px] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:flex-none"
              style={{ backgroundColor: TEAL }}
            >
              Next day
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
