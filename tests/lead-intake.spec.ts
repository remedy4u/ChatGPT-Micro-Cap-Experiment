import { LeadService } from '../apps/api/src/leads/lead.service';

describe('LeadService', () => {
  it('creates lead with normalized status', () => {
    const service = new LeadService();
    const lead = service.create({ tenantId: 't1', phone: '+1', applianceType: 'refrigerator', symptom: 'not_cooling', urgency: 'high', language: 'ru' });
    expect(lead.status).toBe('new');
  });
});
