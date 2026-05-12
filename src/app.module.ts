import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './shared/config/env.config';
import { IdentityModule } from './modules/identity/identity.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OutboxModule } from './shared/infrastructure/outbox/outbox.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    IdentityModule,
    AccountsModule,
    PaymentsModule,
    OutboxModule,
  ],
})
export class AppModule {}
