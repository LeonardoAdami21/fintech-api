// src/modules/accounts/domain/value-objects/pix-key.vo.ts

import { v4 as uuid } from 'uuid';
import { DomainError, Result } from 'src/shared/domain/result';
import { ValueObject } from 'src/shared/domain/value-object.base';

export type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

interface PixKeyProps {
  type: PixKeyType;
  value: string;
}

const VALIDATORS: Record<PixKeyType, RegExp> = {
  CPF: /^\d{11}$/,
  CNPJ: /^\d{14}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+55\d{10,11}$/,
  RANDOM: /.*/,
};

export class PixKey extends ValueObject<PixKeyProps> {
  private constructor(props: PixKeyProps) {
    super(props);
  }

  get type(): PixKeyType {
    return this.props.type;
  }
  get value(): string {
    return this.props.value;
  }

  static create(type: string, value: string): Result<PixKey, DomainError> {
    const regex = VALIDATORS[type];
    if (!regex.test(value)) {
      return Result.fail({
        code: 'INVALID_PIX_KEY',
        message: `Invalido a chave PIX: ${type}`,
      });
    }
    return Result.ok(new PixKey({ type: type as PixKeyType, value }));
  }

  static generateRandom(): PixKey {
    return new PixKey({ type: 'RANDOM', value: uuid() });
  }
}
