import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichReferenceUpload } from "@/lib/reference-enrichment";
import { publicReferenceUrl, saveReferenceImage } from "@/lib/reference-storage";
import { requireAdmin, validationError } from "@/lib/require-admin";

export const runtime = "nodejs";
export const maxDuration = 180;

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function buildReferenceResultJson(
  imageUrl: string,
  enrichment: Awaited<ReturnType<typeof enrichReferenceUpload>>,
): string {
  return JSON.stringify({
    type: "reference_card",
    imageUrl,
    notes: enrichment.compositionNotes,
    synonyms: enrichment.synonyms,
    styleReason: enrichment.styleReason,
    autoEnriched: true,
    source: "admin_reference_upload",
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return validationError("Ожидается multipart/form-data");
  }

  const imageField = formData.get("image");
  if (!(imageField instanceof File)) {
    return validationError("Поле image обязательно");
  }

  if (!ALLOWED_TYPES.has(imageField.type)) {
    return validationError("Допустимы PNG, JPEG или WebP");
  }

  if (imageField.size > MAX_BYTES) {
    return validationError("Файл слишком большой (макс. 8 МБ)");
  }

  const promptRaw = formData.get("prompt");
  const prompt = typeof promptRaw === "string" ? promptRaw.trim() : "";
  if (prompt.length < 3) {
    return validationError("Укажите описание товара или запрос (мин. 3 символа)");
  }
  if (prompt.length > 5000) {
    return validationError("Описание слишком длинное");
  }

  const notesRaw = formData.get("notes");
  const notes =
    typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim().slice(0, 2000) : null;

  const imageBuffer = Buffer.from(await imageField.arrayBuffer());
  const enrichment = await enrichReferenceUpload({ prompt, notes, imageBuffer });

  const batchId = randomUUID();
  const saved = await saveReferenceImage(
    new File([imageBuffer], imageField.name, { type: imageField.type }),
    batchId,
  );

  const example = await prisma.designExample.create({
    data: {
      prompt,
      imageUrl: saved.url,
      notes: enrichment.compositionNotes,
      appliedStyle: enrichment.appliedStyle,
      tags: enrichment.tags,
      resultJson: buildReferenceResultJson(saved.url, enrichment),
    },
  });

  await prisma.referenceImage.create({
    data: {
      originalUrl: publicReferenceUrl(saved.filename),
      notes: enrichment.compositionNotes ?? prompt.slice(0, 500),
    },
  });

  return NextResponse.json({
    example: {
      id: example.id,
      prompt: example.prompt,
      imageUrl: example.imageUrl,
      notes: example.notes,
      appliedStyle: example.appliedStyle,
      tags: example.tags,
      synonyms: enrichment.synonyms,
      styleReason: enrichment.styleReason,
      createdAt: example.createdAt.toISOString(),
    },
  });
}
