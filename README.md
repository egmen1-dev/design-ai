# design-ai

AI-powered infographic marketplace with VPS deployment.

## marketplace-infographic

Next.js app with:

- **Prisma** — `User`, `Subscription`, `GeneratedImage`
- **NextAuth** — GitHub OAuth
- **Ollama** — `qwen2.5:7b` for HTML generation
- **Ollama mock** — deterministic local generator with `OLLAMA_MOCK=true`
- **Puppeteer** — render + watermark
- **Stripe** — checkout + webhook subscriptions
- **Rate limit** — in-memory (no Redis)
- **Zod** — API validation

```bash
cd marketplace-infographic
cp .env.example .env
npm install
npx prisma db push
npm run dev
```

## Deploy

See [DEPLOY.md](./DEPLOY.md) for VPS setup with PM2, PostgreSQL, and GitHub Actions.

```bash
./scripts/setup-vps.sh   # first-time VPS setup
./scripts/install-small-vps.sh # one-shot small VPS bootstrap
./scripts/deploy.sh      # deploy / update
```
