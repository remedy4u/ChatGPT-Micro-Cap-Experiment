# Runbook

## Startup

1. Copy `.env.example` to `.env`.
2. Run `docker compose up --build`.
3. Ensure services healthy:
   - API: `http://localhost:3001`
   - Admin: `http://localhost:3000`

## Common operations

- Seed data: `pnpm db:seed`
- Run tests: `pnpm test`

## Incident handling

- Twilio duplicate callbacks: deduplicated by `CallSid` set in webhook handler.
- SMS failures: retry logic should move to BullMQ worker (next iteration).
- DB unavailable: API currently runs in sandbox-memory mode for intake paths.
