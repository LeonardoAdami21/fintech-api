// src/modules/fraud/domain/value-objects/risk-factor.vo.ts
import { ValueObject } from 'src/shared/domain/value-object.base';

export type RiskFactorCode =
  | 'HIGH_AMOUNT'
  | 'UNUSUAL_AMOUNT'
  | 'HIGH_FREQUENCY'
  | 'NEW_ACCOUNT'
  | 'LARGE_SINGLE_TRANSFER'
  | 'RAPID_SUCCESSION'
  | 'REPEATED_RECEIVER'
  | 'ACCOUNT_BLOCKED_HISTORY';

interface RiskFactorProps {
  code: RiskFactorCode;
  description: string;
  weight: number; // 0-100 contribution to score
}

export class RiskFactor extends ValueObject<RiskFactorProps> {
  constructor(props: RiskFactorProps) {
    super(props);
  }

  get code(): RiskFactorCode {
    return this.props.code;
  }
  get description(): string {
    return this.props.description;
  }
  get weight(): number {
    return this.props.weight;
  }

  toJSON() {
    return {
      code: this.code,
      description: this.description,
      weight: this.weight,
    };
  }
}
