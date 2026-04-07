import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { db } from "../../../src/db";
import { scans, skinScans, users } from "../../../src/db/schema";
import { getSessionUserIdFromRequest } from "../../../src/lib/auth/get-session";
import { buildDummyAiSummary } from "../../../src/lib/dummyScanSummary";
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

async function fileToDataUri(image: File): Promise<string> {
  const arrayBuffer = await image.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = image.type || "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}

const LABELS = ["Wrinkle", "Acne", "Pigmentation", "Texture Irregularity"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDetectedRegions() {
  const count = randomInt(4, 7);
  return Array.from({ length: count }, () => ({
    issue: LABELS[randomInt(0, LABELS.length - 1)] as string,
    coordinates: {
      x: randomInt(35, 65),
      y: randomInt(25, 75),
    },
  }));
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
        entries.push({ label, dataUri: await fileToDataUri(file) });
      }
      faceCaptureImages = entries;
      imageDataUri = entries[0].dataUri;
    } else if (single instanceof File) {
      imageDataUri = await fileToDataUri(single);
    } else {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    // Simulate 2.5 second AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const metrics = {
      acne: randomInt(0, 100),
      pigmentation: randomInt(0, 100),
      wrinkles: randomInt(0, 100),
      hydration: randomInt(0, 100),
      texture: randomInt(0, 100),
      overall_score: randomInt(50, 98),
    };

    const eczemaScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (metrics.hydration + metrics.acne + metrics.texture) / 3
        )
      )
    );

    const detected_regions = generateDetectedRegions();

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
              content: `Skin metrics: acne ${metrics.acne}, pigmentation ${metrics.pigmentation}, wrinkles ${metrics.wrinkles}, hydration ${metrics.hydration}, texture ${metrics.texture}, overall score ${metrics.overall_score}.`,
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
      annotatedImageUrl: imageDataUri,
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
