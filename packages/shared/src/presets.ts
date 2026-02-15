import { PackType, JobParams, ProviderRequest } from './types.js';

const wrapColors = ['black', 'white', 'red', 'nardo gray', 'blue', 'green', 'silver', 'purple'];
const wheelStyles = ['mesh', 'multi-spoke', 'deep-dish', 'aero', 'split-five', 'motorsport'];
const stanceLevels = [-10, -20, -30] as const;
const tintLevels = [20, 35, 50] as const;

export const presetCatalog = { wrapColors, wheelStyles, stanceLevels, tintLevels };

export function buildProviderPayload(packType: PackType, params: JobParams, base: Omit<ProviderRequest, 'prompt' | 'negativePrompt' | 'maskHint'>): ProviderRequest {
  const negativePrompt = 'Do not change car model, body shape, camera angle, lighting direction, or background composition.';
  switch (packType) {
    case 'wrap':
      return {
        ...base,
        maskHint: 'car_body',
        prompt: `Apply ${params.preset} wrap finish (${params.finish ?? 'gloss'}) with realistic reflections and preserve panel lines.`,
        negativePrompt
      };
    case 'wheels':
      return {
        ...base,
        maskHint: 'wheels',
        prompt: `Replace wheels with ${params.preset} style and ${params.sizeDelta ?? 0} inch size change, keep tire fitment believable.`,
        negativePrompt
      };
    case 'stance':
      return {
        ...base,
        maskHint: 'suspension',
        prompt: `Lower vehicle stance by ${params.stanceMm ?? -10}mm while keeping wheel alignment realistic and avoiding clipping.`,
        negativePrompt
      };
    case 'lights_tint':
      return {
        ...base,
        maskHint: 'glass_lights_trim',
        prompt: `Set window tint to ${params.tintPercent ?? 35}% and apply ${params.preset} light/trim styling with realistic intensity.`,
        negativePrompt
      };
    default:
      throw new Error('Unsupported pack type');
  }
}
