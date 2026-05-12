// src/shared/infrastructure/outbox/kafka-producer.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Kafka, Producer, CompressionTypes, logLevel } from 'kafkajs';

export interface KafkaMessage {
  topic: string;
  key: string;
  value: Record<string, unknown>;
  headers?: Record<string, string>;
}

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private readonly kafka: Kafka;
  private readonly producer: Producer;

  // ── Topic routing map ──────────────────────────────────────────────────────
  private static readonly EVENT_TOPIC_MAP: Record<string, string> = {
    'identity.user.created': 'identity.events',
    'identity.user.suspended': 'identity.events',
    'accounts.account.opened': 'accounts.events',
    'accounts.balance.updated': 'accounts.events',
    'accounts.pix_key.registered': 'accounts.events',
    'payments.payment.initiated': 'payments.events',
    'payments.payment.processed': 'payments.events',
    'payments.payment.failed': 'payments.events',
    'fraud.analysis.blocked': 'fraud.events',
  };

  constructor() {
    this.kafka = new Kafka({
      clientId: 'fintech-api',
      brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
      logLevel: logLevel.WARN,
    });
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30_000,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
    this.logger.log('Kafka producer disconnected');
  }

  async publish(
    eventName: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const topic = KafkaProducerService.EVENT_TOPIC_MAP[eventName];
    if (!topic) {
      this.logger.warn(`No topic mapped for event "${eventName}" — skipping`);
      return;
    }

    await this.producer.send({
      topic,
      compression: CompressionTypes.GZIP,
      messages: [
        {
          key: String(
            payload['aggregateId'] ?? payload['eventId'] ?? 'unknown',
          ),
          value: JSON.stringify(payload),
          headers: {
            eventName,
            producedAt: new Date().toISOString(),
            source: 'fintech-api',
          },
        },
      ],
    });
  }

  resolveTopic(eventName: string): string | undefined {
    return KafkaProducerService.EVENT_TOPIC_MAP[eventName];
  }
}
