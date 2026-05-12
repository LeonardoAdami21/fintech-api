// src/modules/accounts/application/commands/remove-pix-key/remove-pix-key.handler.ts
import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as accountRepository from '../../../domain/repositories/account.repository';
import { RemovePixKeyCommand } from './remove-pix-key.command';

@Injectable()
export class RemovePixKeyHandler {
  constructor(
    @Inject(accountRepository.ACCOUNT_REPOSITORY)
    private readonly accountRepo: accountRepository.IAccountRepository,
  ) {}

  async execute(command: RemovePixKeyCommand): Promise<void> {
    const account = await this.accountRepo.findByUserId(command.userId);
    if (!account) throw new NotFoundException('Account not found');

    const result = account.removePixKey(command.keyValue);
    if (result.isFailure) throw new BadRequestException(result.error.message);

    // Delete from DB directly (more efficient than full account update)
    await this.accountRepo.deletePixKey(account.id, command.keyValue);
  }
}
