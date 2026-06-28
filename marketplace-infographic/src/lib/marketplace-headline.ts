import type { InfographicData } from "@/lib/infographic-template";
import { extractProductTitle } from "@/lib/title-extract";

const CLICHE_HEADLINES = [
  /сила в каждой детали/i,
  /меньше слов/i,
  /больше смысла/i,
  /уверенность в/i,
  /комфорт каждый день/i,
  /выше ожиданий/i,
  /качество,? которое видно/i,
  /надёжность в деталях/i,
  /надежность в деталях/i,
  /лучший выбор/i,
  /идеальн/i,
  /премиальн/i,
  /вдохновля/i,
  /твой выбор/i,
  /для всей семьи/i,
];

function isClicheHeadline(text: string): boolean {
  const t = text.trim();
  if (t.length > 36) return true;
  return CLICHE_HEADLINES.some((re) => re.test(t));
}

/** Фактологичный заголовок вместо AI-клише для marketplace */
export function resolveMarketplaceHeadline(
  data: InfographicData,
  productPrompt?: string,
): string {
  const raw = data.headline?.trim() ?? "";
  if (raw && !isClicheHeadline(raw)) {
    return raw;
  }

  if (data.productName?.trim()) {
    const name = data.productName.trim();
    if (name.length <= 28) return name;
    return name.slice(0, 28).trim();
  }

  const fromPrompt = extractProductTitle(productPrompt ?? "", data.productName ?? "");
  if (fromPrompt && !isClicheHeadline(fromPrompt)) return fromPrompt.slice(0, 28);

  const spec = data.specBlocks[0];
  if (spec?.value && spec?.label) {
    const combined = `${spec.value} ${spec.label}`.trim();
    if (combined.length <= 28) return combined;
    return spec.value;
  }

  return spec?.value ?? "Новинка";
}
