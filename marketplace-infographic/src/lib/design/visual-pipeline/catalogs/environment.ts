import type {
  EnvironmentArchitectureId,
  TimeOfDayId,
  WeatherId,
} from "../types";
import type { DepthLevel } from "@/lib/design/scene-blueprint/types";

/** Visual phrases — ONLY used by PollinationsCompiler, never by agents */
export const ARCHITECTURE_VISUAL: Record<EnvironmentArchitectureId, string> = {
  studio: "professional photography studio cyclorama",
  workshop: "clean commercial studio with subtle texture",
  kitchen: "modern home kitchen interior bokeh",
  outdoor: "outdoor terrace with soft natural backdrop",
  corporate: "corporate office environment blur",
  home_interior: "warm domestic interior bokeh",
  tech_stage: "tech product showcase stage",
  nature: "soft natural outdoor greenery blur",
};

export const WEATHER_VISUAL: Record<WeatherId, string> = {
  clear: "clear bright atmosphere",
  overcast: "soft diffused overcast light",
  indoor_controlled: "controlled indoor studio atmosphere",
};

export const TIME_VISUAL: Record<TimeOfDayId, string> = {
  morning: "fresh morning light",
  noon: "neutral midday light",
  golden_hour: "warm golden hour glow",
  studio_neutral: "neutral studio lighting",
};

export const DEPTH_VISUAL: Record<DepthLevel, string> = {
  shallow: "shallow depth of field",
  medium: "moderate environmental depth",
  deep: "deep layered background",
};

export const MOOD_VISUAL: Record<string, string> = {
  confidence: "confident premium atmosphere",
  trust: "trustworthy calm atmosphere",
  luxury: "editorial luxury calm",
  energy: "dynamic energetic atmosphere",
  calm: "serene minimal atmosphere",
  professional: "professional commercial atmosphere",
};
