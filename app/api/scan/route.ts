import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { db } from "../../../src/db";
import { scans, skinScans, users } from "../../../src/db/schema";
import { getSessionUserIdFromRequest } from "../../../src/lib/auth/get-session";
import { buildDummyAiSummary } from "../../../src/lib/dummyScanSummary";
import { runFaceAnalysisService } from "../../../src/lib/faceAnalysisInference";
import { FACE_SCAN_CAPTURE_STEPS } from "../../../src/lib/faceScanCaptures";
import { readWebFormData } from "../../../src/lib/webRequestFormData";

function isMissingFaceCaptureColumn(error: unknown): boolean {
  const err = error as { code?: string; message?: string };
  if (err?.code === "42703") return true;
  const m = err?.message ?? "";
  return (
    /face_capture_images/i.test(m) &&
    (/does not exist/i.test(m) || /undefined column/i.test(m))
  );
}

function bufferToDataUri(buf: Buffer, mimeType: string): string {
  const mime = mimeType || "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const REGION_LABELS = ["Acne", "Wrinkle", "Pigmentation", "Texture"] as const;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSeverity15(): number {
  return Math.round((1 + Math.random() * 4) * 10) / 10;
}

/** 1–5 clinical-style scores for report (dummy path only). */
function generateClinicalFeatureScores() {
  return {
    active_acne: randomSeverity15(),
    skin_quality: randomSeverity15(),
    wrinkle_severity: randomSeverity15(),
    sagging_volume: randomSeverity15(),
    under_eye: randomSeverity15(),
    hair_health: randomSeverity15(),
    pigmentation_model: null as number | null,
  };
}

function clinicalScoresFromModelFeatureScores(
  mfs: Record<string, number | null>
) {
  const num = (k: string, fallback = 2.5) =>
    typeof mfs[k] === "number" && Number.isFinite(mfs[k] as number)
      ? (mfs[k] as number)
      : fallback;
  return {
    active_acne: num("active_acne"),
    skin_quality: num("skin_quality"),
    wrinkle_severity: num("wrinkle_severity"),
    sagging_volume: num("sagging_volume"),
    under_eye: num("under_eye"),
    hair_health: num("hair_health"),
    pigmentation_model:
      typeof mfs.pigmentation_model === "number" &&
      Number.isFinite(mfs.pigmentation_model)
        ? mfs.pigmentation_model
        : null,
  };
}

