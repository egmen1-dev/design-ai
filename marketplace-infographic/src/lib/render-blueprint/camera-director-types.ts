/**
 * Chapter 4.15 — Camera Director types
 */
import type { CameraBlueprint } from "./types";

export const CameraStyle = {
  COMMERCIAL_PRODUCT: "commercial_product",
  PREMIUM_HERO: "premium_hero",
  LIFESTYLE_CONTEXT: "lifestyle_context",
  TECHNOLOGY_DETAIL: "technology_detail",
  MACRO_DETAIL: "macro_detail",
  MARKETPLACE_THUMB: "marketplace_thumb",
} as const;

export type CameraStyleId = (typeof CameraStyle)[keyof typeof CameraStyle];

export const CameraAngleStyle = {
  FRONT: "front",
  THREE_QUARTER: "three_quarter",
  SIDE: "side",
  TOP: "top",
  MACRO: "macro",
  ISOMETRIC: "isometric",
} as const;

export type CameraAngleStyleId = (typeof CameraAngleStyle)[keyof typeof CameraAngleStyle];

export const CameraHeightStyle = {
  EYE_LEVEL: "eye_level",
  SLIGHTLY_ABOVE: "slightly_above",
  LOW_ANGLE: "low_angle",
  HIGH_ANGLE: "high_angle",
} as const;

export type CameraHeightStyleId = (typeof CameraHeightStyle)[keyof typeof CameraHeightStyle];

export const CameraDistanceStyle = {
  CLOSE: "close",
  MEDIUM: "medium",
  WIDE: "wide",
} as const;

export type CameraDistanceStyleId = (typeof CameraDistanceStyle)[keyof typeof CameraDistanceStyle];

export const PerspectiveProfile = {
  NATURAL: "natural",
  COMPRESSED: "compressed",
  EXPANDED: "expanded",
  TECHNICAL: "technical",
  ORTHOGRAPHIC_STYLE: "orthographic_style",
} as const;

export type PerspectiveProfileId = (typeof PerspectiveProfile)[keyof typeof PerspectiveProfile];

export const DepthOfFieldProfile = {
  ENTIRE_PRODUCT_SHARP: "entire_product_sharp",
  SOFT_BACKGROUND: "soft_background",
  MACRO_FOCUS: "macro_focus",
} as const;

export type DepthOfFieldProfileId = (typeof DepthOfFieldProfile)[keyof typeof DepthOfFieldProfile];

export const FramingProfile = {
  CENTERED: "centered",
  RULE_OF_THIRDS: "rule_of_thirds",
  OFFSET_HERO: "offset_hero",
  EDITORIAL_BALANCE: "editorial_balance",
  MARKETPLACE_FOCUS: "marketplace_focus",
} as const;

export type FramingProfileId = (typeof FramingProfile)[keyof typeof FramingProfile];

export type CameraStyleDefinition = {
  id: CameraStyleId;
  name: string;
  summary: string;
};

/** Chapter 4.15 — camera section (viewpoint model, not light/material/prompt) */
export type CameraSection = {
  cameraStyle: CameraStyleId;
  cameraAngle: CameraAngleStyleId;
  cameraHeight: CameraHeightStyleId;
  cameraDistance: CameraDistanceStyleId;
  focalLength: number;
  perspectiveProfile: PerspectiveProfileId;
  heroScale: number;
  depthOfField: DepthOfFieldProfileId;
  framingProfile: FramingProfileId;
  providerHints: string[];
  cameraBlueprint: CameraBlueprint;
  /** Normalized 0.0..1.0 */
  confidence: number;
};

export type CameraDirectorContext = {
  productCategory: string;
  marketplace: string;
  storyType?: string;
  primaryEmotion?: string;
  sceneType?: string;
  photographyStyle?: string;
  focusStrategy?: string;
  cameraIntent?: string;
  lightingScheme?: string;
  layoutTemplateId?: string;
  compositionHeroWeight?: number;
  providerId?: string;
};

export type CameraExplainabilityReport = {
  agentId: "camera-director";
  selectedStyle: CameraStyleId;
  alternativesConsidered: CameraStyleId[];
  rejectedAlternatives: { id: CameraStyleId; reason: string }[];
  storyInfluences: string[];
  photographyInfluences: string[];
  lightingInfluences: string[];
  commercialValue: string;
  reasoning: string[];
};

export type CameraValidationReport = {
  valid: boolean;
  violations: string[];
  section?: CameraSection;
};

export type CameraFailureCode =
  | "PERSPECTIVE_DISTORTION"
  | "HERO_TOO_SMALL"
  | "STORY_CONFLICT"
  | "MISSING_LIGHTING_INPUT"
  | "CONTAINS_LIGHTING_DECISION"
  | "CONTAINS_PROMPT"
  | "COMPOSITION_VIOLATION"
  | "AWKWARD_ANGLE";
