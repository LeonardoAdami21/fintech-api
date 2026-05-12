// src/modules/fraud/fraud.module.ts
import { Module } from '@nestjs/common';
import { OutboxModule } from 'src/shared/infrastructure/outbox/outbox.module';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';
import { AnalyzePaymentHandler } from './application/commands/analyze-payment/analyze-payment.handler';
import { FRAUD_ANALYSIS_REPOSITORY } from './domain/repositories/fraud-analysis.repository';
import { PrismaFraudAnalysisRepository } from './repositories/prisma-fraud-analysis.repository';

@Module({
  imports: [OutboxModule],
  providers: [
    PrismaService,
    AnalyzePaymentHandler,
    {
      provide: FRAUD_ANALYSIS_REPOSITORY,
      useClass: PrismaFraudAnalysisRepository,
    },
  ],
  exports: [AnalyzePaymentHandler],
})
export class FraudModule {}
