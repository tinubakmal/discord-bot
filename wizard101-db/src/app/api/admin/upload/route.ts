import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Stockage local simple (disque du serveur, sous public/uploads/items) pour
// le prototype : suffisant en local, mais a remplacer par un stockage
// objet (S3, R2, etc.) avant toute mise en ligne - voir README.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "items");
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 Mo
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier recu" }, { status: 400 });
  }
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Format non supporte (PNG, JPEG, WebP ou GIF uniquement)" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image trop lourde (8 Mo maximum)" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return NextResponse.json({ url: `/uploads/items/${filename}` }, { status: 201 });
}
