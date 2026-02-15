CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  free_trial_used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  pack_type TEXT NOT NULL,
  params_json JSONB NOT NULL,
  source_image_key TEXT NOT NULL,
  result_keys JSONB,
  collage_key TEXT,
  watermark_applied BOOLEAN NOT NULL DEFAULT FALSE,
  hd BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credits_ledger (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  delta INT NOT NULL,
  reason TEXT NOT NULL,
  job_id UUID REFERENCES jobs(id),
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL,
  provider_payment_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  credits_granted INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON jobs(user_id, status);
