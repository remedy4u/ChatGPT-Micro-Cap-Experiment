import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { store } from '../common/store';
import { Lead, LeadInput } from '../common/types';

@Injectable()
export class LeadService {
  create(input: LeadInput): Lead {
    const lead: Lead = {
      ...input,
      id: randomUUID(),
      status: 'new',
      createdAt: new Date().toISOString()
    };
    store.leads.push(lead);
    return lead;
  }

  list() {
    return store.leads;
  }
}
