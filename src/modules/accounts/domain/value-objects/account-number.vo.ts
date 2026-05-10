// src/modules/accounts/domain/value-objects/account-number.vo.ts

import { DomainError, Result } from 'src/shared/domain/result';
import { ValueObject } from 'src/shared/domain/value-object.base';

interface AccountNumberProps {
  value: string;
}

export class AccountNumber extends ValueObject<AccountNumberProps> {
  private constructor(props: AccountNumberProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static generate(): AccountNumber {
    // Format: 8 random digits
    const num = Math.floor(10_000_000 + Math.random() * 90_000_000).toString();
    return new AccountNumber({ value: num });
  }

  static create(value: string): Result<AccountNumber, DomainError> {
    if (!/^\d{8}$/.test(value)) {
      return Result.fail({
        code: 'INVALID_ACCOUNT_NUMBER',
        message: 'Numero da conta só pode conter 8 dígitos',
      });
    }
    return Result.ok(new AccountNumber({ value }));
  }

  toString(): string {
    return this.props.value;
  }
}
