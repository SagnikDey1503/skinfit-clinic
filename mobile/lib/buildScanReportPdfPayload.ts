import { embedScanImageForPdf } from "./resolveScanImage";
import type { ScanReportPdfPayload } from "./scanReportPdfHtml";

/** GET /api/patient/scans/:id — fields needed for PDF. */
export type PatientScanDetailForPdf = {
  userName: string;
  userAge: number;
  userSkinType: string;
  scanTitle: string | null;
  imageUrl: string;
  faceCaptureGallery?: Array<{ label: string; imageUrl: string }>;
  regions: Array<{ issue: string; coordinates: { x: number; y: number } }>;
  metrics: ScanReportPdfPayload["metrics"];
  aiSummary: string | null;
  scanDateIso: string;
  annotatedImageUrl?: string;
};

export async function buildScanReportPdfPayload(
  detail: PatientScanDetailForPdf,
  token: string | null
): Promise<ScanReportPdfPayload> {
  const photos: Array<{ label: string; dataUri: string }> = [];
  if (detail.faceCaptureGallery && detail.faceCaptureGallery.length > 0) {
    for (const g of detail.faceCaptureGallery) {
      photos.push({
        label: g.label,
        dataUri: await embedScanImageForPdf(g.imageUrl, token),
      });
    }
  } else {
    photos.push({
      label: "Primary scan",
      dataUri: await embedScanImageForPdf(detail.imageUrl, token),
    });
  }

  let annotatedDataUri: string | undefined;
  const raw = detail.annotatedImageUrl?.trim();
  if (raw) {
    annotatedDataUri = await embedScanImageForPdf(raw, token);
  }

  return {
    userName: detail.userName,
    userAge: detail.userAge,
    userSkinType: detail.userSkinType,
    scanTitle: detail.scanTitle,
    metrics: detail.metrics,
    aiSummary: detail.aiSummary,
    scanDateIso: detail.scanDateIso,
    photos,
    annotatedDataUri,
    regions: detail.regions ?? [],
  };
}
