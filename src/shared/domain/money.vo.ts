// src/shared/domain/money.vo.ts
import { ValueObject } from './value-object.base';
import { DomainError, Result } from './result';

interface MoneyProps {
  amountCents: bigint;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  get amountCents(): bigint {
    return this.props.amountCents;
  }

  get currency(): string {
    return this.props.currency;
  }

  get amountBRL(): number {
    return Number(this.props.amountCents) / 100;
  }

  static create(
    amountCents: bigint,
    currency = 'BRL',
  ): Result<Money, DomainError> {
    if (amountCents < 0n) {
      return Result.fail({
        code: 'INVALID_AMOUNT',
        message: 'Amount cannot be negative',
      });
    }
    if (amountCents === 0n) {
      return Result.fail({
        code: 'ZERO_AMOUNT',
        message: 'Amount must be greater than zero',
      });
    }
    return Result.ok(new Money({ amountCents, currency }));
  }

  static fromBRL(amount: number): Result<Money, DomainError> {
    if (!Number.isFinite(amount) || amount <= 0) {
      return Result.fail({
        code: 'INVALID_AMOUNT',
        message: 'Invalid BRL amount',
      });
    }
    const cents = BigInt(Math.round(amount * 100));
    return Money.create(cents);
  }

  add(other: Money): Money {
    return new Money({
      amountCents: this.amountCents + other.amountCents,
      currency: this.currency,
    });
  }

  subtract(other: Money): Result<Money, DomainError> {
    const result = this.amountCents - other.amountCents;
    if (result < 0n) {
      return Result.fail({
        code: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient funds',
      });
    }
    return Result.ok(
      new Money({ amountCents: result, currency: this.currency }),
    );
  }

  isGreaterThan(other: Money): boolean {
    return this.amountCents > other.amountCents;
  }

  toString(): string {
    return `${this.currency} ${this.amountBRL.toFixed(2)}`;
  }
}
