import type { InfographicData } from "./infographic-template";

export type SceneLayers = {
  sky: string;
  ground: string;
  groundHeight: string;
  decor: string;
  props: string;
};

const SCENES: Record<InfographicData["backgroundScene"], SceneLayers> = {
  outdoor_home: {
    sky: `linear-gradient(180deg,
      #4a5568 0%, #2d3748 18%, #1a202c 45%, #111827 72%, #0f1419 100%)`,
    ground: `linear-gradient(180deg,
      #72c572 0%, #4caf50 22%, #43a047 55%, #388e3c 78%, #2e7d32 100%)`,
    groundHeight: "42%",
    decor: `radial-gradient(ellipse 120% 80% at 50% 100%, rgba(255,255,255,0.08) 0%, transparent 50%),
      radial-gradient(circle at 15% 25%, rgba(255,255,255,0.06) 0%, transparent 35%)`,
    props: `
      <div class="scene-trees" aria-hidden="true"></div>
      <div class="scene-fence" aria-hidden="true"></div>
      <div class="scene-sunray" aria-hidden="true"></div>`,
  },
  nature: {
    sky: `linear-gradient(180deg, #5b9bd5 0%, #3d7ab8 40%, #87ceeb 100%)`,
    ground: `linear-gradient(180deg, #7cb342 0%, #558b2f 50%, #33691e 100%)`,
    groundHeight: "44%",
    decor: `radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.25) 0%, transparent 45%)`,
    props: `<div class="scene-hills" aria-hidden="true"></div>`,
  },
  kitchen: {
    sky: `linear-gradient(180deg, #fef3c7 0%, #fde68a 35%, #f5f5f4 100%)`,
    ground: `linear-gradient(180deg, #e7e5e4 0%, #d6d3d1 40%, #a8a29e 100%)`,
    groundHeight: "48%",
    decor: `repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 60px, rgba(0,0,0,0.03) 60px 120px)`,
    props: `
      <div class="scene-counter" aria-hidden="true"></div>
      <div class="scene-backsplash" aria-hidden="true"></div>`,
  },
  bathroom: {
    sky: `linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)`,
    ground: `linear-gradient(180deg, #f8fafc 0%, #e2e8f0 60%, #cbd5e1 100%)`,
    groundHeight: "50%",
    decor: `repeating-linear-gradient(0deg, transparent 0 40px, rgba(148,163,184,0.12) 40px 80px)`,
    props: `<div class="scene-marble" aria-hidden="true"></div>`,
  },
  office: {
    sky: `linear-gradient(180deg, #334155 0%, #1e293b 50%, #0f172a 100%)`,
    ground: `linear-gradient(180deg, #475569 0%, #334155 60%, #1e293b 100%)`,
    groundHeight: "46%",
    decor: `radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.15) 0%, transparent 55%)`,
    props: `<div class="scene-desk" aria-hidden="true"></div>`,
  },
  studio: {
    sky: `radial-gradient(ellipse 90% 70% at 50% 35%, #ffffff 0%, #e2e8f0 45%, #94a3b8 100%)`,
    ground: `linear-gradient(180deg, #f1f5f9 0%, #cbd5e1 100%)`,
    groundHeight: "38%",
    decor: `radial-gradient(circle at 50% 40%, rgba(255,255,255,0.9) 0%, transparent 50%)`,
    props: `<div class="scene-spotlight" aria-hidden="true"></div>`,
  },
};

export function getSceneLayers(scene: InfographicData["backgroundScene"]): SceneLayers {
  return SCENES[scene] ?? SCENES.studio;
}

export const SCENE_PROPS_CSS = `
  .scene-trees {
    position: absolute; bottom: 38%; left: 0; right: 0; height: 120px;
    background:
      radial-gradient(ellipse 80px 100px at 8% 100%, #1b4332 0%, transparent 70%),
      radial-gradient(ellipse 100px 120px at 22% 100%, #2d6a4f 0%, transparent 70%),
      radial-gradient(ellipse 90px 110px at 88% 100%, #1b4332 0%, transparent 70%),
      radial-gradient(ellipse 70px 90px at 72% 100%, #40916c 0%, transparent 70%);
    opacity: 0.55; z-index: 1; pointer-events: none;
  }
  .scene-fence {
    position: absolute; bottom: 40%; left: 5%; right: 5%; height: 50px;
    background: repeating-linear-gradient(90deg,
      rgba(120,113,108,0.35) 0 12px, transparent 12px 24px);
    mask-image: linear-gradient(180deg, black 30%, transparent 100%);
    z-index: 1; pointer-events: none;
  }
  .scene-sunray {
    position: absolute; top: 0; right: 10%; width: 200px; height: 55%;
    background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
    transform: skewX(-8deg); z-index: 1; pointer-events: none;
  }
  .scene-hills {
    position: absolute; bottom: 42%; left: 0; right: 0; height: 80px;
    background: radial-gradient(ellipse 600px 80px at 50% 100%, #2d5016 0%, transparent 70%);
    opacity: 0.4; z-index: 1;
  }
  .scene-counter {
    position: absolute; bottom: 44%; left: 0; right: 0; height: 28px;
    background: linear-gradient(180deg, #d6d3d1, #a8a29e);
    box-shadow: 0 -4px 20px rgba(0,0,0,0.15); z-index: 1;
  }
  .scene-backsplash {
    position: absolute; bottom: 48%; left: 0; right: 0; height: 180px;
    background: linear-gradient(180deg, rgba(255,255,255,0.3), transparent);
    z-index: 0;
  }
  .scene-marble {
    position: absolute; bottom: 46%; left: 10%; right: 10%; height: 200px;
    background: radial-gradient(ellipse at center, rgba(255,255,255,0.5), transparent 70%);
    z-index: 0;
  }
  .scene-desk {
    position: absolute; bottom: 42%; left: 15%; right: 15%; height: 24px;
    background: linear-gradient(180deg, #64748b, #475569);
    border-radius: 4px 4px 0 0; z-index: 1;
  }
  .scene-spotlight {
    position: absolute; top: 5%; left: 50%; transform: translateX(-50%);
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 65%);
    z-index: 0; pointer-events: none;
  }
`;
