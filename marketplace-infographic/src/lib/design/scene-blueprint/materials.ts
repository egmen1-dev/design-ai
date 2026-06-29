import type { MaterialId } from "./types";

export type MaterialProfile = {
  id: MaterialId;
  label: string;
  floor: string;
  reflection: "none" | "subtle" | "moderate" | "glossy";
  lightingBias: "matte" | "specular" | "mixed";
  atmosphere: string;
};

export const MATERIAL_PROFILES: Record<MaterialId, MaterialProfile> = {
  graphite: {
    id: "graphite",
    label: "graphite",
    floor: "matte graphite studio floor",
    reflection: "subtle",
    lightingBias: "matte",
    atmosphere: "premium technical calm",
  },
  soft_concrete: {
    id: "soft_concrete",
    label: "soft concrete",
    floor: "brushed soft concrete surface",
    reflection: "subtle",
    lightingBias: "matte",
    atmosphere: "industrial modern",
  },
  frosted_acrylic: {
    id: "frosted_acrylic",
    label: "frosted acrylic",
    floor: "frosted acrylic pedestal surface",
    reflection: "moderate",
    lightingBias: "specular",
    atmosphere: "clean tech premium",
  },
  matte_aluminum: {
    id: "matte_aluminum",
    label: "matte aluminum",
    floor: "matte aluminum platform",
    reflection: "subtle",
    lightingBias: "mixed",
    atmosphere: "precision engineering",
  },
  dark_steel: {
    id: "dark_steel",
    label: "dark steel",
    floor: "dark brushed steel surface",
    reflection: "moderate",
    lightingBias: "specular",
    atmosphere: "industrial strength",
  },
  premium_plastic: {
    id: "premium_plastic",
    label: "premium plastic",
    floor: "smooth premium polymer surface",
    reflection: "subtle",
    lightingBias: "mixed",
    atmosphere: "consumer tech friendly",
  },
  glass: {
    id: "glass",
    label: "glass",
    floor: "clear glass with soft reflections",
    reflection: "glossy",
    lightingBias: "specular",
    atmosphere: "luxury transparency",
  },
  carbon_fiber: {
    id: "carbon_fiber",
    label: "carbon fiber",
    floor: "carbon fiber texture mat",
    reflection: "subtle",
    lightingBias: "specular",
    atmosphere: "performance premium",
  },
  wood: {
    id: "wood",
    label: "wood",
    floor: "light oak wood surface",
    reflection: "subtle",
    lightingBias: "matte",
    atmosphere: "warm lifestyle",
  },
  stone: {
    id: "stone",
    label: "stone",
    floor: "honed stone surface",
    reflection: "subtle",
    lightingBias: "matte",
    atmosphere: "natural premium",
  },
};
