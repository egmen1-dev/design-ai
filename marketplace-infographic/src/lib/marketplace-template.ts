export type MarketplaceCardData = {
  title: string;
  subtitle: string;
  price: string;
  oldPrice?: string;
  productEmoji?: string;
  badges: string[];
  features: string[];
  specs: { label: string; value: string }[];
};

type ProductCategory = "cosmetics" | "electronics" | "clothing" | "home" | "generic";

const CATEGORY_HINTS: Record<Exclude<ProductCategory, "generic">, string[]> = {
  cosmetics: ["крем", "сыворот", "шампун", "космет", "уход", "кож", "spf", "маск", "помад", "духи"],
  electronics: ["наушник", "телефон", "ноутбук", "bluetooth", "usb", "заряд", "кабель", "колонк", "планшет", "smart"],
  clothing: ["куртк", "плать", "футболк", "джинс", "одежд", "размер", "хлопок", "шерст", "кроссовк", "обув"],
  home: ["пылесос", "чайник", "термос", "посуда", "дом", "кухн", "уборк", "ламп", "подушк", "постел"],
};

const CATEGORY_EMOJI: Record<ProductCategory, string> = {
  cosmetics: "✨",
  electronics: "🎧",
  clothing: "👕",
  home: "🏠",
  generic: "📦",
};

const DEFAULT_BADGES = ["Хит продаж", "Быстрая доставка", "Гарантия 12 мес"];

const DEFAULT_FEATURES: Record<ProductCategory, string[]> = {
  cosmetics: [
    "Гипоаллергенная формула для ежедневного ухода",
    "Подходит для чувствительной кожи",
    "Удобный формат для дома и поездок",
    "Проверенные активные компоненты",
    "Видимый результат при регулярном применении",
  ],
  electronics: [
    "Стабильное подключение и быстрый отклик",
    "Долгое время работы без подзарядки",
    "Компактный корпус и удобное управление",
    "Подходит для ежедневного использования",
    "Совместимость с популярными устройствами",
  ],
  clothing: [
    "Прочные материалы и аккуратная посадка",
    "Удобно в носке весь день",
    "Практичные карманы и детали",
    "Широкая размерная сетка",
    "Лёгкий уход и сохранение формы",
  ],
  home: [
    "Экономит время на рутинных задачах",
    "Простое управление без лишних настроек",
    "Компактный размер для любой кухни",
    "Надёжная сборка и долгий срок службы",
    "Безопасные материалы для семьи",
  ],
  generic: [
    "Высокое качество материалов и сборки",
    "Быстрая доставка по всей России",
    "Гарантия производителя 12 месяцев",
    "Подходит для ежедневного использования",
    "Выгодное соотношение цены и качества",
  ],
};

const DEFAULT_SUBTITLES: Record<ProductCategory, string> = {
  cosmetics: "Нежный уход для ежедневного комфорта",
  electronics: "Надёжная техника для повседневных задач",
  clothing: "Удобная посадка и практичные детали",
  home: "Практичное решение для дома каждый день",
  generic: "Качество, проверенное покупателями",
};

const DEFAULT_SPECS: Record<ProductCategory, { label: string; value: string }[]> = {
  cosmetics: [
    { label: "Объём", value: "50 мл" },
    { label: "Тип кожи", value: "Все типы" },
    { label: "Страна", value: "Россия" },
  ],
  electronics: [
    { label: "Питание", value: "USB-C" },
    { label: "Гарантия", value: "12 мес" },
    { label: "Комплект", value: "Кабель в наборе" },
  ],
  clothing: [
    { label: "Материал", value: "Хлопок 95%" },
    { label: "Сезон", value: "Всесезон" },
    { label: "Уход", value: "Машинная стирка" },
  ],
  home: [
    { label: "Мощность", value: "1500 Вт" },
    { label: "Объём", value: "1.7 л" },
    { label: "Гарантия", value: "24 мес" },
  ],
  generic: [
    { label: "Назначение", value: "Повседневное" },
    { label: "Доставка", value: "1–3 дня" },
    { label: "Гарантия", value: "12 мес" },
  ],
};

