// src/modules/identity/infrastructure/mappers/session.mapper.ts
import { Session as PrismaSession } from '@prisma/client';
import { Session } from '../../domain/entities/session.entity';

export class SessionMapper {
  static toDomain(raw: PrismaSession): Session {
    return Session.reconstitute(
      {
        userId: raw.userId,
        refreshToken: raw.refreshToken,
        expiresAt: raw.expiresAt,
        revokedAt: raw.revokedAt,
        createdAt: raw.createdAt,
      },
      raw.id,
    );
  }

  static toPersistence(session: Session) {
    return {
      id: session.id,
      userId: session.userId,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt ?? null,
      createdAt: session.createdAt,
    };
  }
}
