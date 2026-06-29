import type { ProductCategory } from "@/lib/product-analysis";
import type { CompositionScenario, DesignDNA } from "./types";
import type { VisualHook } from "@/lib/design-process/types";
import { scenarioBoostFromHook } from "@/lib/design-process/visual-hook";

function affinity(weights: Partial<Record<keyof DesignDNA, number>>) {
  return (dna: DesignDNA, _category: ProductCategory) => {
    let score = 50;
    for (const [key, w] of Object.entries(weights) as Array<[keyof DesignDNA, number]>) {
      score += ((dna[key] - 50) / 50) * w;
    }
    return score;
  };
}

export const COMPOSITION_SCENARIOS: CompositionScenario[] = [
  {
    id: "hero_product",
    label: "Hero Product",
    biases: {
      productCenterX: [48, 56],
      productCenterY: [50, 58],
      productWidth: [52, 68],
      productHeight: [72, 86],
      rotationDeg: [-14, -8],
      textSide: "left",
      headlineTop: [5, 8],
      headlineWidth: [42, 58],
      panelSpread: [0.85, 1],
    },
    dnaAffinity: affinity({ productDominance: 22, visualEnergy: 8 }),
  },
  {
    id: "dynamic_diagonal",
    label: "Dynamic Diagonal",
    biases: {
      productCenterX: [52, 60],
      productCenterY: [48, 56],
      productWidth: [48, 64],
      productHeight: [70, 84],
      rotationDeg: [-24, -14],
      textSide: "left",
      headlineTop: [5.5, 9],
      headlineWidth: [38, 52],
      panelSpread: [0.9, 1.05],
    },
    dnaAffinity: affinity({ visualEnergy: 25, symmetry: -12 }),
  },
  {
    id: "minimal_premium",
    label: "Minimal Premium",
    biases: {
      productCenterX: [46, 54],
      productCenterY: [50, 56],
      productWidth: [44, 58],
      productHeight: [68, 78],
      rotationDeg: [-10, -4],
      textSide: "left",
      headlineTop: [6, 10],
      headlineWidth: [36, 48],
      panelSpread: [0.75, 0.92],
    },
    dnaAffinity: affinity({ minimalism: 28, luxury: 18, decorDensity: -15 }),
  },
  {
    id: "asymmetric",
    label: "Asymmetric",
    biases: {
      productCenterX: [54, 62],
      productCenterY: [46, 54],
      productWidth: [50, 66],
      productHeight: [66, 82],
      rotationDeg: [-20, -12],
      textSide: "left",
      headlineTop: [5, 7.5],
      headlineWidth: [40, 55],
      panelSpread: [0.88, 1.08],
    },
    dnaAffinity: affinity({ symmetry: -25, visualEnergy: 12 }),
  },
  {
    id: "floating_product",
    label: "Floating Product",
    biases: {
      productCenterX: [47, 55],
      productCenterY: [44, 52],
      productWidth: [46, 60],
      productHeight: [74, 88],
      rotationDeg: [-16, -6],
      textSide: "auto",
      headlineTop: [5, 8],
      headlineWidth: [44, 60],
      panelSpread: [0.8, 1],
    },
    dnaAffinity: affinity({ depth: 22, negativeSpace: 15 }),
  },
  {
    id: "split_layout",
    label: "Split Layout",
    biases: {
      productCenterX: [58, 66],
      productCenterY: [50, 58],
      productWidth: [46, 58],
      productHeight: [65, 78],
      rotationDeg: [-18, -10],
      textSide: "left",
      headlineTop: [5.5, 8],
      headlineWidth: [38, 50],
      panelSpread: [1, 1.12],
    },
    dnaAffinity: affinity({ textDensity: 15, symmetry: 10 }),
  },
  {
    id: "luxury_advertising",
    label: "Luxury Advertising",
    biases: {
      productCenterX: [50, 57],
      productCenterY: [52, 58],
      productWidth: [42, 56],
      productHeight: [70, 82],
      rotationDeg: [-12, -5],
      textSide: "left",
      headlineTop: [6.5, 10],
      headlineWidth: [38, 52],
      panelSpread: [0.78, 0.95],
    },
    dnaAffinity: affinity({ luxury: 30, minimalism: 12, decorDensity: -10 }),
  },
  {
    id: "commercial_studio",
    label: "Commercial Studio",
    biases: {
      productCenterX: [49, 57],
      productCenterY: [50, 57],
      productWidth: [50, 64],
      productHeight: [68, 80],
      rotationDeg: [-15, -9],
      textSide: "left",
      headlineTop: [5, 7],
      headlineWidth: [44, 58],
      panelSpread: [0.92, 1.05],
    },
    dnaAffinity: affinity({ contrast: 15, lightingDrama: 18 }),
  },
  {
    id: "lifestyle",
    label: "Lifestyle Composition",
    biases: {
      productCenterX: [51, 59],
      productCenterY: [52, 60],
      productWidth: [48, 62],
      productHeight: [72, 86],
      rotationDeg: [-22, -14],
      textSide: "left",
      headlineTop: [5.5, 8.5],
      headlineWidth: [42, 56],
      panelSpread: [0.9, 1.02],
    },
    dnaAffinity: affinity({ depth: 15, colorMood: 12 }),
  },
  {
    id: "tech_showcase",
    label: "Tech Showcase",
    biases: {
      productCenterX: [50, 58],
      productCenterY: [48, 55],
      productWidth: [54, 70],
      productHeight: [66, 78],
      rotationDeg: [-11, -4],
      textSide: "left",
      headlineTop: [5, 7.5],
      headlineWidth: [46, 62],
      panelSpread: [0.95, 1.1],
    },
    dnaAffinity: affinity({ contrast: 18, visualEnergy: 14, symmetry: 8 }),
  },
  {
    id: "editorial",
    label: "Editorial",
    biases: {
      productCenterX: [45, 53],
      productCenterY: [50, 58],
      productWidth: [40, 54],
      productHeight: [68, 82],
      rotationDeg: [-18, -10],
      textSide: "right",
      headlineTop: [6, 9],
      headlineWidth: [36, 48],
      panelSpread: [0.82, 0.98],
    },
    dnaAffinity: affinity({ minimalism: 20, luxury: 15, textDensity: 10 }),
  },
  {
    id: "focus_frame",
    label: "Focus Frame",
    biases: {
      productCenterX: [48, 55],
      productCenterY: [50, 56],
      productWidth: [56, 72],
      productHeight: [74, 88],
      rotationDeg: [-10, -3],
      textSide: "left",
      headlineTop: [5, 7],
      headlineWidth: [40, 54],
      panelSpread: [0.88, 1],
    },
    dnaAffinity: affinity({ productDominance: 25, decorDensity: -8 }),
  },
];

export function selectScenario(
  dna: DesignDNA,
  category: ProductCategory,
  rng: () => number,
  visualHook?: VisualHook,
): CompositionScenario {
  const ranked = COMPOSITION_SCENARIOS.map((s) => ({
    scenario: s,
    score:
      s.dnaAffinity(dna, category) +
      rng() * 12 +
      scenarioBoostFromHook(visualHook, s.id),
  })).sort((a, b) => b.score - a.score);

  return ranked[0]?.scenario ?? COMPOSITION_SCENARIOS[0];
}
