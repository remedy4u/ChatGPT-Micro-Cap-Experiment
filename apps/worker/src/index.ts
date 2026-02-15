import 'dotenv/config';
import { Worker } from 'bullmq';
import { query } from '@mvp/db';
import { applyWatermark, createCollage, createProvider, StubSegmentation } from '@mvp/image';
import { canTransition, ProviderRequest } from '@mvp/shared';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import pino from 'pino';

const log = pino();
const redisUrl = new URL(process.env.REDIS_URL!);
const provider = createProvider();
const segmentation = new StubSegmentation();
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY!, secretAccessKey: process.env.S3_SECRET_KEY! },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
});

new Worker(
  'jobs',
  async (job) => {
    const { jobId, providerPayload, watermark } = job.data as { jobId: string; providerPayload: ProviderRequest; watermark: boolean };
    const current = await query('SELECT status FROM jobs WHERE id=$1', [jobId]);
    if (!current.rowCount || !canTransition(current.rows[0].status, 'processing')) return;
    await query('UPDATE jobs SET status=$1,updated_at=NOW() WHERE id=$2', ['processing', jobId]);

    try {
      providerPayload.maskHint = await segmentation.mask(providerPayload);
      const output = await provider.generate(providerPayload);
      const processed = watermark ? await Promise.all(output.imageBuffers.map((buf: Buffer) => applyWatermark(buf, process.env.WATERMARK_TEXT || 'FREE'))) : output.imageBuffers;
      const keys: string[] = [];
      for (const [idx, image] of processed.entries()) {
        const key = `results/${jobId}/variant-${idx + 1}.png`;
        await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key, Body: image, ContentType: 'image/png' }));
        keys.push(key);
      }
      const collage = await createCollage(processed);
      const collageKey = `results/${jobId}/collage.png`;
      await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: collageKey, Body: collage, ContentType: 'image/png' }));
      await query('UPDATE jobs SET status=$1,result_keys=$2,collage_key=$3,updated_at=NOW() WHERE id=$4', ['succeeded', JSON.stringify(keys), collageKey, jobId]);
    } catch (err) {
      log.error({ err, jobId }, 'Worker job failed');
      await query('UPDATE jobs SET status=$1,updated_at=NOW() WHERE id=$2', ['failed', jobId]);
      throw err;
    }
  },
  { connection: { host: redisUrl.hostname, port: Number(redisUrl.port) }, concurrency: Number(process.env.WORKER_CONCURRENCY || 2) }
);

log.info('Worker started');
