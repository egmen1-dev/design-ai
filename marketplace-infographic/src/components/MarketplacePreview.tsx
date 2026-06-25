"use client";

import { useState } from "react";
import { generatedImageSrc } from "@/lib/image-url";

type Marketplace = "plain" | "wb" | "ozon";

const FRAMES: Record<Marketplace, { label: string; headerBg: string; accent: string }> = {
  plain: { label: "Инфографика", headerBg: "", accent: "" },
  wb: { label: "WB лента", headerBg: "bg-purple-600", accent: "text-purple-400" },
  ozon: { label: "Ozon лента", headerBg: "bg-blue-600", accent: "text-blue-400" },
};

export function MarketplacePreview({ imagePath }: { imagePath: string }) {
  const [marketplace, setMarketplace] = useState<Marketplace>("plain");
  const src = generatedImageSrc(imagePath);

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs text-slate-500">
        Готовый слайд 1200×1200 — именно его скачиваете и загружаете на маркетплейс
      </p>

      {marketplace === "plain" ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt="Инфографика"
          className="w-full rounded-lg border border-slate-700 shadow-lg"
        />
      ) : (
        <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-slate-700 bg-white shadow-xl">
          <div
            className={`flex items-center justify-between px-4 py-2 text-sm font-semibold text-white ${FRAMES[marketplace].headerBg}`}
          >
            <span>{FRAMES[marketplace].label}</span>
            <span className="text-xs opacity-80">как в ленте</span>
          </div>
          <div className="bg-gray-50 p-3">
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Превью" className="w-full object-cover" />
            </div>
            <div className="mt-3 space-y-2 px-1">
              <div className="h-3 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className={`text-lg font-bold ${FRAMES[marketplace].accent}`}>
                  1 299 ₽
                </div>
                <div className="text-xs text-gray-400 line-through">2 499 ₽</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {(Object.keys(FRAMES) as Marketplace[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setMarketplace(key)}
            className={`rounded-full px-3 py-1 text-xs ${
              marketplace === key
                ? "bg-brand-600 text-white"
                : "border border-slate-700 text-slate-400 hover:border-brand-500"
            }`}
          >
            {FRAMES[key].label}
          </button>
        ))}
      </div>
    </div>
  );
}
