// src/modules/identity/domain/events/user-suspended.event.ts
import { DomainEvent } from 'src/shared/domain/domain-event';

export class UserSuspendedEvent extends DomainEvent {
  readonly eventName = 'identity.user.suspended';

  constructor(
    readonly userId: string,
    readonly reason: string,
  ) {
    super();
  }
}
