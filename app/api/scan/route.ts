import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "../../../src/db";
import { scans } from "../../../src/db/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const formData = await request.formData();
    const image = formData.get("image");
    const scanName = (formData.get("scanName") as string) || "Untitled Scan";

    if (!image || !(image instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    // Convert uploaded file to Base64 Data URI
    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = image.type || "image/jpeg";
    const imageDataUri = `data:${mimeType};base64,${base64}`;

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

    const detected_regions = generateDetectedRegions();

    // Generate AI summary via OpenAI
    let aiSummary = "";
    if (process.env.OPENAI_API_KEY) {
      try {
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
        aiSummary = completion.choices[0]?.message?.content?.trim() ?? "";
      } catch (err) {
        console.error("OpenAI summary error:", err);
      }
    }

    // Get first user for now (no auth)
    const user = await db.query.users.findFirst();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "No user found" },
        { status: 400 }
      );
    }

    // Insert scan into database
    const [inserted] = await db
      .insert(scans)
      .values({
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
      })
      .returning();

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
    return NextResponse.json(
      { success: false, error: "Scan failed" },
      { status: 500 }
    );
  }
}
