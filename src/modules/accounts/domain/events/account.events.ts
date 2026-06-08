// src/modules/accounts/domain/events/account-opened.event.ts

import { DomainEvent } from 'src/shared/domain/domain-event';

export class AccountOpenedEvent extends DomainEvent {
  readonly eventName = 'accounts.account.opened';
  constructor(
    readonly accountId: string,
    readonly userId: string,
  ) {
    super();
  }
}

// src/modules/accounts/domain/events/balance-updated.event.ts
export class BalanceUpdatedEvent extends DomainEvent {
  readonly eventName = 'accounts.balance.updated';
  constructor(
    readonly accountId: string,
    readonly direction: 'CREDIT' | 'DEBIT',
    readonly amountCents: number,
  ) {
    super();
  }
}

// src/modules/accounts/domain/events/pix-key-registered.event.ts
export class PixKeyRegisteredEvent extends DomainEvent {
  readonly eventName = 'accounts.pix_key.registered';
  constructor(
    readonly accountId: string,
    readonly keyType: string,
    readonly keyValue: string,
  ) {
    super();
  }
}
