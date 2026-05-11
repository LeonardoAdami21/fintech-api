// src/modules/identity/infrastructure/repositories/prisma-session.repository.ts
import { Injectable } from '@nestjs/common';
import { ISessionRepository } from '../../domain/repositories/session.repository';
import { Session } from '../../domain/entities/session.entity';
import { PrismaService } from 'src/shared/infra/prisma.service';
import { SessionMapper } from '../mappers/session.mapper';

@Injectable()
export class PrismaSessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Session | null> {
    const raw = await this.prisma.session.findUnique({ where: { id } });
    return raw ? SessionMapper.toDomain(raw) : null;
  }

  async findByToken(refreshToken: string): Promise<Session | null> {
    const raw = await this.prisma.session.findUnique({
      where: { refreshToken },
    });
    return raw ? SessionMapper.toDomain(raw) : null;
  }

  async findAllActiveByUserId(userId: string): Promise<Session[]> {
    const rows = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(SessionMapper.toDomain);
  }

  async save(session: Session): Promise<void> {
    await this.prisma.session.create({
      data: SessionMapper.toPersistence(session),
    });
  }

  async update(session: Session): Promise<void> {
    const { id, ...data } = SessionMapper.toPersistence(session);
    await this.prisma.session.update({ where: { id }, data });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
