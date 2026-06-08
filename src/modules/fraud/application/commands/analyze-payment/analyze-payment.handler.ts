// src/modules/fraud/application/commands/analyze-payment/analyze-payment.command.ts
export class AnalyzePaymentCommand {
  constructor(
    readonly paymentId?: string,
    readonly senderAccountId: string = '',
    readonly receiverAccountId: string = '',
    readonly amountCents: number = 0,
    readonly accountAgeDays: number = 0,
  ) {}
}

// ─────────────────────────────────────────────────────────────────────────────

// src/modules/fraud/application/commands/analyze-payment/analyze-payment.handler.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import * as fraudAnalysisRepository from '../../../domain/repositories/fraud-analysis.repository';
import { RiskFactor } from '../../../domain/value-objects/risk-factor.vo';
import { FraudAnalysis } from '../../../domain/entities/fraud-analysis.entity';
import { OutboxService } from 'src/shared/infrastructure/outbox/outbox.service';

export interface AnalyzePaymentResult {
  analysisId: string;
  riskScore: number;
  decision: 'APPROVED' | 'REVIEW' | 'BLOCKED';
  factors: Array<{ code: string; description: string; weight: number }>;
}

// ── Thresholds (easily moved to config/DB) ───────────────────────────────────
const LARGE_AMOUNT_CENTS = 500_000; // R$ 5.000
const VERY_LARGE_AMOUNT_CENTS = 5_000_000; // R$ 50.000
const HIGH_FREQ_WINDOW_MINUTES = 10;
const HIGH_FREQ_THRESHOLD = 5;
const DAILY_VOLUME_LIMIT_CENTS = 2_000_000; // R$ 20.000
const NEW_ACCOUNT_DAYS_THRESHOLD = 30;

@Injectable()
export class AnalyzePaymentHandler {
  private readonly logger = new Logger(AnalyzePaymentHandler.name);

  constructor(
    @Inject(fraudAnalysisRepository.FRAUD_ANALYSIS_REPOSITORY)
    private readonly fraudRepo: fraudAnalysisRepository.IFraudAnalysisRepository,
    private readonly outboxService: OutboxService,
  ) {}

  async execute(command: AnalyzePaymentCommand): Promise<AnalyzePaymentResult> {
    const factors: RiskFactor[] = [];

    // ── Rule 1: Very large single transfer ────────────────────────────────────
    if (command.amountCents >= VERY_LARGE_AMOUNT_CENTS) {
      factors.push(
        new RiskFactor({
          code: 'LARGE_SINGLE_TRANSFER',
          description: 'Transfer above R$ 50.000',
          weight: 80,
        }),
      );
    } else if (command.amountCents >= LARGE_AMOUNT_CENTS) {
      factors.push(
        new RiskFactor({
          code: 'HIGH_AMOUNT',
          description: 'Transfer above R$ 5.000',
          weight: 30,
        }),
      );
    }

    // ── Rule 2: High frequency in short window ────────────────────────────────
    const recentCount = await this.fraudRepo.countRecentBySender(
      command.senderAccountId,
      HIGH_FREQ_WINDOW_MINUTES,
    );
    if (recentCount >= HIGH_FREQ_THRESHOLD) {
      factors.push(
        new RiskFactor({
          code: 'HIGH_FREQUENCY',
          description: `${recentCount} transfers in last ${HIGH_FREQ_WINDOW_MINUTES} minutes`,
          weight: 40,
        }),
      );
    }

    // ── Rule 3: Daily volume exceeded ─────────────────────────────────────────
    const dailyVolume = await this.fraudRepo.sumRecentAmountBySender(
      command.senderAccountId,
      24,
    );
    if (dailyVolume + command.amountCents > DAILY_VOLUME_LIMIT_CENTS) {
      factors.push(
        new RiskFactor({
          code: 'UNUSUAL_AMOUNT',
          description: `Daily volume limit of R$ 20.000 exceeded`,
          weight: 35,
        }),
      );
    }

    // ── Rule 4: New account ────────────────────────────────────────────────────
    if (command.accountAgeDays < NEW_ACCOUNT_DAYS_THRESHOLD) {
      const ageWeight = command.accountAgeDays < 7 ? 25 : 10;
      factors.push(
        new RiskFactor({
          code: 'NEW_ACCOUNT',
          description: `Account is only ${command.accountAgeDays} days old`,
          weight: ageWeight,
        }),
      );
    }

    // ── Rule 5: Repeated receiver (possible structuring) ──────────────────────
    const recentReceivers = await this.fraudRepo.findRecentReceivers(
      command.senderAccountId,
      1,
    );
    const repeatedCount = recentReceivers.filter(
      (r) => r === command.receiverAccountId,
    ).length;
    if (repeatedCount > 0) {
      factors.push(
        new RiskFactor({
          code: 'REPEATED_RECEIVER',
          description: 'Same receiver targeted multiple times in last hour',
          weight: 20,
        }),
      );
    }

    // ── Build analysis ─────────────────────────────────────────────────────────
    const analysisResult = FraudAnalysis.create({
      paymentId: command.paymentId,
      senderAccountId: command.senderAccountId,
      amountCents: +command.amountCents,
      factors,
    });

    if (analysisResult.isFailure) throw new Error(analysisResult.error.message);
    const analysis = analysisResult.value;

    // ── Persist + dispatch domain events via outbox ────────────────────────────
    await this.fraudRepo.save(analysis);
    if (analysis.domainEvents.length) {
      await this.outboxService.saveEvents(analysis.domainEvents);
      analysis.clearDomainEvents();
    }

    this.logger.log(
      `Fraud analysis [${analysis.id}]: score=${analysis.riskScore.value} decision=${analysis.decision} ` +
        `factors=[${factors.map((f) => f.code).join(', ')}]`,
    );

    return {
      analysisId: analysis.id,
      riskScore: analysis.riskScore.value,
      decision: analysis.decision,
      factors: factors.map((f) => f.toJSON()),
    };
  }
}
