// src/modules/accounts/application/commands/register-pix-key/register-pix-key.command.ts
import { PixKeyType } from '../../../domain/value-objects/pix-key.vo';
export class RegisterPixKeyCommand {
  constructor(
    readonly userId: string,
    readonly keyType: PixKeyType,
    readonly keyValue: string,
  ) {}
}

import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as accountRepository from '../../../domain/repositories/account.repository';

@Injectable()
export class RegisterPixKeyHandler {
  constructor(
    @Inject(accountRepository.ACCOUNT_REPOSITORY)
    private readonly accountRepo: accountRepository.IAccountRepository,
  ) {}

  async execute(command: RegisterPixKeyCommand) {
    const account = await this.accountRepo.findByUserId(command.userId);
    if (!account) throw new NotFoundException('Account not found');

    const result = account.registerPixKey(command.keyType, command.keyValue);
    if (result.isFailure) throw new BadRequestException(result.error.message);

    await this.accountRepo.update(account);
    account.clearDomainEvents();

    return { keyType: result.value.type, keyValue: result.value.value };
  }
}
