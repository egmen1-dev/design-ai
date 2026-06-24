#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/design-ai}"
REPO_URL="${REPO_URL:-https://github.com/egmen1-dev/design-ai.git}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
SWAP_SIZE="${SWAP_SIZE:-2G}"
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"

echo "==> Preparing small VPS for design-ai"

if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
else
  SUDO="sudo"
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Installing base packages"
$SUDO apt-get update
$SUDO apt-get install -y curl git openssl ca-certificates nginx

if [ ! -f /swapfile ]; then
  echo "==> Creating ${SWAP_SIZE} swapfile"
  $SUDO fallocate -l "${SWAP_SIZE}" /swapfile || $SUDO dd if=/dev/zero of=/swapfile bs=1M count=2048
  $SUDO chmod 600 /swapfile
  $SUDO mkswap /swapfile
  $SUDO swapon /swapfile
  echo "/swapfile none swap sw 0 0" | $SUDO tee -a /etc/fstab >/dev/null
else
  echo "==> Swapfile already exists"
fi

if [ ! -d "${APP_DIR}/.git" ]; then
  echo "==> Cloning ${REPO_URL} to ${APP_DIR}"
  $SUDO mkdir -p "${APP_DIR}"
  $SUDO chown "$(whoami):$(whoami)" "${APP_DIR}"
  git clone --branch "${DEPLOY_BRANCH}" "${REPO_URL}" "${APP_DIR}"
else
  echo "==> Updating existing repository"
  git -C "${APP_DIR}" fetch origin "${DEPLOY_BRANCH}"
  git -C "${APP_DIR}" checkout "${DEPLOY_BRANCH}"
  git -C "${APP_DIR}" pull origin "${DEPLOY_BRANCH}"
fi

chmod +x "${APP_DIR}/scripts/setup-vps.sh" "${APP_DIR}/scripts/deploy.sh"

echo "==> Running repository VPS setup"
APP_DIR="${APP_DIR}" DEPLOY_BRANCH="${DEPLOY_BRANCH}" REPO_URL="${REPO_URL}" "${APP_DIR}/scripts/setup-vps.sh"

ENV_FILE="${APP_DIR}/marketplace-infographic/.env"
if [ ! -f "${ENV_FILE}" ]; then
  cp "${APP_DIR}/marketplace-infographic/.env.example" "${ENV_FILE}"
fi

if ! grep -q '^NEXTAUTH_SECRET="[^"]' "${ENV_FILE}"; then
  NEXTAUTH_SECRET="$(openssl rand -base64 32)"
  sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"${NEXTAUTH_SECRET}\"|" "${ENV_FILE}"
fi

if [ -n "${DOMAIN}" ]; then
  echo "==> Configuring Nginx for ${DOMAIN}"
  $SUDO tee /etc/nginx/sites-available/design-ai >/dev/null <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX
  $SUDO ln -sf /etc/nginx/sites-available/design-ai /etc/nginx/sites-enabled/design-ai
  $SUDO nginx -t
  $SUDO systemctl reload nginx

  sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=\"https://${DOMAIN}\"|" "${ENV_FILE}"

  if [ -n "${EMAIL}" ]; then
    echo "==> Installing SSL certificate with Certbot"
    $SUDO apt-get install -y certbot python3-certbot-nginx
    $SUDO certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" --redirect
  else
    echo "==> DOMAIN set, but EMAIL empty; skipping automatic SSL"
  fi
else
  echo "==> DOMAIN is empty; skipping Nginx vhost and SSL"
fi

echo "==> Deploying application"
APP_DIR="${APP_DIR}" DEPLOY_BRANCH="${DEPLOY_BRANCH}" "${APP_DIR}/scripts/deploy.sh"

echo "==> Done"
echo "PM2 status: pm2 status"
echo "Logs: pm2 logs marketplace-infographic"
echo "Env file: ${ENV_FILE}"
