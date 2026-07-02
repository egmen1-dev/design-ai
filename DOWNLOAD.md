# Design AI — скачать проект

**Ветка:** `cursor/public-download-0e50`  
**Репозиторий:** https://github.com/egmen1-dev/design-ai

---

## Самое простое — открыть в браузере

**Весь код (без node_modules):**  
https://github.com/egmen1-dev/design-ai/tree/cursor/public-download-0e50/marketplace-infographic

**Аудит и доки:**  
https://github.com/egmen1-dev/design-ai/tree/cursor/public-download-0e50/marketplace-infographic/docs

---

## Скачать ZIP одной кнопкой

1. Открой: https://github.com/egmen1-dev/design-ai/tree/cursor/public-download-0e50
2. Зелёная кнопка **Code** → **Download ZIP**

> ZIP без `node_modules` — после распаковки: `cd marketplace-infographic && npm install`

---

## Маленькие файлы — один клик (для ChatGPT / анализа)

| Файл | Размер | Ссылка |
|------|--------|--------|
| Зависший агент (Ch11) | 16 KB | https://github.com/egmen1-dev/design-ai/raw/cursor/public-download-0e50/marketplace-infographic/docs/full-project-archive/hung-agent-untracked-only.tar.gz |
| Аудит глав 1–11 | 84 KB | https://github.com/egmen1-dev/design-ai/raw/cursor/public-download-0e50/marketplace-infographic/docs/full-project-archive/audit-export-only.tar.gz |
| Статус восстановления | текст | https://github.com/egmen1-dev/design-ai/blob/cursor/public-download-0e50/marketplace-infographic/docs/RESTORATION-STATUS.md |
| Индекс книги | текст | https://github.com/egmen1-dev/design-ai/blob/cursor/public-download-0e50/marketplace-infographic/docs/DESIGN-AI-BOOK-INDEX-CH1-11.md |

**GitHub Release (те же мелкие файлы):**  
https://github.com/egmen1-dev/design-ai/releases/tag/public-download-jul2026

---

## Полный архив (~661 MB) — по частям 40 MB

Папка: https://github.com/egmen1-dev/design-ai/tree/cursor/public-download-0e50/marketplace-infographic/docs/full-project-archive

Скачай все файлы `FULL-PROJECT-ARCHIVE-40M.part-aa` … `part-aq` (17 штук), положи в одну папку:

**Windows:**
```powershell
copy /b FULL-PROJECT-ARCHIVE-40M.part-* FULL-PROJECT-ARCHIVE.tar.gz
```

**Mac/Linux:**
```bash
cat FULL-PROJECT-ARCHIVE-40M.part-* > FULL-PROJECT-ARCHIVE.tar.gz
tar -xzf FULL-PROJECT-ARCHIVE.tar.gz
```

Прямые ссылки на части — в файле:  
https://github.com/egmen1-dev/design-ai/blob/cursor/public-download-0e50/marketplace-infographic/docs/full-project-archive/DOWNLOAD-GITHUB-RU.md

---

## Что внутри

- `src/lib/render-blueprint/` — главы 3–7 (120 тестов)
- `src/lib/design-knowledge-platform/` — глава 8
- `src/lib/intelligent-orchestration-platform/` — глава 9
- `src/lib/human-ai-collaboration/` — глава 10
- `src/lib/commercial-intelligence-platform/` — глава 11
- `docs/recovered-hung-agent/` — восстановление зависшего агента

Тесты: `cd marketplace-infographic && ./scripts/run-design-ai-book-audit.sh`
