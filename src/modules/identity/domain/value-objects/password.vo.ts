// src/modules/identity/domain/value-objects/password.vo.ts

import * as bcrypt from 'bcryptjs';
import { DomainError, Result } from 'src/shared/domain/result';
import { ValueObject } from 'src/shared/domain/value-object.base';

interface PasswordProps {
  value: string;
  isHashed: boolean;
}

export class Password extends ValueObject<PasswordProps> {
  private static readonly MIN_LENGTH = 8;
  private static readonly SALT_ROUNDS = 12;

  private constructor(props: PasswordProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  get isHashed(): boolean {
    return this.props.isHashed;
  }

  static create(plainText: string): Result<Password, DomainError> {
    if (plainText.length < Password.MIN_LENGTH) {
      return Result.fail({
        code: 'WEAK_PASSWORD',
        message: `A senha deve ter pelo menos ${Password.MIN_LENGTH} characters`,
      });
    }
    const hasUppercase = /[A-Z]/.test(plainText);
    const hasNumber = /[0-9]/.test(plainText);
    if (!hasUppercase || !hasNumber) {
      return Result.fail({
        code: 'WEAK_PASSWORD',
        message:
          'A senha deve conter pelo menos uma letra maiúscula e um número',
      });
    }
    return Result.ok(new Password({ value: plainText, isHashed: false }));
  }

  static fromHash(hash: string): Password {
    return new Password({ value: hash, isHashed: true });
  }

  async hash(): Promise<Password> {
    if (this.isHashed) return this;
    const hashed = await bcrypt.hash(this.value, Password.SALT_ROUNDS);
    return new Password({ value: hashed, isHashed: true });
  }

  async compare(plainText: string): Promise<boolean> {
    if (!this.isHashed) return this.value === plainText;
    return bcrypt.compare(plainText, this.value);
  }
}
