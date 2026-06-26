import type { InfographicStyle } from "@/lib/design-trends";
import type { StyleSlideSkin } from "@/lib/style-slide-css";
import type { InfographicData } from "@/lib/infographic-template";

export type PlaqueKind = "stat" | "ribbon" | "seal" | "stack" | "tag" | "notch";

type StylePlaqueSet = {
  left: PlaqueKind;
  rightTop: PlaqueKind;
  rightBottom: PlaqueKind;
  promo: PlaqueKind;
  spec: PlaqueKind;
};

const STYLE_PLAQUES: Record<InfographicStyle, StylePlaqueSet> = {
  modern: {
    left: "stat",
    rightTop: "ribbon",
    rightBottom: "seal",
    promo: "ribbon",
    spec: "stat",
  },
  minimal: {
    left: "stack",
    rightTop: "notch",
    rightBottom: "seal",
    promo: "notch",
    spec: "stack",
  },
  glassmorphism: {
    left: "stat",
    rightTop: "ribbon",
    rightBottom: "seal",
    promo: "ribbon",
    spec: "stat",
  },
  neumorphism: {
    left: "stack",
    rightTop: "ribbon",
    rightBottom: "seal",
    promo: "stack",
    spec: "stack",
  },
  brutalism: {
    left: "stat",
    rightTop: "tag",
    rightBottom: "stat",
    promo: "tag",
    spec: "stat",
  },
  retro: {
    left: "stack",
    rightTop: "ribbon",
    rightBottom: "seal",
    promo: "ribbon",
    spec: "stack",
  },
  swiss: {
    left: "stat",
    rightTop: "tag",
    rightBottom: "seal",
    promo: "tag",
    spec: "stat",
  },
  "3d": {
    left: "stack",
    rightTop: "ribbon",
    rightBottom: "seal",
    promo: "ribbon",
    spec: "stack",
  },
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pickIcon(text: string): string {
  if (/вт|квт|мощ|power/i.test(text)) return "bolt";
  if (/л|литр|объём|объем/i.test(text)) return "water_drop";
  if (/кг|вес/i.test(text)) return "fitness_center";
  if (/гарант|год|мес/i.test(text)) return "verified";
  if (/ipx|защит/i.test(text)) return "shield";
  return "star";
}

function plaqueShell(
  kind: PlaqueKind,
  inner: string,
  skin: StyleSlideSkin,
  accentPrimary: string,
  extraClass = "",
): string {
  const styleAttr = `style="background:${skin.badgeBg};color:${skin.badgeTextColor};border-radius:${skin.badgeRadius};${skin.badgeExtraCss}"`;
  const accentAttr = `style="--plaque-accent:${accentPrimary};border-color:${accentPrimary};color:${accentPrimary};background:${skin.circleBg}"`;

  if (kind === "seal") {
    return `<div class="plaque plaque--seal ${extraClass}" ${accentAttr}>${inner}</div>`;
  }

  return `<div class="plaque plaque--${kind} ${extraClass}" ${styleAttr}>${inner}</div>`;
}

function statBody(value: string, label: string): string {
  return `
    <span class="plaque__value">${escapeHtml(value)}</span>
    <span class="plaque__label">${escapeHtml(label)}</span>`;
}

function ribbonBody(icon: string, text: string): string {
  return `
    <span class="material-symbols-outlined plaque__icon" aria-hidden="true">${icon}</span>
    <span class="plaque__text">${escapeHtml(text)}</span>`;
}

function stackBody(head: string, value: string, label: string, accent: string): string {
  return `
    <div class="plaque__stack-head" style="background:${accent};">${escapeHtml(head)}</div>
    <div class="plaque__stack-body">
      <span class="plaque__value">${escapeHtml(value)}</span>
      <span class="plaque__label">${escapeHtml(label)}</span>
    </div>`;
}

function sealBody(value: string, label: string): string {
  return `
    <span class="plaque__value">${escapeHtml(value)}</span>
    <span class="plaque__label">${escapeHtml(label)}</span>`;
}

function tagBody(text: string): string {
  return `<span class="plaque__text">${escapeHtml(text)}</span>`;
}

function notchBody(icon: string, text: string): string {
  return ribbonBody(icon, text);
}

export function buildPlaqueHtml(
  kind: PlaqueKind,
  payload:
    | { type: "stat"; value: string; label: string }
    | { type: "ribbon"; text: string }
    | { type: "stack"; head: string; value: string; label: string }
    | { type: "seal"; value: string; label: string }
    | { type: "tag"; text: string }
    | { type: "notch"; text: string },
  skin: StyleSlideSkin,
  accentPrimary: string,
): string {
  switch (payload.type) {
    case "stat":
      return plaqueShell(kind, statBody(payload.value, payload.label), skin, accentPrimary);
    case "ribbon":
      return plaqueShell(
        kind,
        ribbonBody(pickIcon(payload.text), payload.text),
        skin,
        accentPrimary,
      );
    case "stack":
      return plaqueShell(
        kind,
        stackBody(payload.head, payload.value, payload.label, accentPrimary),
        skin,
        accentPrimary,
        "plaque--stack-wrap",
      );
    case "seal":
      return plaqueShell(kind, sealBody(payload.value, payload.label), skin, accentPrimary);
    case "tag":
      return plaqueShell(kind, tagBody(payload.text), skin, accentPrimary);
    case "notch":
      return plaqueShell(
        kind,
        notchBody(pickIcon(payload.text), payload.text),
        skin,
        accentPrimary,
      );
    default:
      return "";
  }
}

export function buildSideBadgesLeftHtml(
  data: InfographicData,
  skin: StyleSlideSkin,
  accentPrimary: string,
  style: InfographicStyle,
): string {
  const spec = data.specBlocks[0];
  const kind = STYLE_PLAQUES[style].left;

  if (kind === "stack") {
    return buildPlaqueHtml(
      kind,
      {
        type: "stack",
        head: spec.label.toUpperCase(),
        value: spec.value,
        label: spec.label,
      },
      skin,
      accentPrimary,
    );
  }

  return buildPlaqueHtml(
    kind,
    { type: "stat", value: spec.value, label: spec.label },
    skin,
    accentPrimary,
  );
}

export function buildSideBadgesRightHtml(
  data: InfographicData,
  skin: StyleSlideSkin,
  accentPrimary: string,
  style: InfographicStyle,
): string {
  const spec = data.specBlocks[1] ?? data.specBlocks[0];
  const banner = data.mainBanner;
  const set = STYLE_PLAQUES[style];

  const top = buildPlaqueHtml(
    set.rightTop,
    set.rightTop === "tag" || set.rightTop === "notch"
      ? { type: set.rightTop, text: banner.title }
      : { type: "ribbon", text: banner.title },
    skin,
    accentPrimary,
  );

  const bottomKind = set.rightBottom;
  let bottom: string;

  if (bottomKind === "seal") {
    bottom = buildPlaqueHtml(
      bottomKind,
      { type: "seal", value: spec.value, label: spec.label },
      skin,
      accentPrimary,
    );
  } else {
    bottom = buildPlaqueHtml(
      bottomKind,
      { type: "stat", value: spec.value, label: spec.label },
      skin,
      accentPrimary,
    );
  }

  return `${top}${bottom}`;
}

export function buildPromoPlaqueHtml(
  banner: InfographicData["mainBanner"],
  skin: StyleSlideSkin,
  accentPrimary: string,
  style: InfographicStyle,
): string {
  const kind = STYLE_PLAQUES[style].promo;

  if (kind === "stack") {
    const parts = banner.title.split(/\s+/);
    const value = parts[0] ?? banner.title;
    const label = parts.slice(1).join(" ") || banner.description || "характеристика";
    return buildPlaqueHtml(
      kind,
      {
        type: "stack",
        head: banner.description?.slice(0, 18).toUpperCase() || "ФИШКА",
        value,
        label,
      },
      skin,
      accentPrimary,
    );
  }

  if (kind === "tag" || kind === "notch") {
    return buildPlaqueHtml(kind, { type: kind, text: banner.title }, skin, accentPrimary);
  }

  return buildPlaqueHtml(
    kind,
    { type: "ribbon", text: banner.title },
    skin,
    accentPrimary,
  );
}

export function buildSpecPlaquesHtml(
  specs: InfographicData["specBlocks"],
  skin: StyleSlideSkin,
  accentPrimary: string,
  style: InfographicStyle,
): string {
  const kind = STYLE_PLAQUES[style].spec;

  const cards = specs.slice(0, 3).map((spec) => {
    if (kind === "stack") {
      return buildPlaqueHtml(
        kind,
        {
          type: "stack",
          head: spec.label.toUpperCase(),
          value: spec.value,
          label: spec.label,
        },
        skin,
        accentPrimary,
      );
    }

    return buildPlaqueHtml(
      kind,
      { type: "stat", value: spec.value, label: spec.label },
      skin,
      accentPrimary,
    );
  });

  return `<div class="spec-row spec-row--plaques">${cards.join("")}</div>`;
}

export function buildPlaqueSkinCss(style: InfographicStyle, skin: StyleSlideSkin): string {
  const sealRadius = skin.circleRadius;
  const isBrutal = style === "brutalism";
  const isSwiss = style === "swiss";
  const isGlass = style === "glassmorphism";
  const isNeu = style === "neumorphism";
  const is3d = style === "3d";

  return `
    .plaque { font-family: var(--font-display); }
    .plaque--seal {
      border-radius: ${sealRadius};
      border-width: ${isBrutal || isSwiss ? "4px" : "5px"};
      border-style: solid;
      background: ${skin.circleBg};
      color: ${skin.badgeTextColor};
      ${skin.badgeExtraCss}
    }
    .plaque--stack-wrap { padding: 0; overflow: hidden; background: transparent !important; border: none !important; box-shadow: none !important; }
    .plaque__stack-head {
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-align: center;
      color: #fff;
    }
    .plaque__stack-body {
      padding: 14px 16px;
      text-align: center;
      background: ${skin.badgeBg};
      color: ${skin.badgeTextColor};
      border-radius: 0 0 ${skin.badgeRadius} ${skin.badgeRadius};
      ${skin.badgeExtraCss}
    }
    .plaque--tag {
      clip-path: polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%);
      padding-right: 22px;
      padding-bottom: 18px;
    }
    .plaque--notch::after {
      content: "";
      position: absolute;
      left: 50%;
      bottom: -10px;
      transform: translateX(-50%);
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 10px solid ${skin.badgeBg};
      filter: drop-shadow(0 2px 0 rgba(0,0,0,0.12));
    }
    .plaque--ribbon::before {
      content: "";
      position: absolute;
      right: -8px;
      top: 50%;
      transform: translateY(-50%);
      border-top: 14px solid transparent;
      border-bottom: 14px solid transparent;
      border-left: 8px solid ${isBrutal ? "#111" : "currentColor"};
      opacity: ${isBrutal ? 1 : 0.35};
    }
    ${isGlass ? `.plaque { backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }` : ""}
    ${isNeu ? `.plaque--stat, .plaque--ribbon, .plaque--notch { box-shadow: inset 2px 2px 6px rgba(255,255,255,0.65), inset -3px -3px 8px rgba(163,177,198,0.55), 8px 8px 18px #bec3c9; }` : ""}
    ${is3d ? `.plaque { box-shadow: 0 16px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.25); }` : ""}
    ${isBrutal ? `.plaque--seal { border-radius: 0; } .plaque__stack-body { border: 4px solid #111; box-shadow: 8px 8px 0 #111; }` : ""}
    ${isSwiss ? `.plaque--tag { clip-path: none; border-left: 6px solid ${skin.brandColor}; }` : ""}
    .spec-row--plaques .plaque { min-height: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .accent-pill.plaque { margin-top: 16px; }
  `;
}

export function renderLibraryBadgeHtml(
  template: string,
  text: string,
  color: string,
): string {
  const safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return template.replaceAll("{{text}}", safeText).replaceAll("{{color}}", color);
}
