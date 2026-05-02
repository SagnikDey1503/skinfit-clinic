import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/src/db";
import {
  parameterScores,
  scans,
  skinDnaCards,
  users,
  visitNotes,
  weeklyReports,
} from "@/src/db/schema";
import { getSessionUserIdFromRequest } from "@/src/lib/auth/get-session";
import { KAI_PARAM_KEYS, KAI_PARAMETERS } from "@/src/lib/kaiParameters";

function cleanActionText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().replace(/\.$/, "");
}

function actionFromWeeklyNarrative(narrative: string | null | undefined): string | null {
  if (!narrative) return null;
  const firstSentence = narrative
    .split(/[.!?]/)
    .map((s) => cleanActionText(s))
    .find((s) => s.length >= 20);
  if (!firstSentence) return null;
  return `${firstSentence}.`;
}

function deriveAiActionsFromWeeklyReports(
  weeklyRows: Array<{
    focusActionsJson: unknown;
    narrativeText: string | null;
    weeklyDelta: number | null;
    consistencyScore: number | null;
  }>
): string[] {
  const latest = weeklyRows[0];
  const older = weeklyRows.slice(1);

  const latestCandidates: string[] = [];
  const olderCandidates: string[] = [];

  for (const [idx, row] of weeklyRows.entries()) {
    const list = idx === 0 ? latestCandidates : olderCandidates;
    if (Array.isArray(row.focusActionsJson)) {
      for (const item of row.focusActionsJson as Array<{
        title?: unknown;
        detail?: unknown;
      }>) {
        if (typeof item?.title === "string") {
          const t = cleanActionText(item.title);
          if (t.length >= 8) list.push(`${t}.`);
        }
        if (typeof item?.detail === "string") {
          const d = cleanActionText(item.detail);
          if (d.length >= 18) list.push(`${d}.`);
        }
      }
    }
  }

  const out: string[] = [];
  const seen = new Set<string>();
  const pushUnique = (text: string | null | undefined) => {
    if (!text) return;
    const normalized = cleanActionText(text).toLowerCase();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    out.push(text.endsWith(".") ? text : `${text}.`);
  };

  pushUnique(latestCandidates[0] ?? actionFromWeeklyNarrative(latest?.narrativeText));
  pushUnique(olderCandidates[0] ?? actionFromWeeklyNarrative(older[0]?.narrativeText));

  if (out.length < 2 && latest) {
    const consistency = latest.consistencyScore;
    const delta = latest.weeklyDelta;
    if (typeof consistency === "number" && consistency < 70) {
      pushUnique(
        "Consistency dipped in recent reports — lock in a simple AM/PM routine for at least 5 of the next 7 days"
      );
    } else if (typeof delta === "number" && delta < 0) {
      pushUnique(
        "Recent weekly report trend is down — prioritize barrier support and avoid introducing new actives this week"
      );
    } else if (typeof delta === "number" && delta > 0) {
      pushUnique(
        "Recent trend is improving — keep the current routine steady and focus on hydration + sleep consistency"
      );
    }
  }

  if (out.length < 2) {
    pushUnique(
      "Use your weekly report pattern to keep one routine change stable for 7 days before adding anything new"
    );
  }
  if (out.length < 2) {
    pushUnique("Track your next scan under similar lighting to compare progress reliably");
  }

  return out.slice(0, 2);
}

export async function GET(request: Request) {
  const userId = await getSessionUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const [user, dna, weeklyRows, visits] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        skinType: true,
        primaryConcern: true,
        skinSensitivity: true,
        baselineSunExposure: true,
        fitzpatrick: true,
        primaryGoal: true,
      },
    }),
    db.query.skinDnaCards.findFirst({
      where: eq(skinDnaCards.userId, userId),
    }),
    db.query.weeklyReports.findMany({
      where: eq(weeklyReports.userId, userId),
      orderBy: [desc(weeklyReports.createdAt)],
      limit: 6,
    }),
    db.query.visitNotes.findMany({
      where: eq(visitNotes.userId, userId),
      orderBy: [desc(visitNotes.visitDate)],
      limit: 12,
    }),
  ]);

  const recentScans = await db
    .select({ id: scans.id, createdAt: scans.createdAt, overallScore: scans.overallScore })
    .from(scans)
    .where(eq(scans.userId, userId))
    .orderBy(desc(scans.createdAt))
    .limit(4);

  const scanIds = recentScans.map((s) => s.id);
  const scoreRows =
    scanIds.length > 0
      ? await db
          .select()
          .from(parameterScores)
          .where(inArray(parameterScores.scanId, scanIds))
      : [];

  const sparklines: Record<
    string,
    { values: (number | null)[]; sources: string[] }
  > = {};
  for (const key of KAI_PARAM_KEYS) {
    const values = recentScans.map((scan) => {
      const r = scoreRows.find(
        (x) => x.scanId === scan.id && x.paramKey === key
      );
      if (!r || r.source === "pending") return null;
      return r.value;
    });
    const sources = recentScans.map((scan) => {
      const r = scoreRows.find(
        (x) => x.scanId === scan.id && x.paramKey === key
      );
      return r?.source ?? "pending";
    });
    sparklines[key] = { values, sources };
  }

  const lastWeekly = weeklyRows[0] ?? null;
  const knowDo = {
    know: [] as string[],
    do: [] as string[],
  };
  const aiGenerated = deriveAiActionsFromWeeklyReports(
    weeklyRows.map((w) => ({
      focusActionsJson: w.focusActionsJson,
      narrativeText: w.narrativeText,
      weeklyDelta: w.weeklyDelta,
      consistencyScore: w.consistencyScore,
    }))
  );
  knowDo.do = [
    ...aiGenerated,
    "Keep logging your weekly 5-angle scan.",
  ].slice(0, 3);
  knowDo.know = [
    dna?.primaryConcern ?? user?.primaryConcern ?? "Primary concern on file",
    user?.skinSensitivity
      ? `Sensitivity: ${user.skinSensitivity}`
      : "Sensitivity: note in questionnaire",
    user?.fitzpatrick
      ? `Fitzpatrick: ${user.fitzpatrick}`
      : "Fitzpatrick: set in clinic if unknown",
  ];

  return NextResponse.json({
    skinDna: {
      skinType: dna?.skinType ?? user?.skinType ?? null,
      primaryConcern: dna?.primaryConcern ?? user?.primaryConcern ?? null,
      sensitivityIndex: dna?.sensitivityIndex ?? null,
      uvSensitivity: dna?.uvSensitivity ?? user?.baselineSunExposure ?? null,
      hormonalCorrelation: dna?.hormonalCorrelation ?? null,
    },
    lastWeekObservations: lastWeekly?.narrativeText ?? null,
    priorityKnowDo: knowDo,
    sparklines,
    paramLabels: Object.fromEntries(
      KAI_PARAM_KEYS.map((k) => [k, KAI_PARAMETERS[k].shortLabel])
    ),
    visits: visits.map((v) => ({
      id: v.id,
      visitDate: v.visitDate.toISOString().slice(0, 10),
      doctorName: v.doctorName,
      purpose: v.purpose,
      treatments: v.treatments,
      preAdvice: v.preAdvice,
      postAdvice: v.postAdvice,
      notes: v.notes,
      prescription: v.prescription,
      responseRating: v.responseRating,
      beforeImageIds: v.beforeImageIds ?? [],
      afterImageIds: v.afterImageIds ?? [],
    })),
  });
}
