import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_STYLE, STYLE_KEYS } from "@/lib/design-trends";
import { publicReferenceUrl, saveReferenceImage } from "@/lib/reference-storage";
import { requireAdmin, validationError } from "@/lib/require-admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function buildReferenceResultJson(imageUrl: string, notes: string | null): string {
  return JSON.stringify({
    type: "reference_card",
    imageUrl,
    notes,
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

  const styleRaw = formData.get("appliedStyle");
  const appliedStyle =
    typeof styleRaw === "string" && STYLE_KEYS.includes(styleRaw as (typeof STYLE_KEYS)[number])
      ? styleRaw
      : DEFAULT_STYLE;

  const tagsRaw = formData.get("tags");
  let tags: string[] = [];
  if (typeof tagsRaw === "string" && tagsRaw.trim()) {
    try {
      const parsed = JSON.parse(tagsRaw) as unknown;
      if (Array.isArray(parsed)) {
        tags = parsed
          .filter((tag): tag is string => typeof tag === "string")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 20);
      }
    } catch {
      return validationError("Некорректный формат tags");
    }
  }

  const notesRaw = formData.get("notes");
  const notes =
    typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim().slice(0, 2000) : null;

  const batchId = randomUUID();
  const saved = await saveReferenceImage(imageField, batchId);

  const example = await prisma.designExample.create({
    data: {
      prompt,
      imageUrl: saved.url,
      notes,
      appliedStyle,
      tags,
      resultJson: buildReferenceResultJson(saved.url, notes),
    },
  });

  await prisma.referenceImage.create({
    data: {
      originalUrl: publicReferenceUrl(saved.filename),
      notes: notes ?? prompt.slice(0, 500),
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
      createdAt: example.createdAt.toISOString(),
    },
  });
}
