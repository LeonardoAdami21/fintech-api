// src/modules/identity/application/queries/list-sessions.query.ts
import { Inject, Injectable } from '@nestjs/common';
import * as sessionRepository from '../../domain/repositories/session.repository';

@Injectable()
export class ListSessionsQuery {
  constructor(
    @Inject(sessionRepository.SESSION_REPOSITORY)
    private readonly sessionRepo: sessionRepository.ISessionRepository,
  ) {}

  async byUserId(userId: string) {
    const sessions = await this.sessionRepo.findAllActiveByUserId(userId);
    return sessions.map((s) => ({
      sessionId: s.id,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isExpired: s.isExpired,
    }));
  }
}
