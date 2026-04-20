import { Module } from '@nestjs/common';
import { LeadController } from './leads/lead.controller';
import { LeadService } from './leads/lead.service';
import { QuoteService } from './quotes/quote.service';
import { QuoteController } from './quotes/quote.controller';
import { TwilioVoiceController } from './webhooks/twilio-voice.controller';
import { ReminderService } from './reminders/reminder.service';
import { ReminderController } from './reminders/reminder.controller';
import { DashboardController } from './analytics/dashboard.controller';

@Module({
  controllers: [LeadController, QuoteController, TwilioVoiceController, ReminderController, DashboardController],
  providers: [LeadService, QuoteService, ReminderService]
})
export class AppModule {}
