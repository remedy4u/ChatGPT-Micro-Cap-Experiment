import 'dotenv/config';
import express from 'express';
import { Queue } from 'bullmq';
import { z } from 'zod';
import { query } from '@mvp/db';
import { buildProviderPayload, chargeCreditsOnce, PackType } from '@mvp/shared';
import { v4 as uuid } from 'uuid';
import pino from 'pino';
import client from 'prom-client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
app.use(express.json({ limit: '2mb' }));
const redisUrl = new URL(process.env.REDIS_URL!);
const queue = new Queue('jobs', { connection: { host: redisUrl.hostname, port: Number(redisUrl.port) } });

const reqCounter = new client.Counter({ name: 'api_requests_total', help: 'API requests', labelNames: ['route'] });

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY!, secretAccessKey: process.env.S3_SECRET_KEY! },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
});

const submissionSchema = z.object({
  telegramId: z.number(),
  packType: z.custom<PackType>(),
  params: z.record(z.any()),
  sourceImage: z.string().optional(),
  sourceImageKey: z.string().optional(),
  idempotencyKey: z.string(),
  variants: z.number().min(1).max(6).default(6),
  hd: z.boolean().default(false),
  referenceKeys: z.array(z.string()).optional()
});

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.post('/users/:telegramId/topup', async (req, res) => {
  reqCounter.inc({ route: 'topup' });
  const telegramId = Number(req.params.telegramId);
  const sku = req.body.sku as string;
  const credits = sku === 'sku_20' ? 20 : sku === 'sku_5' ? 5 : 1;
  const u = await ensureUser(telegramId);
  await query('INSERT INTO purchases(id,user_id,provider,provider_payment_id,sku,credits_granted) VALUES($1,$2,$3,$4,$5,$6)', [uuid(), u.id, 'manual_stub', `stub-${Date.now()}`, sku, credits]);
  await query('INSERT INTO credits_ledger(id,user_id,delta,reason,idempotency_key) VALUES($1,$2,$3,$4,$5)', [uuid(), u.id, credits, 'purchase', uuid()]);
  res.json({ ok: true, creditsAdded: credits });
});

app.get('/users/:telegramId/credits', async (req, res) => {
  reqCounter.inc({ route: 'credits' });
  const telegramId = Number(req.params.telegramId);
  const u = await ensureUser(telegramId);
  const bal = await creditsBalance(u.id);
  res.json({ userId: u.id, balance: bal, freeTrialUsed: u.free_trial_used });
});

app.post('/jobs', async (req, res) => {
  reqCounter.inc({ route: 'jobs_post' });
  const body = submissionSchema.parse(req.body);

  const u = await ensureUser(body.telegramId);
  const existing = await query('SELECT id FROM jobs WHERE idempotency_key=$1', [body.idempotencyKey]);
  if (existing.rowCount) return res.json({ jobId: existing.rows[0].id, deduplicated: true });

  const concurrent = await query('SELECT COUNT(*)::text as count FROM jobs WHERE user_id=$1 AND status IN ($2,$3)', [u.id, 'queued', 'processing']);
  if (Number(concurrent.rows[0].count) >= Number(process.env.MAX_CONCURRENT_JOBS_PER_USER ?? 2)) {
    return res.status(429).json({ error: 'Too many concurrent jobs' });
  }

  let sourceImageKey = body.sourceImageKey;
  if (!sourceImageKey && body.sourceImage) {
    const imageBuf = Buffer.from(body.sourceImage, 'base64');
    sourceImageKey = `originals/${u.id}/${Date.now()}.jpg`;
    await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: sourceImageKey, Body: imageBuf, ContentType: 'image/jpeg' }));
  }
  if (!sourceImageKey) return res.status(400).json({ error: 'sourceImageKey or sourceImage required' });

  const isFreeTrial = !u.free_trial_used;
  const cost = (isFreeTrial ? 0 : Number(process.env.SET_COST_CREDITS ?? 1)) + (body.hd ? Number(process.env.HD_SURCHARGE_CREDITS ?? 1) : 0);
  if (cost > 0) {
    const balance = await creditsBalance(u.id);
    if (balance < cost) return res.status(402).json({ error: 'Insufficient credits' });
  }

  const jobId = uuid();
  await query(
    'INSERT INTO jobs(id,user_id,status,pack_type,params_json,source_image_key,idempotency_key,hd,watermark_applied) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [jobId, u.id, 'queued', body.packType, JSON.stringify(body.params), sourceImageKey, body.idempotencyKey, body.hd, isFreeTrial]
  );

  if (cost > 0) {
    await chargeCreditsOnce(
      {
        hasEntryByKey: async (k: string) => (await query('SELECT 1 FROM credits_ledger WHERE idempotency_key=$1', [k])).rowCount! > 0,
        insertEntry: async (entry: { userId: string; delta: number; reason: string; jobId?: string; idempotencyKey: string }) => {
          await query('INSERT INTO credits_ledger(id,user_id,delta,reason,job_id,idempotency_key) VALUES($1,$2,$3,$4,$5,$6)', [uuid(), entry.userId, entry.delta, entry.reason, entry.jobId ?? null, entry.idempotencyKey]);
        }
      },
      { userId: u.id, delta: -cost, reason: 'job_charge', jobId, idempotencyKey: body.idempotencyKey }
    );
  } else {
    await query('UPDATE users SET free_trial_used=true WHERE id=$1', [u.id]);
  }

  const providerPayload = buildProviderPayload(body.packType, body.params as any, {
    sourceImageKey,
    references: body.referenceKeys,
    variants: body.variants,
    hd: body.hd
  });

  await queue.add('generate', { jobId, userId: u.id, providerPayload, watermark: isFreeTrial }, { attempts: 3, backoff: { type: 'exponential', delay: 1500 } });
  res.json({ jobId, queued: true });
});

app.get('/jobs/:id', async (req, res) => {
  reqCounter.inc({ route: 'jobs_get' });
  const job = await query('SELECT * FROM jobs WHERE id=$1', [req.params.id]);
  if (!job.rowCount) return res.status(404).json({ error: 'Not found' });
  res.json(job.rows[0]);
});

async function ensureUser(telegramId: number) {
  const existing = await query('SELECT id, free_trial_used FROM users WHERE telegram_id=$1', [telegramId]);
  if (existing.rowCount) return existing.rows[0];
  const id = uuid();
  await query('INSERT INTO users(id,telegram_id) VALUES($1,$2)', [id, telegramId]);
  return { id, free_trial_used: false };
}

async function creditsBalance(userId: string) {
  const res = await query('SELECT COALESCE(SUM(delta),0)::text AS balance FROM credits_ledger WHERE user_id=$1', [userId]);
  return Number(res.rows[0].balance);
}

const port = Number(process.env.API_PORT || 3001);
app.listen(port, () => {
  log.info({ port }, 'API running');
});
