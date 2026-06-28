import type {
  EnvironmentArchitectureId,
  TimeOfDayId,
  WeatherId,
} from "../types";
import type { DepthLevel } from "@/lib/design/scene-blueprint/types";

/** Visual phrases — ONLY used by PollinationsCompiler, never by agents */
export const ARCHITECTURE_VISUAL: Record<EnvironmentArchitectureId, string> = {
  studio: "professional photography studio cyclorama",
  workshop: "clean commercial workshop with visible floor plane",
  kitchen: "modern home kitchen, sharp floor tiles in foreground",
  outdoor: "outdoor terrace with natural ground plane",
  corporate: "corporate interior with readable floor and walls",
  home_interior: "warm domestic interior, sharp foreground floor",
  tech_stage: "tech product showcase stage with floor reflection",
  nature: "outdoor lawn with sharp grass foreground",
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
  shallow: "sharp foreground floor, gentle background falloff only",
  medium: "sharp product zone, soft distant background",
  deep: "layered interior depth, crisp floor in foreground",
};

export const MOOD_VISUAL: Record<string, string> = {
  confidence: "confident premium atmosphere",
  trust: "trustworthy calm atmosphere",
  luxury: "editorial luxury calm",
  energy: "dynamic energetic atmosphere",
  calm: "serene minimal atmosphere",
  professional: "professional commercial atmosphere",
};
