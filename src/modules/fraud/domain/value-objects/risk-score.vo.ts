// src/modules/fraud/domain/value-objects/risk-score.vo.ts

import { DomainError, Result } from 'src/shared/domain/result';
import { ValueObject } from 'src/shared/domain/value-object.base';

export type FraudDecision = 'APPROVED' | 'REVIEW' | 'BLOCKED';

interface RiskScoreProps {
  value: number;
}

export class RiskScore extends ValueObject<RiskScoreProps> {
  // Thresholds
  static readonly REVIEW_THRESHOLD = 50;
  static readonly BLOCK_THRESHOLD = 75;

  private constructor(props: RiskScoreProps) {
    super(props);
  }

  get value(): number {
    return this.props.value;
  }

  get decision(): FraudDecision {
    if (this.props.value >= RiskScore.BLOCK_THRESHOLD) return 'BLOCKED';
    if (this.props.value >= RiskScore.REVIEW_THRESHOLD) return 'REVIEW';
    return 'APPROVED';
  }

  get isBlocked(): boolean {
    return this.decision === 'BLOCKED';
  }
  get needsReview(): boolean {
    return this.decision === 'REVIEW';
  }

  static create(value: number): Result<RiskScore, DomainError> {
    if (value < 0 || value > 100) {
      return Result.fail({
        code: 'INVALID_RISK_SCORE',
        message: 'Risk score must be 0-100',
      });
    }
    return Result.ok(new RiskScore({ value: Math.round(value) }));
  }

  /** Combine multiple factor weights, capped at 100 */
  static fromWeights(weights: number[]): RiskScore {
    const total = Math.min(
      weights.reduce((a, b) => a + b, 0),
      100,
    );
    return new RiskScore({ value: Math.round(total) });
  }
}
