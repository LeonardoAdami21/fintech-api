// src/modules/payments/domain/value-objects/idempotency-key.vo.ts

import { randomUUID } from 'crypto';
import { DomainError, Result } from 'src/shared/domain/result';
import { ValueObject } from 'src/shared/domain/value-object.base';

interface IdempotencyKeyProps {
  value: string;
}

export class IdempotencyKey extends ValueObject<IdempotencyKeyProps> {
  private constructor(props: IdempotencyKeyProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static generate(): IdempotencyKey {
    return new IdempotencyKey({ value: randomUUID() });
  }

  static create(value: string): Result<IdempotencyKey, DomainError> {
    if (!value || value.trim().length < 8) {
      return Result.fail({
        code: 'INVALID_IDEMPOTENCY_KEY',
        message: 'Idempotency key must be at least 8 characters',
      });
    }
    return Result.ok(new IdempotencyKey({ value: value.trim() }));
  }

  toString(): string {
    return this.props.value;
  }
}
