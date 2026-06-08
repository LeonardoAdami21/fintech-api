// src/modules/accounts/infrastructure/mappers/account.mapper.ts
import {
  Account as PrismaAccount,
  PixKey as PrismaPixKey,
} from '@prisma/client';
import { Account } from '../../domain/entities/account.entity';
import { AccountNumber } from '../../domain/value-objects/account-number.vo';
import { PixKey } from '../../domain/value-objects/pix-key.vo';
import { BadRequestException } from '@nestjs/common';

type PrismaAccountWithKeys = PrismaAccount & { pixKeys: PrismaPixKey[] };

// Helper to build a zero-balance Money-like object without calling create()
function makeMoney(cents: number) {
  return {
    amountCents: cents,
    currency: 'BRL',
    add: () => {},
    subtract: () => {},
  } as any;
}

export class AccountMapper {
  static toDomain(raw: PrismaAccountWithKeys): Account {
    const accountNumber = AccountNumber.create(raw.accountNumber);
    if (accountNumber.isFailure)
      throw new BadRequestException(
        `Bad account number in DB: ${raw.accountNumber}`,
      );

    const pixKeys = raw.pixKeys.map((pk) => {
      const result = PixKey.create(pk.keyType as any, pk.keyValue);
      if (result.isFailure)
        throw new BadRequestException(`Bad PIX key in DB: ${pk.keyValue}`);
      return result.value;
    });

    return Account.reconstitute(
      {
        userId: raw.userId,
        accountNumber: accountNumber.value,
        agency: raw.agency,
        balance: makeMoney(parseFloat(raw.balanceCents as any)),
        limit: makeMoney(parseFloat(raw.limitCents as any)),
        status: raw.status as any,
        pixKeys,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  static toPersistence(account: Account) {
    return {
      id: account.id,
      userId: account.userId,
      accountNumber: account.accountNumber.value,
      agency: account.agency,
      balanceCents: +account.balance.amountCents,
      limitCents: +account.limit.amountCents,
      status: account.status,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
