// src/modules/identity/domain/events/user-created.event.ts
import { DomainEvent } from 'src/shared/domain/domain-event';

export class UserCreatedEvent extends DomainEvent {
  readonly eventName = 'identity.user.created';

  constructor(
    readonly userId: string,
    readonly email: string,
  ) {
    super();
  }
}
