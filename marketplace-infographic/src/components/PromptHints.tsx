"use client";

import { useMemo } from "react";
import {
  analyzePrompt,
  appendHintToPrompt,
  type AnalyzedHint,
} from "@/lib/prompt-hints";

type Props = {
  prompt: string;
  onInsert: (nextPrompt: string) => void;
};

const READINESS_STYLES = {
  low: "border-amber-800/40 bg-amber-950/20 text-amber-200",
  medium: "border-brand-700/40 bg-brand-950/20 text-brand-200",
  high: "border-green-800/40 bg-green-950/20 text-green-200",
} as const;

function HintRow({
  hint,
  onInsert,
}: {
  hint: AnalyzedHint;
  onInsert: (text: string) => void;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        hint.satisfied
          ? "border-green-800/50 bg-green-950/15"
          : "border-slate-800 bg-slate-950/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={`text-sm font-medium ${
              hint.satisfied ? "text-green-300" : "text-slate-200"
            }`}
          >
            {hint.satisfied ? "✓ " : "○ "}
            {hint.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{hint.description}</p>
          {!hint.satisfied && (
            <p className="mt-1 text-xs text-amber-300/90">{hint.missingTip}</p>
          )}
          <p className="mt-1 text-xs text-slate-600">
            Пример: <span className="text-slate-400">{hint.example}</span>
          </p>
        </div>
        {!hint.satisfied && (
          <button
            type="button"
            onClick={() => onInsert(hint.insertText)}
            className="shrink-0 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:border-brand-500 hover:text-brand-300"
          >
            + Вставить
          </button>
        )}
      </div>
    </div>
  );
}

export function PromptHints({ prompt, onInsert }: Props) {
  const analysis = useMemo(() => analyzePrompt(prompt), [prompt]);

  function handleInsert(fragment: string) {
    onInsert(appendHintToPrompt(prompt, fragment));
  }

  return (
    <div className="mt-3 space-y-3">
      <div
        className={`rounded-lg border px-3 py-2 text-xs ${READINESS_STYLES[analysis.readiness]}`}
      >
        <p className="font-medium">
          Подсказки для AI · {analysis.satisfiedCount}/{analysis.total}
        </p>
        <p className="mt-1 opacity-90">{analysis.summary}</p>
      </div>

      <p className="text-xs text-slate-500">
        Нейросеть читает ваш текст и собирает слайд: заголовок, цифры в блоках,
        синий баннер и подписи к товару. Чем конкретнее описание — тем точнее
        результат.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {analysis.hints.map((hint) => (
          <HintRow key={hint.id} hint={hint} onInsert={handleInsert} />
        ))}
      </div>
    </div>
  );
}
