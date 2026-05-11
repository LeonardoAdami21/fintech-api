// src/modules/payments/domain/entities/payment.entity.ts
import { IdempotencyKey } from '../value-objects/idempotency-key.vo';
import { PaymentInitiatedEvent } from '../events/payment-initiated.event';
import { PaymentProcessedEvent } from '../events/payment-processed.event';
import { PaymentFailedEvent } from '../events/payment-failed.event';
import { Money } from 'src/shared/domain/money.vo';
import { AggregateRoot } from 'src/shared/domain/aggregate-root';
import { DomainError, Result } from 'src/shared/domain/result';

export type PaymentType = 'PIX' | 'TED' | 'INTERNAL';
export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED';

interface PaymentProps {
  senderAccountId: string;
  receiverAccountId: string;
  amount: Money;
  type: PaymentType;
  status: PaymentStatus;
  description: string | null;
  idempotencyKey: IdempotencyKey;
  failureReason: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Valid state transitions ──────────────────────────────
const TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ['PROCESSING', 'FAILED'],
  PROCESSING: ['COMPLETED', 'FAILED'],
  COMPLETED: ['REFUNDED'],
  FAILED: [],
  REFUNDED: [],
};

export class Payment extends AggregateRoot<PaymentProps> {
  private constructor(props: PaymentProps, id?: string) {
    super(props, id);
  }

  // ── Getters ────────────────────────────────────────────
  get senderAccountId(): string {
    return this.props.senderAccountId;
  }
  get receiverAccountId(): string {
    return this.props.receiverAccountId;
  }
  get amount(): Money {
    return this.props.amount;
  }
  get type(): PaymentType {
    return this.props.type;
  }
  get status(): PaymentStatus {
    return this.props.status;
  }
  get description(): string | null {
    return this.props.description;
  }
  get idempotencyKey(): IdempotencyKey {
    return this.props.idempotencyKey;
  }
  get failureReason(): string | null {
    return this.props.failureReason;
  }
  get processedAt(): Date | null {
    return this.props.processedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ── Factory ─────────────────────────────────────────────
  static initiate(props: {
    senderAccountId: string;
    receiverAccountId: string;
    amount: Money;
    type: PaymentType;
    description?: string;
    idempotencyKey: IdempotencyKey;
  }): Result<Payment, DomainError> {
    if (props.senderAccountId === props.receiverAccountId) {
      return Result.fail({
        code: 'SELF_TRANSFER',
        message: 'Cannot transfer to the same account',
      });
    }
    const now = new Date();
    const payment = new Payment({
      ...props,
      description: props.description ?? null,
      status: 'PENDING',
      failureReason: null,
      processedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    payment.addDomainEvent(
      new PaymentInitiatedEvent(
        payment.id,
        props.senderAccountId,
        props.receiverAccountId,
        props.amount.amountCents,
        props.type,
      ),
    );
    return Result.ok(payment);
  }

  static reconstitute(props: PaymentProps, id: string): Payment {
    return new Payment(props, id);
  }

  // ── State machine helpers ────────────────────────────────
  private transition(next: PaymentStatus): Result<void, DomainError> {
    if (!TRANSITIONS[this.props.status].includes(next)) {
      return Result.fail({
        code: 'INVALID_TRANSITION',
        message: `Cannot transition payment from ${this.props.status} to ${next}`,
      });
    }
    (this.props as PaymentProps).status = next;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  // ── Business methods ─────────────────────────────────────
  startProcessing(): Result<void, DomainError> {
    return this.transition('PROCESSING');
  }

  complete(): Result<void, DomainError> {
    const r = this.transition('COMPLETED');
    if (r.isFailure) return r;
    (this.props as PaymentProps).processedAt = new Date();
    this.addDomainEvent(
      new PaymentProcessedEvent(
        this.id,
        this.senderAccountId,
        this.receiverAccountId,
        this.amount.amountCents,
      ),
    );
    return Result.ok(undefined);
  }

  fail(reason: string): Result<void, DomainError> {
    const r = this.transition('FAILED');
    if (r.isFailure) return r;
    (this.props as PaymentProps).failureReason = reason;
    this.addDomainEvent(new PaymentFailedEvent(this.id, reason));
    return Result.ok(undefined);
  }

  refund(): Result<void, DomainError> {
    return this.transition('REFUNDED');
  }
}
