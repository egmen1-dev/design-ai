import { createSeededRng, pickRange } from "@/lib/design/variability";
import type { LayoutTemplateId } from "@/lib/layout-engine/types";
import type { DesignGenomeRecord } from "./types";
import { LAYOUT_TEMPLATES } from "@/lib/layout-engine/templates";

const CAMERA_MUTATIONS = [
  "low-angle hero",
  "three-quarter front-right",
  "slight high-angle",
  "eye-level commercial",
] as const;

const LENS_OPTIONS = ["24mm", "35mm", "50mm", "85mm"] as const;

export function mutateGenome(genome: DesignGenomeRecord, seed: string): DesignGenomeRecord {
  const rng = createSeededRng(`mutate-${seed}-${genome.genomeKey}`);
  const templates = LAYOUT_TEMPLATES.map((t) => t.id);
  const layoutPick = templates[Math.floor(pickRange(rng, 0, templates.length - 1))] as LayoutTemplateId;

  const mutated: DesignGenomeRecord = {
    ...genome,
    genomeKey: `${genome.genomeKey}_mut_${seed.slice(-6)}`,
    camera: {
      ...genome.camera,
      cameraAngle: CAMERA_MUTATIONS[Math.floor(pickRange(rng, 0, CAMERA_MUTATIONS.length - 1))],
      lens: LENS_OPTIONS[Math.floor(pickRange(rng, 0, LENS_OPTIONS.length - 1))],
      heroAngle: CAMERA_MUTATIONS[Math.floor(pickRange(rng, 0, CAMERA_MUTATIONS.length - 1))],
    },
    composition: {
      ...genome.composition,
      layoutTemplate: layoutPick,
      heroPosition: layoutPick.includes("right") ? "right" : layoutPick.includes("left") ? "left" : "center",
      productScalePct: Math.round(
        pickRange(rng, genome.composition.productScalePct - 4, genome.composition.productScalePct + 4),
      ),
      negativeSpacePct: Math.round(
        pickRange(rng, genome.composition.negativeSpacePct - 3, genome.composition.negativeSpacePct + 3),
      ),
    },
    light: {
      ...genome.light,
      temperature:
        pickRange(rng, 0, 1) > 0.5
          ? "4500K warm"
          : genome.light.temperature,
      rimLight: pickRange(rng, 0, 1) > 0.6 ? "accent rim" : genome.light.rimLight,
    },
    typography: {
      ...genome.typography,
      fontWeight: pickRange(rng, 0, 1) > 0.55 ? "Bold" : genome.typography.fontWeight,
      fontScale: Number(pickRange(rng, 0.95, 1.08).toFixed(2)),
    },
    badge: {
      ...genome.badge,
      radius: Math.round(pickRange(rng, genome.badge.radius - 4, genome.badge.radius + 6)),
      style: pickRange(rng, 0, 1) > 0.7 ? "premium" : genome.badge.style,
    },
    rankings: {
      ...genome.rankings,
      originality: Math.min(100, genome.rankings.originality + Math.round(pickRange(rng, 4, 12))),
      reuseScore: Math.max(0.1, genome.rankings.reuseScore - 0.15),
    },
  };

  return mutated;
}
