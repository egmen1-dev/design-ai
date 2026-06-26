import { CANVAS, HEADLINE_BLOCK_MAX_HEIGHT_PCT, HEADLINE_FONT_MAX_PX, HEADLINE_FONT_MIN_PX } from "./constants";

/** Оценка ширины текста (приближённо, кириллица) */
function estimateTextWidthPx(text: string, fontPx: number): number {
  const avgChar = fontPx * 0.52;
  return text.length * avgChar;
}

/** Разбивает заголовок максимум на 2 строки без переноса внутри слов */
export function splitHeadlineTwoLines(title: string): [string, string?] {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [title.trim()];
  if (words.length === 2) return [words[0], words[1]];

  let bestSplit = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(" ");
    const l2 = words.slice(i).join(" ");
    const diff = Math.abs(l1.length - l2.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplit = i;
    }
  }
  const line1 = words.slice(0, bestSplit).join(" ");
  const line2 = words.slice(bestSplit).join(" ");
  return line2 ? [line1, line2] : [line1];
}

/** Подбирает размер шрифта 46–84px, макс. 2 строки, без переноса слов */
export function fitHeadlineFontSize(
  title: string,
  maxWidthPct: number,
): { fontPx: number; fontSizePct: number; lines: string[]; blockHeightPct: number } {
  const maxWidthPx = (maxWidthPct / 100) * CANVAS.width;
  const maxBlockHeightPx = (HEADLINE_BLOCK_MAX_HEIGHT_PCT / 100) * CANVAS.height;
  const [line1, line2] = splitHeadlineTwoLines(title);
  const lines = line2 ? [line1, line2] : [line1];
  const longestLine = lines.reduce((a, b) => (a.length >= b.length ? a : b), "");

  let fontPx = HEADLINE_FONT_MAX_PX;
  while (fontPx > HEADLINE_FONT_MIN_PX) {
    const lineWidth = estimateTextWidthPx(longestLine, fontPx);
    const blockHeight = fontPx * 1.08 * lines.length;
    if (lineWidth <= maxWidthPx && blockHeight <= maxBlockHeightPx) break;
    fontPx -= 2;
  }
  fontPx = Math.max(HEADLINE_FONT_MIN_PX, fontPx);
  const blockHeightPct = ((fontPx * 1.08 * lines.length) / CANVAS.height) * 100;

  return {
    fontPx,
    fontSizePct: (fontPx / CANVAS.height) * 100,
    lines,
    blockHeightPct: Math.min(HEADLINE_BLOCK_MAX_HEIGHT_PCT, blockHeightPct),
  };
}

export function hasWordBreakInsideWord(title: string): boolean {
  return /-\s*\n|\w{12,}/.test(title);
}
