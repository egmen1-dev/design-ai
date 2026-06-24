# Deploying design-ai to VPS

This guide covers deploying the **marketplace-infographic** Next.js app to a Linux VPS with PM2, PostgreSQL, and Ollama.

## Architecture

```
GitHub (main) → GitHub Actions → SSH → VPS
                                      ├── PM2 (Next.js :3000)
                                      ├── PostgreSQL
                                      └── Ollama (qwen2.5:7b)
```

## Prerequisites

- Ubuntu 22.04+ VPS with SSH access
- Domain (optional) pointing to the VPS
- GitHub OAuth App for NextAuth
- Stripe account with a subscription Price ID

## 1. Initial VPS setup

For a small VPS, use the one-shot installer. It creates swap, installs the base packages, runs the regular VPS setup, optionally configures Nginx, and deploys:

```bash
export DOMAIN=your-domain.com
export EMAIL=admin@your-domain.com
bash -c "$(curl -fsSL https://raw.githubusercontent.com/egmen1-dev/design-ai/main/scripts/install-small-vps.sh)"
```

SSH into your server and run:

```bash
export REPO_URL=https://github.com/egmen1-dev/design-ai.git
export APP_DIR=/opt/design-ai
bash -c "$(curl -fsSL https://raw.githubusercontent.com/egmen1-dev/design-ai/main/scripts/setup-vps.sh)"
```

Or clone manually and run:

```bash
git clone https://github.com/egmen1-dev/design-ai.git /opt/design-ai
cd /opt/design-ai
chmod +x scripts/*.sh
./scripts/setup-vps.sh
```

## 2. Configure environment

Edit `/opt/design-ai/marketplace-infographic/.env`:

```env
DATABASE_URL="postgresql://designai:YOUR_PASSWORD@localhost:5432/marketplace_infographic"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:7b"
AI_MOCK_MODE="false"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
WATERMARK_TEXT="design-ai"
```

## 3. First deploy

```bash
cd /opt/design-ai
./scripts/deploy.sh
```

PM2 will start the app on port 3000. Put Nginx or Caddy in front for HTTPS.

Set `AI_MOCK_MODE=true` only when you need to verify the UI and render pipeline before `qwen2.5:7b` is available.

### Example Nginx snippet

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 4. GitHub Actions CI/CD

Add these repository secrets:

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS IP or hostname |
| `VPS_USER` | SSH username (e.g. `ubuntu`) |
| `VPS_SSH_KEY` | Private SSH key (PEM) |
| `APP_DIR` | App path (default `/opt/design-ai`) |

On every push to `main`, `.github/workflows/deploy.yml` SSHs into the VPS and runs `scripts/deploy.sh`.

## 5. Stripe webhook

Point Stripe webhook to:

```
https://your-domain.com/api/stripe/webhook
```

Events to listen for:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## 6. Useful commands

```bash
pm2 status
pm2 logs marketplace-infographic
pm2 restart marketplace-infographic
ollama list
ollama pull qwen2.5:7b
```

## Project structure

```
design-ai/
├── marketplace-infographic/   # Next.js app
├── scripts/
│   ├── deploy.sh
│   └── setup-vps.sh
├── .github/workflows/deploy.yml
├── ecosystem.config.cjs
└── DEPLOY.md
```
