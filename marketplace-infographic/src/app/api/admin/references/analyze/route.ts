import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildDraftBadgeHtml,
  detectFontFromImage,
  extractBadgeFromImage,
} from "@/lib/reference-analyzer";
import { publicReferenceUrl, referencesDir, saveReferenceImage } from "@/lib/reference-storage";
import { requireAdmin, validationError } from "@/lib/require-admin";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
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

  const notesRaw = formData.get("notes");
  const notes =
    typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim().slice(0, 2000) : null;

  const batchId = randomUUID();
  const ext = extensionForMime(imageField.type);
  const originalFilename = `${batchId}-original.${ext}`;

  await mkdir(referencesDir(), { recursive: true });
  const originalPath = path.join(referencesDir(), originalFilename);
  const originalBuffer = Buffer.from(await imageField.arrayBuffer());
  await writeFile(originalPath, originalBuffer);

  const originalUrl = publicReferenceUrl(originalFilename);

  const reference = await prisma.referenceImage.create({
    data: {
      originalUrl,
      notes,
    },
  });

  try {
    const badgeAssets = await extractBadgeFromImage(originalPath, batchId);
    const fontSuggestion = await detectFontFromImage(originalPath);

    const svgContent = await readFile(
      path.join(referencesDir(), `${batchId}.svg`),
      "utf8",
    );

    const badge = await prisma.libraryBadge.create({
      data: {
        name: `Черновик ${reference.id.slice(0, 8)}`,
        htmlTemplate: buildDraftBadgeHtml(badgeAssets.pngUrl),
        svgTemplate: svgContent,
        pngUrl: badgeAssets.pngUrl,
        styleTags: [],
      },
    });

    return NextResponse.json({
      referenceId: reference.id,
      originalUrl,
      badgeDraft: {
        id: badge.id,
        pngUrl: badgeAssets.pngUrl,
        svgUrl: badgeAssets.svgUrl,
        htmlTemplate: badge.htmlTemplate,
        svgTemplate: svgContent,
      },
      fontSuggestion: {
        text: fontSuggestion.text,
        fontName: fontSuggestion.fontName,
      },
    });
  } catch (error) {
    console.error("reference analyze error:", error);
    return NextResponse.json(
      { error: "Не удалось проанализировать изображение" },
      { status: 500 },
    );
  }
}
