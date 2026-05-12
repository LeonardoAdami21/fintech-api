// src/modules/fraud/domain/events/fraud-analysis-blocked.event.ts

import { DomainEvent } from 'src/shared/domain/domain-event';

export class FraudAnalysisBlockedEvent extends DomainEvent {
  readonly eventName = 'fraud.analysis.blocked';

  constructor(
    readonly analysisId: string,
    readonly senderAccountId: string,
    readonly riskScore: number,
    readonly factorCodes: string[],
  ) {
    super();
  }
}
