/** Mirrors web `src/lib/skinScanAnalysis.ts` for dashboard params. */

const DEFAULT_SKIN_PARAMS = [
  { label: "Acne", value: 90 },
  { label: "Pores", value: 65 },
  { label: "Dark Spots", value: 72 },
  { label: "Wrinkles", value: 84 },
  { label: "Pigmentation", value: 65 },
  { label: "Uniformity & Elasticity", value: 78 },
] as const;

function clamp100(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function readNum(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function kaiParamValue(kaiParams: unknown, key: string): number | undefined {
  if (!kaiParams || typeof kaiParams !== "object") return undefined;
  const row = (kaiParams as Record<string, unknown>)[key];
  if (!row || typeof row !== "object") return undefined;
  const v = (row as { value?: unknown }).value;
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function avgDefined(...vals: (number | undefined)[]): number | undefined {
  const xs = vals.filter((v): v is number => v != null);
  if (xs.length === 0) return undefined;
  return Math.round(xs.reduce((s, x) => s + x, 0) / xs.length);
}

export function analysisResultsToParams(
  analysis: unknown
): { label: string; value: number }[] {
  const a =
    analysis && typeof analysis === "object"
      ? (analysis as Record<string, unknown>)
      : {};

  const kaiParams = a.kaiParams;

  const acne = readNum(a, "acne");
  const wrinkles = readNum(a, "wrinkles");
  const texture = readNum(a, "texture");
  const poreSize = readNum(a, "poreSize");
  const pigmentation = readNum(a, "pigmentation");
  const hydration = readNum(a, "hydration");

  const acneK = kaiParamValue(kaiParams, "acne_pimples");
  const poresK = kaiParamValue(kaiParams, "pores");
  const wrinklesK = kaiParamValue(kaiParams, "wrinkles");
  const pigmentationK = kaiParamValue(kaiParams, "pigmentation");
  const toneEven = kaiParamValue(kaiParams, "tone_evenness");
  const uvDamage = kaiParamValue(kaiParams, "uv_damage");
  const uniformityK = kaiParamValue(kaiParams, "uniformity");
  const elasticityK = kaiParamValue(kaiParams, "elasticity");

  const poresScoreLegacy =
    texture != null
      ? clamp100(texture)
      : poreSize != null
        ? clamp100(poreSize)
        : DEFAULT_SKIN_PARAMS[1].value;

  const fallback = (i: number) => DEFAULT_SKIN_PARAMS[i].value;

  const darkSpots =
    avgDefined(toneEven, uvDamage) ??
    pigmentation ??
    pigmentationK ??
    fallback(2);

  const uniformityElasticity =
    avgDefined(uniformityK, elasticityK) ??
    (texture != null && hydration != null
      ? clamp100(Math.round((texture + hydration) / 2))
      : undefined) ??
    fallback(5);

  return [
    {
      label: "Acne",
      value: clamp100(acneK ?? acne ?? fallback(0)),
    },
    {
      label: "Pores",
      value: clamp100(poresK ?? poresScoreLegacy),
    },
    {
      label: "Dark Spots",
      value: clamp100(darkSpots),
    },
    {
      label: "Wrinkles",
      value: clamp100(wrinklesK ?? wrinkles ?? fallback(3)),
    },
    {
      label: "Pigmentation",
      value: clamp100(pigmentationK ?? pigmentation ?? fallback(4)),
    },
    {
      label: "Uniformity & Elasticity",
      value: clamp100(uniformityElasticity),
    },
  ];
}
