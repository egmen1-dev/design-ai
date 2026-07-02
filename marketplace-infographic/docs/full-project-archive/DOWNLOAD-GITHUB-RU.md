# Как скачать архив с GitHub

Ветка: `cursor/full-project-archive-0e50`  
Репозиторий: https://github.com/egmen1-dev/design-ai

---

## Вариант А — только зависший агент (16 KB, скачивается мгновенно)

Это то, что писал сломанный агент — уже добавлено в репозиторий.

**Скачать одним файлом:**  
https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/hung-agent-untracked-only.tar.gz

**Или открыть папку в браузере (без скачивания архива):**  
https://github.com/egmen1-dev/design-ai/tree/cursor/full-project-archive-0e50/marketplace-infographic/docs/recovered-hung-agent

Распаковка:
```bash
tar -xzf hung-agent-untracked-only.tar.gz
```

---

## Вариант Б — аудит глав 1–11 (84 KB)

https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/audit-export-only.tar.gz

---

## Вариант В — полный архив (~661 MB, 17 частей по 40 MB)

### Как скачать в браузере (пошагово)

1. Откройте папку:  
   https://github.com/egmen1-dev/design-ai/tree/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive

2. Нажимайте на каждый файл `FULL-PROJECT-ARCHIVE-40M.part-XX` по очереди.

3. На странице файла нажмите кнопку **Download** (справа вверху) или **Raw** — файл скачается.

4. Скачайте **все 17 частей** в одну папку на компьютере:
   - `part-aa`, `part-ab`, `part-ac` … `part-aq`

5. Склейте и распакуйте (Windows PowerShell):
   ```powershell
   cd C:\путь\к\папке\с\частями
   cmd /c copy /b FULL-PROJECT-ARCHIVE-40M.part-aa+FULL-PROJECT-ARCHIVE-40M.part-ab+FULL-PROJECT-ARCHIVE-40M.part-ac+FULL-PROJECT-ARCHIVE-40M.part-ad+FULL-PROJECT-ARCHIVE-40M.part-ae+FULL-PROJECT-ARCHIVE-40M.part-af+FULL-PROJECT-ARCHIVE-40M.part-ag+FULL-PROJECT-ARCHIVE-40M.part-ah+FULL-PROJECT-ARCHIVE-40M.part-ai+FULL-PROJECT-ARCHIVE-40M.part-aj+FULL-PROJECT-ARCHIVE-40M.part-ak+FULL-PROJECT-ARCHIVE-40M.part-al+FULL-PROJECT-ARCHIVE-40M.part-am+FULL-PROJECT-ARCHIVE-40M.part-an+FULL-PROJECT-ARCHIVE-40M.part-ao+FULL-PROJECT-ARCHIVE-40M.part-ap+FULL-PROJECT-ARCHIVE-40M.part-aq FULL-PROJECT-ARCHIVE.tar.gz
   ```
   Или macOS/Linux:
   ```bash
   cat FULL-PROJECT-ARCHIVE-40M.part-* > FULL-PROJECT-ARCHIVE.tar.gz
   tar -xzf FULL-PROJECT-ARCHIVE.tar.gz
   ```

### Прямые ссылки на каждую часть (клик → скачивание)

| № | Файл | Ссылка |
|---|------|--------|
| 1 | part-aa | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-aa |
| 2 | part-ab | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-ab |
| 3 | part-ac | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-ac |
| 4 | part-ad | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-ad |
| 5 | part-ae | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-ae |
| 6 | part-af | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-af |
| 7 | part-ag | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-ag |
| 8 | part-ah | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-ah |
| 9 | part-ai | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-ai |
| 10 | part-aj | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-aj |
| 11 | part-ak | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-ak |
| 12 | part-al | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-al |
| 13 | part-am | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-am |
| 14 | part-an | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-an |
| 15 | part-ao | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-ao |
| 16 | part-ap | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-ap |
| 17 | part-aq | https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/FULL-PROJECT-ARCHIVE-40M.part-aq |

Скрипт склейки (скачать):  
https://github.com/egmen1-dev/design-ai/raw/cursor/full-project-archive-0e50/marketplace-infographic/docs/full-project-archive/reassemble.sh

---

## Вариант Г — через git (если браузер не зависает)

```bash
git clone --branch cursor/full-project-archive-0e50 --depth 1 https://github.com/egmen1-dev/design-ai.git
cd design-ai/marketplace-infographic/docs/full-project-archive
chmod +x reassemble.sh
./reassemble.sh
tar -xzf FULL-PROJECT-ARCHIVE.tar.gz
```

---

## Что внутри полного архива

| Компонент | Описание |
|-----------|----------|
| `design-ai-workspace-snapshot.tar.gz` | Весь проект (ветка design-ai-book-ch1-11) |
| `design-ai-all-branches.bundle` | 132 ветки git |
| `recovered-hung-agent-stash/` | Снимок зависшего агента (2138 файлов) |
| `audit-export/` | Аудит глав 1–11 |

Подробности: `RECOVERY-MANIFEST.md`
