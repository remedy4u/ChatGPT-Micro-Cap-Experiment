import { Body, Controller, Post } from '@nestjs/common';
import { ReminderService } from './reminder.service';

@Controller('reminders')
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Post('schedule')
  schedule(@Body() body: { appointmentId: string }) {
    return this.reminderService.schedule(body.appointmentId);
  }
}
