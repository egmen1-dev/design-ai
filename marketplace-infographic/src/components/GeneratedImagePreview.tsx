"use client";

import { useMemo, useState } from "react";

type GeneratedImagePreviewProps = {
  src: string;
  alt: string;
  className?: string;
};

export function GeneratedImagePreview({
  src,
  alt,
  className,
}: GeneratedImagePreviewProps) {
  const apiFallback = useMemo(() => {
    if (src.startsWith("/api/generated/")) return src;
    if (!src.startsWith("/generated/")) return src;

    const filename = src.split("/").pop();
    return filename ? `/api/generated/${encodeURIComponent(filename)}` : src;
  }, [src]);

  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex min-h-64 w-full items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950/70 p-6 text-center text-sm text-slate-400 ${className ?? ""}`}
      >
        Изображение ещё недоступно. Попробуйте обновить страницу или
        сгенерировать заново.
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (currentSrc !== apiFallback) {
          setCurrentSrc(apiFallback);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