/** Face-relative marker positions (percent) — biased toward cheeks / forehead / jaw. */
function generateDetectedRegions(): Array<{
  issue: string;
  coordinates: { x: number; y: number };
}> {
  const templates: Array<{ issue: string; x: number; y: number }> = [
    { issue: "Acne", x: 44, y: 52 },
    { issue: "Acne", x: 56, y: 54 },
    { issue: "Acne", x: 50, y: 58 },
    { issue: "Wrinkle", x: 48, y: 38 },
    { issue: "Wrinkle", x: 42, y: 42 },
    { issue: "Pigmentation", x: 52, y: 44 },
    { issue: "Texture", x: 38, y: 48 },
  ];
  const pick = randomInt(5, 7);
  const out: Array<{ issue: string; coordinates: { x: number; y: number } }> = [];
  const shuffled = [...templates].sort(() => Math.random() - 0.5);
  for (let i = 0; i < pick && i < shuffled.length; i++) {
    const t = shuffled[i];
    out.push({
      issue: t.issue,
      coordinates: {
        x: Math.min(92, Math.max(8, t.x + randomInt(-4, 4))),
        y: Math.min(90, Math.max(12, t.y + randomInt(-4, 4))),
      },
    });
  }
  while (out.length < 5) {
    out.push({
      issue: REGION_LABELS[randomInt(0, REGION_LABELS.length - 1)],
      coordinates: { x: randomInt(30, 70), y: randomInt(28, 72) },
    });
  }
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await readWebFormData(request);
    const scanName = (formData.get("scanName") as string) || "Untitled Scan";

    const multiRaw = formData
      .getAll("images")
      .filter((x): x is File => x instanceof File && x.size > 0);
    const single = formData.get("image");

    let imageDataUri: string;
    let faceCaptureImages: Array<{ label: string; dataUri: string }> | null = null;
    let scanFileForModel!: File;

    if (multiRaw.length > 0) {
      if (multiRaw.length !== FACE_SCAN_CAPTURE_STEPS.length) {
        return NextResponse.json(
          {
            success: false,
            error: `Provide exactly ${FACE_SCAN_CAPTURE_STEPS.length} face images in order.`,
          },
          { status: 400 }
        );
      }
      const entries: Array<{ label: string; dataUri: string }> = [];
      for (let i = 0; i < multiRaw.length; i++) {
        const file = multiRaw[i];
        const label = FACE_SCAN_CAPTURE_STEPS[i].id;
        const buf = Buffer.from(await file.arrayBuffer());
        entries.push({
          label,
          dataUri: bufferToDataUri(buf, file.type || "image/jpeg"),
        });
        if (i === 0) {
          scanFileForModel = new File(
            [buf],
            file.name || "scan.jpg",
            { type: file.type || "image/jpeg" }
          );
        }
      }
      faceCaptureImages = entries;
      imageDataUri = entries[0].dataUri;
    } else if (single instanceof File) {
      const buf = Buffer.from(await single.arrayBuffer());
      imageDataUri = bufferToDataUri(buf, single.type || "image/jpeg");
      scanFileForModel = new File([buf], single.name || "scan.jpg", {
        type: single.type || "image/jpeg",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    const inferenceBase = process.env.FACE_ANALYSIS_SERVICE_URL?.trim();
    const inferenceSecret = process.env.FACE_ANALYSIS_SERVICE_SECRET?.trim();
    const allowDummyInferenceFallback =
      process.env.FACE_ANALYSIS_ALLOW_DUMMY === "1" ||
      process.env.FACE_ANALYSIS_ALLOW_DUMMY === "true";
    const inferenceTimeoutRaw = process.env.FACE_ANALYSIS_TIMEOUT_MS?.trim();
    const inferenceTimeoutMs = inferenceTimeoutRaw
      ? Math.max(5_000, parseInt(inferenceTimeoutRaw, 10) || 120_000)
      : 120_000;

    let modelFeatureScores: ReturnType<typeof generateClinicalFeatureScores>;
    let metrics: {
      acne: number;
      pigmentation: number;
      wrinkles: number;
      hydration: number;
      texture: number;
      overall_score: number;
      clinical_scores: ReturnType<typeof clinicalScoresFromModelFeatureScores>;
    };
    let detected_regions: ReturnType<typeof generateDetectedRegions>;
    let overlayDataUri: string | undefined;

    if (inferenceBase) {
      try {
        const inf = await runFaceAnalysisService(scanFileForModel, {
          baseUrl: inferenceBase,
          apiKey: inferenceSecret,
          timeoutMs: inferenceTimeoutMs,
        });
        modelFeatureScores = {
          active_acne: inf.modelFeatureScores.active_acne ?? 2.5,
          skin_quality: inf.modelFeatureScores.skin_quality ?? 2.5,
          wrinkle_severity: inf.modelFeatureScores.wrinkle_severity ?? 2.5,
          sagging_volume: inf.modelFeatureScores.sagging_volume ?? 2.5,
          under_eye: inf.modelFeatureScores.under_eye ?? 2.5,
          hair_health: inf.modelFeatureScores.hair_health ?? 2.5,
          pigmentation_model: inf.modelFeatureScores.pigmentation_model ?? null,
        };
        metrics = {
          ...inf.metrics,
          clinical_scores: clinicalScoresFromModelFeatureScores(
            inf.modelFeatureScores
          ),
        };
        detected_regions = inf.detected_regions;
        overlayDataUri = inf.overlayDataUri;
      } catch (err) {
        console.error("Face analysis service error:", err);
        if (!allowDummyInferenceFallback) {
          const msg =
            err instanceof Error ? err.message : "Face analysis failed";
          return NextResponse.json(
            {
              success: false,
              error:
                "Skin analysis service is unavailable. Try again shortly or contact support.",
              ...(process.env.NODE_ENV === "development" ? { detail: msg } : {}),
            },
            { status: 503 }
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 2500));
        modelFeatureScores = generateClinicalFeatureScores();
        metrics = {
          acne: randomInt(0, 100),
          pigmentation: randomInt(0, 100),
          wrinkles: randomInt(0, 100),
          hydration: randomInt(0, 100),
          texture: randomInt(0, 100),
          overall_score: randomInt(50, 98),
          clinical_scores: {
            active_acne: modelFeatureScores.active_acne,
            skin_quality: modelFeatureScores.skin_quality,
            wrinkle_severity: modelFeatureScores.wrinkle_severity,
            sagging_volume: modelFeatureScores.sagging_volume,
            under_eye: modelFeatureScores.under_eye,
            hair_health: modelFeatureScores.hair_health,
            pigmentation_model: modelFeatureScores.pigmentation_model,
          },
        };
        detected_regions = generateDetectedRegions();
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      modelFeatureScores = generateClinicalFeatureScores();
      metrics = {
        acne: randomInt(0, 100),
        pigmentation: randomInt(0, 100),
        wrinkles: randomInt(0, 100),
        hydration: randomInt(0, 100),
        texture: randomInt(0, 100),
        overall_score: randomInt(50, 98),
        clinical_scores: {
          active_acne: modelFeatureScores.active_acne,
          skin_quality: modelFeatureScores.skin_quality,
          wrinkle_severity: modelFeatureScores.wrinkle_severity,
          sagging_volume: modelFeatureScores.sagging_volume,
          under_eye: modelFeatureScores.under_eye,
          hair_health: modelFeatureScores.hair_health,
          pigmentation_model: modelFeatureScores.pigmentation_model,
        },
      };
      detected_regions = generateDetectedRegions();
    }

    const eczemaScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (metrics.hydration + metrics.acne + metrics.texture) / 3
        )
      )
    );

    // Prefer OpenAI when configured; otherwise (or on failure) use dummy templates.
    let aiSummary = buildDummyAiSummary(metrics);
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    if (openaiKey) {
      try {
        const openai = new OpenAI({ apiKey: openaiKey });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an empathetic, professional dermatological AI assistant. Write exactly ONE short sentence summarizing the patient's skin health based on these metrics and offering a gentle, non-medical recommendation. CRITICAL SCORING RULE: For ALL metrics (including Acne, Pigmentation, and Wrinkles), a HIGHER number is BETTER. A score of 100 means perfect/clear skin, and a score of 0 means severe issues. For example, a high Acne score means the user has very clear skin with almost no acne. Do not use clinical jargon.",
            },
            {
              role: "user",
              content: `Skin metrics (0-100, higher is better): acne ${metrics.acne}, pigmentation ${metrics.pigmentation}, wrinkles ${metrics.wrinkles}, hydration ${metrics.hydration}, texture ${metrics.texture}, overall ${metrics.overall_score}. Clinical 1-5 severities (higher=worse): active acne ${modelFeatureScores.active_acne}, skin quality ${modelFeatureScores.skin_quality}, wrinkle severity ${modelFeatureScores.wrinkle_severity}, sagging/volume ${modelFeatureScores.sagging_volume}, under-eye ${modelFeatureScores.under_eye}, hair ${modelFeatureScores.hair_health}.`,
            },
          ],
          max_tokens: 80,
        });
        const text = completion.choices[0]?.message?.content?.trim();
        if (text) aiSummary = text;
      } catch (err) {
        console.error("OpenAI summary error:", err);
      }
    }

    const userId = await getSessionUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Sign in to save a skin scan." },
        { status: 401 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 400 }
      );
    }

    const analysisResults = {
      acne: metrics.acne,
      wrinkles: metrics.wrinkles,
      texture: metrics.texture,
      pigmentation: metrics.pigmentation,
      hydration: metrics.hydration,
      eczema: eczemaScore,
    };

    const scanRowBase = {
      userId: user.id,
      scanName: scanName.trim() || null,
      imageUrl: imageDataUri,
      overallScore: metrics.overall_score,
      acne: metrics.acne,
      pigmentation: metrics.pigmentation,
      wrinkles: metrics.wrinkles,
      hydration: metrics.hydration,
      texture: metrics.texture,
      aiSummary: aiSummary || null,
      annotations: detected_regions,
      scores: {
        modelFeatureScores: modelFeatureScores as Record<string, number | null>,
        ...(overlayDataUri ? { overlayDataUri } : {}),
      },
    };

    let inserted: (typeof scans.$inferSelect) | undefined;
    try {
      [inserted] = await db
        .insert(scans)
        .values({
          ...scanRowBase,
          faceCaptureImages,
        })
        .returning();
    } catch (insertErr) {
      if (
        faceCaptureImages &&
        isMissingFaceCaptureColumn(insertErr)
      ) {
        [inserted] = await db
          .insert(scans)
          .values({
            ...scanRowBase,
            faceCaptureImages: null,
          })
          .returning();
      } else {
        throw insertErr;
      }
    }

    await db.insert(skinScans).values({
      userId: user.id,
      originalImageUrl: imageDataUri,
      annotatedImageUrl: overlayDataUri ?? imageDataUri,
      skinScore: metrics.overall_score,
      analysisResults,
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        detected_regions,
        ai_summary: aiSummary,
        id: inserted?.id,
        userName: user.name,
        scanDate:
          inserted?.createdAt?.toISOString?.() ?? new Date().toISOString(),
        ...(overlayDataUri ? { annotatedImageUrl: overlayDataUri } : {}),
      },
    });
  } catch (error) {
    console.error("Scan API error:", error);
    const msg =
      error instanceof Error ? error.message : "Scan failed";
    const dev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        success: false,
        error: dev
          ? msg
          : "Could not save this scan. Try smaller photos or contact support if it continues.",
        ...(dev ? { detail: String(error) } : {}),
      },
      { status: 500 }
    );
  }
}
