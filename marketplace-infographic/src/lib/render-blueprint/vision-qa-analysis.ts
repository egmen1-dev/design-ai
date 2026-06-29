/**
 * Chapter 3.18 — Vision QA issue analysis (image signals only)
 */
import {
  IssueSeverity,
  VisionCategory,
  VISION_METRIC_WEIGHTS,
  VISION_THRESHOLDS,
  type VisionImageSignals,
  type VisionMetrics,
  type VisionQAIssue,
} from "./vision-qa-types";

export function analyzeVisionSignals(signals: VisionImageSignals): {
  issues: VisionQAIssue[];
  metrics: VisionMetrics;
} {
  const issues: VisionQAIssue[] = [];

  if (signals.productAreaRatio < 0.3) {
    issues.push({
      category: VisionCategory.COMPOSITION,
      severity: IssueSeverity.HIGH,
      reason: `Hero занимает менее 30% площади изображения (${Math.round(signals.productAreaRatio * 100)}%).`,
      code: "PRODUCT_TOO_SMALL",
      location: { x: 0.2, y: 0.2, width: signals.productAreaRatio, height: signals.productAreaRatio },
    });
  }

  if (signals.headlineWhitespaceRatio < 0.4) {
    issues.push({
      category: VisionCategory.MARKETPLACE,
      severity: IssueSeverity.HIGH,
      reason: "Недостаточно свободного места под текст заголовка.",
      code: "INSUFFICIENT_WHITESPACE",
    });
  }

  if (!signals.hasContactShadow) {
    issues.push({
      category: VisionCategory.COMPOSITION,
      severity: IssueSeverity.MEDIUM,
      reason: "Контактная тень отсутствует.",
      code: "MISSING_CONTACT_SHADOW",
    });
  }

  if (signals.lightingMismatch > 0.35) {
    issues.push({
      category: VisionCategory.LIGHTING,
      severity: IssueSeverity.MEDIUM,
      reason: "Свет на товаре не согласован с освещением фона.",
      code: "LIGHTING_MISMATCH",
    });
  }

  if (signals.perspectiveMismatch > 0.35) {
    issues.push({
      category: VisionCategory.COMPOSITION,
      severity: IssueSeverity.MEDIUM,
      reason: "Перспектива товара не совпадает с фоном.",
      code: "PERSPECTIVE_MISMATCH",
    });
  }

  if (signals.backgroundClutter > 0.4) {
    issues.push({
      category: VisionCategory.BACKGROUND,
      severity: IssueSeverity.MEDIUM,
      reason: "Фон отвлекает от товара — слишком высокая плотность объектов.",
      code: "BACKGROUND_CLUTTER",
    });
  }

  if (signals.duplicateProduct) {
    issues.push({
      category: VisionCategory.PRODUCT,
      severity: IssueSeverity.CRITICAL,
      reason: "Обнаружен дубликат товара на изображении.",
      code: "DUPLICATE_PRODUCT",
    });
  }

  if (signals.noiseLevel > 0.35) {
    issues.push({
      category: VisionCategory.TECHNICAL,
      severity: IssueSeverity.MEDIUM,
      reason: "Повышенный уровень шума на изображении.",
      code: "NOISE",
    });
  }

  if (signals.jpegArtifactScore > 0.4) {
    issues.push({
      category: VisionCategory.TECHNICAL,
      severity: IssueSeverity.MEDIUM,
      reason: "Заметные JPEG-искажения.",
      code: "JPEG_ARTIFACTS",
    });
  }

  if (signals.blurScore > 0.45) {
    issues.push({
      category: VisionCategory.TECHNICAL,
      severity: IssueSeverity.HIGH,
      reason: "Изображение смазано или недостаточного разрешения.",
      code: "BLUR",
    });
  }

  if (signals.overexposure > 0.35) {
    issues.push({
      category: VisionCategory.TECHNICAL,
      severity: IssueSeverity.MEDIUM,
      reason: "Области пересвета на изображении.",
      code: "OVEREXPOSURE",
    });
  }

  if (signals.lightingMismatch > 0.3 && !signals.hasContactShadow) {
    issues.push({
      category: VisionCategory.REALISM,
      severity: IssueSeverity.HIGH,
      reason: 'Эффект "PNG на фоне" — товар не интегрирован в сцену.',
      code: "PNG_OVERLAY_FEEL",
    });
  }

  const composition = scoreFromIssues(
    issues,
    [VisionCategory.COMPOSITION, VisionCategory.PRODUCT],
    signals.productAreaRatio * 100,
  );
  const realism = scoreFromIssues(issues, [VisionCategory.REALISM], 100 - signals.perspectiveMismatch * 100);
  const lighting = scoreFromIssues(issues, [VisionCategory.LIGHTING], 100 - signals.lightingMismatch * 100);
  const integration = scoreFromIssues(
    issues,
    [VisionCategory.COMPOSITION, VisionCategory.REALISM],
    signals.hasContactShadow ? 90 : 55,
  );
  const marketplace = scoreFromIssues(
    issues,
    [VisionCategory.MARKETPLACE, VisionCategory.TYPOGRAPHY],
    signals.headlineWhitespaceRatio * 100,
  );
  const technical = scoreFromIssues(
    issues,
    [VisionCategory.TECHNICAL],
    100 - (signals.noiseLevel + signals.jpegArtifactScore + signals.blurScore) * 33,
  );

  const overall = weightedOverall({
    composition,
    realism,
    lighting,
    integration,
    marketplace,
    technical,
    overall: 0,
  });

  return {
    issues,
    metrics: {
      composition,
      realism,
      lighting,
      integration,
      marketplace,
      technical,
      overall,
    },
  };
}

function penaltyForSeverity(severity: IssueSeverityId): number {
  switch (severity) {
    case IssueSeverity.LOW:
      return 5;
    case IssueSeverity.MEDIUM:
      return 12;
    case IssueSeverity.HIGH:
      return 22;
    case IssueSeverity.CRITICAL:
      return 35;
  }
}

type IssueSeverityId = (typeof IssueSeverity)[keyof typeof IssueSeverity];

function scoreFromIssues(
  issues: VisionQAIssue[],
  categories: string[],
  base: number,
): number {
  const relevant = issues.filter((i) => categories.includes(i.category));
  const penalty = relevant.reduce((s, i) => s + penaltyForSeverity(i.severity), 0);
  return Math.max(0, Math.min(100, Math.round(base - penalty)));
}

export function weightedOverall(metrics: Omit<VisionMetrics, "overall"> & { overall: number }): number {
  const w = VISION_METRIC_WEIGHTS;
  return Math.round(
    metrics.composition * w.composition +
      metrics.realism * w.realism +
      metrics.lighting * w.lighting +
      metrics.integration * w.integration +
      metrics.marketplace * w.marketplace +
      metrics.technical * w.technical,
  );
}

export function passesVisionThresholds(metrics: VisionMetrics): boolean {
  return (
    metrics.composition >= VISION_THRESHOLDS.composition &&
    metrics.realism >= VISION_THRESHOLDS.realism &&
    metrics.lighting >= VISION_THRESHOLDS.lighting &&
    metrics.integration >= VISION_THRESHOLDS.integration &&
    metrics.marketplace >= VISION_THRESHOLDS.marketplace &&
    metrics.technical >= VISION_THRESHOLDS.technical
  );
}

export function visionConfidence(metrics: VisionMetrics, issueCount: number): number {
  const base = metrics.overall;
  const penalty = Math.min(30, issueCount * 4);
  return Math.max(0, Math.min(100, base - penalty));
}
