# Telegram Car Tuning MVP (Production-Ready Baseline)

## 1) Stack choice
This MVP uses **Node.js + TypeScript** for all services because it provides a single typed runtime across bot, API, and worker; straightforward async queue handling with BullMQ/Redis; and a mature ecosystem for Telegram bots, S3, and image processing (Sharp). This keeps implementation coherent while still allowing provider-swapping and quick local iteration.

## Architecture
- `apps/api` – REST API, credits/idempotency checks, job enqueue, metrics.
- `apps/bot` – Telegram bot UX (`/start`, pack selection, generate/refine flow, manual top-up stub).
- `apps/worker` – queue consumer, masking hook, image generation provider, watermark + collage output.
- `packages/shared` – typed domain models + preset/prompt builder + business rules + tests.
- `packages/image` – `ImageProvider` interface + `MockProvider` + `RealProvider` client + collage/watermark.
- `packages/db` – SQL migrations and PG client.

## Features implemented
- Free trial: first generated set is watermark-enabled.
- Credits ledger + purchase records (`manual top-up stub`, swappable with Telegram Payments).
- Idempotency key support on job submit + credit charging once.
- Queue states: `queued -> processing -> succeeded/failed`.
- Retry policy for worker jobs (BullMQ attempts/backoff).
- Basic abuse protections:
  - max concurrent jobs per user
  - API payload validation
- S3-compatible object storage (MinIO locally).
- Metrics endpoint: `/metrics`.

## Environment
Copy `.env.example` to `.env` and set secrets:

```bash
cp .env.example .env
```

Key vars:
- `TELEGRAM_BOT_TOKEN`
- `IMAGE_PROVIDER=mock|real`
- `REAL_PROVIDER_URL`, `REAL_PROVIDER_API_KEY` (when using `real`)
- `DATABASE_URL`, `REDIS_URL`, `S3_*`

## Run locally
```bash
npm install
npm run migrate
docker compose up --build
```

Or with Make:
```bash
make up
```

## Tests
```bash
npm test
```

## API endpoints
- `GET /health`
- `GET /metrics`
- `GET /users/:telegramId/credits`
- `POST /users/:telegramId/topup` body: `{ "sku": "sku_1|sku_5|sku_20" }`
- `POST /jobs` submit generation
- `GET /jobs/:id`

### Submit job example
```json
{
  "telegramId": 123456,
  "packType": "wrap",
  "params": { "preset": "nardo gray", "finish": "matte" },
  "sourceImageKey": "telegram/123/a.jpg",
  "idempotencyKey": "telegram-update-1234",
  "variants": 6,
  "hd": false
}
```

## Telegram UX flow (MVP)
1. `/start` -> welcome + CTA buttons.
2. user uploads photo.
3. bot shows pack buttons (Wrap / Wheels / Stance / Lights-Tint).
4. generate 6 variants -> queued async.
5. on completion: sends variants + collage + follow-up actions.
6. refine: user sends text instruction; next generate includes refine note.

## Presets supported
- Wrap colors: 8 (`black`, `white`, `red`, `nardo gray`, `blue`, `green`, `silver`, `purple`)
- Wheel styles: 6 (`mesh`, `multi-spoke`, `deep-dish`, `aero`, `split-five`, `motorsport`)
- Stance levels: `-10`, `-20`, `-30` mm
- Tint levels: `20`, `35`, `50` %

## Deploy outline
1. Build each app image (api/worker/bot).
2. Run managed Postgres + Redis + S3-compatible object storage.
3. Run migrations (`npm run migrate`) during release.
4. Set `IMAGE_PROVIDER=real` and provider credentials.
5. Configure Telegram webhook/polling strategy (polling in MVP).

## Notes / assumptions
- Telegram Payments integration is stubbed through `/topup` manual credit grant and isolated for easy swap.
- Rate limiting and concurrency checks are baseline and can be extended with Redis token-bucket middleware.
- Masking interface is included (`SegmentationModule`) with a stub implementation for MVP.
