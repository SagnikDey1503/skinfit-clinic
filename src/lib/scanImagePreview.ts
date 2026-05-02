import sharp from "sharp";

const PREVIEW_MAX_EDGE = 960;
const PREVIEW_JPEG_QUALITY = 78;

/** Downscale for report/list thumbnails; keeps aspect ratio. */
export async function bufferToPreviewJpegBuffer(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(PREVIEW_MAX_EDGE, PREVIEW_MAX_EDGE, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: PREVIEW_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
}

export async function buildPreviewJpegDataUri(input: Buffer): Promise<string> {
  const buf = await bufferToPreviewJpegBuffer(input);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}
