// src/modules/identity/infrastructure/jobs/session-cleanup.job.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';

@Injectable()
export class SessionCleanupJob {
  private readonly logger = new Logger(SessionCleanupJob.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs daily at 02:00 AM.
   * Removes sessions that are both expired AND older than 30 days
   * (keeps recent expired sessions for audit trail / reuse detection window).
   */
  @Cron('0 2 * * *', { name: 'session-cleanup', timeZone: 'America/Sao_Paulo' })
  async cleanupExpiredSessions(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    try {
      const { count } = await this.prisma.session.deleteMany({
        where: {
          OR: [
            // Expired sessions older than 30 days
            { expiresAt: { lt: cutoff } },
            // Revoked sessions older than 30 days
            { revokedAt: { lt: cutoff } },
          ],
        },
      });

      if (count > 0) {
        this.logger.log(`Sessão limpada - ${count} sessão(s) removida(s)`);
      }
    } catch (err: any) {
      this.logger.error(`Remoção de sessão falhou: ${err.message}`);
    }
  }

  /**
   * Also runs every hour to clean up truly expired + revoked sessions
   * older than 24h (faster turnaround for compliance).
   */
  @Cron(CronExpression.EVERY_HOUR, { name: 'session-cleanup-hourly' })
  async cleanupRevokedSessions(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      const { count } = await this.prisma.session.deleteMany({
        where: {
          revokedAt: { lt: cutoff, not: null },
          expiresAt: { lt: new Date() },
        },
      });

      if (count > 0) {
        this.logger.debug(
          `Hourly cleanup: removed ${count} revoked+expired session(s)`,
        );
      }
    } catch (err: any) {
      this.logger.error(`Hourly session cleanup failed: ${err.message}`);
    }
  }
}
