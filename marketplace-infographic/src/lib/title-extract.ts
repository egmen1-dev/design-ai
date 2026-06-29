/** Извлекает название товара из описания, если AI вернул «Товар» / «Новинка» */
const GENERIC_TITLES = /^(товар|новинка|продукт|product|item|brand)$/i;

export function extractProductTitle(prompt: string, aiTitle?: string): string {
  const cleaned = (aiTitle ?? "").trim();
  if (cleaned && !GENERIC_TITLES.test(cleaned) && cleaned.length > 3) {
    return cleaned.slice(0, 40);
  }

  const text = prompt.replace(/\s+/g, " ").trim();

  const brandModel = text.match(
    /((?:бензиновый|аккумуляторный|электрический|профессиональный|садовый|беспроводные?|робот[\s-]?)?\s*(?:генератор|триммер|пылесос|наушники?|крем|куртка|чайник)[^.!?\n,]{0,50})/i,
  );
  if (brandModel) {
    return brandModel[1]
      .replace(/\s{2,}/g, " ")
      .replace(/\d+\s*(?:кВт|квт|Вт|вт|л|литр|мАч).*/i, "")
      .trim()
      .slice(0, 40);
  }

  const firstSentence = text.split(/[.!?\n]/)[0]?.trim() ?? text;
  const words = firstSentence.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, Math.min(5, words.length))
      .join(" ")
      .replace(/\d+\s*(?:кВт|квт|Вт|вт).*/i, "")
      .trim()
      .slice(0, 40);
  }

  return cleaned || "Товар";
}

export function extractProductSubtitle(prompt: string, aiSubtitle?: string): string {
  const sub = (aiSubtitle ?? "").trim();
  if (sub && !GENERIC_TITLES.test(sub) && !/премиум\s*качество/i.test(sub)) {
    return sub.slice(0, 40);
  }

  const text = prompt.toLowerCase();
  if (/генератор|generator/.test(text)) {
    const kw = text.match(/(\d+(?:[.,]\d+)?\s*квт)/i);
    if (kw) return kw[1].replace(/\s+/g, " ");
    return "бензиновый";
  }
  if (/триммер/.test(text)) {
    return /аккумулятор|акб/i.test(text) ? "аккумуляторный" : "мощный";
  }
  if (/наушник/.test(text)) return "беспроводные";
  if (/крем|космет/.test(text)) return "увлажняющий";

  return sub || "новинка";
}
