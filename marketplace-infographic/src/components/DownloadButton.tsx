"use client";

export function DownloadButton({
  imageId,
  filename = "infographic.png",
}: {
  imageId: string;
  filename?: string;
}) {
  async function handleDownload() {
    const res = await fetch(`/api/images/${imageId}/download`);
    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
    >
      Скачать PNG
    </button>
  );
}
