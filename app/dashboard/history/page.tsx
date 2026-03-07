import React from "react";
import { db } from "../../../src/db";
import { scans, users } from "../../../src/db/schema";
import { desc, eq } from "drizzle-orm";
import { HistoryView } from "../../../components/dashboard/HistoryView";

export default async function HistoryPage() {
  const user = await db.query.users.findFirst();
  const scansList = user
    ? await db.query.scans.findMany({
        where: eq(scans.userId, user.id),
        columns: {
          id: true,
          scanName: true,
          imageUrl: true,
          overallScore: true,
          createdAt: true,
          aiSummary: true,
        },
        orderBy: [desc(scans.createdAt)],
      })
    : [];

  const scanRecords = scansList.map((s) => ({
    id: s.id,
    scanName: s.scanName,
    imageUrl: s.imageUrl,
    overallScore: s.overallScore,
    createdAt: s.createdAt,
    aiSummary: s.aiSummary ?? null,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">
        Treatment History
      </h1>
      <HistoryView scans={scanRecords} />
    </div>
  );
}
