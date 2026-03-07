import React from "react";
import { format } from "date-fns";
import { db } from "../../src/db";
import { scans, skinScans, dailyLogs, appointments } from "../../src/db/schema";
import { desc, eq } from "drizzle-orm";
import { DashboardView } from "../../components/dashboard/DashboardView";

const DUMMY_UPCOMING_APPOINTMENT = {
  type: "Follow-up AI Scan",
  date: "March 15, 2026",
  time: "10:00 AM",
};

export default async function DashboardPage() {
  // 1. FETCH USER
  const user = await db.query.users.findFirst();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-10 text-white">
        <div className="text-xl font-bold text-red-400">Test User Not Found</div>
        <p className="text-zinc-400">
          Please run <code className="rounded bg-zinc-800 px-1 py-0.5 text-teal-400">npm run seed</code> in
          your terminal to create the test data.
        </p>
      </div>
    );
  }

  // 2. FETCH LATEST SCAN (from new scans table, fallback to skinScans)
  const latestDbScan = await db.query.scans.findFirst({
    where: eq(scans.userId, user.id),
    columns: { id: true, overallScore: true, acne: true, pigmentation: true, wrinkles: true, hydration: true, texture: true, aiSummary: true, createdAt: true },
    orderBy: [desc(scans.createdAt)],
  });

  const latestScan = await db.query.skinScans.findFirst({
    where: eq(skinScans.userId, user.id),
    orderBy: [desc(skinScans.createdAt)],
  });

  const todayLog = await db.query.dailyLogs.findFirst({
    where: eq(dailyLogs.userId, user.id),
    orderBy: [desc(dailyLogs.date)],
  });

  const nextAppointment = await db.query.appointments.findFirst({
    where: eq(appointments.userId, user.id),
    orderBy: [desc(appointments.dateTime)],
  });

  // Use latestDbScan (scans table) for metrics; fallback to skinScans analysis
  const scanMetrics = latestDbScan
    ? { acne: latestDbScan.acne, pigmentation: latestDbScan.pigmentation, wrinkles: latestDbScan.wrinkles, hydration: latestDbScan.hydration, texture: latestDbScan.texture, overallScore: latestDbScan.overallScore, createdAt: latestDbScan.createdAt }
    : null;
  const analysis = (latestScan?.analysisResults ?? {}) as Record<string, number>;
  const params = [
    { label: "Acne", value: scanMetrics?.acne ?? analysis.acne ?? 0, icon: "Target" as const, color: "text-teal-600" },
    { label: "Pigmentation", value: scanMetrics?.pigmentation ?? analysis.pigmentation ?? 0, icon: "Droplets" as const, color: "text-amber-600" },
    { label: "Wrinkles", value: scanMetrics?.wrinkles ?? analysis.wrinkles ?? 0, icon: "Wind" as const, color: "text-purple-600" },
    { label: "Hydration", value: scanMetrics?.hydration ?? analysis.hydration ?? 0, icon: "Droplets" as const, color: "text-cyan-600" },
    { label: "Texture", value: scanMetrics?.texture ?? analysis.texture ?? 0, icon: "Sparkles" as const, color: "text-emerald-600" },
  ];

  const skinScore = scanMetrics?.overallScore ?? latestScan?.skinScore ?? 0;
  const aiSummary =
    (latestDbScan?.aiSummary && latestDbScan.aiSummary.trim()) ||
    (scanMetrics ?? (latestScan && analysis.hydration)
      ? `Your hydration is at ${scanMetrics?.hydration ?? analysis.hydration ?? 0}%, ${(scanMetrics?.acne ?? analysis.acne) ? `acne severity is ${scanMetrics?.acne ?? analysis.acne}. ` : ""}We recommend focusing on your PM routine to reduce mild redness.`
      : "Complete your first AI skin scan to get a personalized summary and recommendations.");

  const amItems = ["Gentle Cleanser", "Vitamin C", "SPF 50"];
  const pmItems = ["Oil Cleanser", "Retinol", "Moisturizer"];
  const amChecked = todayLog?.amRoutine ?? false;
  const pmChecked = todayLog?.pmRoutine ?? false;

  const latestScanForView = scanMetrics
    ? { skinScore: skinScore, createdAt: scanMetrics.createdAt, analysisResults: scanMetrics }
    : latestScan
      ? { skinScore: latestScan.skinScore, createdAt: latestScan.createdAt, analysisResults: latestScan.analysisResults }
      : null;

  const routineScore = scanMetrics ? 85 : 0;
  const hydrationScore = scanMetrics?.hydration ?? 0;

  const upcomingAppointmentBanner = nextAppointment
    ? {
        type: nextAppointment.type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        date: format(new Date(nextAppointment.dateTime), "MMMM d, yyyy"),
        time: format(new Date(nextAppointment.dateTime), "h:mm a"),
      }
    : DUMMY_UPCOMING_APPOINTMENT;

  return (
    <DashboardView
      latestScan={latestScanForView}
      todayLog={todayLog ?? null}
      nextAppointment={nextAppointment ?? null}
      upcomingAppointmentBanner={upcomingAppointmentBanner}
      params={params}
      aiSummary={aiSummary}
      amItems={amItems}
      pmItems={pmItems}
      amChecked={amChecked}
      pmChecked={pmChecked}
      routineScore={routineScore}
      hydrationScore={hydrationScore}
    />
  );
}
