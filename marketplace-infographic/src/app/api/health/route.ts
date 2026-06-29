import { NextResponse } from "next/server";
import { PIPELINE_VERSION } from "@/lib/pipeline-version";

export async function GET() {
  const checks = {
    status: "ok",
    pipelineVersion: PIPELINE_VERSION,
    timestamp: new Date().toISOString(),
    ollama: false,
    database: false,
  };

  try {
    const ollamaUrl =
      process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    const res = await fetch(`${ollamaUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    checks.ollama = res.ok;
  } catch {
    checks.ollama = false;
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  const healthy = checks.database;
  return NextResponse.json(checks, { status: healthy ? 200 : 503 });
}
