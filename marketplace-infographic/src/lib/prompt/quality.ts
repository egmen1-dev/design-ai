export function buildQualityChecklistPrompt(): string {
  return `QUALITY CHECKLIST (заполни qualityChecklist в JSON)
- [ ] композиция сбалансирована
- [ ] цвета не конфликтуют
- [ ] не более 5 bullets, без дублей
- [ ] контраст текста достаточный
- [ ] шрифт соответствует категории
- [ ] фон без товара и текста
- [ ] палитра согласована с референсом`;
}

export const QUALITY_ISSUES = [
  "duplicate_bullets",
  "too_many_bullets",
  "bad_contrast",
  "missing_headline",
  "product_in_background",
  "weak_palette",
] as const;

export type QualityIssue = (typeof QUALITY_ISSUES)[number];
