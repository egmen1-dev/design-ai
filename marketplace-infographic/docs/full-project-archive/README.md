# Full Project Archive — Design AI

Полный архив проекта для анализа и восстановления, включая работу зависшего агента.

## Быстрая загрузка

Если файлы разбиты на части (лимит GitHub 100 MB):

```bash
cat FULL-PROJECT-ARCHIVE.tar.gz.part-* > FULL-PROJECT-ARCHIVE.tar.gz
tar -xzf FULL-PROJECT-ARCHIVE.tar.gz
```

См. `RECOVERY-MANIFEST.md` для деталей восстановления.

## Состав архива

1. **design-ai-workspace-snapshot.tar.gz** — снимок рабочей копии (ветка `cursor/design-ai-book-ch1-11-0e50`)
2. **design-ai-all-branches.bundle** — все 132 ветки git (`git clone bundle.repo`)
3. **recovered-hung-agent-stash/** — восстановление из stash `audit-temp` (коммиты `e435fdcc`, `b5b58cf3`, `0ad82ab1`)
4. **audit-export/** — предыдущий аудит глав 1–11

## После распаковки

```bash
cd marketplace-infographic
npm install
./scripts/run-design-ai-book-audit.sh
```
