export type FaceAnalysisInferenceResult = {
  metrics: {
    acne: number;
    wrinkles: number;
    pigmentation: number;
    hydration: number;
    texture: number;
    overall_score: number;
  };
  modelFeatureScores: Record<string, number | null>;
  detected_regions: Array<{
    issue: string;
    coordinates: { x: number; y: number };
  }>;
  /** JPEG data URI: wrinkle tint + acne circles (matches Gradio). */
  overlayDataUri?: string;
};

type RunOptions = {
  baseUrl: string;
  apiKey?: string;
  /** Default 120s (cold model load). */
  timeoutMs?: number;
};

export async function runFaceAnalysisService(
  image: File,
  options: RunOptions
): Promise<FaceAnalysisInferenceResult> {
  const url = `${options.baseUrl.replace(/\/$/, "")}/analyze`;
  const fd = new FormData();
  fd.append("image", image, image.name || "scan.jpg");
  const headers: HeadersInit = {};
  const key = options.apiKey?.trim();
  if (key) headers["X-API-Key"] = key;

  const timeoutMs = options.timeoutMs ?? 120_000;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      body: fd,
      headers,
      signal: controller.signal,
    });
  } catch (e) {
    const msg =
      e instanceof Error && e.name === "AbortError"
        ? `Face analysis timed out after ${timeoutMs}ms`
        : e instanceof Error
          ? e.message
          : String(e);
    throw new Error(msg);
  } finally {
    clearTimeout(t);
  }

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Face analysis: invalid JSON (HTTP ${res.status}): ${text.slice(0, 200)}`
    );
  }

  if (!res.ok) {
    const err =
      json &&
      typeof json === "object" &&
      "detail" in json &&
      typeof (json as { detail?: unknown }).detail === "string"
        ? (json as { detail: string }).detail
        : text.slice(0, 300);
    throw new Error(`Face analysis HTTP ${res.status}: ${err}`);
  }

  if (
    !json ||
    typeof json !== "object" ||
    (json as { ok?: unknown }).ok !== true
  ) {
    const err =
      json &&
      typeof json === "object" &&
      "error" in json &&
      typeof (json as { error?: unknown }).error === "string"
        ? (json as { error: string }).error
        : "Face analysis failed";
    throw new Error(err);
  }

  const body = json as {
    metrics: FaceAnalysisInferenceResult["metrics"];
    modelFeatureScores: Record<string, number | null>;
    detected_regions: FaceAnalysisInferenceResult["detected_regions"];
    overlayDataUri?: string;
  };

  if (
    !body.metrics ||
    typeof body.modelFeatureScores !== "object" ||
    !Array.isArray(body.detected_regions)
  ) {
    throw new Error("Face analysis: malformed response");
  }

  const overlayDataUri =
    typeof body.overlayDataUri === "string" &&
    body.overlayDataUri.startsWith("data:image/")
      ? body.overlayDataUri
      : undefined;

  return {
    metrics: body.metrics,
    modelFeatureScores: body.modelFeatureScores,
    detected_regions: body.detected_regions,
    ...(overlayDataUri ? { overlayDataUri } : {}),
  };
}
