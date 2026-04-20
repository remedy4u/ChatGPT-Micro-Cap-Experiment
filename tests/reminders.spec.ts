import { ReminderService } from '../apps/api/src/reminders/reminder.service';

describe('ReminderService', () => {
  it('creates 24h and 2h jobs', () => {
    const service = new ReminderService();
    const result = service.schedule('appt-1');
    expect(result.jobs).toEqual(['24h_before', '2h_before']);
  });
});
