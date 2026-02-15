import sharp from 'sharp';
import { ProviderRequest, ProviderResult } from '@mvp/shared';

export interface ImageProvider {
  generate(req: ProviderRequest): Promise<ProviderResult>;
}

export interface SegmentationModule {
  mask(req: ProviderRequest): Promise<string>;
}

export class StubSegmentation implements SegmentationModule {
  async mask(req: ProviderRequest): Promise<string> {
    return req.maskHint;
  }
}

export class MockProvider implements ImageProvider {
  async generate(req: ProviderRequest): Promise<ProviderResult> {
    const images: Buffer[] = [];
    for (let i = 0; i < req.variants; i++) {
      const svg = `<svg width="1024" height="768"><rect width="100%" height="100%" fill="#1f2937"/><text x="50" y="120" font-size="48" fill="white">Mock Variant ${i + 1}</text><text x="50" y="190" font-size="30" fill="#d1d5db">${req.prompt}</text></svg>`;
      images.push(await sharp(Buffer.from(svg)).png().toBuffer());
    }
    return { imageBuffers: images };
  }
}

export class RealProvider implements ImageProvider {
  constructor(private readonly endpoint: string, private readonly apiKey: string) {}

  async generate(req: ProviderRequest): Promise<ProviderResult> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`Real provider failed: ${res.status}`);
    const data = (await res.json()) as { imagesBase64: string[] };
    return { imageBuffers: data.imagesBase64.map((s) => Buffer.from(s, 'base64')) };
  }
}

export function createProvider(): ImageProvider {
  if (process.env.IMAGE_PROVIDER === 'real') {
    return new RealProvider(process.env.REAL_PROVIDER_URL ?? '', process.env.REAL_PROVIDER_API_KEY ?? '');
  }
  return new MockProvider();
}

export async function applyWatermark(image: Buffer, text: string): Promise<Buffer> {
  const mark = `<svg width="1024" height="768"><text x="40" y="730" font-size="42" fill="rgba(255,255,255,0.6)">${text}</text></svg>`;
  return sharp(image).composite([{ input: Buffer.from(mark), gravity: 'southwest' }]).png().toBuffer();
}

export async function createCollage(images: Buffer[]): Promise<Buffer> {
  const resized = await Promise.all(images.slice(0, 6).map((img) => sharp(img).resize(512, 384).png().toBuffer()));
  const canvas = sharp({ create: { width: 1536, height: 768, channels: 3, background: '#0b0f1a' } });
  return canvas
    .composite(
      resized.map((input, idx) => ({
        input,
        left: (idx % 3) * 512,
        top: idx < 3 ? 0 : 384
      }))
    )
    .png()
    .toBuffer();
}
