// src/modules/fraud/domain/entities/fraud-analysis.entity.ts

import { RiskFactor } from '../value-objects/risk-factor.vo';
import { RiskScore, FraudDecision } from '../value-objects/risk-score.vo';
import { FraudAnalysisBlockedEvent } from '../events/fraud-analysis-blocked.event';
import { AggregateRoot } from 'src/shared/domain/aggregate-root';
import { DomainError, Result } from 'src/shared/domain/result';

interface FraudAnalysisProps {
  paymentId?: string;
  senderAccountId: string;
  amountCents: bigint;
  riskScore: RiskScore;
  factors: RiskFactor[];
  analyzedAt: Date;
}

export class FraudAnalysis extends AggregateRoot<FraudAnalysisProps> {
  private constructor(props: FraudAnalysisProps, id?: string) {
    super(props, id);
  }

  get paymentId(): string | undefined {
    return this.props.paymentId;
  }
  get senderAccountId(): string {
    return this.props.senderAccountId;
  }
  get amountCents(): bigint {
    return this.props.amountCents;
  }
  get riskScore(): RiskScore {
    return this.props.riskScore;
  }
  get decision(): FraudDecision {
    return this.props.riskScore.decision;
  }
  get factors(): RiskFactor[] {
    return [...this.props.factors];
  }
  get analyzedAt(): Date {
    return this.props.analyzedAt;
  }
  get isBlocked(): boolean {
    return this.props.riskScore.isBlocked;
  }

  static create(props: {
    paymentId?: string;
    senderAccountId: string;
    amountCents: bigint;
    factors: RiskFactor[];
  }): Result<FraudAnalysis, DomainError> {
    const riskScore = RiskScore.fromWeights(props.factors.map((f) => f.weight));

    const analysis = new FraudAnalysis({
      ...props,
      riskScore,
      analyzedAt: new Date(),
    });

    if (analysis.isBlocked) {
      analysis.addDomainEvent(
        new FraudAnalysisBlockedEvent(
          analysis.id,
          props.senderAccountId,
          riskScore.value,
          props.factors.map((f) => f.code),
        ),
      );
    }

    return Result.ok(analysis);
  }

  static reconstitute(props: FraudAnalysisProps, id: string): FraudAnalysis {
    return new FraudAnalysis(props, id);
  }
}
