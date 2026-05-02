/** Decode a data: URL with base64 payload into bytes (server-safe). */
export function decodeDataUrlImage(
  dataUrl: string
): { mime: string; buffer: Buffer } | null {
  if (!dataUrl.startsWith("data:")) return null;
  const semi = dataUrl.indexOf(";");
  const comma = dataUrl.indexOf(",");
  if (semi < 0 || comma < 0 || comma <= semi) return null;
  const mime = dataUrl.slice(5, semi).trim() || "image/jpeg";
  const meta = dataUrl.slice(semi + 1, comma);
  if (!meta.includes("base64")) return null;
  const b64 = dataUrl.slice(comma + 1).trim();
  try {
    return { mime, buffer: Buffer.from(b64, "base64") };
  } catch {
    return null;
  }
}
