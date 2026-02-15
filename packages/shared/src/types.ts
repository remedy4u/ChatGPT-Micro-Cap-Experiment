export type PackType = 'wrap' | 'wheels' | 'stance' | 'lights_tint';
export type JobStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

export interface JobParams {
  preset: string;
  finish?: 'matte' | 'gloss';
  sizeDelta?: number;
  stanceMm?: -10 | -20 | -30;
  tintPercent?: 20 | 35 | 50;
  refineText?: string;
}

export interface ProviderRequest {
  sourceImageKey: string;
  references?: string[];
  prompt: string;
  negativePrompt: string;
  maskHint: string;
  variants: number;
  hd: boolean;
}

export interface ProviderResult {
  imageBuffers: Buffer[];
}
