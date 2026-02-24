import React from "react";
import { db } from "../../src/db";
import { skinScans, dailyLogs, appointments } from "../../src/db/schema";
import { desc, eq } from "drizzle-orm";
import { DashboardView } from "../../components/dashboard/DashboardView";

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

  // 2. FETCH REAL DATA
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

  // Parse analysis results for Skin Parameters
  const analysis = (latestScan?.analysisResults ?? {}) as Record<string, number>;
  const params = [
    { label: "Acne", value: analysis.acne ?? "--", icon: "Target" as const, color: "text-teal-600" },
    { label: "Pigmentation", value: analysis.pigmentation ?? "--", icon: "Droplets" as const, color: "text-amber-600" },
    { label: "Wrinkles", value: analysis.wrinkles ?? "--", icon: "Wind" as const, color: "text-purple-600" },
    { label: "Hydration", value: analysis.hydration ?? "--", icon: "Droplets" as const, color: "text-cyan-600" },
    { label: "Texture", value: analysis.texture ?? "--", icon: "Sparkles" as const, color: "text-emerald-600" },
  ];

  // AI Skin Summary (derived from scan or default)
  const aiSummary =
    latestScan && analysis.hydration
      ? `Your hydration is at ${analysis.hydration}%, ${analysis.acne ? `acne severity is ${analysis.acne}. ` : ""}We recommend focusing on your PM routine to reduce mild redness.`
      : "Complete your first AI skin scan to get a personalized summary and recommendations.";

  const amItems = ["Gentle Cleanser", "Vitamin C", "SPF 50"];
  const pmItems = ["Oil Cleanser", "Retinol", "Moisturizer"];
  const amChecked = todayLog?.amRoutine ?? false;
  const pmChecked = todayLog?.pmRoutine ?? false;

  return (
    <DashboardView
      latestScan={latestScan ?? null}
      todayLog={todayLog ?? null}
      nextAppointment={nextAppointment ?? null}
      params={params}
      aiSummary={aiSummary}
      amItems={amItems}
      pmItems={pmItems}
      amChecked={amChecked}
      pmChecked={pmChecked}
    />
  );
}
