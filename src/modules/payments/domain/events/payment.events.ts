import { DomainEvent } from 'src/shared/domain/domain-event';

// src/modules/payments/domain/events/payment-initiated.event.ts
export class PaymentInitiatedEvent extends DomainEvent {
  readonly eventName = 'payments.payment.initiated';
  constructor(
    readonly paymentId: string,
    readonly senderAccountId: string,
    readonly receiverAccountId: string,
    readonly amountCents: bigint,
    readonly paymentType: string,
  ) {
    super();
  }
}

// src/modules/payments/domain/events/payment-processed.event.ts
export class PaymentProcessedEvent extends DomainEvent {
  readonly eventName = 'payments.payment.processed';
  constructor(
    readonly paymentId: string,
    readonly senderAccountId: string,
    readonly receiverAccountId: string,
    readonly amountCents: bigint,
  ) {
    super();
  }
}

// src/modules/payments/domain/events/payment-failed.event.ts
export class PaymentFailedEvent extends DomainEvent {
  readonly eventName = 'payments.payment.failed';
  constructor(
    readonly paymentId: string,
    readonly reason: string,
  ) {
    super();
  }
}
