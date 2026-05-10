import { Module } from '@nestjs/common';
import { AccountsController } from './interface/controller/accounts.controller';

@Module({
  controllers: [AccountsController],
  providers: [],
})
export class AccountsModule {}
