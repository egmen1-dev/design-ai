# SSH-ключ для деплоя (GitHub Actions → VPS)

Сгенерирована пара **ed25519** для автоматического деплоя при push в `main`.

| Файл | Назначение |
|------|------------|
| `github-actions-deploy` | **Приватный** ключ → секрет GitHub `VPS_SSH_KEY` |
| `github-actions-deploy.pub` | Публичный ключ → на VPS в `authorized_keys` |

Приватный ключ в `.gitignore` и **не попадает в репозиторий**.

## 1. GitHub Secrets

Репозиторий → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret | Значение |
|--------|----------|
| `VPS_HOST` | `194.226.115.138` |
| `VPS_USER` | `root` |
| `APP_DIR` | `/opt/design-ai` |
| `VPS_SSH_KEY` | Весь текст файла `github-actions-deploy` (включая `-----BEGIN` / `-----END`) |

## 2. Публичный ключ на VPS

На сервере:

```bash
ssh root@194.226.115.138
bash /opt/design-ai/scripts/add-deploy-ssh-key.sh
```

Или вручную:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIOYa5J50g/56RyioVXB8N2sgx9phLN2agt9icmTWb3N github-actions-deploy@design-ai.com' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## 3. Проверка

С Mac (из клонированного репозитория, где лежит приватный ключ):

```bash
ssh -i deploy/ssh/github-actions-deploy -o StrictHostKeyChecking=no root@194.226.115.138 'cd /opt/design-ai && git log -1 --oneline'
```

Должен вывести последний коммит без запроса пароля.

## 4. Запуск деплоя

- Push в ветку `main`, или
- GitHub → **Actions** → **Deploy to VPS** → **Run workflow**
