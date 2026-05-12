// src/shared/infrastructure/outbox/outbox-event.interface.ts

export type OutboxStatus = 'PENDING' | 'PUBLISHED' | 'FAILED';

export interface OutboxRecord {
  id:          string;
  aggregateId: string;
  eventName:   string;
  payload:     Record<string, unknown>;
  status:      OutboxStatus;
  retries:     number;
  lastError:   string | null;
  publishedAt: Date | null;
  createdAt:   Date;
}
