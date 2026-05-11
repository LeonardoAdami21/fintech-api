// src/modules/accounts/application/commands/register-pix-key/register-pix-key.command.ts
export class RegisterPixKeyCommand {
  constructor(
    readonly userId: string,
    readonly keyType: PixKeyType,
    readonly keyValue: string,
  ) {}
}

// ─────────────────────────────────────────────────────────────────────────────

// src/modules/accounts/application/commands/register-pix-key/register-pix-key.handler.ts
import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as accountRepository from 'src/modules/accounts/domain/repositories/account.repository';

import { PixKeyType } from 'src/modules/accounts/domain/value-objects/pix-key.vo';

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
