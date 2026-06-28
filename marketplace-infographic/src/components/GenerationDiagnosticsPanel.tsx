"use client";

import { useCallback, useState } from "react";

type DiagnosticStep = {
  id: string;
  label: string;
  status: "ok" | "warn" | "fail" | "skip";
  summary?: string;
  score?: number;
};

type RenderReportView = {
  selectedModel: string;
  overallScore: number;
  attempts: Array<{
    attemptIndex: number;
    modelId: string;
    providerId: string;
    passed: boolean;
    error?: string;
    qualityScore?: number;
    latencyMs?: number;
    backgroundUrl?: string;
    compiled?: { prompt: string; negativePrompt?: string };
  }>;
};

type DiagnosticsPayload = {
  id: string;
  prompt: string;
  createdAt: string;
  diagnostic: {
    steps: DiagnosticStep[];
    durationMs?: number;
    variationSeed: string;
    backgroundSource: string;
    renderReport?: RenderReportView;
  } | null;
  renderReport?: RenderReportView | null;
  artifacts: {
    finalImage: string;
    background?: string | null;
    productCutout?: string | null;
  };
  legacy?: boolean;
  message?: string;
};

const STATUS_COLORS: Record<DiagnosticStep["status"], string> = {
  ok: "text-emerald-400",
  warn: "text-amber-400",
  fail: "text-red-400",
  skip: "text-slate-500",
};

const STATUS_LABELS: Record<DiagnosticStep["status"], string> = {
  ok: "OK",
  warn: "WARN",
  fail: "FAIL",
  skip: "—",
};

export function GenerationDiagnosticsPanel({
  imageId,
  diagnosticsUrl,
}: {
  imageId: string;
  diagnosticsUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DiagnosticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = diagnosticsUrl ?? `/api/images/${imageId}/diagnostics`;
      const res = await fetch(url);
      const json = (await res.json()) as DiagnosticsPayload & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Не удалось загрузить диагностику");
        return;
      }
      setData(json);
      setOpen(true);
    } catch {
      setError("Ошибка сети при загрузке диагностики");
    } finally {
      setLoading(false);
    }
  }, [diagnosticsUrl, imageId]);

  const report: RenderReportView | null | undefined =
    data?.diagnostic?.renderReport ?? data?.renderReport;
  const steps = data?.diagnostic?.steps ?? [];

  return (
    <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/80">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-200">Диагностика генерации</p>
          <p className="text-xs text-slate-500">
            Цепочка пайплайна, артефакты и render report
          </p>
        </div>
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : load())}
          disabled={loading}
          className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-brand-500 disabled:opacity-50"
        >
          {loading ? "Загрузка..." : open ? "Скрыть" : "Показать отчёт"}
        </button>
      </div>

      {error && <p className="px-4 pb-3 text-xs text-red-400">{error}</p>}

      {open && data && (
        <div className="border-t border-slate-800 px-4 py-3 text-xs">
          {data.message && (
            <p className="mb-3 text-amber-400">{data.message}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <a
              href={data.artifacts.finalImage}
              target="_blank"
              rel="noreferrer"
              className="rounded border border-slate-700 px-2 py-1.5 text-sky-400 hover:border-brand-500"
            >
              Финал PNG
            </a>
            {data.artifacts.background && (
              <a
                href={data.artifacts.background}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-slate-700 px-2 py-1.5 text-sky-400 hover:border-brand-500"
              >
                AI-фон
              </a>
            )}
            {data.artifacts.productCutout && (
              <a
                href={data.artifacts.productCutout}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-slate-700 px-2 py-1.5 text-sky-400 hover:border-brand-500"
              >
                Cutout товара
              </a>
            )}
          </div>

          {data.diagnostic && (
            <p className="mt-3 text-slate-500">
              Seed: <span className="font-mono text-slate-300">{data.diagnostic.variationSeed}</span>
              {" · "}
              фон: <span className="text-slate-300">{data.diagnostic.backgroundSource}</span>
              {data.diagnostic.durationMs != null && (
                <>
                  {" · "}
                  {Math.round(data.diagnostic.durationMs / 1000)}с
                </>
              )}
            </p>
          )}

          {report && (
            <div className="mt-4 rounded border border-slate-800 bg-slate-900/60 p-3">
              <p className="font-medium text-slate-200">Render Report</p>
              <p className="mt-1 text-slate-400">
                Модель: <span className="text-brand-300">{report.selectedModel}</span>
                {" · "}
                score: {report.overallScore}
                {" · "}
                попыток: {report.attempts.length}
              </p>
              <div className="mt-2 space-y-2">
                {report.attempts.map((a) => (
                  <div
                    key={a.attemptIndex}
                    className="rounded border border-slate-800 px-2 py-1.5"
                  >
                    <p className="text-slate-300">
                      #{a.attemptIndex + 1} {a.modelId} @ {a.providerId}
                      {" — "}
                      <span className={a.passed ? "text-emerald-400" : "text-amber-400"}>
                        {a.passed ? "passed" : "retry"}
                      </span>
                      {a.qualityScore != null && ` · ${a.qualityScore}`}
                      {a.latencyMs != null && ` · ${a.latencyMs}ms`}
                    </p>
                    {a.error && <p className="text-red-400">{a.error}</p>}
                    {a.compiled?.prompt && (
                      <p className="mt-1 line-clamp-2 text-slate-500">{a.compiled.prompt}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {steps.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 font-medium text-slate-200">Цепочка пайплайна</p>
              <ol className="space-y-1">
                {steps.map((step) => (
                  <li
                    key={step.id}
                    className="flex flex-wrap items-baseline gap-x-2 rounded px-1 py-0.5 hover:bg-slate-900/50"
                  >
                    <span className={`font-mono ${STATUS_COLORS[step.status]}`}>
                      [{STATUS_LABELS[step.status]}]
                    </span>
                    <span className="text-slate-300">{step.label}</span>
                    {step.score != null && (
                      <span className="text-slate-500">{step.score}</span>
                    )}
                    {step.summary && (
                      <span className="text-slate-500">— {step.summary}</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-slate-400 hover:text-slate-200">
              JSON отчёт
            </summary>
            <pre className="mt-2 max-h-80 overflow-auto rounded bg-slate-900 p-2 text-[10px] leading-relaxed text-slate-400">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
