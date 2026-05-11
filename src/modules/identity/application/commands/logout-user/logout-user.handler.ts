// src/modules/identity/application/commands/logout-user/logout-user.handler.ts
import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { LogoutUserCommand } from './logout-user.command';
import * as sessionRepository from '../../../domain/repositories/session.repository';

@Injectable()
export class LogoutUserHandler {
  private readonly logger = new Logger(LogoutUserHandler.name);

  constructor(
    @Inject(sessionRepository.SESSION_REPOSITORY)
    private readonly sessionRepo: sessionRepository.ISessionRepository,
  ) {}

  async execute(command: LogoutUserCommand): Promise<{ revokedCount: number }> {
    // Global logout — revoke all sessions
    if (!command.sessionId) {
      await this.sessionRepo.revokeAllByUserId(command.userId);
      this.logger.log('Global logout for user ' + command.userId);
      return { revokedCount: -1 }; // unknown exact count
    }

    // Single session logout
    const session = await this.sessionRepo.findById(command.sessionId);
    if (!session || session.userId !== command.userId) {
      throw new NotFoundException('Session not found');
    }

    session.revoke();
    await this.sessionRepo.update(session);

    this.logger.log(
      'Session ' + command.sessionId + ' revoked for user ' + command.userId,
    );
    return { revokedCount: 1 };
  }
}
