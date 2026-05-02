import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { scans } from "@/src/db/schema";
import { getDoctorPortalUserId } from "@/src/lib/auth/doctor-access";

function decodeDataUrlImage(dataUrl: string): { mime: string; buffer: Buffer } | null {
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

export async function GET(
  req: Request,
  ctx: { params: Promise<{ patientId: string; scanId: string }> }
) {
  const staffId = await getDoctorPortalUserId();
  if (!staffId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { patientId, scanId: scanIdParam } = await ctx.params;
  const scanId = Number.parseInt(scanIdParam, 10);
  if (!patientId || !Number.isFinite(scanId) || scanId < 1) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const urlObj = new URL(req.url);
  const iRaw = urlObj.searchParams.get("i");
  const index =
    iRaw === null || iRaw === "" ? 0 : Number.parseInt(iRaw, 10);
  if (!Number.isFinite(index) || index < 0) {
    return NextResponse.json({ error: "INVALID_INDEX" }, { status: 400 });
  }

  const row = await db.query.scans.findFirst({
    where: and(eq(scans.id, scanId), eq(scans.userId, patientId)),
    columns: { imageUrl: true, faceCaptureImages: true },
  });

  if (!row) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const multi = row.faceCaptureImages;
  const maxIdx = multi && multi.length > 0 ? multi.length - 1 : 0;
  if (index > maxIdx) {
    return NextResponse.json({ error: "INVALID_INDEX" }, { status: 400 });
  }

  let url = "";

  if (multi && multi.length > index && multi[index]?.dataUri) {
    url = multi[index]!.dataUri.trim();
  } else if (index === 0) {
    url = row.imageUrl?.trim() ?? "";
  } else {
    return NextResponse.json({ error: "IMAGE_NOT_FOUND" }, { status: 404 });
  }

  if (!url || url === "pending_upload") {
    return NextResponse.json({ error: "IMAGE_NOT_READY" }, { status: 404 });
  }

  if (url.startsWith("data:")) {
    const decoded = decodeDataUrlImage(url);
    if (!decoded || decoded.buffer.length === 0) {
      return NextResponse.json({ error: "INVALID_IMAGE" }, { status: 500 });
    }
    return new NextResponse(new Uint8Array(decoded.buffer), {
      status: 200,
      headers: {
        "Content-Type": decoded.mime,
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return NextResponse.redirect(url);
  }

  return NextResponse.json({ error: "UNSUPPORTED_IMAGE_URL" }, { status: 500 });
}
