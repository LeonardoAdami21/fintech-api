// src/modules/identity/identity.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';
import { JwtStrategy } from './infra/strategies/jwt.strategy';
import { TokenService } from './infra/services/token.service';
import { PrismaUserRepository } from './infra/repositories/prisma-user.repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { SESSION_REPOSITORY } from './domain/repositories/session.repository';
import { PrismaSessionRepository } from './infra/repositories/prisma-session.repository';
import { LoginUserHandler } from './application/commands/login-user/login-user.handler';
import { RefreshTokenHandler } from './application/commands/refresh-token/refresh-token.handler';
import { LogoutUserHandler } from './application/commands/logout-user/logout-user.handler';
import { ListSessionsQuery } from './application/queries/list-sessions.query';
import { RegisterUserHandler } from './application/commands/register-user/register-user.handler';
import { AuthController } from './interface/controllers/auth.controller';
import { SessionCleanupJob } from './infra/jobs/session-cleanup.job';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET'),
        signOptions: { issuer: 'fintech-api', audience: 'fintech-client' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    PrismaService,
    JwtStrategy,
    TokenService,
    SessionCleanupJob,
    RegisterUserHandler,
    LoginUserHandler,
    RefreshTokenHandler,
    LogoutUserHandler,
    ListSessionsQuery,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },
  ],
  controllers: [AuthController],
  exports: [
    JwtModule,
    PassportModule,
    USER_REPOSITORY,
    SESSION_REPOSITORY,
    TokenService,
  ],
})
export class IdentityModule {}
