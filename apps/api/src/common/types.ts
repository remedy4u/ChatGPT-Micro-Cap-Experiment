export type Language = 'ru' | 'en' | 'unknown';
export type Urgency = 'low' | 'medium' | 'high' | 'emergency' | 'unknown';

export interface LeadInput {
  tenantId: string;
  phone: string;
  applianceType: string;
  brand?: string;
  model?: string;
  symptom: string;
  urgency: Urgency;
  language: Language;
  address?: string;
}

export interface Lead extends LeadInput {
  id: string;
  status: 'new' | 'quoted' | 'booked';
  createdAt: string;
}

export interface QuotePreview {
  leadId: string;
  lowEstimate: number;
  highEstimate: number;
  confidence: number;
  recommendedAction: string;
  assumptions: string[];
}