const FEATURE_ICONS = ["✓", "★", "⚡", "🛡", "📦", "💎"];

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function detectCategory(prompt: string): ProductCategory {
  const lower = prompt.toLowerCase();
  for (const category of Object.keys(CATEGORY_HINTS) as Exclude<ProductCategory, "generic">[]) {
    if (CATEGORY_HINTS[category].some((hint) => lower.includes(hint))) {
      return category;
    }
  }
  return "generic";
}

function buildTitle(prompt: string): string {
  const words = prompt.split(/\s+/).filter(Boolean);
  const fromWords = words.slice(0, 6).join(" ").slice(0, 50);
  const fallback = prompt.slice(0, 50).trim();
  const raw = fromWords || fallback || "Ваш товар";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function extractFeatures(prompt: string, category: ProductCategory): string[] {
  const sentences = prompt
    .split(/[.!?\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, 6);

  if (sentences.length >= 4) {
    return normalizeFeatureCount(sentences);
  }

  const defaults = DEFAULT_FEATURES[category];
  const merged = [...sentences, ...defaults];
  return normalizeFeatureCount(merged);
}

function normalizeFeatureCount(features: string[]): string[] {
  const unique = [...new Set(features.map((f) => f.trim()).filter(Boolean))];
  if (unique.length >= 6) return unique.slice(0, 6);
  if (unique.length >= 4) return unique;
  const padded = [...unique];
  while (padded.length < 4) {
    padded.push(DEFAULT_FEATURES.generic[padded.length % DEFAULT_FEATURES.generic.length]);
  }
  return padded.slice(0, 6);
}

function extractPrice(prompt: string): { price: string; oldPrice?: string } {
  const priceMatch = prompt.match(/(\d[\d\s]*)\s*₽/);
  if (!priceMatch) {
    return { price: "1 299 ₽", oldPrice: "2 499 ₽" };
  }

  const price = `${priceMatch[1].replace(/\s/g, " ").trim()} ₽`;
  const oldMatch = prompt.match(/(?:было|старая\s+цена|вместо)\s*(\d[\d\s]*)\s*₽/i);
  const oldPrice = oldMatch ? `${oldMatch[1].replace(/\s/g, " ").trim()} ₽` : undefined;
  return { price, oldPrice };
}

function extractBadges(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const badges: string[] = [];

  if (/хит|бестселлер|топ/.test(lower)) badges.push("Хит продаж");
  if (/новинк|new/.test(lower)) badges.push("Новинка");
  if (/скидк|акци|распродаж/.test(lower)) badges.push("Скидка");
  if (/доставк|быстр/.test(lower)) badges.push("Быстрая доставка");
  if (/гарант/.test(lower)) badges.push("Гарантия 12 мес");
  if (/оригинал|сертиф/.test(lower)) badges.push("Оригинал");

  return badges.length > 0 ? badges.slice(0, 4) : DEFAULT_BADGES.slice(0, 3);
}

function extractSpecs(prompt: string, category: ProductCategory): { label: string; value: string }[] {
  const specs: { label: string; value: string }[] = [];
  const patterns: [RegExp, string][] = [
    [/(\d+(?:[.,]\d+)?)\s*(?:мл|ml)/i, "Объём"],
    [/(\d+(?:[.,]\d+)?)\s*(?:л|l)\b/i, "Объём"],
    [/(\d+(?:[.,]\d+)?)\s*(?:кг|kg)/i, "Вес"],
    [/(\d+(?:[.,]\d+)?)\s*(?:г|g)\b/i, "Вес"],
    [/(\d+(?:[.,]\d+)?)\s*(?:вт|w)\b/i, "Мощность"],
    [/размер[:\s]+([^\n,.;]+)/i, "Размер"],
    [/материал[:\s]+([^\n,.;]+)/i, "Материал"],
    [/цвет[:\s]+([^\n,.;]+)/i, "Цвет"],
  ];

  for (const [pattern, label] of patterns) {
    const match = prompt.match(pattern);
    if (match) {
      specs.push({ label, value: match[1].trim().slice(0, 24) });
    }
  }

  if (specs.length >= 3) return specs.slice(0, 4);
  return [...specs, ...DEFAULT_SPECS[category]].slice(0, 4);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.map((item) => asString(item)).filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function asSpecs(
  value: unknown,
  fallback: { label: string; value: string }[],
): { label: string; value: string }[] {
  if (!Array.isArray(value)) return fallback;
  const specs = value
    .filter(isRecord)
    .map((item) => ({
      label: asString(item.label),
      value: asString(item.value),
    }))
    .filter((item) => item.label && item.value);
  return specs.length > 0 ? specs.slice(0, 4) : fallback;
}

export function parseCardDataFromPrompt(prompt: string): MarketplaceCardData {
  const trimmed = prompt.trim();
  const category = detectCategory(trimmed);
  const { price, oldPrice } = extractPrice(trimmed);

  return {
    title: buildTitle(trimmed),
    subtitle: DEFAULT_SUBTITLES[category],
    price,
    oldPrice,
    productEmoji: CATEGORY_EMOJI[category],
    badges: extractBadges(trimmed),
    features: extractFeatures(trimmed, category),
    specs: extractSpecs(trimmed, category),
  };
}

export function parseCardDataFromJson(raw: string, fallbackPrompt: string): MarketplaceCardData {
  const fallback = parseCardDataFromPrompt(fallbackPrompt);

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return fallback;

    return {
      title: asString(parsed.title, fallback.title),
      subtitle: asString(parsed.subtitle, fallback.subtitle),
      price: asString(parsed.price, fallback.price),
      oldPrice: asString(parsed.oldPrice, fallback.oldPrice) || undefined,
      productEmoji: asString(parsed.productEmoji, fallback.productEmoji),
      badges: asStringArray(parsed.badges, fallback.badges).slice(0, 4),
      features: normalizeFeatureCount(asStringArray(parsed.features, fallback.features)),
      specs: asSpecs(parsed.specs, fallback.specs),
    };
  } catch {
    return fallback;
  }
}

export function renderMarketplaceCardHtml(data: MarketplaceCardData): string {
  const productEmoji = data.productEmoji ?? "📦";
  const features = normalizeFeatureCount(data.features);
  const badges = data.badges.slice(0, 4);
  const specs = data.specs.slice(0, 4);
  const showOldPrice = Boolean(data.oldPrice && data.oldPrice !== data.price);

  const badgesHtml = badges
    .map(
      (badge, index) =>
        `<span class="badge badge-${index % 3}">${escapeHtml(badge)}</span>`,
    )
    .join("");

  const featuresHtml = features
    .map(
      (feature, index) => `
        <div class="feature">
          <div class="feature-icon">${FEATURE_ICONS[index % FEATURE_ICONS.length]}</div>
          <div class="feature-text">${escapeHtml(feature)}</div>
        </div>`,
    )
    .join("");

  const specsHtml = specs
    .map(
      (spec) => `
        <div class="spec">
          <div class="spec-label">${escapeHtml(spec.label)}</div>
          <div class="spec-value">${escapeHtml(spec.value)}</div>
        </div>`,
    )
    .join("");

  const priceHtml = data.price
    ? `<div class="price-block">
        <span class="price-label">Цена</span>
        <span class="price">${escapeHtml(data.price)}</span>
        ${showOldPrice ? `<span class="old-price">${escapeHtml(data.oldPrice!)}</span>` : ""}
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1200, height=1200" />
  <title>${escapeHtml(data.title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    html, body {
      width: 1200px;
      height: 1200px;
      overflow: hidden;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    }

    .card {
      width: 1200px;
      height: 1200px;
      background: linear-gradient(145deg, #6b21a8 0%, #7c3aed 28%, #2563eb 72%, #1d4ed8 100%);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      padding: 48px;
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 15% 20%, rgba(255,255,255,0.18) 0%, transparent 42%),
        radial-gradient(circle at 85% 75%, rgba(255,255,255,0.12) 0%, transparent 45%);
      pointer-events: none;
    }

    .card::after {
      content: "";
      position: absolute;
      width: 520px;
      height: 520px;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
      top: -180px;
      right: -120px;
      pointer-events: none;
    }

    .header {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
    }

    .marketplace-tag {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      background: rgba(255,255,255,0.16);
      border: 1px solid rgba(255,255,255,0.28);
      padding: 10px 18px;
      border-radius: 999px;
      backdrop-filter: blur(8px);
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 600;
    }

    .stars { color: #fde047; letter-spacing: 2px; }

    .main {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 420px 1fr;
      gap: 40px;
      flex: 1;
      min-height: 0;
    }

    .visual {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .emoji-box {
      flex: 1;
      min-height: 380px;
      background: linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%);
      border: 2px solid rgba(255,255,255,0.28);
      border-radius: 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 24px 60px rgba(0,0,0,0.22);
      backdrop-filter: blur(12px);
    }

    .emoji {
      font-size: 148px;
      line-height: 1;
      filter: drop-shadow(0 8px 24px rgba(0,0,0,0.2));
    }

    .emoji-caption {
      margin-top: 18px;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.78);
    }

    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .badge {
      font-size: 14px;
      font-weight: 700;
      padding: 8px 14px;
      border-radius: 999px;
      letter-spacing: 0.02em;
    }

    .badge-0 { background: #f43f5e; color: #fff; }
    .badge-1 { background: #fbbf24; color: #1e1b4b; }
    .badge-2 { background: rgba(255,255,255,0.92); color: #5b21b6; }

    .content {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .title {
      font-size: 52px;
      font-weight: 800;
      line-height: 1.08;
      letter-spacing: -0.02em;
      margin-bottom: 14px;
      text-shadow: 0 4px 20px rgba(0,0,0,0.18);
    }

    .subtitle {
      font-size: 24px;
      line-height: 1.35;
      color: rgba(255,255,255,0.88);
      margin-bottom: 24px;
      max-width: 640px;
    }

    .price-block {
      display: flex;
      align-items: baseline;
      gap: 16px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }

    .price-label {
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255,255,255,0.72);
    }

    .price {
      font-size: 56px;
      font-weight: 800;
      color: #fef08a;
      text-shadow: 0 2px 12px rgba(0,0,0,0.2);
    }

    .old-price {
      font-size: 28px;
      color: rgba(255,255,255,0.55);
      text-decoration: line-through;
    }

    .features-title {
      font-size: 18px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255,255,255,0.75);
      margin-bottom: 16px;
    }

    .features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      flex: 1;
      align-content: start;
    }

    .feature {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 16px;
      padding: 14px 16px;
      backdrop-filter: blur(6px);
    }

    .feature-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: rgba(255,255,255,0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .feature-text {
      font-size: 17px;
      line-height: 1.35;
      font-weight: 500;
      color: rgba(255,255,255,0.95);
    }

    .specs-row {
      position: relative;
      z-index: 1;
      margin-top: 28px;
      display: grid;
      grid-template-columns: repeat(${Math.max(specs.length, 1)}, 1fr);
      gap: 16px;
      background: rgba(15,23,42,0.28);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 20px;
      padding: 22px 24px;
      backdrop-filter: blur(8px);
    }

    .spec-label {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255,255,255,0.62);
      margin-bottom: 6px;
    }

    .spec-value {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
    }

    .footer {
      position: relative;
      z-index: 1;
      margin-top: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 18px;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: rgba(255,255,255,0.92);
    }

    .footer-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255,255,255,0.55);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="marketplace-tag">Карточка товара</div>
      <div class="rating">
        <span class="stars">★★★★★</span>
        <span>4.9</span>
      </div>
    </div>

    <div class="main">
      <div class="visual">
        <div class="emoji-box">
          <div class="emoji">${escapeHtml(productEmoji)}</div>
          <div class="emoji-caption">Фото товара</div>
        </div>
        <div class="badges">${badgesHtml}</div>
      </div>

      <div class="content">
        <h1 class="title">${escapeHtml(data.title)}</h1>
        <p class="subtitle">${escapeHtml(data.subtitle)}</p>
        ${priceHtml}
        <div class="features-title">Преимущества</div>
        <div class="features">${featuresHtml}</div>
      </div>
    </div>

    <div class="specs-row">${specsHtml}</div>

    <div class="footer">
      <span>Wildberries</span>
      <span class="footer-dot"></span>
      <span>Ozon</span>
    </div>
  </div>
</body>
</html>`;
}
