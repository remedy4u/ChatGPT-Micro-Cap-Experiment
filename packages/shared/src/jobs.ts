import { JobStatus } from './types.js';

const transitions: Record<JobStatus, JobStatus[]> = {
  queued: ['processing', 'failed'],
  processing: ['succeeded', 'failed'],
  succeeded: [],
  failed: []
};

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return transitions[from].includes(to);
}
