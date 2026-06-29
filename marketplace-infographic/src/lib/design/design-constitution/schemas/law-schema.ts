import { z } from "zod";

export const lawSeveritySchema = z.enum(["critical", "major", "minor"]);

export const lawCategorySchema = z.enum([
  "composition",
  "typography",
  "whitespace",
  "color",
  "lighting",
  "depth",
  "luxury",
  "marketplace",
  "accessibility",
  "brand",
  "rendering",
  "photography",
  "materials",
  "hierarchy",
  "eye_flow",
  "spacing",
  "contrast",
  "alignment",
  "balance",
  "negative_space",
  "visual_density",
]);

export const constitutionStageSchema = z.enum([
  "scene_blueprint",
  "layout_spec",
  "prompt",
  "rendered_critique",
]);

export const constitutionSetIdSchema = z.enum([
  "core_v1",
  "marketplace_v1",
  "luxury_v2",
  "industrial_dna",
  "beauty_dna",
  "electronics_dna",
]);

/** Serializable law definition for documentation / future CMS */
export const lawDefinitionSchema = z.object({
  id: z.string().regex(/^LAW_\d{3}$/),
  name: z.string().min(3),
  category: lawCategorySchema,
  severity: lawSeveritySchema,
  version: z.string(),
  description: z.string(),
  stages: z.array(constitutionStageSchema).min(1),
  sets: z.array(constitutionSetIdSchema).min(1),
});

export type LawDefinitionSchema = z.infer<typeof lawDefinitionSchema>;

export function validateLawDefinition(def: unknown): LawDefinitionSchema {
  return lawDefinitionSchema.parse(def);
}
