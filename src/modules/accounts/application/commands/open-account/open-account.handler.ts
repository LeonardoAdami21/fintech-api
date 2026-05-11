// src/modules/accounts/application/commands/open-account/open-account.command.ts
export class OpenAccountCommand {
  constructor(readonly userId: string) {}
}
import { Inject, Injectable, ConflictException } from '@nestjs/common';
import * as accountRepository from '../../../domain/repositories/account.repository';
import { Account } from '../../../domain/entities/account.entity';

export interface OpenAccountResult {
  accountId: string;
  accountNumber: string;
  agency: string;
}

@Injectable()
export class OpenAccountHandler {
  constructor(
    @Inject(accountRepository.ACCOUNT_REPOSITORY)
    private readonly accountRepo: accountRepository.IAccountRepository,
  ) {}

  async execute(command: OpenAccountCommand): Promise<OpenAccountResult> {
    const existing = await this.accountRepo.findByUserId(command.userId);
    if (existing) {
      throw new ConflictException('User already has an account');
    }

    const result = Account.open(command.userId);
    if (result.isFailure) throw new Error(result.error.message);

    const account = result.value;
    await this.accountRepo.save(account);
    account.clearDomainEvents();

    return {
      accountId: account.id,
      accountNumber: account.accountNumber.value,
      agency: account.agency,
    };
  }
}
