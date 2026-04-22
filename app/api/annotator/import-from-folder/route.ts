import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { NextResponse } from "next/server";
import { asc, desc, inArray } from "drizzle-orm";
import { db } from "@/src/db";
import { annotatorImages } from "@/src/db/schema";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function inferMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export async function POST() {
  const candidateFolders = [
    path.join(process.cwd(), "images_face"),
    path.join(process.cwd(), "..", "images_face"),
    path.join(os.homedir(), "Desktop", "skinfit-clinic", "images_face"),
  ];

  let folderPath: string | null = null;
  let dirEntries: string[] = [];
  for (const candidate of candidateFolders) {
    try {
      dirEntries = await fs.readdir(candidate);
      folderPath = candidate;
      break;
    } catch {
      // try next candidate
    }
  }

  if (!folderPath) {
    return NextResponse.json(
      {
        error: "FOLDER_NOT_FOUND",
        checkedFolders: candidateFolders,
        message: "Create images_face in one of the checked folders.",
      },
      { status: 404 }
    );
  }

  const imageNames = dirEntries
    .filter((name) => ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  if (imageNames.length === 0) {
    return NextResponse.json({ error: "NO_SUPPORTED_IMAGES_FOUND", folderPath }, { status: 400 });
  }

  const existing = await db
    .select({ fileName: annotatorImages.fileName })
    .from(annotatorImages)
    .where(inArray(annotatorImages.fileName, imageNames));
  const existingNames = new Set(existing.map((e) => e.fileName));
  const pending = imageNames.filter((name) => !existingNames.has(name));

  if (pending.length === 0) {
    const all = await db
      .select({
        id: annotatorImages.id,
        fileName: annotatorImages.fileName,
        mimeType: annotatorImages.mimeType,
        dataUri: annotatorImages.dataUri,
        sortOrder: annotatorImages.sortOrder,
      })
      .from(annotatorImages)
      .orderBy(asc(annotatorImages.sortOrder), asc(annotatorImages.id));
    return NextResponse.json({ success: true, importedCount: 0, skippedCount: imageNames.length, images: all });
  }

  const last = await db
    .select({ sortOrder: annotatorImages.sortOrder })
    .from(annotatorImages)
    .orderBy(desc(annotatorImages.sortOrder))
    .limit(1);
  let nextSortOrder = (last[0]?.sortOrder ?? -1) + 1;

  const inserts: Array<{
    fileName: string;
    mimeType: string;
    dataUri: string;
    sortOrder: number;
  }> = [];

  for (const fileName of pending) {
    const abs = path.join(folderPath, fileName);
    const buf = await fs.readFile(abs);
    const mimeType = inferMimeType(fileName);
    const base64 = buf.toString("base64");
    inserts.push({
      fileName,
      mimeType,
      dataUri: `data:${mimeType};base64,${base64}`,
      sortOrder: nextSortOrder++,
    });
  }

  await db.insert(annotatorImages).values(inserts);

  const all = await db
    .select({
      id: annotatorImages.id,
      fileName: annotatorImages.fileName,
      mimeType: annotatorImages.mimeType,
      dataUri: annotatorImages.dataUri,
      sortOrder: annotatorImages.sortOrder,
    })
    .from(annotatorImages)
    .orderBy(asc(annotatorImages.sortOrder), asc(annotatorImages.id));

  return NextResponse.json({
    success: true,
    importedCount: inserts.length,
    skippedCount: imageNames.length - inserts.length,
    images: all,
  });
}
