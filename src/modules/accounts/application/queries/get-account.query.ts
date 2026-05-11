// src/modules/accounts/application/queries/get-account.query.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as accountRepository from '../../domain/repositories/account.repository';

@Injectable()
export class GetAccountQuery {
  constructor(
    @Inject(accountRepository.ACCOUNT_REPOSITORY)
    private readonly accountRepo: accountRepository.IAccountRepository,
  ) {}

  async byUserId(userId: string) {
    const account = await this.accountRepo.findByUserId(userId);
    if (!account) throw new NotFoundException('Account not found');

    return {
      accountId: account.id,
      accountNumber: account.accountNumber.value,
      agency: account.agency,
      balance: account.balance.amountBRL,
      balanceCents: account.balance.amountCents.toString(),
      currency: 'BRL',
      status: account.status,
      pixKeys: account.pixKeys.map((k) => ({ type: k.type, value: k.value })),
    };
  }
}
