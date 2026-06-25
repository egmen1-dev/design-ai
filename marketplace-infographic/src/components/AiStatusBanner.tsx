"use client";

import { useEffect, useState } from "react";

type AiStatus = {
  available: boolean;
  model: string;
  mockMode: boolean;
  message: string;
};

export function AiStatusBanner() {
  const [status, setStatus] = useState<AiStatus | null>(null);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
  }, []);

  if (!status) return null;

  const ok = status.available || status.mockMode;

  return (
    <div
      className={`mb-8 rounded-xl border px-4 py-3 text-sm ${
        ok
          ? "border-green-800/50 bg-green-950/30 text-green-300"
          : "border-amber-800/50 bg-amber-950/30 text-amber-200"
      }`}
    >
      <span className="font-medium">AI: </span>
      {status.message}
      {status.mockMode && (
        <span className="ml-2 text-xs opacity-70">(AI_MOCK_MODE=true)</span>
      )}
    </div>
  );
}
