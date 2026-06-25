export function generatedImageSrc(imagePath: string): string {
  if (imagePath.startsWith("/api/generated/")) {
    return imagePath;
  }
  const filename = imagePath.split("/").pop();
  return filename ? `/api/generated/${filename}` : imagePath;
}

export function generatedImageFilePath(imagePath: string): string {
  const filename = imagePath.split("/").pop();
  if (!filename) {
    throw new Error("Invalid image path");
  }
  return filename;
}
