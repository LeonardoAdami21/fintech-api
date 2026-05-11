// src/modules/accounts/accounts.module.ts
import { Module } from '@nestjs/common';
import { ACCOUNT_REPOSITORY } from './domain/repositories/account.repository';
import { OpenAccountHandler } from './application/commands/open-account/open-account.handler';
import { RegisterPixKeyHandler } from './application/commands/register-pix-key/register-pix-key.handler';
import { GetAccountQuery } from './application/queries/get-account.query';
import { IdentityModule } from '../identity/identity.module';
import { PrismaService } from 'src/shared/infra/prisma.service';
import { PrismaAccountRepository } from './infra/repositories/prisma-account.repository';
import { AccountsController } from './interface/controller/accounts.controller';

@Module({
  imports: [IdentityModule],
  providers: [
    PrismaService,
    OpenAccountHandler,
    RegisterPixKeyHandler,
    GetAccountQuery,
    { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository },
  ],
  controllers: [AccountsController],
  exports: [ACCOUNT_REPOSITORY, GetAccountQuery],
})
export class AccountsModule {}
