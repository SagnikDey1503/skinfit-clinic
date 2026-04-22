import { NextResponse } from "next/server";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/src/db";
import { annotatorImages } from "@/src/db/schema";

type CreateImageInput = {
  fileName: string;
  mimeType: string;
  dataUri: string;
};

export async function GET() {
  const rows = await db
    .select({
      id: annotatorImages.id,
      fileName: annotatorImages.fileName,
      mimeType: annotatorImages.mimeType,
      dataUri: annotatorImages.dataUri,
      sortOrder: annotatorImages.sortOrder,
    })
    .from(annotatorImages)
    .orderBy(asc(annotatorImages.sortOrder), asc(annotatorImages.id));

  return NextResponse.json({ success: true, images: rows });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { images?: CreateImageInput[] } | null;
  const incoming = body?.images ?? [];
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json({ error: "NO_IMAGES_PROVIDED" }, { status: 400 });
  }

  const last = await db
    .select({ sortOrder: annotatorImages.sortOrder })
    .from(annotatorImages)
    .orderBy(desc(annotatorImages.sortOrder))
    .limit(1);
  let nextSortOrder = (last[0]?.sortOrder ?? -1) + 1;

  const inserts = incoming.map((img) => ({
    fileName: img.fileName?.trim() || `image-${nextSortOrder + 1}`,
    mimeType: img.mimeType?.trim() || "image/jpeg",
    dataUri: img.dataUri,
    sortOrder: nextSortOrder++,
  }));

  const created = await db
    .insert(annotatorImages)
    .values(inserts)
    .returning({
      id: annotatorImages.id,
      fileName: annotatorImages.fileName,
      mimeType: annotatorImages.mimeType,
      dataUri: annotatorImages.dataUri,
      sortOrder: annotatorImages.sortOrder,
    });

  return NextResponse.json({ success: true, createdCount: created.length, images: created });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const idRaw = url.searchParams.get("id");
  if (!idRaw) {
    await db.delete(annotatorImages);
    return NextResponse.json({ success: true, deleted: "all" });
  }

  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  }

  await db.delete(annotatorImages).where(eq(annotatorImages.id, id));
  await db.execute(sql`select setval(pg_get_serial_sequence('annotator_images', 'id'), coalesce((select max(id) from annotator_images), 1), true)`);
  return NextResponse.json({ success: true, deleted: id });
}
