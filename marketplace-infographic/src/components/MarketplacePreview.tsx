"use client";

import { useState } from "react";
import { generatedImageSrc } from "@/lib/image-url";
import {
  MARKETPLACE_CARD,
  MARKETPLACE_FRAMES,
  type MarketplaceFrame,
} from "@/lib/marketplace-crop";

export function MarketplacePreview({ imagePath }: { imagePath: string }) {
  const [frame, setFrame] = useState<MarketplaceFrame>("plain");
  const src = generatedImageSrc(imagePath);
  const meta = MARKETPLACE_FRAMES[frame];

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs text-slate-500">{meta.hint}</p>

      {frame === "plain" ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={src}
          src={src}
          alt="Инфографика"
          className="w-full rounded-lg border border-slate-700 shadow-lg"
        />
      ) : (
        <div
          className="mx-auto w-full max-w-sm overflow-hidden rounded-lg border border-slate-700 shadow-lg"
          style={{ aspectRatio: `${MARKETPLACE_CARD.width} / ${MARKETPLACE_CARD.height}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={src}
            src={src}
            alt={meta.label}
            className="h-full w-full object-cover object-center"
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(MARKETPLACE_FRAMES) as MarketplaceFrame[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFrame(key)}
            className={`rounded-full px-3 py-1 text-xs ${
              frame === key
                ? "bg-brand-600 text-white"
                : "border border-slate-700 text-slate-400 hover:border-brand-500"
            }`}
          >
            {MARKETPLACE_FRAMES[key].label}
          </button>
        ))}
      </div>
    </div>
  );
}
