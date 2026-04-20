import { Injectable } from '@nestjs/common';
import { store } from '../common/store';
import { QuotePreview } from '../common/types';

const rules = [
  { applianceType: 'washing_machine', symptom: 'not_spinning', low: 120, high: 260, confidence: 0.78 },
  { applianceType: 'refrigerator', symptom: 'not_cooling', low: 180, high: 420, confidence: 0.68 }
];

@Injectable()
export class QuoteService {
  preview(leadId: string): QuotePreview {
    const lead = store.leads.find((x) => x.id === leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const matched = rules.find((r) => r.applianceType === lead.applianceType && r.symptom === lead.symptom);
    const low = matched?.low ?? 90;
    const high = matched?.high ?? 480;
    const confidence = matched?.confidence ?? 0.4;
    const recommendedAction = confidence < 0.55 ? 'inspection_required' : 'book_visit';

    const quote: QuotePreview = {
      leadId,
      lowEstimate: low,
      highEstimate: high,
      confidence,
      recommendedAction,
      assumptions: [
        `urgency=${lead.urgency}`,
        'parts_pricing_estimated',
        'final_price_after_diagnosis'
      ]
    };
    store.quotes.push(quote);
    return quote;
  }
}
