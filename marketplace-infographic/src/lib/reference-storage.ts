import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "node:crypto";
import { persistentDataDir } from "@/lib/runtime-paths";

export function referencesDir(): string {
  return persistentDataDir("references");
}

export function publicReferenceUrl(filename: string): string {
  return `/api/references/${filename}`;
}

export async function saveReferenceImage(
  file: File,
  batchId = randomUUID(),
): Promise<{ filename: string; url: string; absolutePath: string }> {
  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

  const filename = `${batchId}.${ext}`;
  const dir = referencesDir();
  await mkdir(dir, { recursive: true });

  const absolutePath = path.join(dir, filename);
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  return {
    filename,
    url: publicReferenceUrl(filename),
    absolutePath,
  };
}
