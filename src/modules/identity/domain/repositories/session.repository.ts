// src/modules/identity/domain/repositories/session.repository.ts
import { Session } from '../entities/session.entity';

export const SESSION_REPOSITORY = Symbol('ISessionRepository');

export interface ISessionRepository {
  findById(id: string): Promise<Session | null>;
  findByToken(refreshToken: string): Promise<Session | null>;
  findAllActiveByUserId(userId: string): Promise<Session[]>;
  save(session: Session): Promise<void>;
  update(session: Session): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
}
