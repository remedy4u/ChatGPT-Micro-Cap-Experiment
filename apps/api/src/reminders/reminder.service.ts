import { Injectable } from '@nestjs/common';
import { store } from '../common/store';

@Injectable()
export class ReminderService {
  schedule(appointmentId: string) {
    store.reminders[appointmentId] = ['24h_before', '2h_before'];
    return { appointmentId, jobs: store.reminders[appointmentId] };
  }
}
