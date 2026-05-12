// src/shared/infrastructure/outbox/outbox.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

import { Prisma } from '@prisma/client';
import { DomainEvent } from 'src/shared/domain/domain-event';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persists domain events into outbox_events within the SAME Prisma transaction.
   * Call this inside prisma.$transaction() alongside your business writes.
   */
  buildOutboxInserts(
    events: DomainEvent[],
    tx: Prisma.TransactionClient,
  ): Promise<void>[] {
    return events.map((event) =>
      tx.outboxEvent
        .create({
          data: {
            aggregateId: (event as any).aggregateId ?? 'unknown',
            eventName: event.eventName,
            payload: this.serializeEvent(event) as any,
            status: 'PENDING',
          },
        })
        .then(() => undefined),
    );
  }

  /** Convenience: save events outside an explicit transaction */
  async saveEvents(events: DomainEvent[]): Promise<void> {
    if (!events.length) return;
    await this.prisma.outboxEvent.createMany({
      data: events.map((e) => ({
        aggregateId: (e as any).aggregateId ?? 'unknown',
        eventName: e.eventName,
        payload: this.serializeEvent(e) as any,
        status: 'PENDING' as const,
      })),
    });
  }

  /** Fetch a batch of pending events for the relay to process */
  async fetchPending(limit = 50): Promise<
    Array<{
      id: string;
      eventName: string;
      payload: Record<string, unknown>;
      retries: number;
    }>
  > {
    const rows = await this.prisma.outboxEvent.findMany({
      where: { status: 'PENDING', retries: { lt: 5 } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      eventName: r.eventName,
      payload: r.payload as Record<string, unknown>,
      retries: r.retries,
    }));
  }

  async markPublished(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  async markFailed(id: string, error: string, retries: number): Promise<void> {
    const nextStatus = retries >= 4 ? 'FAILED' : 'PENDING';
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status: nextStatus as any,
        lastError: error,
        retries: retries + 1,
      },
    });
  }

  private serializeEvent(event: DomainEvent): Record<string, unknown> {
    const { eventName, eventId, occurredAt, ...rest } = event as any;
    return { eventId, eventName, occurredAt, ...rest };
  }
}
