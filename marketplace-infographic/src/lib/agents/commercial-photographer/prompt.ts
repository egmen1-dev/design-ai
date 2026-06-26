import type { CommercialPhotographerInput } from "./types";

export function buildCommercialPhotographerPrompt(input: CommercialPhotographerInput): string {
  const lighting = input.lighting
    ? {
        direction: input.lighting.direction,
        temperatureKelvin: input.lighting.temperatureKelvin,
        brightness: input.lighting.brightness,
        contrast: input.lighting.contrast,
        warmth: input.lighting.warmth,
      }
    : null;

  const scene = {
    cameraAngle: input.scene.cameraAngle,
    cameraHeight: input.scene.cameraHeight,
    cameraDistance: input.scene.cameraDistance,
    lightingDirection: input.scene.lightingDirection,
    lightingTemperature: input.scene.lightingTemperature,
    depthOfField: input.scene.depthOfField,
    shadowProfile: input.scene.shadowProfile,
    reflectionEnabled: input.scene.reflectionEnabled,
    surfaceType: input.scene.surfaceType,
    visualMood: input.scene.visualMood,
  };

  const quality = input.qualityValidation
    ? {
        total: input.qualityValidation.total,
        dimensions: input.qualityValidation.dimensions.map((d) => ({
          id: d.id,
          score: d.score,
        })),
        issues: input.qualityValidation.issues,
      }
    : null;

  return `Ты — коммерческий фотограф и специалист по рекламному CGI.
Ты создаешь рекламные изображения уровня Apple, Dyson, Bosch и Nike.
Твоя задача — определить, выглядит ли изображение как настоящая рекламная фотография.

Проверяй:
• контактную тень
• окружающую тень
• цветовую температуру
• перспективу
• глубину
• освещение
• отражения
• интеграцию товара
• ощущение настоящей фотографии
• резкость
• шум
• микроконтраст
• атмосферу
• выглядит ли товар вставленным
• совпадает ли освещение товара и фона
• соответствует ли материал товара окружению

ТОВАР: ${input.productPrompt.slice(0, 200)}
ФОН: ${input.backgroundSource}
КОМПОЗИТ: ${input.hasComposite ? "photoreal merge выполнен" : "нет фотореалистичного композита — товар как PNG"}
ТЕНИ: ${input.hasShadows ? "да" : "нет"}
ОТРАЖЕНИЕ: ${input.hasReflection ? "да" : "нет"}

СЦЕНА:
${JSON.stringify(scene, null, 2)}

ОСВЕЩЕНИЕ (анализ):
${lighting ? JSON.stringify(lighting, null, 2) : "нет данных"}

QUALITY ENGINE:
${quality ? JSON.stringify(quality, null, 2) : "нет данных"}

Очень редко ставь выше 90.
Если товар выглядит как PNG поверх изображения — оценка не может быть выше 60.

Ответ только JSON:
{
  "score": 0,
  "realism": 0,
  "looksLikePhoto": false,
  "problems": [],
  "recommendations": [],
  "scores": {
    "lighting": 0,
    "shadows": 0,
    "perspective": 0,
    "integration": 0,
    "colorMatching": 0,
    "realism": 0
  }
}`;
}
