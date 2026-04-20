import { QuoteService } from '../apps/api/src/quotes/quote.service';
import { store } from '../apps/api/src/common/store';

describe('QuoteService', () => {
  it('returns bounded quote for known symptom', () => {
    store.leads = [{
      id: 'l1', tenantId: 't1', phone: '+1', applianceType: 'washing_machine', symptom: 'not_spinning', urgency: 'medium', language: 'en', status: 'new', createdAt: new Date().toISOString()
    } as any];
    const service = new QuoteService();
    const quote = service.preview('l1');
    expect(quote.lowEstimate).toBe(120);
    expect(quote.highEstimate).toBe(260);
  });
});
