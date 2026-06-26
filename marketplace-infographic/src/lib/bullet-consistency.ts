export type PowerType = "battery" | "gas" | "corded" | "unknown";

export function detectPowerType(...parts: string[]): PowerType {
  const text = parts.join(" ").toLowerCase();
  if (/аккумулятор|акб|battery|li-ion|а·ч|mah|вольт/i.test(text)) return "battery";
  if (/бензин|бак\s*\d|\d\s*л\b|литр|л\/ч|2т|4т/i.test(text)) return "gas";
  if (/\d+\s*вт|\d+\s*квт|от сети|220\s*в/i.test(text) && !/акб|аккумулятор/i.test(text)) {
    return "corded";
  }
  return "unknown";
}

/** Убирает противоречащие характеристики (аккумуляторный + бак 2 л) */
export function filterConsistentBullets(
  bullets: string[],
  context: string,
  subtitle: string,
): string[] {
  const power = detectPowerType(context, subtitle, bullets.join(" "));

  return bullets.filter((bullet) => {
    const b = bullet.toLowerCase();
    if (power === "battery") {
      if (/бак|литр|\d\s*л\b|л\/ч|бензин/i.test(b)) return false;
      if (/\d{3,4}\s*вт/i.test(b) && !/акб/i.test(b)) return false;
    }
    if (power === "gas" && /акб|аккумулятор|а·ч/i.test(b)) return false;
    return true;
  });
}

export function gardenTrimmerBatteryBullets(): string[] {
  return [
    "25000 об/мин",
    "Очки и перчатки в подарок",
    "3 мощных АКБ",
    "8 насадок",
    "Немецкие технологии",
  ];
}
