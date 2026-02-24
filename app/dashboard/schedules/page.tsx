"use client";

import { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  getDay,
  getDate,
} from "date-fns";
import { motion } from "framer-motion";
import { Flame, Check, ChevronLeft, ChevronRight } from "lucide-react";

const priorityTasks = [
  { id: 1, label: "Complete AM Routine", priority: "high", done: false },
  { id: 2, label: "Upload Weekly Progress Photo", priority: "high", done: false },
  { id: 3, label: "Complete PM Routine", priority: "medium", done: false },
  { id: 4, label: "Apply retinol serum (PM)", priority: "medium", done: false },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const events = [
  { day: 5, title: "Consultation with Dr. Ruby", type: "consultation" },
  { day: 12, title: "Session 2: Laser", type: "treatment" },
  { day: 19, title: "Follow-up Check-in", type: "followup" },
];

function getEventsForDate(date: Date, referenceDate: Date) {
  const d = getDate(date);
  const inScope = date.getMonth() === referenceDate.getMonth() && date.getFullYear() === referenceDate.getFullYear();
  if (!inScope) return [];
  return events.filter((e) => e.day === d);
}

export default function SchedulesPage() {
  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 15)); // Oct 15, 2025

  const calendarCells: (Date | null)[] =
    view === "month"
      ? (() => {
          const start = startOfMonth(currentDate);
          const end = endOfMonth(currentDate);
          const firstDay = getDay(start);
          const daysInMonth = getDate(end);
          const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
          const cells: (Date | null)[] = [];
          for (let i = 0; i < firstDay; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) {
            cells.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), d));
          }
          while (cells.length < totalCells) cells.push(null);
          return cells;
        })()
      : eachDayOfInterval({
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate),
        });

  const handlePrev = () => (view === "month" ? setCurrentDate((d) => subMonths(d, 1)) : setCurrentDate((d) => subWeeks(d, 1)));
  const handleNext = () => (view === "month" ? setCurrentDate((d) => addMonths(d, 1)) : setCurrentDate((d) => addWeeks(d, 1)));

  const headerLabel =
    view === "month"
      ? format(currentDate, "MMMM yyyy")
      : `Week of ${format(startOfWeek(currentDate), "MMM d")} – ${format(endOfWeek(currentDate), "MMM d, yyyy")}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-1"
      >
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Schedules & Tasks
        </h1>
        <p className="text-sm text-zinc-400">
          Stay on top of your personalized skincare journey.
        </p>
      </motion.header>

      {/* Priority Reminders */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6"
      >
        <p className="mb-1 text-sm text-zinc-400">
          {format(new Date(), "EEEE, MMM do")}
        </p>
        <h3 className="mb-4 text-lg font-bold text-white">
          Priority Reminders
        </h3>
        <ul className="space-y-2">
          {priorityTasks.map((task) => (
            <motion.li
              key={task.id}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/50 px-4 py-3 transition-colors hover:bg-zinc-800 hover:border-zinc-700"
            >
              <div className="flex items-center gap-3">
                <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-teal-400/70 bg-zinc-800 shadow-[0_0_10px_rgba(45,212,191,0.35)]">
                  {task.done && (
                    <Check className="h-2.5 w-2.5 text-teal-400" strokeWidth={3} />
                  )}
                </div>
                <span className="text-sm font-medium text-zinc-200">
                  {task.label}
                </span>
              </div>
              <div
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  task.priority === "high"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-zinc-600/50 text-zinc-400"
                }`}
              >
                {task.priority === "high" && (
                  <Flame className="h-3 w-3" />
                )}
                {task.priority === "high" ? "High" : "Medium"}
              </div>
            </motion.li>
          ))}
        </ul>
      </motion.section>

      {/* Upcoming Schedule - Calendar */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50"
      >
        <div className="flex flex-col gap-4 border-b border-zinc-800 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              Upcoming Schedule
            </h3>
            <p className="mt-0.5 text-sm text-zinc-500">
              {headerLabel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg bg-zinc-800 p-1">
              <button
                type="button"
                onClick={() => setView("month")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === "month"
                    ? "bg-zinc-700 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setView("week")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === "week"
                    ? "bg-zinc-700 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Week
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {DAYS.map((day) => (
            <div
              key={day}
              className="border-r border-zinc-800 py-2 text-center last:border-r-0"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarCells.map((day, idx) => {
            const cellEvents = day ? getEventsForDate(day, currentDate) : [];
            const hasEvents = cellEvents.length > 0;
            return (
              <div
                key={day ? day.toISOString() : idx}
                className={`border-b border-r border-zinc-800 p-1.5 last:border-r-0 ${
                  day === null ? "bg-zinc-900/30" : "bg-zinc-900/20"
                } ${view === "week" ? "min-h-[200px]" : "min-h-[72px]"}`}
              >
                {day !== null && (
                  <>
                    <span
                      className={`text-xs font-medium ${
                        hasEvents ? "text-teal-400" : "text-zinc-500"
                      }`}
                    >
                      {getDate(day)}
                    </span>
                    {cellEvents.map((event) => (
                      <div
                        key={event.day + event.title}
                        className="mt-1 rounded-lg border border-teal-400/30 bg-teal-400/15 px-2 py-1.5"
                      >
                        <p className="truncate text-xs font-medium text-teal-400">
                          {event.title}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Event legend / summary */}
        <div className="border-t border-zinc-800 bg-zinc-800/30 px-6 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {view === "month" ? "This month" : "This week"}
          </p>
          <div className="space-y-2">
            {(view === "week"
              ? calendarCells
                  .filter((d): d is Date => d !== null)
                  .flatMap((d) => getEventsForDate(d, currentDate))
                  .filter((e, i, arr) => arr.findIndex((x) => x.day === e.day && x.title === e.title) === i)
              : events
            ).map((event) => (
              <div
                key={`${event.day}-${event.title}`}
                className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-400/20 text-teal-400">
                  <span className="text-sm font-bold">{event.day}</span>
                </div>
                <span className="text-sm font-medium text-white">
                  {event.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
