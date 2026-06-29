export function generatedImageSrc(imagePath: string, cacheBust?: string | number): string {
  const base = imagePath.startsWith("/api/generated/")
    ? imagePath
    : (() => {
        const filename = imagePath.split("/").pop();
        return filename ? `/api/generated/${filename}` : imagePath;
      })();

  if (cacheBust === undefined || cacheBust === "") {
    return base;
  }
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}v=${encodeURIComponent(String(cacheBust))}`;
}

export function generatedImageFilePath(imagePath: string): string {
  const filename = imagePath.split("/").pop();
  if (!filename) {
    throw new Error("Invalid image path");
  }
  return filename;
}
