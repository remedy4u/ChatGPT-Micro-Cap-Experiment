# RepairAI Guard (MVP)

Production-ready oriented MVP for appliance-repair companies. Focus: missed-call recovery, fast qualification, preliminary quotes, booking, reminders, and analytics.

## One-command local start

```bash
docker compose up --build
```

## Repo structure

- `apps/api` — NestJS API (Twilio webhook, lead intake, quote preview, reminders, analytics)
- `apps/admin` — Next.js admin dashboard
- `apps/worker` — queue worker scaffold
- `packages/shared` — shared enums/constants
- `packages/config` — env helpers
- `packages/ui` — ui token stubs
- `prisma` — schema and seed data
- `tests` — quote/lead/reminder tests
- `docs` — architecture/runbook/api spec

## Sandbox E2E demo

1. Start stack: `docker compose up --build`
2. Call webhook (mock call):
```bash
curl -X POST http://localhost:3001/webhooks/twilio/voice \
  -H 'content-type: application/json' \
  -d '{"CallSid":"CA123","From":"+15551230000","applianceType":"washer","symptom":"not_spinning","urgency":"high","lang":"ru","address":"101 Main St"}'
```
3. View leads: `curl http://localhost:3001/leads`
4. View analytics: `curl http://localhost:3001/dashboard/summary`

## Security/Reliability baseline in MVP

- Input normalization and DTO validation
- Multi-tenant field in core entities
- Webhook idempotency set for Twilio callback `CallSid`
- Env-based secret management (`.env.example`)
- Sandbox mode support (`SANDBOX_MODE=true`)

## Next steps

- Replace in-memory store with Prisma repositories.
- Add JWT auth + RBAC guards.
- Move reminders/dispatch to BullMQ queues + DLQ.
- Add Twilio signature validation and rate-limiting middleware.
