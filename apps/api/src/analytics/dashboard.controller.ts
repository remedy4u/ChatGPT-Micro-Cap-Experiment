import { Controller, Get } from '@nestjs/common';
import { store } from '../common/store';

@Controller('dashboard')
export class DashboardController {
  @Get('summary')
  summary() {
    const leads = store.leads.length;
    const quotes = store.quotes.length;
    return {
      recoveredCalls: leads,
      quoteToBookingConversion: leads === 0 ? 0 : Number((quotes / leads).toFixed(2)),
      avgResponseTimeSec: 7,
      topSymptoms: ['not_cooling', 'not_spinning'],
      noShowRate: 0.05
    };
  }
}
