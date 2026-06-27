import type {
  ChiefDesignDirectorPlan,
  FixAction,
  FixPriority,
  TopProblem,
} from "./types";
import { CHIEF_APPROVE_SCORE } from "./types";
import type { ChiefDesignDirectorInput } from "./types";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function collectIssues(input: ChiefDesignDirectorInput): string[] {
  return [
    ...input.seniorArtDirector.criticalProblems,
    ...input.marketplaceExpert.mainProblems,
    ...input.commercialPhotographer.problems,
  ];
}

function countMentions(issues: string[], keywords: string[]): number {
  return issues.filter((issue) => {
    const n = norm(issue);
    return keywords.some((k) => n.includes(k));
  }).length;
}

function priorityFromMentions(mentions: number): FixPriority {
  if (mentions >= 2) return "critical";
  if (mentions === 1) return "major";
  return "minor";
}

function pushFix(bucket: FixAction[], fix: FixAction) {
  if (!bucket.some((f) => f.action === fix.action)) bucket.push(fix);
}

/** Объединяет отчёты трёх экспертов в измеримый план — без анализа карточки напрямую */
export function buildChiefDesignDirectorHeuristic(
  input: ChiefDesignDirectorInput,
): ChiefDesignDirectorPlan {
  const m = input.layout.metrics;
  const issues = collectIssues(input);
  const topProblems: TopProblem[] = [];

  const layoutChanges: FixAction[] = [];
  const typographyChanges: FixAction[] = [];
  const backgroundChanges: FixAction[] = [];
  const lightingChanges: FixAction[] = [];
  const productChanges: FixAction[] = [];
  const colorChanges: FixAction[] = [];
  const effectChanges: FixAction[] = [];
  const badgeChanges: FixAction[] = [];
  const compositionChanges: FixAction[] = [];

  const storyWeak =
    !input.storyBlueprintSnippet || input.storyBlueprintSnippet.replace(/Story:|история:/i, "").trim().length < 12;

  const allApproved =
    input.seniorArtDirector.approved &&
    input.marketplaceExpert.wouldClick &&
    input.commercialPhotographer.looksLikePhoto &&
    !storyWeak;

  const avgScore = clamp(
    (input.seniorArtDirector.score +
      input.marketplaceExpert.score +
      input.commercialPhotographer.score) /
      3,
  );

  if (storyWeak) {
    topProblems.push({
      problem: "Коммерческая история не читается с первого взгляда",
      reason: "Visual Story Blueprint не прошёл проверку Chief Director",
    });
    pushFix(compositionChanges, {
      priority: "critical",
      action: "Усилить hero concept и сократить текст до одной мысли",
      expectedImprovement: "+12 к story clarity",
    });
  }

  if (allApproved && avgScore >= CHIEF_APPROVE_SCORE) {
    return {
      approved: true,
      estimatedScoreAfterFix: avgScore,
      topProblems: [],
      layoutChanges: [],
      typographyChanges: [],
      backgroundChanges: [],
      lightingChanges: [],
      productChanges: [],
      colorChanges: [],
      effectChanges: [],
      badgeChanges: [],
      compositionChanges: [],
      finalAdvice: "Карточка соответствует уровню профессионального дизайна. Сохранить текущую версию.",
      source: "heuristic",
    };
  }

  const productSmall = countMentions(issues, ["мал", "55", "теряется", "dominant", "доминир"]);
  if (productSmall > 0 || m.productAreaPct < 58) {
    const target = clamp(Math.max(65, m.productAreaPct + 6));
    topProblems.push({
      problem: `Товар занимает ${m.productAreaPct.toFixed(0)}% кадра`,
      reason: `${productSmall} эксперт(ов) указали на слабую доминанту товара`,
    });
    pushFix(productChanges, {
      priority: priorityFromMentions(productSmall),
      action: `Увеличить товар с ${m.productAreaPct.toFixed(0)}% до ${target}% площади кадра`,
      expectedImprovement: "+8–12 к attention и productDominance",
    });
  }

  const whitespace = countMentions(issues, ["воздух", "whitespace", "перегруж", "шум", "элемент"]);
  if (whitespace > 0 || m.whitespacePct < 20) {
    topProblems.push({
      problem: `Воздух ${m.whitespacePct.toFixed(0)}% (минимум 20%)`,
      reason: "Перегруз снижает CTR и премиальность",
    });
    pushFix(layoutChanges, {
      priority: priorityFromMentions(whitespace),
      action: `Переключить layout template на minimal (текущий: ${input.templateId ?? "unknown"})`,
      expectedImprovement: "+15% whitespace, −2 элемента на обложке",
    });
    pushFix(compositionChanges, {
      priority: "major",
      action: "Скрыть subtitle и badge если не критичны — оставить title + feature",
      expectedImprovement: "+4–6% свободного пространства",
    });
  }

  const plaque = countMentions(issues, ["плашк", "панел", "badge", "бейдж"]);
  const plaqueW = input.layout.plaques.mediumWidthPct;
  if (plaque > 0 || m.plaqueAreaPct > 9) {
    const targetW = clamp(Math.min(26, plaqueW * 0.65));
    topProblems.push({
      problem: `Плашка ${plaqueW.toFixed(0)}% ширины`,
      reason: "Крупные панели выглядят как инфографика, не реклама",
    });
    pushFix(badgeChanges, {
      priority: priorityFromMentions(plaque),
      action: `Уменьшить стеклянную панель с ${plaqueW.toFixed(0)}% ширины до ${targetW}%`,
      expectedImprovement: "+6 к minimalism и hierarchy",
    });
  }

  const typo = countMentions(issues, ["заголовок", "перенос", "текст", "чита", "слов"]);
  if (typo > 0 || input.cardMeaning.title.length > 50) {
    topProblems.push({
      problem: "Типографика заголовка",
      reason: input.seniorArtDirector.criticalProblems.find((p) => /перенос|заголовок/i.test(p)) ?? "Длинный или нечитаемый title",
    });
    pushFix(typographyChanges, {
      priority: priorityFromMentions(typo),
      action: `Сократить заголовок с ${input.cardMeaning.title.length} до ≤45 символов или уменьшить шрифт на 4px`,
      expectedImprovement: "+10 к readability и clarity",
    });
  }

  const bg = countMentions(issues, ["фон", "категор", "гостин", "офис", "спальн", "сцен"]);
  if (bg > 0) {
    topProblems.push({
      problem: "Фон не соответствует категории",
      reason: "Marketplace/Art Director указали неверное окружение",
    });
    pushFix(backgroundChanges, {
      priority: priorityFromMentions(bg),
      action: "Изменить фон с интерьера на современную террасу / гараж / участок (по категории)",
      expectedImprovement: "+12 к marketplaceFit и categoryEnvironment",
    });
  }

  const photo = countMentions(issues, ["png", "композит", "тень", "освещ", "интеграц", "вставлен"]);
  if (photo > 0 || !input.commercialPhotographer.looksLikePhoto) {
    topProblems.push({
      problem: "Товар выглядит вставленным",
      reason: input.commercialPhotographer.problems[0] ?? "Низкий realism score",
    });
    pushFix(effectChanges, {
      priority: priorityFromMentions(photo),
      action: "Добавить контактную тень радиусом 18 px под товаром",
      expectedImprovement: "+15 к integration и shadows",
    });
    pushFix(lightingChanges, {
      priority: priorityFromMentions(photo),
      action: "Добавить тёплый контровой свет справа (3200K rim, opacity 12%)",
      expectedImprovement: "+10 к lighting consistency",
    });
    pushFix(colorChanges, {
      priority: "major",
      action: "Подстроить color temperature товара к фону ±300K",
      expectedImprovement: "+8 к colorMatching",
    });
  }

  const selling = countMentions(issues, ["выгода", "преимуществ", "продаёт", "название товара", "feature"]);
  if (selling > 0 || !input.cardMeaning.feature?.trim()) {
    topProblems.push({
      problem: "Слабая продающая мысль",
      reason: "CTR Expert: нет явной выгоды за 1 секунду",
    });
    pushFix(typographyChanges, {
      priority: "major",
      action: "Заменить subtitle на одну цифру feature (например «3 кВт») в glass badge 7% высоты",
      expectedImprovement: "+14 к sellingPower и CTR",
    });
  }

  const top5 = topProblems.slice(0, 5);
  const criticalCount =
    layoutChanges.filter((c) => c.priority === "critical").length +
    productChanges.filter((c) => c.priority === "critical").length +
    backgroundChanges.filter((c) => c.priority === "critical").length +
    effectChanges.filter((c) => c.priority === "critical").length;

  const estimatedScoreAfterFix = clamp(
    avgScore + Math.min(18, criticalCount * 5 + top5.length * 2),
  );

  const approved =
    allApproved &&
    avgScore >= CHIEF_APPROVE_SCORE &&
    top5.length === 0;

  return {
    approved,
    estimatedScoreAfterFix,
    topProblems: top5,
    layoutChanges: layoutChanges.slice(0, 3),
    typographyChanges: typographyChanges.slice(0, 2),
    backgroundChanges: backgroundChanges.slice(0, 2),
    lightingChanges: lightingChanges.slice(0, 2),
    productChanges: productChanges.slice(0, 2),
    colorChanges: colorChanges.slice(0, 2),
    effectChanges: effectChanges.slice(0, 2),
    badgeChanges: badgeChanges.slice(0, 2),
    compositionChanges: compositionChanges.slice(0, 2),
    finalAdvice: approved
      ? "Утвердить без изменений."
      : `Выполнить ${Math.min(5, top5.length)} приоритетных правок. Ожидаемый score: ${estimatedScoreAfterFix}.`,
    source: "heuristic",
  };
}
