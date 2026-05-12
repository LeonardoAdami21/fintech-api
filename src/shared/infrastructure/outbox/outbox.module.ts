// src/shared/infrastructure/outbox/outbox.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService }       from '../prisma.service';
import { OutboxService }       from './outbox.service';
import { KafkaProducerService } from './kafka-producer.service';
import { OutboxRelayService }  from './outbox-relay.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    PrismaService,
    OutboxService,
    KafkaProducerService,
    OutboxRelayService,
  ],
  exports: [OutboxService, KafkaProducerService],
})
export class OutboxModule {}
