"use client";

import { PROMPT_HINTS } from "@/lib/prompt-hints";

/** Статичный превью-подсказки для гостей (до входа) */
export function PromptHintsPreview() {
  return (
    <div className="mt-4 space-y-3 text-left">
      <div className="rounded-lg border border-brand-800/40 bg-brand-950/20 px-3 py-2 text-xs text-brand-200">
        <p className="font-medium">Подсказки для AI · что написать в описании</p>
        <p className="mt-1 opacity-90">
          После входа подсказки будут обновляться по мере набора текста.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {PROMPT_HINTS.map((hint) => (
          <div
            key={hint.id}
            className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
          >
            <p className="text-sm font-medium text-slate-200">○ {hint.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{hint.description}</p>
            <p className="mt-1 text-xs text-slate-600">
              Пример: <span className="text-slate-400">{hint.example}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
