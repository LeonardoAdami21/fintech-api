// src/modules/accounts/domain/entities/account.entity.ts

import { AccountNumber } from '../value-objects/account-number.vo';
import { PixKey, PixKeyType } from '../value-objects/pix-key.vo';
import { AccountOpenedEvent } from '../events/account-opened.event';
import { BalanceUpdatedEvent } from '../events/balance-updated.event';
import { PixKeyRegisteredEvent } from '../events/pix-key-registered.event';
import { AggregateRoot } from 'src/shared/domain/aggregate-root';
import { Money } from 'src/shared/domain/money.vo';
import { DomainError, Result } from 'src/shared/domain/result';

export type AccountStatus = 'ACTIVE' | 'BLOCKED' | 'CLOSED';

interface AccountProps {
  userId: string;
  accountNumber: AccountNumber;
  agency: string;
  balance: Money;
  limit: Money;
  status: AccountStatus;
  pixKeys: PixKey[];
  createdAt: Date;
  updatedAt: Date;
}

export class Account extends AggregateRoot<AccountProps> {
  private constructor(props: AccountProps, id?: string) {
    super(props, id);
  }

  // ── Getters ─────────────────────────────────────
  get userId(): string {
    return this.props.userId;
  }
  get accountNumber(): AccountNumber {
    return this.props.accountNumber;
  }
  get agency(): string {
    return this.props.agency;
  }
  get balance(): Money {
    return this.props.balance;
  }
  get limit(): Money {
    return this.props.limit;
  }
  get status(): AccountStatus {
    return this.props.status;
  }
  get pixKeys(): PixKey[] {
    return [...this.props.pixKeys];
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  // ── Factory ─────────────────────────────────────
  static open(userId: string): Result<Account, DomainError> {
    const zeroMoney = Money.create(1n); // bootstrap; set to 0 manually below
    const now = new Date();
    const account = new Account({
      userId,
      accountNumber: AccountNumber.generate(),
      agency: '0001',
      balance: new (Money as any)({ amountCents: 0n, currency: 'BRL' }),
      limit: new (Money as any)({ amountCents: 0n, currency: 'BRL' }),
      status: 'ACTIVE',
      pixKeys: [],
      createdAt: now,
      updatedAt: now,
    });
    account.addDomainEvent(new AccountOpenedEvent(account.id, userId));
    return Result.ok(account);
  }

  static reconstitute(props: AccountProps, id: string): Account {
    return new Account(props, id);
  }

  // ── Business methods ─────────────────────────────
  credit(amount: Money): Result<void, DomainError> {
    if (!this.isActive) {
      return Result.fail({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'Account is not active',
      });
    }
    (this.props as AccountProps).balance = this.props.balance.add(amount);
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new BalanceUpdatedEvent(this.id, 'CREDIT', amount.amountCents),
    );
    return Result.ok(undefined);
  }

  debit(amount: Money): Result<void, DomainError> {
    if (!this.isActive) {
      return Result.fail({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'Account is not active',
      });
    }
    const result = this.props.balance.subtract(amount);
    if (result.isFailure) return Result.fail(result.error);
    (this.props as AccountProps).balance = result.value;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new BalanceUpdatedEvent(this.id, 'DEBIT', amount.amountCents),
    );
    return Result.ok(undefined);
  }

  registerPixKey(type: PixKeyType, value: string): Result<PixKey, DomainError> {
    if (!this.isActive) {
      return Result.fail({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'Account is not active',
      });
    }
    if (this.props.pixKeys.length >= 5) {
      return Result.fail({
        code: 'PIX_KEY_LIMIT',
        message: 'Maximum 5 PIX keys per account',
      });
    }
    const keyResult = PixKey.create(type, value);
    if (keyResult.isFailure) return Result.fail(keyResult.error);
    this.props.pixKeys.push(keyResult.value);
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PixKeyRegisteredEvent(this.id, type, value));
    return Result.ok(keyResult.value);
  }

  block(): Result<void, DomainError> {
    if (this.props.status === 'BLOCKED') {
      return Result.fail({
        code: 'ALREADY_BLOCKED',
        message: 'Account is already blocked',
      });
    }
    (this.props as AccountProps).status = 'BLOCKED';
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  removePixKey(keyValue: string): Result<void, DomainError> {
    if (!this.isActive) {
      return Result.fail({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'Account is not active',
      });
    }
    const idx = this.props.pixKeys.findIndex((k) => k.value === keyValue);
    if (idx === -1) {
      return Result.fail({
        code: 'PIX_KEY_NOT_FOUND',
        message: `PIX key "${keyValue}" not found on this account`,
      });
    }
    this.props.pixKeys.splice(idx, 1);
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }
}
