import { Lead, QuotePreview } from './types';

export const store: { leads: Lead[]; quotes: QuotePreview[]; reminders: Record<string, string[]> } = {
  leads: [],
  quotes: [],
  reminders: {}
};
