// src/shared/infrastructure/outbox/outbox-relay.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxService } from './outbox.service';
import { KafkaProducerService } from './kafka-producer.service';

@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name);
  private isRunning = false;

  constructor(
    private readonly outboxService:   OutboxService,
    private readonly kafkaProducer:   KafkaProducerService,
  ) {}

  /**
   * Polls every 2 seconds — low latency for near-real-time delivery.
   * Uses a lock flag to prevent overlapping runs.
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async relay(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const events = await this.outboxService.fetchPending(50);
      if (!events.length) return;

      this.logger.debug(`Relaying ${events.length} outbox event(s)`);

      await Promise.allSettled(
        events.map((event) => this.publishOne(event)),
      );
    } catch (err: any) {
      this.logger.error(`Outbox relay error: ${err.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  private async publishOne(event: {
    id: string;
    eventName: string;
    payload: Record<string, unknown>;
    retries: number;
  }): Promise<void> {
    try {
      await this.kafkaProducer.publish(event.eventName, event.payload);
      await this.outboxService.markPublished(event.id);
      this.logger.debug(`Published event "${event.eventName}" [${event.id}]`);
    } catch (err: any) {
      this.logger.warn(`Failed to publish "${event.eventName}" [${event.id}]: ${err.message}`);
      await this.outboxService.markFailed(event.id, err.message, event.retries);
    }
  }
}
