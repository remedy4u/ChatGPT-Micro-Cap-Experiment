import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { LeadService } from '../leads/lead.service';
import { QuoteService } from '../quotes/quote.service';

const idempotency = new Set<string>();

@Controller('webhooks/twilio')
export class TwilioVoiceController {
  constructor(private readonly leadService: LeadService, private readonly quoteService: QuoteService) {}

  @Post('voice')
  @HttpCode(200)
  inbound(@Body() payload: Record<string, string>) {
    const callSid = payload.CallSid ?? payload.callSid;
    if (!callSid) {
      return { ok: false, reason: 'missing_call_sid' };
    }
    if (idempotency.has(callSid)) {
      return { ok: true, deduplicated: true };
    }
    idempotency.add(callSid);

    const lead = this.leadService.create({
      tenantId: process.env.DEFAULT_TENANT_SLUG ?? 'demo-repair',
      phone: payload.From ?? '+10000000000',
      applianceType: normalizeAppliance(payload.applianceType),
      brand: payload.brand,
      model: payload.model,
      symptom: normalizeSymptom(payload.symptom),
      urgency: normalizeUrgency(payload.urgency),
      language: normalizeLanguage(payload.lang),
      address: payload.address
    });

    const quote = this.quoteService.preview(lead.id);
    return {
      ok: true,
      lead,
      quote,
      twiml: `<Response><Say language=\"${lead.language === 'ru' ? 'ru-RU' : 'en-US'}\">Спасибо! Предварительная оценка ${quote.lowEstimate}-${quote.highEstimate} долларов. Мы отправили SMS для подтверждения времени визита.</Say></Response>`
    };
  }
}

const normalizeAppliance = (input?: string) => {
  const map: Record<string, string> = {
    washer: 'washing_machine',
    washing_machine: 'washing_machine',
    refrigerator: 'refrigerator',
    fridge: 'refrigerator'
  };
  return map[(input ?? '').toLowerCase()] ?? 'unknown';
};
const normalizeSymptom = (input?: string) => {
  const map: Record<string, string> = { not_spinning: 'not_spinning', not_cooling: 'not_cooling' };
  return map[(input ?? '').toLowerCase()] ?? 'unknown';
};
const normalizeUrgency = (input?: string): 'low' | 'medium' | 'high' | 'emergency' | 'unknown' => {
  const allowed = ['low', 'medium', 'high', 'emergency'];
  return (allowed.includes((input ?? '').toLowerCase()) ? input!.toLowerCase() : 'unknown') as any;
};
const normalizeLanguage = (input?: string): 'ru' | 'en' | 'unknown' => {
  const v = (input ?? '').toLowerCase();
  if (v.startsWith('ru')) return 'ru';
  if (v.startsWith('en')) return 'en';
  return 'unknown';
};
