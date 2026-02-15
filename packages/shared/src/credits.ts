export interface LedgerInsert {
  userId: string;
  delta: number;
  reason: string;
  jobId?: string;
  idempotencyKey: string;
}

export interface LedgerRepo {
  hasEntryByKey: (idempotencyKey: string) => Promise<boolean>;
  insertEntry: (entry: LedgerInsert) => Promise<void>;
}

export async function chargeCreditsOnce(repo: LedgerRepo, entry: LedgerInsert): Promise<boolean> {
  if (await repo.hasEntryByKey(entry.idempotencyKey)) return false;
  await repo.insertEntry(entry);
  return true;
}
